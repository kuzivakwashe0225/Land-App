// Land API service — uses relative URLs so Vite proxy forwards them to the backend
// This ensures cookies (access_token) are sent correctly from the same origin

const apiFetch = async (url, options = {}) => {
  const headers = { ...options.headers };
  
  // Do NOT set Content-Type if body is FormData (browser needs to set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const defaultOptions = {
    credentials: 'include', // Always send cookies
    headers,
    ...options,
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  }

  const response = await fetch(url, defaultOptions);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.response = { data, status: response.status };
    throw error;
  }

  return data;
};

export const landService = {
  // Get all land listings with filters
  getLandListings: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) params.append(key, val);
    });
    return apiFetch(`/api/land?${params.toString()}`);
  },

  // Search lands
  searchLands: async (query) => {
    return apiFetch(`/api/land/search?q=${encodeURIComponent(query)}`);
  },

  // Get specific land by ID
  getLandById: async (landId) => {
    return apiFetch(`/api/land/${landId}`);
  },

  // Create new land listing
  createLandListing: async (landData) => {
    return apiFetch('/api/land', {
      method: 'POST',
      body: JSON.stringify(landData),
    });
  },

  // Update land listing
  updateLandListing: async (landId, updateData) => {
    return apiFetch(`/api/land/${landId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Verify land ownership (admin/municipal officer only)
  verifyLandOwnership: async (landId, verificationData) => {
    return apiFetch(`/api/land/${landId}/verify`, {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  },

  // Get verification status
  getVerificationStatus: async (landId) => {
    return apiFetch(`/api/land/${landId}/verification-status`);
  },

  // Upload land documents (multipart)
  uploadLandDocuments: async (landId, formData) => {
    return apiFetch(`/api/land/${landId}/documents`, {
      method: 'POST',
      body: formData, // FormData — Content-Type is auto-removed
    });
  },

  // Flag land as suspicious
  flagLandAsSuspicious: async (landId, flagData) => {
    return apiFetch(`/api/land/${landId}/flag`, {
      method: 'POST',
      body: JSON.stringify(flagData),
    });
  },

  // Get public listings
  getPublicListings: async () => {
    return apiFetch('/api/land/public');
  },

  // Live location check
  checkLocation: async (lat, lng, standNumber) => {
    return apiFetch(`/api/land/check-location?lat=${lat}&lng=${lng}&standNumber=${encodeURIComponent(standNumber || '')}`);
  },

  // Search authority registry by address
  searchAuthorityRegistry: async (address) => {
    return apiFetch(`/api/land/authority-search?address=${encodeURIComponent(address)}`);
  },

  // Get land analytics (admin only)
  getLandAnalytics: async () => {
    return apiFetch('/api/land/analytics');
  },

  // Get admin dashboard stats (user counts, etc)
  getAdminStats: async () => {
    return apiFetch('/api/admin/dashboard/stats');
  },
};

// Named exports for convenience
export const getLandListings = landService.getLandListings;
export const searchLands = landService.searchLands;
export const getLandById = landService.getLandById;
export const createLandListing = landService.createLandListing;
export const updateLandListing = landService.updateLandListing;
export const verifyLandOwnership = landService.verifyLandOwnership;
export const getVerificationStatus = landService.getVerificationStatus;
export const uploadLandDocuments = landService.uploadLandDocuments;
export const flagLandAsSuspicious = landService.flagLandAsSuspicious;
export const getLandAnalytics = landService.getLandAnalytics;

export default landService;
