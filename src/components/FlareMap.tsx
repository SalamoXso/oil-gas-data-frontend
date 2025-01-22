"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngExpression } from "leaflet";

interface Flare {
  id: number;
  latitude: number;
  longitude: number;
  volume: number;
  duration: number;
  h2s: number;
  date: string;
  location: string;
  operator: string;
}

interface FlareMapProps {
  data: Flare[];
}

export default function FlareMap({ data }: FlareMapProps) {
  const center: LatLngExpression = [31.9686, -99.9018]; // Default center (Texas coordinates)

  return (
    <MapContainer center={center} zoom={6} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {data
        .filter((flare) => flare.latitude && flare.longitude) // Filter out invalid coordinates
        .map((flare) => (
          <Marker key={flare.id} position={[flare.latitude, flare.longitude]}>
            <Popup>
              <strong>Volume:</strong> {flare.volume} <br />
              <strong>Duration:</strong> {flare.duration} <br />
              <strong>H2S:</strong> {flare.h2s} <br />
              <strong>Date:</strong> {flare.date} <br />
              <strong>Location:</strong> {flare.location} <br />
              <strong>Operator:</strong> {flare.operator}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}