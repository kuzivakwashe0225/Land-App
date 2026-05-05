import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Share2, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ListingDetails() {
  const { landId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchListing();
  }, [landId]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/land/${landId}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Failed to load listing');
        toast.error(data.message || 'Failed to load listing');
        return;
      }

      setListing(data.data);
    } catch (error) {
      console.error('Error fetching listing:', error);
      setError('Error loading listing');
      toast.error('Error loading listing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-red-600 mb-4">{error || 'Listing not found'}</p>
        <button
          onClick={() => navigate('/lands')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  // Get verification status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUSPICIOUS':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{listing.standNumber}</h1>
            <p className="text-gray-600 mt-2">
              <MapPin size={16} className="inline mr-2" />
              {listing.location?.address?.street}, {listing.location?.address?.suburb}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied!');
              }}
              className="p-2 border rounded hover:bg-gray-100"
              title="Share"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={() => navigate(`/report-fraud?landId=${landId}`)}
              className="p-2 border rounded hover:bg-red-50"
              title="Report"
            >
              <Flag size={20} className="text-red-600" />
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(listing.status)}`}>
            {listing.status}
          </span>
          {listing.verificationScore && (
            <div className="mt-2 text-sm text-gray-600">
              Verification Score: <strong>{listing.verificationScore}%</strong>
            </div>
          )}
        </div>

        {/* Price and Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Price</p>
            <p className="text-3xl font-bold text-gray-900">${listing.price?.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Stand Size</p>
            <p className="text-3xl font-bold text-gray-900">{listing.size} sqm</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Zoning</p>
            <p className="text-2xl font-bold text-gray-900">{listing.zoning}</p>
          </div>
        </div>

        {/* Map */}
        {listing.location?.coordinates?.latitude && listing.location?.coordinates?.longitude && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-2xl font-bold mb-4">Location on Map</h2>
            <MapContainer
              center={[listing.location.coordinates.latitude, listing.location.coordinates.longitude]}
              zoom={16}
              style={{ height: '400px', borderRadius: '0.5rem' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <Marker position={[listing.location.coordinates.latitude, listing.location.coordinates.longitude]}>
                <Popup>
                  <div className="text-center">
                    <strong>{listing.standNumber}</strong>
                    <br />
                    <small>
                      {listing.location.coordinates.latitude.toFixed(4)}, {listing.location.coordinates.longitude.toFixed(4)}
                    </small>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Coordinates:</strong> {listing.location.coordinates.latitude.toFixed(6)}, {listing.location.coordinates.longitude.toFixed(6)}</p>
            </div>
          </div>
        )}

        {/* Land Details */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Land Details</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-gray-600 text-sm">Stand Number</dt>
              <dd className="text-lg font-semibold text-gray-900">{listing.standNumber}</dd>
            </div>
            <div>
              <dt className="text-gray-600 text-sm">Title Deed</dt>
              <dd className="text-lg font-semibold text-gray-900">{listing.titleDeed}</dd>
            </div>
            <div>
              <dt className="text-gray-600 text-sm">Land Use</dt>
              <dd className="text-lg font-semibold text-gray-900">{listing.landUse}</dd>
            </div>
            <div>
              <dt className="text-gray-600 text-sm">Suburb</dt>
              <dd className="text-lg font-semibold text-gray-900">{listing.location?.address?.suburb}</dd>
            </div>
          </dl>
        </div>

        {/* Owner Information */}
        {listing.owner && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-2xl font-bold mb-4">Seller Information</h2>
            <div className="space-y-3">
              <p>
                <strong>Name:</strong> {listing.owner.firstName} {listing.owner.lastName}
              </p>
              <p>
                <strong>Email:</strong> <a href={`mailto:${listing.owner.email}`} className="text-blue-600 hover:underline">{listing.owner.email}</a>
              </p>
              {listing.owner.phoneNumber && (
                <p>
                  <strong>Phone:</strong> <a href={`tel:${listing.owner.phoneNumber}`} className="text-blue-600 hover:underline">{listing.owner.phoneNumber}</a>
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/messages')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Send Inquiry
            </button>
          </div>
        )}

        {/* Documents */}
        {listing.documents && listing.documents.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-2xl font-bold mb-4">Documents</h2>
            <div className="space-y-2">
              {listing.documents.map((doc, index) => (
                <a
                  key={index}
                  href={doc.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 border rounded hover:bg-blue-50 text-blue-600 hover:underline"
                >
                  📄 {doc.documentType}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/lands')}
            className="px-6 py-2 border rounded hover:bg-gray-100"
          >
            Back to Listings
          </button>
        </div>
      </div>
    </div>
  );
}

export default ListingDetails;
