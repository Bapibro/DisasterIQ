import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Maximize2, Minimize2, Layers3, Play, Pause, LocateFixed } from 'lucide-react';
import type { RadarData, RadarFrame } from '../lib/services/liveMonitoringService';

type Place = {
  name: string;
  latitude: number;
  longitude: number;
  description: string;
};

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
};

type LiveMonitoringMapProps = {
  radar: RadarData | null;
  selectedFrame: RadarFrame | null;
  selectedFrameIndex: number;
  onFrameChange: (index: number) => void;
  onPlaceSelected: (place: Place | null) => void;
};

const nagpurCenter: Place = {
  name: 'Nagpur',
  latitude: 21.1458,
  longitude: 79.0882,
  description: 'Dashboard forecast point',
};

function MapController({
  place,
  onReady,
}: {
  place: Place | null;
  onReady: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
  }, [map, onReady]);

  useEffect(() => {
    if (place) map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [map, place]);

  return null;
}

function formatRadarTime(timestamp: number, options?: Intl.DateTimeFormatOptions) {
  const dateOptions = options ?? {};
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...(!dateOptions.dateStyle && !dateOptions.timeStyle
      ? { hour: '2-digit', minute: '2-digit' }
      : {}),
    ...dateOptions,
  }).format(new Date(timestamp * 1000));
}

export function LiveMonitoringMap({
  radar,
  selectedFrame,
  selectedFrameIndex,
  onFrameChange,
  onPlaceSelected,
}: LiveMonitoringMapProps) {
  const mapPanelRef = useRef<HTMLDivElement>(null);
  const lastSearchAtRef = useRef(0);
  const [map, setMap] = useState<L.Map | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRadarVisible, setIsRadarVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapControlError, setMapControlError] = useState('');
  const frames = radar?.frames ?? [];

  useEffect(() => {
    if (!isPlaying || frames.length < 2) return;
    const timer = window.setInterval(() => {
      if (selectedFrameIndex >= frames.length - 1) {
        setIsPlaying(false);
        return;
      }
      onFrameChange(selectedFrameIndex + 1);
    }, 900);
    return () => window.clearInterval(timer);
  }, [frames.length, isPlaying, onFrameChange, selectedFrameIndex]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === mapPanelRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen) map?.invalidateSize();
  }, [isFullscreen, map]);

  const searchPlaces = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchText.trim();
    if (!query || isSearching) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const waitMs = Math.max(1000 - (Date.now() - lastSearchAtRef.current), 0);
      if (waitMs > 0) await new Promise((resolve) => window.setTimeout(resolve, waitMs));
      lastSearchAtRef.current = Date.now();
      const params = new URLSearchParams({
        format: 'jsonv2',
        q: `${query}, Nagpur, Maharashtra`,
        countrycodes: 'in',
        viewbox: '78.85,21.30,79.35,20.95',
        bounded: '1',
        limit: '5',
        addressdetails: '1',
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
      if (!response.ok) throw new Error(`OpenStreetMap search returned HTTP ${response.status}.`);
      const results: unknown = await response.json();
      if (!Array.isArray(results)) throw new Error('The locality search returned an unexpected response.');
      const places = results.filter(
        (result): result is SearchResult =>
          typeof result === 'object' &&
          result !== null &&
          typeof result.place_id === 'number' &&
          typeof result.display_name === 'string' &&
          typeof result.lat === 'string' &&
          typeof result.lon === 'string' &&
          Number.isFinite(Number(result.lat)) &&
          Number.isFinite(Number(result.lon)),
      );
      if (!places.length) {
        setSearchError('No matching places found in the Nagpur search area.');
        return;
      }
      setSearchResults(places);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Locality search is unavailable.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectPlace = (result: SearchResult) => {
    const parts = result.display_name.split(',').map((part) => part.trim());
    const selected = {
      name: parts[0] || 'Selected place',
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      description: parts.slice(1, 4).join(', '),
    };
    setPlace(selected);
    onPlaceSelected(selected);
    setSearchText(parts[0] || '');
    setSearchResults([]);
  };

  const toggleFullscreen = async () => {
    const panel = mapPanelRef.current;
    if (!panel) return;
    setMapControlError('');
    try {
      if (document.fullscreenElement === panel) {
        await document.exitFullscreen();
      } else {
        await panel.requestFullscreen();
      }
      window.setTimeout(() => map?.invalidateSize(), 100);
    } catch (error) {
      setMapControlError(error instanceof Error ? error.message : 'Fullscreen mode is unavailable.');
    }
  };

  const setFrame = (index: number) => {
    onFrameChange(index);
    if (isPlaying) setIsPlaying(false);
  };

  return (
    <div className="live-map-panel" ref={mapPanelRef}>
      <div className="live-map-toolbar">
        <form className="locality-search" onSubmit={searchPlaces} role="search">
          <Search size={16} aria-hidden="true" />
          <input
            aria-label="Search Nagpur localities"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search Nagpur localities"
          />
          <button type="submit" disabled={isSearching || !searchText.trim()}>
            {isSearching ? 'Searching' : 'Find'}
          </button>
        </form>
        <div className="map-toolbar-actions">
          <button
            type="button"
            className={isRadarVisible ? 'map-action is-active' : 'map-action'}
            onClick={() => setIsRadarVisible((visible) => !visible)}
            aria-pressed={isRadarVisible}
            title={isRadarVisible ? 'Hide radar layer' : 'Show radar layer'}
          >
            <Layers3 size={15} />
            <span>Radar</span>
          </button>
          <button type="button" className="map-action" onClick={toggleFullscreen} title="Toggle fullscreen">
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFullscreen ? 'Exit' : 'Expand'}</span>
          </button>
        </div>
      </div>

      {(searchError || searchResults.length > 0) && (
        <div className="locality-search-results">
          {searchError && <p role="status">{searchError}</p>}
          {searchResults.map((result) => (
            <button type="button" key={result.place_id} onClick={() => selectPlace(result)}>
              <span>{result.display_name.split(',')[0]}</span>
              <small>{result.display_name}</small>
            </button>
          ))}
        </div>
      )}

      <div className="live-map-canvas">
        <MapContainer
          center={[nagpurCenter.latitude, nagpurCenter.longitude]}
          zoom={12}
          minZoom={5}
          maxZoom={17}
          scrollWheelZoom
          zoomControl={false}
          className="nagpur-map"
        >
          <MapController place={place} onReady={setMap} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            subdomains="abc"
            maxZoom={19}
            className="dark-base-tiles"
          />
          {isRadarVisible && radar && selectedFrame && (
            <TileLayer
              key={selectedFrame.time}
              attribution='Radar imagery &copy; <a href="https://www.rainviewer.com/">RainViewer</a>'
              url={`${radar.host}${selectedFrame.path}/256/{z}/{x}/{y}/2/1_1.png`}
              maxNativeZoom={7}
              maxZoom={17}
              opacity={0.72}
            />
          )}
          {place && (
            <Marker position={[place.latitude, place.longitude]}>
              <Popup>
                <strong>{place.name}</strong>
                <br />
                {place.description}
              </Popup>
            </Marker>
          )}
          <CircleMarker
            center={[nagpurCenter.latitude, nagpurCenter.longitude]}
            radius={5}
            pathOptions={{ color: '#67e8f9', fillColor: '#67e8f9', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>Nagpur forecast reference point</Popup>
          </CircleMarker>
        </MapContainer>
        <div className="map-zoom-controls" aria-label="Map zoom controls">
          <button type="button" aria-label="Zoom in" onClick={() => map?.zoomIn()}>+</button>
          <button type="button" aria-label="Zoom out" onClick={() => map?.zoomOut()}>−</button>
        </div>
        <button
          type="button"
          className="map-center-control"
          aria-label="Return to Nagpur center"
          title="Return to Nagpur center"
          onClick={() => {
            setPlace(null);
            onPlaceSelected(null);
            map?.flyTo([nagpurCenter.latitude, nagpurCenter.longitude], 12, { duration: 0.8 });
          }}
        >
          <LocateFixed size={16} />
        </button>
        <div className="map-overlay-label">
          <span className="radar-live-dot" />
          <span>{selectedFrame ? `PAST RADAR · ${formatRadarTime(selectedFrame.time)}` : 'RADAR · UNAVAILABLE'}</span>
        </div>
        {mapControlError && <p className="map-control-error" role="status">{mapControlError}</p>}
        {!isRadarVisible && <div className="map-layer-disabled">Radar layer hidden</div>}
      </div>

      <div className="map-lower-controls">
        <div className="map-layer-status">
          <div className="map-layer-toggle">
            <span className="layer-swatch radar-swatch" />
            <span>Observed radar reflectivity</span>
            <span className="layer-availability">
              {radar ? 'Available' : 'Radar unavailable'}
            </span>
          </div>
          <div className="map-layer-toggle is-unavailable">
            <span className="layer-swatch risk-swatch" />
            <span>Flood susceptibility</span>
            <span className="layer-availability">No verified local data</span>
          </div>
          <div className="map-layer-toggle is-unavailable">
            <span className="layer-swatch report-swatch" />
            <span>Waterlogging reports</span>
            <span className="layer-availability">No verified feed</span>
          </div>
          <div className="map-layer-toggle is-unavailable">
            <span className="layer-swatch boundary-swatch" />
            <span>Nagpur boundary</span>
            <span className="layer-availability">No city GeoJSON</span>
          </div>
        </div>
        <div className="radar-timeline">
          <div className="radar-timeline-heading">
            <div>
              <p>RECENT RADAR FRAMES</p>
              <span>{selectedFrame ? formatRadarTime(selectedFrame.time, { dateStyle: 'medium' }) : 'No frames available'}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isPlaying && selectedFrameIndex >= frames.length - 1) onFrameChange(0);
                setIsPlaying((playing) => !playing);
              }}
              disabled={frames.length < 2}
              aria-label={isPlaying ? 'Pause radar playback' : 'Play radar frames'}
              title={isPlaying ? 'Pause playback' : 'Play past radar frames'}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>
          </div>
          <input
            aria-label="Select radar frame"
            type="range"
            min={0}
            max={Math.max(frames.length - 1, 0)}
            step={1}
            value={Math.min(selectedFrameIndex, Math.max(frames.length - 1, 0))}
            disabled={frames.length < 2}
            onChange={(event) => setFrame(Number(event.target.value))}
          />
          <div className="radar-timeline-labels">
            <span>{frames[0] ? formatRadarTime(frames[0].time) : '—'}</span>
            <span>{frames.at(-1) ? formatRadarTime(frames.at(-1)!.time) : '—'}</span>
          </div>
          <p className="radar-timeline-note">Past frames only · 10-minute intervals · max native zoom 7 · reflectivity (dBZ), not rainfall in mm</p>
        </div>
      </div>
    </div>
  );
}
