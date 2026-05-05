import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import GISMap from '../components/GISMap';
import LandVerificationCard from '../components/LandVerificationCard';
import { searchLands, getLandListings, flagLandAsSuspicious } from '../services/landService';
import { toast } from 'react-toastify';

const LandListings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.user?.user || state.user);
  const userRole = currentUser?.rest?.role || currentUser?.role || 'BUYER';
  const currentUserId = currentUser?.rest?._id || currentUser?._id;

  const [lands, setLands] = useState([]);
  const [filteredLands, setFilteredLands] = useState([]);
  const [selectedLand, setSelectedLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'map'
  const [filters, setFilters] = useState({
    suburb: '',
    zoning: '',
    status: '',
    verificationStatus: '',
    verified: '',
    minPrice: '',
    maxPrice: '',
    minSize: '',
    maxSize: '',
    search: ''
  });

  // Zimbabwe suburbs
  const suburbs = ['HARARE', 'CHITUNGWIZA', 'KADOMA', 'BULAWAYO', 'GWERU', 'MASVINGO', 'MUTARE'];
  const zoningTypes = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE'];
  const statuses = ['AVAILABLE', 'PENDING_SALE', 'SOLD', 'UNDER_REVIEW', 'FLAGGED'];

  useEffect(() => {
    fetchLands();
  }, []);

  useEffect(() => {
    // Read query parameters and update filters
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setFilters(prev => ({ ...prev, verificationStatus: statusParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [lands, filters]);

  const fetchLands = async () => {
    try {
      setLoading(true);
      const response = await getLandListings();
      const landData = Array.isArray(response.data) ? response.data : (response.data?.lands || response.lands || []);
      setLands(landData);
    } catch (error) {
      toast.error('Failed to fetch land listings');
      console.error('Error fetching lands:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...lands];

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(land =>
        land.standNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        land.titleDeedNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        land.location.address.street.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply other filters
    if (filters.suburb) {
      filtered = filtered.filter(land => land.location.address.suburb === filters.suburb);
    }

    if (filters.zoning) {
      filtered = filtered.filter(land => land.landDetails.zoning === filters.zoning);
    }

    if (filters.status) {
      filtered = filtered.filter(land => land.transaction.status === filters.status);
    }

    // Filter by verification status (VERIFIED, PENDING, REJECTED, etc.)
    if (filters.verificationStatus) {
      filtered = filtered.filter(land => land.verification?.status === filters.verificationStatus);
    }

    if (filters.verified !== '') {
      const isVerified = filters.verified === 'true';
      filtered = filtered.filter(land => {
        const isActuallyVerified = land.verification?.status === 'VERIFIED' || land.verification?.status === 'AUTO_VERIFIED';
        return isActuallyVerified === isVerified;
      });
    }

    if (filters.minPrice) {
      filtered = filtered.filter(land => land.transaction.listedPrice.amount >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(land => land.transaction.listedPrice.amount <= parseFloat(filters.maxPrice));
    }

    if (filters.minSize) {
      filtered = filtered.filter(land => land.landDetails.size.squareMeters >= parseFloat(filters.minSize));
    }

    if (filters.maxSize) {
      filtered = filtered.filter(land => land.landDetails.size.squareMeters <= parseFloat(filters.maxSize));
    }

    setFilteredLands(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      suburb: '',
      zoning: '',
      status: '',
      verified: '',
      minPrice: '',
      maxPrice: '',
      minSize: '',
      maxSize: '',
      search: ''
    });
  };

  const handleLandSelect = (land) => {
    setSelectedLand(land);
  };

  const handleFlagLand = async (landId, flagData) => {
    try {
      await flagLandAsSuspicious(landId, flagData);
      toast.success('Land flagged successfully');
      fetchLands(); // Refresh the list
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to flag this land');
      } else {
        toast.error('Failed to flag land');
      }
      console.error('Error flagging land:', error);
    }
  };

  const handleViewDetails = (land) => {
    // Navigate to land detail page
    navigate(`/lands/${land._id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verified Land Listings</h1>
        <p className="text-gray-600">Browse and search verified land properties across Zimbabwe</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Search & Filters</h2>
        
        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by stand number, title deed, or address..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
            <select
              value={filters.suburb}
              onChange={(e) => handleFilterChange('suburb', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Suburbs</option>
              {suburbs.map(suburb => (
                <option key={suburb} value={suburb}>{suburb}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zoning</label>
            <select
              value={filters.zoning}
              onChange={(e) => handleFilterChange('zoning', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Zones</option>
              {zoningTypes.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification</label>
            <select
              value={filters.verified}
              onChange={(e) => handleFilterChange('verified', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
          </div>
        </div>

        {/* Price and Size filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Price ($)</label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Price ($)</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="1000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Size (m²)</label>
            <input
              type="number"
              value={filters.minSize}
              onChange={(e) => handleFilterChange('minSize', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Size (m²)</label>
            <input
              type="number"
              value={filters.maxSize}
              onChange={(e) => handleFilterChange('maxSize', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="10000"
            />
          </div>
        </div>

        {/* Filter actions */}
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
          <div className="ml-auto text-sm text-gray-600 py-2">
            Showing {filteredLands.length} of {lands.length} lands
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'cards' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Card View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-md transition-colors ${
              viewMode === 'map' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Map View
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredLands.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No lands found</h3>
          <p className="text-gray-600">Try adjusting your filters or search criteria</p>
        </div>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLands.map(land => (
                <LandVerificationCard
                  key={land._id}
                  land={land}
                  onVerify={() => {}}
                  onFlag={handleFlagLand}
                  onViewDetails={handleViewDetails}
                  userRole={userRole}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <GISMap
                lands={filteredLands}
                selectedLand={selectedLand}
                onLandSelect={handleLandSelect}
                height="600px"
              />
              
              {selectedLand && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold">{selectedLand.standNumber}</h3>
                      <p className="text-gray-600">{selectedLand.location.address.street}, {selectedLand.location.address.suburb}</p>
                    </div>
                    <button
                      onClick={() => handleViewDetails(selectedLand)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LandListings;
