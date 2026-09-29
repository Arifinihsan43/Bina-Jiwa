import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [-6.215, 106.825]; // Jakarta

const pinIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `
    <div class="leaflet-pin-wrapper active">
      <div class="leaflet-pin-badge">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#0284c7" stroke="#ffffff" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
        </svg>
      </div>
    </div>
  `,
  iconSize: [26, 30],
  iconAnchor: [13, 28],
});

/** Peta kecil untuk memilih titik lokasi praktik. Klik peta untuk memindahkan pin. */
export default function LocationPicker({ lat, lng, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    map.on('click', (e) => {
      onChangeRef.current(Number(e.latlng.lat.toFixed(7)), Number(e.latlng.lng.toFixed(7)));
    });

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sinkronkan pin dengan nilai lat/lng dari form.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    }
    if (!map.getBounds().contains([lat, lng])) {
      map.setView([lat, lng], Math.max(map.getZoom(), 14));
    }
  }, [lat, lng]);

  return <div ref={containerRef} className="pp-location-map" />;
}
