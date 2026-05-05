import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GISMap = ({ 
  lands = [], 
  selectedLand = null, 
  onLandSelect = null,
  onLocationSelect = null,
  showBoundaries = true,
  editable = false,
  addressCoordinates = null, // {latitude, longitude} from typed/geocoded address
  center = [-18.0, 31.0],
  zoom = 10,
  height = '400px'
}) => {
  const [map, setMap] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(
    addressCoordinates ? [addressCoordinates.latitude, addressCoordinates.longitude] : null
  );
  const [boundaries, setBoundaries] = useState([]);
  const mapRef = useRef();

  // Sync addressCoordinates into the map marker
  useEffect(() => {
    if (addressCoordinates?.latitude && addressCoordinates?.longitude) {
      setSelectedLocation([addressCoordinates.latitude, addressCoordinates.longitude]);
    }
  }, [addressCoordinates?.latitude, addressCoordinates?.longitude]);

  // Custom marker icons
  const verifiedIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const pendingIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const flaggedIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Map click handler for editable mode
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        if (editable && onLocationSelect) {
          const { lat, lng } = e.latlng;
          setSelectedLocation([lat, lng]);
          onLocationSelect({ latitude: lat, longitude: lng });
        }
      },
    });
    return null;
  };

  // Helper to extract lat/lng from coordinates
  const getLatLng = (coordinates) => {
    if (coordinates?.latitude !== undefined && coordinates?.longitude !== undefined) {
      return [coordinates.latitude, coordinates.longitude];
    }
    if (Array.isArray(coordinates?.coordinates) && coordinates.coordinates.length === 2) {
      return [coordinates.coordinates[1], coordinates.coordinates[0]]; // GeoJSON is [lng, lat]
    }
    return null;
  };

  // Fit map to show all lands
  const fitToBounds = () => {
    if (map && lands.length > 0) {
      const bounds = new LatLngBounds();
      lands.forEach(land => {
        const latLng = getLatLng(land.location?.coordinates);
        if (latLng) {
          bounds.extend(latLng);
        }
      });
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  useEffect(() => {
    if (map) {
      fitToBounds();
    }
  }, [lands, map]);

  // Get marker icon based on land status
  const getMarkerIcon = (land) => {
    if (land.verification?.isVerified) {
      return verifiedIcon;
    } else if (land.transaction?.status === 'FLAGGED') {
      return flaggedIcon;
    } else {
      return pendingIcon;
    }
  };

  // Get boundary color based on status
  const getBoundaryColor = (land) => {
    if (land.verification?.isVerified) {
      return '#10b981'; // green
    } else if (land.transaction?.status === 'FLAGGED') {
      return '#ef4444'; // red
    } else {
      return '#f59e0b'; // yellow
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenReady={(mapInstance) => setMap(mapInstance.target)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {editable && <MapClickHandler />}

        {/* Land markers */}
        {lands.map((land) => {
          const latLng = getLatLng(land.location?.coordinates);
          if (!latLng) return null;

          return (
            <Marker
              key={land._id}
              position={latLng}
              icon={getMarkerIcon(land)}
              eventHandlers={{
                click: () => onLandSelect && onLandSelect(land)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg mb-2">{land.standNumber}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {land.location?.address?.street}, {land.location?.address?.suburb}
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-semibold">Size:</span> {land.landDetails?.size?.squareMeters} m²
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-semibold">Zoning:</span> {land.landDetails?.zoning}
                  </p>
                  <p className="text-sm mb-2">
                    <span className="font-semibold">Price:</span> ${land.transaction?.listedPrice?.amount?.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      land.verification?.isVerified
                        ? 'bg-green-100 text-green-800'
                        : land.transaction?.status === 'FLAGGED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {land.verification?.isVerified ? 'Verified' :
                       land.transaction?.status === 'FLAGGED' ? 'Flagged' : 'Pending'}
                    </span>
                  </div>
                  <button
                    onClick={() => onLandSelect && onLandSelect(land)}
                    className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Land boundaries */}
        {showBoundaries && lands.map((land) => {
          if (!land.location?.boundaries || land.location.boundaries.length === 0) return null;

          const boundaryCoords = land.location.boundaries
            .map(b => [b.latitude || b[0], b.longitude || b[1]])
            .filter(coord => coord[0] && coord[1]);

          if (boundaryCoords.length === 0) return null;

          return (
            <Polygon
              key={`boundary-${land._id}`}
              positions={boundaryCoords}
              pathOptions={{
                color: getBoundaryColor(land),
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.2
              }}
              eventHandlers={{
                click: () => onLandSelect && onLandSelect(land)
              }}
            />
          );
        })}

        {/* Selected location marker for editable mode */}
        {selectedLocation && editable && (
          <Marker position={selectedLocation} icon={verifiedIcon}>
            <Popup>
              <div className="p-2">
                <p className="text-sm font-semibold">Selected Location</p>
                <p className="text-xs text-gray-600">
                  Lat: {selectedLocation[0].toFixed(6)}, Lng: {selectedLocation[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map controls */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <button
          onClick={fitToBounds}
          className="bg-white p-2 rounded shadow hover:bg-gray-100 transition-colors"
          title="Fit to all lands"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>
        
        {editable && (
          <button
            onClick={() => setSelectedLocation(null)}
            className="bg-white p-2 rounded shadow hover:bg-gray-100 transition-colors"
            title="Clear selection"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded shadow z-[1000]">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs">Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs">Flagged</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GISMap;
