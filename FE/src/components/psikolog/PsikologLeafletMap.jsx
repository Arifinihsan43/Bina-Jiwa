import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ShieldCheck, ExternalLink, Navigation } from 'lucide-react';
import { TILE_OPTIONS, TILE_URL } from '../../utils/mapTiles';

// Data berasal dari input psikolog — wajib di-escape sebelum masuk ke HTML Leaflet.
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

export default function PsikologLeafletMap({
  psychologists = [],
  activePinId,
  setActivePinId,
  onOpenBooking,
  onlyAvailableToday,
  setOnlyAvailableToday
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const lastListKeyRef = useRef('');
  const lastActiveRef = useRef(null);

  // Initialize Leaflet Map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center around Jakarta Pusat / Selatan area
      const map = L.map(mapContainerRef.current, {
        center: [-2.5, 117.5], // Indonesia; dipusatkan ulang ke pin psikolog setelah data dimuat
        zoom: 5,
        zoomControl: false,
        attributionControl: true // wajib untuk lisensi data OpenStreetMap
      });
      map.attributionControl.setPrefix(false);
      // Bagian bawah peta tertutup bilah keterangan, jadi kontrol diletakkan di atas.
      map.attributionControl.setPosition('topleft');
      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);

      mapInstanceRef.current = map;
    }

    // Leaflet perlu diberi tahu bila ukuran wadahnya berubah (data dimuat, sidebar
    // dibuka/ditutup, layout responsif) — tanpa ini peta tampil abu-abu/terpotong.
    const resizeObserver = new ResizeObserver(() => mapInstanceRef.current?.invalidateSize());
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers whenever psychologists or activePinId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Daftar pin berubah (data dimuat / filter) -> tampilkan semua pin dalam layar.
    const listKey = psychologists.map((p) => p.id).join(',');
    const listChanged = listKey !== lastListKeyRef.current;
    const activeChanged = activePinId !== lastActiveRef.current;
    lastListKeyRef.current = listKey;
    lastActiveRef.current = activePinId;
    if (listChanged && psychologists.length > 0) {
      const bounds = L.latLngBounds(psychologists.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    psychologists.forEach((p) => {
      const isActive = p.id === activePinId;

      // Create Custom HTML Div Icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="leaflet-pin-wrapper ${isActive ? 'active' : ''}">
            <div class="leaflet-pin-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="${isActive ? '#0284c7' : '#0ea5e9'}" stroke="#ffffff" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
              </svg>
            </div>
            <span class="leaflet-pin-label">${escapeHtml(p.name.split(',')[0])}</span>
          </div>
        `,
        iconSize: [120, 48],
        iconAnchor: [60, 44]
      });

      const marker = L.marker([p.lat, p.lng], { icon: customIcon }).addTo(map);

      // Popup Content
      const popupHtml = `
        <div class="leaflet-popup-card">
          <div class="leaflet-popup-header">
            <div>
              <div class="leaflet-popup-name">${escapeHtml(p.name.split(',')[0])}</div>
              <div class="leaflet-popup-clinic">${escapeHtml(p.address || p.city)}</div>
            </div>
          </div>
          <div class="leaflet-popup-body">
            <div class="leaflet-popup-slot">
              ${escapeHtml(p.availableToday ? `Hari ini ${p.slots[0]}` : p.availableNext)}
            </div>
          </div>
          <button id="popup-book-btn-${escapeHtml(p.id)}" class="leaflet-popup-btn">
            Buat Janji &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'leaflet-custom-popup',
        closeButton: true,
        offset: [0, -32]
      });

      // Handle marker click
      marker.on('click', () => {
        setActivePinId(p.id);
        map.flyTo([p.lat, p.lng], 14, { duration: 1.2 });
      });

      // Attach button click event once popup opens
      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-book-btn-${p.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onOpenBooking) onOpenBooking(p);
          };
        }
      });

      markersRef.current[p.id] = marker;

      // If active pin, fly to location & open popup
      if (isActive) {
        if (activeChanged && !listChanged) map.flyTo([p.lat, p.lng], 14, { duration: 1.2 });
        marker.openPopup();
      }
    });
  }, [psychologists, activePinId, setActivePinId, onOpenBooking]);

  return (
    <div className="psikolog-map-column">
      <div className="map-card-wrapper">
        {/* Map Top Toggle Bar */}
        <div className="map-top-bar">
          <label className="map-checkbox-label">
            <input
              type="checkbox"
              checked={onlyAvailableToday}
              onChange={(e) => setOnlyAvailableToday(e.target.checked)}
            />
            <span>Hanya Buka Hari Ini</span>
          </label>
          <span className="map-api-badge">
            <Navigation size={12} /> OpenStreetMap API Integrated
          </span>
        </div>

        {/* Real Leaflet Map Container */}
        <div className="styled-map-canvas" style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%', minHeight: '520px', zIndex: 1 }}
          />

          {psychologists.length === 0 && (
            <div className="map-empty-overlay">
              <MapPin size={22} />
              <span>Belum ada psikolog dengan titik lokasi praktik yang cocok dengan filter ini.</span>
            </div>
          )}

          {/* Map Overlay Footer Bar */}
          <div className="map-footer-bar" style={{ zIndex: 1000, position: 'absolute', bottom: 12, left: 12, right: 12 }}>
            <div className="map-footer-left">
              <ShieldCheck size={15} className="text-sky-600" />
              <span>Praktisi terdaftar resmi berstandar klinis HIMPSI</span>
            </div>
            <a href="#panduan" className="map-footer-link">
              Panduan Konsultasi <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
