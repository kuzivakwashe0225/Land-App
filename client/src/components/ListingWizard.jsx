import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MapSelector from './MapSelector';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const SUBURBS = ['HARARE', 'CHITUNGWIZA', 'KADOMA', 'BULAWAYO', 'GWERU', 'MASVINGO', 'MUTARE'];
const ZONINGS = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE'];
const LAND_USES = ['VACANT', 'DEVELOPED', 'PARTIALLY_DEVELOPED'];

function ListingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    standNumber: '',
    titleDeedNumber: '',
    price: '',
    size: '',
    address: '',
    suburb: '',
    province: '',
    latitude: null,
    longitude: null,
    zoning: 'RESIDENTIAL',
    landUse: 'VACANT'
  });
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCoordinatesSelected = (coords) => {
    setFormData(prev => ({
      ...prev,
      latitude: coords.lat,
      longitude: coords.lng,
      address: coords.address,
      suburb: coords.suburb || prev.suburb
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.standNumber) {
        toast.error('Stand number is required');
        return false;
      }
      if (!formData.titleDeedNumber) {
        toast.error('Title deed number is required');
        return false;
      }
      if (!formData.price) {
        toast.error('Price is required');
        return false;
      }
      if (!formData.size) {
        toast.error('Stand size is required');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.address) {
        toast.error('Please select location on map');
        return false;
      }
      if (!formData.suburb) {
        toast.error('Suburb is required');
        return false;
      }
      if (!formData.latitude || !formData.longitude) {
        toast.error('Please click on map to set coordinates');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      setLoading(true);

      const payload = {
        standNumber: formData.standNumber.toUpperCase(),
        titleDeedNumber: formData.titleDeedNumber,
        listedPrice: {
          amount: Number(formData.price),
          currency: 'USD'
        },
        location: {
          address: {
            street: formData.address,
            suburb: formData.suburb.toUpperCase(),
            province: formData.province || formData.suburb
          },
          coordinates: {
            latitude: formData.latitude,
            longitude: formData.longitude
          }
        },
        landDetails: {
          size: {
            squareMeters: Number(formData.size),
            hectares: Number(formData.size) / 10000
          },
          zoning: formData.zoning,
          landUse: formData.landUse
        }
      };

      const response = await fetch('/api/land', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message || 'Failed to create listing');
        return;
      }

      toast.success('Stand submitted for verification!');
      setResult({
        success: true,
        message: 'Your stand has been submitted and is now pending verification',
        landId: data.data?._id
      });
      setStep(5);
    } catch (error) {
      console.error('Error submitting listing:', error);
      toast.error(error.message || 'Failed to submit listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                className={`flex-1 h-2 mx-1 rounded-full transition-all ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-gray-600 text-sm">
            Step {step} of 5
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stand Number *
                  </label>
                  <input
                    type="text"
                    name="standNumber"
                    value={formData.standNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., A123"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    onChange={handleInputChange}
                    placeholder="e.g., TD-2024-001"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (USD) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="50000"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stand Size (sqm) *
                    </label>
                    <input
                      type="number"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      placeholder="500"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location & Map */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Location & Map</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Click on map below to set address"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suburb *
                    </label>
                    <select
                      name="suburb"
                      value={formData.suburb}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select suburb...</option>
                      {SUBURBS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province
                    </label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      placeholder="Auto-filled"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <MapSelector onCoordinatesSelected={handleCoordinatesSelected} />
            </div>
          )}

          {/* Step 3: Land Details */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Land Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoning *
                  </label>
                  <select
                    name="zoning"
                    value={formData.zoning}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ZONINGS.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Land Use *
                  </label>
                  <select
                    name="landUse"
                    value={formData.landUse}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {LAND_USES.map(lu => (
                      <option key={lu} value={lu}>{lu}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    📋 Documents upload is optional at this stage. You can upload documents after initial verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Review Your Listing</h2>
              <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Stand Number</p>
                    <p className="text-lg font-semibold">{formData.standNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Title Deed</p>
                    <p className="text-lg font-semibold">{formData.titleDeedNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Price</p>
                    <p className="text-lg font-semibold">${Number(formData.price).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Size</p>
                    <p className="text-lg font-semibold">{formData.size} sqm</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Location</p>
                    <p className="text-lg font-semibold">{formData.suburb}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Zoning</p>
                    <p className="text-lg font-semibold">{formData.zoning}</p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-gray-600 text-sm mb-2">Coordinates</p>
                  <p className="text-sm font-mono text-gray-800">
                    {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900">
                    ✓ All required information is complete. Click Submit to send for verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Result */}
          {step === 5 && result && (
            <div className="text-center">
              <div className="mb-6">
                <Check size={64} className="text-green-600 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-green-600">Success!</h2>
              <p className="text-gray-600 mb-6">{result.message}</p>
              <button
                onClick={() => navigate(`/lands/${result.landId}`)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-3"
              >
                View Listing
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 5 && (
            <div className="flex justify-between gap-4 mt-8 pt-6 border-t">
              <button
                onClick={handlePrev}
                disabled={step === 1}
                className="flex items-center gap-2 px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              <button
                onClick={step === 4 ? handleSubmit : handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : step === 4 ? 'Submit' : 'Next'}
                {step < 4 && <ChevronRight size={20} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListingWizard;
