import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Base marker styles using simple SVG strings
const createIcon = (color) => {
  const markerHtmlStyles = `
    background-color: ${color};
    width: 2rem;
    height: 2rem;
    display: block;
    left: -1rem;
    top: -1rem;
    position: relative;
    border-radius: 3rem 3rem 0;
    transform: rotate(45deg);
    border: 1px solid #FFFFFF;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  `;
  
  return L.divIcon({
    className: "custom-pin",
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles}"></span>`
  });
};

const defaultIcon = createIcon('#3B82F6'); // Blue
const successIcon = createIcon('#10B981'); // Green
const warningIcon = createIcon('#F59E0B'); // Yellow/Orange
const dangerIcon = createIcon('#EF4444');  // Red

const LocationMarker = ({ position, setPosition, icon }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={icon}></Marker>
  );
};

// Component
const MapSelector = ({ onLocationSelected, initialLocation = null, verificationStatus = null, isGeocoding = false }) => {
  const [position, setPosition] = useState(initialLocation);
  
  // Update position if initialLocation changes (e.g., from geocoder typing)
  useEffect(() => {
    if (initialLocation && initialLocation.lat && initialLocation.lng) {
      setPosition(initialLocation);
    }
  }, [initialLocation]);

  useEffect(() => {
    if (position && (!initialLocation || position.lat !== initialLocation.lat || position.lng !== initialLocation.lng)) {
      onLocationSelected(position);
    }
  }, [position]);

  // Determine icon and status text
  let activeIcon = defaultIcon;
  let statusBadge = null;

  if (verificationStatus === 'AUTO_VERIFIED') {
    activeIcon = successIcon;
    statusBadge = (
      <div className="absolute top-4 right-4 z-[400] bg-white px-4 py-2 rounded-lg shadow-lg border border-emerald-200 flex items-center gap-2 text-emerald-700 font-semibold text-sm">
        <span className="text-xl">✔</span> Verified Stand (Authority Approved)
      </div>
    );
  } else if (verificationStatus === 'REQUIRES_REVIEW' || verificationStatus === 'SUSPICIOUS') {
    activeIcon = warningIcon;
    statusBadge = (
      <div className="absolute top-4 right-4 z-[400] bg-white px-4 py-2 rounded-lg shadow-lg border border-amber-200 flex items-center gap-2 text-amber-700 font-semibold text-sm">
        <span className="text-xl">⚠</span> Pending Authority Review
      </div>
    );
  } else if (verificationStatus === 'REJECTED') {
    activeIcon = dangerIcon;
    statusBadge = (
      <div className="absolute top-4 right-4 z-[400] bg-white px-4 py-2 rounded-lg shadow-lg border border-red-200 flex items-center gap-2 text-red-700 font-semibold text-sm">
        <span className="text-xl">✖</span> Not found in authority database
      </div>
    );
  } else if (isGeocoding) {
    statusBadge = (
      <div className="absolute top-4 right-4 z-[400] bg-white px-4 py-2 rounded-lg shadow-lg border border-blue-200 flex items-center gap-2 text-blue-700 font-semibold text-sm">
        <span className="animate-spin text-xl">⟳</span> Checking Stand Registry...
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {statusBadge}
      <MapContainer 
        center={position || [-17.825166, 31.033510]} 
        zoom={position ? 15 : 12} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} icon={activeIcon} />
      </MapContainer>
    </div>
  );
};

export default MapSelector;
