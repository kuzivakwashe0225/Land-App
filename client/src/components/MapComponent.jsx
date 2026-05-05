import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '1.5rem',
};

const defaultCenter = {
    lat: -17.8292, // Harare
    lng: 31.0522
};

const MapComponent = ({
    center = defaultCenter,
    zoom = 13,
    onLocationSelect,
    readOnly = false,
    isLoaded: externalIsLoaded
}) => {
    const [map, setMap] = useState(null);
    const [markerPosition, setMarkerPosition] = useState(center);

    useEffect(() => {
        if (center && (center.lat !== markerPosition.lat || center.lng !== markerPosition.lng)) {
            setMarkerPosition(center);
        }
    }, [center]);

    const onMapClick = useCallback((e) => {
        if (readOnly) return;
        const newPos = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
        };
        setMarkerPosition(newPos);
        if (onLocationSelect) {
            onLocationSelect(newPos);
        }
    }, [readOnly, onLocationSelect]);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    return (
        <div className="relative w-full">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={markerPosition || center}
                zoom={zoom}
                onClick={onMapClick}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    disableDefaultUI: false,
                    clickableIcons: false,
                    scrollwheel: true,
                }}
            >
                {(markerPosition || center) && (
                    <Marker
                        position={markerPosition || center}
                        draggable={!readOnly}
                        onDragEnd={(e) => {
                            if (readOnly) return;
                            const newPos = {
                                lat: e.latLng.lat(),
                                lng: e.latLng.lng(),
                            };
                            setMarkerPosition(newPos);
                            if (onLocationSelect) onLocationSelect(newPos);
                        }}
                    />
                )}
            </GoogleMap>
        </div>
    );
};

export default React.memo(MapComponent);
