import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, FileText, Upload, Save, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { landService } from '../services/landService';

const UpdateLandListing = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [listingStatus, setListingStatus] = useState(null);
  const [landData, setLandData] = useState(null);

  const [formData, setFormData] = useState({
    standNumber: '',
    titleDeedNumber: '',
    location: {
      address: {
        street: '',
        suburb: 'HARARE',
        province: 'HARARE'
      },
      coordinates: {
        latitude: '',
        longitude: ''
      }
    },
    landDetails: {
      size: {
        squareMeters: ''
      },
      zoning: 'RESIDENTIAL',
      landUse: 'VACANT',
      description: ''
    },
    transaction: {
      listedPrice: {
        amount: ''
      }
    }
  });

  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/land/${params.landId}`);
        const data = await res.json();
        if (data.success === false) {
          setError(data.message);
          return;
        }
        setLandData(data.data || data.land);
        setListingStatus(data.data?.listingStatus || data.land?.listingStatus);
        setFormData({
          standNumber: data.data?.standNumber || data.land?.standNumber || '',
          titleDeedNumber: data.data?.titleDeedNumber || data.land?.titleDeedNumber || '',
          location: data.data?.location || data.land?.location || {
            address: { street: '', suburb: '', province: '' },
            coordinates: { latitude: '', longitude: '' }
          },
          landDetails: data.data?.landDetails || data.land?.landDetails || {
            size: { squareMeters: '' },
            zoning: '', landUse: '', description: ''
          },
          transaction: data.data?.transaction || data.land?.transaction || {
            listedPrice: { amount: '' }
          }
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [params.landId]);

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

  // Mark listing as sold
  const handleMarkAsSold = async () => {
    if (!window.confirm('Mark this listing as sold? It will be hidden from public view.')) return;
    setActionLoading(true);
    try {
      await fetch(`/api/land/${params.landId}/mark-sold`, { method: 'POST' });
      toast.success('Listing marked as sold');
      setListingStatus('sold');
    } catch (err) {
      toast.error('Failed to mark as sold');
    } finally {
      setActionLoading(false);
    }
  };

  // Withdraw listing
  const handleWithdraw = async () => {
    if (!window.confirm('Withdraw this listing? It will be hidden from public view.')) return;
    setActionLoading(true);
    try {
      await fetch(`/api/land/${params.landId}`, { method: 'DELETE' });
      toast.success('Listing withdrawn');
      setListingStatus('withdrawn');
    } catch (err) {
      toast.error('Failed to withdraw listing');
    } finally {
      setActionLoading(false);
    }
  };

  // Create revision for verified listing
  const handleCreateRevision = async () => {
    if (!window.confirm('Create a new revision? The original listing will remain visible while the new version is under review.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/land/${params.landId}/create-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      toast.success('New revision created. Redirecting...');
      setTimeout(() => navigate(`/lands/${data.data._id}`), 2000);
    } catch (err) {
      toast.error('Failed to create revision');
    } finally {
      setActionLoading(false);
    }
  };

  const canEdit = listingStatus && ['draft', 'pending_verification', 'rejected'].includes(listingStatus);
  const isVerified = listingStatus === 'verified';
  const isSoldOrWithdrawn = ['sold', 'withdrawn'].includes(listingStatus);

  const getStatusBadge = () => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      pending_verification: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      sold: 'bg-blue-100 text-blue-800',
      withdrawn: 'bg-gray-300 text-gray-900'
    };
    const statusLabels = {
      draft: 'Draft',
      pending_verification: 'Pending Review',
      verified: 'Verified',
      rejected: 'Rejected',
      sold: 'Sold',
      withdrawn: 'Withdrawn'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[listingStatus] || 'bg-gray-100'}`}>
        {statusLabels[listingStatus] || listingStatus}
      </span>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Calculate hectares
      const submissionData = { ...formData };
      submissionData.landDetails = {
        ...submissionData.landDetails,
        size: {
          squareMeters: Number(submissionData.landDetails.size.squareMeters),
          hectares: Number(submissionData.landDetails.size.squareMeters) / 10000
        }
      };

      // Update land listing
      const response = await landService.updateLandListing(params.landId, submissionData);

      // Upload documents if any
      if (documents.length > 0) {
        const formData = new FormData();
        documents.forEach((doc, index) => {
          formData.append('documents', doc);
        });

        await landService.uploadLandDocuments(response.data.land._id, formData);
      }

      setSuccess('Land listing updated successfully!');
      setTimeout(() => {
        navigate(`/lands/${response.data.land._id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create land listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Update Land Listing</h1>
            {listingStatus && getStatusBadge()}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>{success}</div>
            </div>
          )}

          {!canEdit && listingStatus && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-2">Cannot Edit {listingStatus === 'verified' ? 'Verified' : listingStatus.charAt(0).toUpperCase() + listingStatus.slice(1)} Listing</p>
                <p className="text-sm">
                  {listingStatus === 'verified' ? 'To modify this verified listing, request a new revision below.' : 'You can only edit listings that are in draft or rejected status.'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <fieldset disabled={!canEdit} className={!canEdit ? 'opacity-60' : ''}>
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
                    disabled={!canEdit}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="location.address.street"
                    value={formData.location.address.street}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suburb *
                  </label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province *
                  </label>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="location.coordinates.latitude"
                    value={formData.location.coordinates.latitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="-17.8292"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="location.coordinates.longitude"
                    value={formData.location.coordinates.longitude}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="31.0522"
                    required
                  />
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${formData.landDetails.zoning === 'COMMERCIAL' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="AGRICULTURAL">Agricultural</option>
                    <option value="MIXED_USE">Mixed Use</option>
                  </select>
                  {formData.landDetails.zoning === 'COMMERCIAL' && (
                    <p className="text-xs text-amber-700 mt-1">
                      Note: Commercial stands are currently restricted from verification.
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
            </fieldset>

            {/* Action Buttons - Lifecycle */}
            {!isSoldOrWithdrawn && (
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/lands')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>

                {/* Withdraw button - available for draft, pending, rejected */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={actionLoading}
                    className="px-6 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                  >
                    {actionLoading ? 'Withdrawing...' : 'Withdraw'}
                  </button>
                )}

                {/* Update button - only for editable statuses */}
                {canEdit && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Listing'}
                  </button>
                )}

                {/* Create Revision - only for verified */}
                {isVerified && (
                  <button
                    type="button"
                    onClick={handleCreateRevision}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Creating...' : 'Request Edit'}
                  </button>
                )}

                {/* Mark as Sold - only for verified */}
                {isVerified && (
                  <button
                    type="button"
                    onClick={handleMarkAsSold}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Marking...' : 'Mark Sold'}
                  </button>
                )}
              </div>
            )}

            {/* Sold/Withdrawn State */}
            {isSoldOrWithdrawn && (
              <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="h-5 w-5" />
                  <span>This listing is {listingStatus === 'sold' ? 'marked as sold' : 'withdrawn'} and no longer available.</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/lands')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Back to Listings
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateLandListing;
