import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import type { FloodCoordinates } from '../lib/services/floodPredictionService';

type FloodPredictionMapProps = {
  coordinates: FloodCoordinates;
  elevation: number | null;
  onSelect: (coordinates: FloodCoordinates) => void;
};

function MapClickHandler({ onSelect }: { onSelect: FloodPredictionMapProps['onSelect'] }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: Number(event.latlng.lat.toFixed(5)),
        longitude: Number(event.latlng.lng.toFixed(5)),
      });
    },
  });
  return null;
}

export function FloodPredictionMap({ coordinates, elevation, onSelect }: FloodPredictionMapProps) {
  return (
    <MapContainer
      center={[21.1458, 79.0882]}
      zoom={12}
      minZoom={10}
      maxZoom={17}
      maxBounds={[[20.75, 78.55], [21.55, 79.65]]}
      maxBoundsViscosity={0.85}
      scrollWheelZoom
      className="flood-map"
      aria-label="Interactive Nagpur map. Select a point to inspect rainfall and terrain data."
    >
      <MapClickHandler onSelect={onSelect} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains="abc"
        maxZoom={19}
      />
      <CircleMarker
        center={[coordinates.latitude, coordinates.longitude]}
        radius={8}
        pathOptions={{ color: '#064e3b', fillColor: '#34d399', fillOpacity: 0.9, weight: 3 }}
      >
        <Popup>
          <strong>Selected assessment point</strong>
          <br />
          {coordinates.latitude.toFixed(5)}° N, {coordinates.longitude.toFixed(5)}° E
          <br />
          {elevation === null ? 'Elevation unavailable' : `Terrain elevation: ${elevation.toFixed(0)} m`}
          <br />
          Flood incidents and locality vulnerability data are not available here.
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}
