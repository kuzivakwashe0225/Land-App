import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, FileText, Upload, Save, X, Map, Navigation, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { landService } from '../services/landService';
import MapSelector from '../components/MapSelector';

const CreateLandListing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // GPS proof-of-presence state
  const [gpsProof, setGpsProof] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // User's current GPS position (for coordinate validation)
  const [userGpsPosition, setUserGpsPosition] = useState(null);
  const [gpsWarning, setGpsWarning] = useState(null);

  // Geocoding state (Find on Map button)
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  // Live Geo-Verification state
  const [liveVerificationStatus, setLiveVerificationStatus] = useState(null);

  const [formData, setFormData] = useState({
    standNumber: '',
    titleDeedNumber: '',
    location: {
      address: { street: '', suburb: 'HARARE', province: 'HARARE' },
      coordinates: { latitude: '', longitude: '' }
    },
    landDetails: {
      size: { squareMeters: '' },
      zoning: 'RESIDENTIAL',
      landUse: 'VACANT',
      description: ''
    },
    transaction: { listedPrice: { amount: '' } }
  });

  const [documents, setDocuments] = useState([]);
  const [images, setImages] = useState([]);
  const [showMapModal, setShowMapModal] = useState(false);

  // Capture seller's live GPS location
  const captureGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('GPS is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsProof({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(`GPS access denied: ${err.message}. You may still submit, but your listing will be flagged for manual review.`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        let newData = { ...prev };
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Haversine distance calculation (meters)
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Format distance for display
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // When user clicks a point on the map — reverse-geocode and write address into the street box
  const handleLocationSelect = async (location) => {
    const lat = location.lat || location.latitude;
    const lng = location.lng || location.longitude;

    // Store coordinates for backend verification
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: { latitude: lat, longitude: lng }
      }
    }));

    // Reverse-geocode: convert coordinates → human-readable address
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await res.json();
      if (data?.display_name) {
        const addr = data.address || {};
        // Build a clean readable street string
        const parts = [
          addr.house_number,
          addr.road || addr.pedestrian || addr.footway || addr.path,
          addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district,
          addr.city || addr.town || addr.village
        ].filter(Boolean);
        const streetAddress = parts.length > 0
          ? parts.join(', ')
          : data.display_name.split(',').slice(0, 3).join(',').trim();

        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { latitude: lat, longitude: lng },
            address: {
              ...prev.location.address,
              street: streetAddress
            }
          }
        }));
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
    }

    // Ping Backend for Live Verification Check
    try {
      const verifyRes = await landService.checkLocation(lat, lng, formData.standNumber);
      setLiveVerificationStatus(verifyRes.verificationStatus);
    } catch (err) {
      console.warn('Live verification check failed:', err);
      setLiveVerificationStatus(null);
    }
  };

  // Open map modal and capture user's GPS position
  const openMapModal = () => {
    setShowMapModal(true);
    setGpsWarning(null);
    // Capture user's current GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGpsPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        (err) => {
          console.warn('GPS capture failed:', err);
          // GPS failure is not blocking - user can still pick location on map
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  // Use user's current GPS as the listing coordinates
  const useCurrentLocation = () => {
    if (!userGpsPosition) {
      toast.error('GPS location not available. Please allow location access and try again.');
      return;
    }
    handleLocationSelect(userGpsPosition);
    toast.success('Using your current location');
  };

  // "Find on Map" button — geocodes the typed address then opens the map with a pin
  const findOnMap = async () => {
    const address = formData.location.address.street;
    if (!address) return;
    setGeocoding(true);
    setGeocodeError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Zimbabwe')}&limit=1`
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon } = results[0];
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { latitude: parseFloat(lat), longitude: parseFloat(lon) }
          }
        }));
        
        // Live verification check
        try {
          const verifyRes = await landService.checkLocation(parseFloat(lat), parseFloat(lon), formData.standNumber);
          setLiveVerificationStatus(verifyRes.verificationStatus);
        } catch (vErr) {
          console.warn('Live verification check failed:', vErr);
          setLiveVerificationStatus(null);
        }

        openMapModal(); // Open map with GPS capture
      } else {
        setGeocodeError('Address not found. Try the map button below to pick a location manually.');
        openMapModal(); // Still open map for manual picking
      }
    } catch (err) {
      setGeocodeError('Network error searching address. Please pick the location manually.');
      console.warn('Geocoding failed:', err);
      openMapModal();
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submissionData = {
        ...formData,
        landDetails: {
          ...formData.landDetails,
          size: {
            squareMeters: Number(formData.landDetails.size.squareMeters),
            hectares: Number(formData.landDetails.size.squareMeters) / 10000
          }
        },
        location: {
          ...formData.location,
          latitude: formData.location.coordinates.latitude !== '' 
            ? Number(formData.location.coordinates.latitude) 
            : null,
          longitude: formData.location.coordinates.longitude !== '' 
            ? Number(formData.location.coordinates.longitude) 
            : null,
        },
        transaction: {
          ...formData.transaction,
          listedPrice: { amount: Number(formData.transaction.listedPrice.amount), currency: 'USD' }
        },
        // Include GPS proof — backend verification service will validate distance
        gpsProof: gpsProof || null,
      };

      const response = await landService.createLandListing(submissionData);

      // Upload title deed documents and images if any
      if (documents.length > 0 || images.length > 0) {
        const docFormData = new FormData();
        documents.forEach(doc => docFormData.append('titleDeed', doc));
        images.forEach(img => docFormData.append('images', img));
        try {
          const uploadResponse = await landService.uploadLandDocuments(response.data._id, docFormData);
          console.log('Documents uploaded successfully:', uploadResponse);
          toast.success(`✅ ${uploadResponse.data.documentsCount} documents and ${uploadResponse.data.imagesCount} images uploaded`);
        } catch (docErr) {
          console.error('Document upload failed (listing still created):', docErr);
          toast.error(`⚠️ Documents upload failed: ${docErr.response?.data?.message || docErr.message}. Listing created - you can retry upload later.`);
        }
      }

      const successMsg = response.message || 'Land listing submitted! Automated verification is now running.';
      setSuccess(successMsg);
      toast.success(successMsg);
      setTimeout(() => navigate(`/lands/${response.data._id}`), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create land listing';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Land Listing</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stand Number *
                  </label>
                  <input
                    type="text"
                    name="standNumber"
                    value={formData.standNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1234A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title Deed Number *
                  </label>
                  <input
                    type="text"
                    name="titleDeedNumber"
                    value={formData.titleDeedNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., TD-2024-123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    name="transaction.listedPrice.amount"
                    value={formData.transaction.listedPrice.amount}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Land Size (sqm) *
                  </label>
                  <input
                    type="number"
                    name="landDetails.size.squareMeters"
                    value={formData.landDetails.size.squareMeters}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 500"
                  />
                </div>
              </div>
            </div>

            {/* Removed Owner Information, because the backend automatically attaches `req.user.id` to the owner reference. */}

            {/* Location Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Location Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Street Address + Find on Map */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="location.address.street"
                      value={formData.location.address.street}
                      onChange={handleChange}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 14 Borrowdale Road, Harare"
                    />
                    <button
                      type="button"
                      onClick={findOnMap}
                      disabled={geocoding || !formData.location.address.street}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm whitespace-nowrap flex items-center gap-2 font-bold"
                    >
                      {geocoding
                        ? <><span className="animate-spin inline-block">⟳</span> Searching...</>
                        : <><MapPin className="h-4 w-4" /> Find on Map</>
                      }
                    </button>
                  </div>
                  {geocodeError && (
                    <p className="text-xs text-red-600 mt-1">⚠ {geocodeError}</p>
                  )}
                  {formData.location.coordinates.latitude && !geocodeError && (
                    <p className="text-xs text-green-600 mt-1">
                      📍 Location pinned on map
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Type an address and click "Find on Map", or click the map button below to pick manually
                  </p>
                </div>

                {/* Suburb */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Suburb *</label>
                  <select
                    name="location.address.suburb"
                    value={formData.location.address.suburb}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HARARE">Harare</option>
                    <option value="CHITUNGWIZA">Chitungwiza</option>
                    <option value="KADOMA">Kadoma</option>
                    <option value="BULAWAYO">Bulawayo</option>
                    <option value="GWERU">Gweru</option>
                    <option value="MASVINGO">Masvingo</option>
                    <option value="MUTARE">Mutare</option>
                  </select>
                </div>

                {/* Province */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                  <input
                    type="text"
                    name="location.address.province"
                    value={formData.location.address.province}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Harare Province"
                  />
                </div>

                {/* Open Map Button + GPS Advisory */}
                <div className="md:col-span-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={openMapModal}
                        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
                      >
                        <Map className="h-5 w-5" />
                        Set Location on Map
                      </button>
                      <button
                        type="button"
                        onClick={useCurrentLocation}
                        disabled={!userGpsPosition}
                        className="bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 whitespace-nowrap"
                        title="Use your current GPS location as the listing coordinates"
                      >
                        <Navigation className="h-4 w-4" />
                        Use My Location
                      </button>
                    </div>
                    {gpsWarning && (
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800 flex gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{gpsWarning}</span>
                      </div>
                    )}
                    <p className="text-xs text-blue-700 mt-2 text-center">
                      {formData.location.address.street
                        ? `📍 Current address: ${formData.location.address.street}`
                        : 'Click on the map — the address will be written here automatically'}
                    </p>
                  </div>
                </div>

              </div>
            </div>


            {/* Land Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Land Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoning *
                  </label>
                  <select
                    name="landDetails.zoning"
                    value={formData.landDetails.zoning}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.landDetails.zoning === 'COMMERCIAL' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="AGRICULTURAL">Agricultural</option>
                    <option value="MIXED_USE">Mixed Use</option>
                  </select>
                  {formData.landDetails.zoning === 'COMMERCIAL' && (
                    <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Note: Commercial stands are currently restricted from verification in this test environment.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Land Use *
                  </label>
                  <select
                    name="landDetails.landUse"
                    value={formData.landDetails.landUse}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="VACANT">Vacant</option>
                    <option value="DEVELOPED">Developed</option>
                    <option value="PARTIALLY_DEVELOPED">Partially Developed</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="landDetails.description"
                    value={formData.landDetails.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the land, its features, and any additional information..."
                  />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification Documents</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500">Upload documents</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-600 mt-2">
                    PDF, DOC, DOCX, JPG, PNG up to 5MB each
                  </p>
                </div>
              </div>

              {documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium text-gray-900">Uploaded Documents:</h3>
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Stand Images (Optional)</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500">Upload images</span>
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-600 mt-2">
                    JPG, PNG, WEBP up to 5MB each
                  </p>
                </div>
              </div>

              {images.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="font-medium text-gray-900">Uploaded Images:</h3>
                  {images.map((img, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm">{img.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPS Proof-of-Presence */}
            <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Navigation className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-blue-900 mb-1">
                    📍 GPS Proof-of-Presence
                    <span className="ml-2 text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Recommended</span>
                  </h2>
                  <p className="text-sm text-blue-700 mb-4">
                    Our automated verification system checks that you are physically at the land when submitting.
                    Capturing your GPS location reduces review time and increases your listing's trust score.
                  </p>

                  {gpsProof ? (
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                      <CheckCircle className="text-green-600 h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">✅ GPS Captured Successfully</p>
                        <p className="text-xs text-green-700">
                          {gpsProof.latitude.toFixed(6)}, {gpsProof.longitude.toFixed(6)}
                          &nbsp;·&nbsp; Accuracy: ±{Math.round(gpsProof.accuracy)}m
                        </p>
                      </div>
                      <button type="button" onClick={() => setGpsProof(null)}
                        className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline">Reset</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={captureGPSLocation}
                      disabled={gpsLoading}
                      className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium text-sm"
                    >
                      <Navigation className="h-4 w-4" />
                      {gpsLoading ? 'Getting GPS...' : 'Capture My GPS Location'}
                    </button>
                  )}

                  {gpsError && (
                    <div className="mt-3 flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <p className="text-xs">{gpsError}</p>
                    </div>
                  )}

                  {!gpsProof && !gpsError && (
                    <p className="text-xs text-blue-600 mt-2">
                      ⚠️ Without GPS proof, your listing will require manual verification which may take 2–5 business days.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/lands')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center gap-2"
              >
                {loading ? (
                  <><span className="animate-spin">⟳</span> Submitting...</>
                ) : (
                  <><Save className="h-4 w-4" /> Submit for Verification</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">📍 Set Land Location on Map</h3>
                <p className="text-xs text-blue-100 mt-0.5">Click anywhere on the map — the address will be filled in automatically</p>
              </div>
              <button
                onClick={() => setShowMapModal(false)}
                className="hover:bg-blue-700 p-1 rounded"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden" style={{ cursor: 'crosshair' }}>
              <MapSelector
                onLocationSelected={handleLocationSelect}
                initialLocation={
                  formData.location.coordinates.latitude && formData.location.coordinates.longitude
                    ? { lat: Number(formData.location.coordinates.latitude), lng: Number(formData.location.coordinates.longitude) }
                    : null
                }
                verificationStatus={liveVerificationStatus}
                isGeocoding={geocoding}
              />
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t flex justify-between items-center gap-4">
              <p className="text-sm text-gray-700 flex items-center gap-2 min-w-0">
                {formData.location.address.street ? (
                  <><span className="text-green-600">📍</span>
                  <span className="truncate font-medium">{formData.location.address.street}</span></>
                ) : (
                  <span className="text-gray-500 italic">Click anywhere on the map to set the address</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="shrink-0 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
              >
                ✓ Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateLandListing;
