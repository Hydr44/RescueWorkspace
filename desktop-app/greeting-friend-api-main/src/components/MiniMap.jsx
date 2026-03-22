// src/components/MiniMap.jsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// fix icone default
const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MiniMap({ lat, lng, accuracy = 30, height = 260, zoom = 16 }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const m = L.map(ref.current, { zoomControl: true, attributionControl: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(m);
    mapRef.current = m;
  }, []);

  useEffect(() => {
    if (!mapRef.current || lat == null || lng == null) return;
    const m = mapRef.current;

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { icon }).addTo(m);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (!circleRef.current) {
      circleRef.current = L.circle([lat, lng], { radius: Math.max(accuracy || 0, 1) }).addTo(m);
    } else {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(Math.max(accuracy || 0, 1));
    }

    m.setView([lat, lng], zoom);
  }, [lat, lng, accuracy, zoom]);

  return (
    <div
      ref={ref}
      style={{ height }}
      className="w-full rounded-lg border border-[#243044]  overflow-hidden"
    />
  );
}
