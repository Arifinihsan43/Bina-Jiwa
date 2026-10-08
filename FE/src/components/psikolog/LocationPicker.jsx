import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, AlertCircle } from 'lucide-react';
import { TILE_OPTIONS, TILE_URL } from '../../utils/mapTiles';

const INDONESIA_CENTER = [-2.5, 117.5];

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

// Geocoder OpenStreetMap (Nominatim). Dipanggil hanya saat psikolog menekan "Cari",
// sesuai kebijakan pemakaian Nominatim (tanpa autocomplete per ketikan).
async function searchAddress(query) {
  const params = new URLSearchParams({ format: 'jsonv2', q: query, countrycodes: 'id', limit: '5' });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'id' },
  });
  if (!res.ok) throw new Error('Layanan pencarian alamat sedang tidak tersedia.');
  return res.json();
}

/**
 * Peta kecil untuk memilih titik lokasi praktik: cari alamat atau klik peta.
 * suggestedQuery: alamat awal untuk kolom pencarian (mis. alamat praktik + kota).
 */
export default function LocationPicker({ lat, lng, onChange, suggestedQuery = '' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [query, setQuery] = useState(suggestedQuery);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, { center: INDONESIA_CENTER, zoom: 5 });
    map.attributionControl.setPrefix(false);
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);

    map.on('click', (e) => {
      onChangeRef.current(Number(e.latlng.lat.toFixed(7)), Number(e.latlng.lng.toFixed(7)));
    });

    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
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
    if (!map.getBounds().contains([lat, lng]) || map.getZoom() < 12) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15));
    }
  }, [lat, lng]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setResults([]);
    try {
      const rows = await searchAddress(query.trim());
      if (rows.length === 0) setSearchError('Alamat tidak ditemukan. Coba tulis lebih umum (mis. nama jalan + kota).');
      setResults(rows);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r) => {
    onChange(Number(Number(r.lat).toFixed(7)), Number(Number(r.lon).toFixed(7)));
    setResults([]);
  };

  return (
    <div className="pp-location-picker">
      <div className="pp-location-search">
        <input
          className="pp-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Cari nama klinik atau jalan + kota, mis. Grhasia Yogyakarta"
          aria-label="Cari alamat lokasi praktik"
        />
        <button type="button" className="pp-btn-secondary" onClick={handleSearch} disabled={searching || !query.trim()}>
          <Search size={15} />
          <span>{searching ? 'Mencari…' : 'Cari'}</span>
        </button>
      </div>

      {searchError && (
        <p className="pp-location-error">
          <AlertCircle size={13} /> {searchError}
        </p>
      )}

      {results.length > 0 && (
        <ul className="pp-location-results">
          {results.map((r) => (
            <li key={r.place_id}>
              <button type="button" onClick={() => pickResult(r)}>{r.display_name}</button>
            </li>
          ))}
        </ul>
      )}

      <div ref={containerRef} className="pp-location-map" />
    </div>
  );
}
