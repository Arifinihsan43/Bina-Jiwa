import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ShieldCheck, ExternalLink, Calendar, Clock, Navigation } from 'lucide-react';

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

  // Initialize Leaflet Map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center around Jakarta Pusat / Selatan area
      const map = L.map(mapContainerRef.current, {
        center: [-6.215, 106.825],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      // Add sleek zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB Voyager clean tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    // Force map resize check
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
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
            <span class="leaflet-pin-label">${p.name.split(',')[0]}</span>
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
            <img src="${p.avatar}" alt="${p.name}" class="leaflet-popup-avatar" />
            <div>
              <div class="leaflet-popup-name">${p.name.split(',')[0]}</div>
              <div class="leaflet-popup-clinic">${p.locationName.split(',')[0]}</div>
            </div>
          </div>
          <div class="leaflet-popup-body">
            <div class="leaflet-popup-slot">
              ${p.availableToday ? `Hari ini ${p.slots[0]}` : p.availableNext || 'Tersedia Besok'}
            </div>
            <div class="leaflet-popup-fee">${p.fee}</div>
          </div>
          <button id="popup-book-btn-${p.id}" class="leaflet-popup-btn">
            Rute & Buat Janji &rarr;
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
        map.flyTo([p.lat, p.lng], 14, { duration: 1.2 });
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
