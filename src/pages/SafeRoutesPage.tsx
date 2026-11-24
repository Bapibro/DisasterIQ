import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, ExternalLink, LoaderCircle, LocateFixed, MapPin, Route, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './SafeRoutesPage.css';

type Place = {
  label: string;
  latitude: number;
  longitude: number;
};

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry: { coordinates: [number, number][] };
};

type OSMFacility = {
  id: number;
  lat: number;
  lon: number;
  tags: { name?: string; amenity?: string };
};

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const ORIGIN_MARKER_ICON = L.divIcon({
  className: 'safe-route-marker safe-route-marker--origin',
  html: '<svg viewBox="0 0 32 42" aria-hidden="true"><path d="M16 1C8.27 1 2 7.27 2 15c0 10 14 25 14 25s14-15 14-25C30 7.27 23.73 1 16 1Z"/><circle cx="16" cy="15" r="9"/><text x="16" y="19">A</text></svg>',
  iconSize: [32, 42],
  iconAnchor: [16, 40],
  popupAnchor: [0, -38],
});

const DESTINATION_MARKER_ICON = L.divIcon({
  className: 'safe-route-marker safe-route-marker--destination',
  html: '<svg viewBox="0 0 32 42" aria-hidden="true"><path d="M16 1C8.27 1 2 7.27 2 15c0 10 14 25 14 25s14-15 14-25C30 7.27 23.73 1 16 1Z"/><circle cx="16" cy="15" r="9"/><text x="16" y="19">B</text></svg>',
  iconSize: [32, 42],
  iconAnchor: [16, 40],
  popupAnchor: [0, -38],
});

function isCoordinate(value: unknown): value is [number, number] {
  return Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    Number.isFinite(value[0]) &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[1]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function RouteMapController({ route }: { route: OsrmRoute | null }) {
  const map = useMap();

  useEffect(() => {
    if (route) {
      const points = route.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number]);
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 14 });
    }
  }, [map, route]);
  return null;
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}

async function geocodeNagpur(query: string, signal?: AbortSignal): Promise<Place> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: `${query}, Nagpur, Maharashtra, India`,
    countrycodes: 'in',
    viewbox: '78.85,21.30,79.35,20.95',
    bounded: '1',
    limit: '1',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal });
  if (!response.ok) throw new Error(`OpenStreetMap search returned HTTP ${response.status}.`);
  const result: unknown = await response.json();
  if (!Array.isArray(result) || !isRecord(result[0])) throw new Error(`Could not find “${query}” inside the Nagpur search area.`);
  const item = result[0];
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || typeof item.display_name !== 'string') {
    throw new Error('OpenStreetMap returned an invalid place result.');
  }
  return {
    label: item.display_name.split(',').slice(0, 3).join(','),
    latitude,
    longitude,
  };
}

async function fetchOsrmRoute(from: Place, to: Place, signal?: AbortSignal): Promise<OsrmRoute> {
  const path = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const params = new URLSearchParams({ overview: 'full', geometries: 'geojson', steps: 'false' });
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${path}?${params}`, { signal });
  if (!response.ok) throw new Error(`Routing service returned HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  if (!isRecord(payload) || payload.code !== 'Ok' || !Array.isArray(payload.routes) || !isRecord(payload.routes[0])) {
    throw new Error('No driving route was returned for these places.');
  }
  const route = payload.routes[0];
  const coordinates = isRecord(route.geometry) && Array.isArray(route.geometry.coordinates)
    ? route.geometry.coordinates.filter(isCoordinate)
    : [];
  if (
    typeof route.distance !== 'number' ||
    typeof route.duration !== 'number' ||
    !isRecord(route.geometry) ||
    coordinates.length < 2 ||
    (Array.isArray(route.geometry.coordinates) && coordinates.length !== route.geometry.coordinates.length)
  ) {
    throw new Error('The routing service returned an incomplete route.');
  }
  return {
    distance: route.distance,
    duration: route.duration,
    geometry: { coordinates },
  };
}

async function fetchNearbyFacilities(place: Place, signal?: AbortSignal): Promise<OSMFacility[]> {
  const query = `[out:json][timeout:20];(node["amenity"~"hospital|fire_station|shelter"](around:3500,${place.latitude},${place.longitude});way["amenity"~"hospital|fire_station|shelter"](around:3500,${place.latitude},${place.longitude}););out center tags;`;
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ data: query }),
    signal,
  });
  if (!response.ok) throw new Error(`OpenStreetMap facility search returned HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.elements)) throw new Error('Facility search returned an invalid response.');
  return payload.elements.flatMap((element): OSMFacility[] => {
    if (!isRecord(element) || typeof element.id !== 'number' || !isRecord(element.tags)) return [];
    const center = isRecord(element.center) ? element.center : element;
    if (typeof center.lat !== 'number' || typeof center.lon !== 'number') return [];
    return [{
      id: element.id,
      lat: center.lat,
      lon: center.lon,
      tags: {
        name: typeof element.tags.name === 'string' ? element.tags.name : undefined,
        amenity: typeof element.tags.amenity === 'string' ? element.tags.amenity : undefined,
      },
    }];
  });
}

function FacilityMarkers({ facilities }: { facilities: OSMFacility[] }) {
  return (
    <>
      {facilities.map((facility) => (
        <CircleMarker
          key={facility.id}
          center={[facility.lat, facility.lon]}
          radius={5}
          pathOptions={{ color: '#ffffff', fillColor: '#d97706', fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <strong>{facility.tags.name || 'Unnamed mapped facility'}</strong>
            <br />
            {facility.tags.amenity?.replace('_', ' ') || 'Mapped facility'}
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

export default function SafeRoutesPage() {
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [route, setRoute] = useState<OsrmRoute | null>(null);
  const [facilities, setFacilities] = useState<OSMFacility[]>([]);
  const [facilityError, setFacilityError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tileStatus, setTileStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tileLayerVersion, setTileLayerVersion] = useState(0);
  const lastGeocodeAtRef = useRef(0);

  const locateOrigin = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Location permission is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPlace = {
          label: 'Your current location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setOrigin(currentPlace);
        setOriginText(currentPlace.label);
      },
      (locationError) => setError(`Could not access location: ${locationError.message}`),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submitRoute = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!destinationText.trim() || (!origin && !originText.trim())) {
      setError('Enter both an origin and a destination, or use your current location as the origin.');
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError('');
    setFacilityError('');
    setRoute(null);
    try {
      let resolvedOrigin = origin;
      if (!resolvedOrigin) {
        resolvedOrigin = await geocodeNagpur(originText.trim(), controller.signal);
        lastGeocodeAtRef.current = Date.now();
        setOrigin(resolvedOrigin);
      }
      const delay = Math.max(1000 - (Date.now() - lastGeocodeAtRef.current), 0);
      if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
      const resolvedDestination = await geocodeNagpur(destinationText.trim(), controller.signal);
      lastGeocodeAtRef.current = Date.now();
      setDestination(resolvedDestination);
      const [routeData, facilityResult] = await Promise.allSettled([
        fetchOsrmRoute(resolvedOrigin, resolvedDestination, controller.signal),
        fetchNearbyFacilities(resolvedDestination, controller.signal),
      ]);
      if (routeData.status === 'rejected') throw routeData.reason;
      setRoute(routeData.value);
      if (facilityResult.status === 'fulfilled') setFacilities(facilityResult.value);
      else setFacilityError(facilityResult.reason instanceof Error ? facilityResult.reason.message : 'Mapped facilities are unavailable.');
    } catch (routeError) {
      if (routeError instanceof Error && routeError.name === 'AbortError') return;
      setError(routeError instanceof Error ? routeError.message : 'Route planning is unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const routePositions = route?.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number]) ?? [];

  return (
    <main className="safe-routes-page">
      <div className="safe-routes-shell">
        <header className="safe-routes-header">
          <div>
            <span>EMERGENCY RESPONSE · NAGPUR</span>
            <h1>Route planning</h1>
            <p>Get a road route between places in Nagpur. A shortest/fastest route is not a verified safe evacuation route.</p>
          </div>
        </header>

        <section className="safe-routes-grid">
          <div className="safe-routes-map-panel">
            <MapContainer center={[21.1458, 79.0882]} zoom={12} scrollWheelZoom className="safe-routes-map">
              <RouteMapController route={route} />
              <TileLayer
                key={tileLayerVersion}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                url={OSM_TILE_URL}
                subdomains={['a', 'b', 'c']}
                maxZoom={19}
                eventHandlers={{
                  loading: () => setTileStatus('loading'),
                  load: () => setTileStatus((current) => current === 'error' ? 'error' : 'ready'),
                  tileerror: () => setTileStatus('error'),
                }}
              />
              {route && (
                <>
                  <Polyline positions={routePositions} pathOptions={{ color: '#ffffff', weight: 10, opacity: 0.9 }} />
                  <Polyline positions={routePositions} pathOptions={{ color: '#087f8c', weight: 6, opacity: 0.96 }} />
                </>
              )}
              {origin && (
                <Marker
                  position={[origin.latitude, origin.longitude]}
                  icon={ORIGIN_MARKER_ICON}
                  title="Origin"
                  alt="Origin marker"
                  zIndexOffset={1000}
                >
                  <Popup>Origin: {origin.label}</Popup>
                </Marker>
              )}
              {destination && (
                <Marker
                  position={[destination.latitude, destination.longitude]}
                  icon={DESTINATION_MARKER_ICON}
                  title="Destination"
                  alt="Destination marker"
                  zIndexOffset={1000}
                >
                  <Popup>Destination: {destination.label}</Popup>
                </Marker>
              )}
              <FacilityMarkers facilities={facilities} />
            </MapContainer>
            {(tileStatus === 'loading' || tileStatus === 'error') && (
              <div className={`safe-route-map-status safe-route-map-status--${tileStatus}`} role={tileStatus === 'error' ? 'alert' : 'status'} aria-live="polite">
                {tileStatus === 'loading' ? <LoaderCircle size={16} className="safe-route-map-spinner" /> : <AlertTriangle size={16} />}
                <span>{tileStatus === 'loading' ? 'Loading street map…' : 'Some map tiles could not load. Check your connection.'}</span>
                {tileStatus === 'error' && (
                  <button type="button" onClick={() => { setTileStatus('loading'); setTileLayerVersion((version) => version + 1); }}>Retry</button>
                )}
              </div>
            )}
          </div>

          <aside className="safe-routes-sidebar">
            <form onSubmit={submitRoute} className="safe-routes-form">
              <label>
                Origin
                <span className="safe-route-input">
                  <MapPin size={15} />
                  <input value={originText} onChange={(event) => { setOriginText(event.target.value); setOrigin(null); }} placeholder="Nagpur locality or address" />
                </span>
              </label>
              <button type="button" className="safe-route-location" onClick={locateOrigin}><LocateFixed size={14} /> Use my location</button>
              <label>
                Destination
                <span className="safe-route-input">
                  <Search size={15} />
                  <input value={destinationText} onChange={(event) => setDestinationText(event.target.value)} placeholder="Nagpur destination" />
                </span>
              </label>
              <button type="submit" className="safe-route-submit" disabled={isLoading}>
                <Route size={15} /> {isLoading ? 'Finding route…' : 'Find road route'}
              </button>
            </form>

            {error && <p className="safe-route-error" role="alert"><AlertTriangle size={15} />{error}</p>}

            {route && (
              <section className="safe-route-result" aria-live="polite">
                <h2>OSRM driving route</h2>
                <div><strong>{formatDistance(route.distance)}</strong><span>Estimated distance</span></div>
                <div><strong>{formatDuration(route.duration)}</strong><span>Modelled travel time</span></div>
                <small>Travel time is an estimate and may not reflect current traffic or road conditions.</small>
              </section>
            )}

            <section className="safe-route-facilities">
              <h2>Mapped emergency facilities</h2>
              {facilityError ? <p role="status">{facilityError}</p> : facilities.length ? (
                <ul>
                  {facilities.slice(0, 8).map((facility) => (
                    <li key={facility.id}>
                      <strong>{facility.tags.name || 'Unnamed OSM facility'}</strong>
                      <span>{facility.tags.amenity?.replace('_', ' ')}</span>
                    </li>
                  ))}
                </ul>
              ) : <p>{isLoading ? 'Searching OpenStreetMap around the destination…' : 'Search a destination to find nearby mapped hospitals, fire stations, and shelters.'}</p>}
              <small>OpenStreetMap-mapped points are not verified for current operation, capacity, or availability.</small>
            </section>
          </aside>
        </section>

        <div className="safe-route-warning">
          <AlertTriangle size={17} />
          <p>Road closure and verified flood/waterlogging feeds are unavailable. This route cannot be guaranteed safe and must not be used as an emergency evacuation instruction. For immediate danger in India call <a href="tel:112">112</a>.</p>
        </div>
        <footer className="safe-route-sources">
          <a href="https://project-osrm.org/" target="_blank" rel="noreferrer">Routing · OSRM <ExternalLink size={12} /></a>
          <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">Places & map · OpenStreetMap <ExternalLink size={12} /></a>
        </footer>
      </div>
    </main>
  );
}
