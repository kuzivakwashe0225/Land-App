import axios from 'axios';
import Stands from '../models/stands-model.js';
import AuthorityRecords from '../models/authority-records-model.js';

// Deeds Office API integration
export const verifyDeedsOffice = async (titleDeedNumber) => {
  try {
    // In production, this would integrate with the actual Zimbabwe Deeds Office API
    // For testing/development, we use our local AuthorityRecords as the source of truth
    
    const record = await AuthorityRecords.findOne({ 
      $or: [
        { titleDeedNumber: titleDeedNumber },
        { standNumber: titleDeedNumber } // Fallback if stand number is used as deed number in tests
      ]
    });

    if (record) {
      return {
        verified: record.status === 'VALID',
        ownerName: record.ownerFullName,
        nationalId: record.nationalId,
        propertyDetails: {
          standNumber: record.standNumber,
          size: `${record.standSize?.squareMeters || 0} sqm`,
          location: record.location?.suburb || 'Harare'
        },
        registrationDate: record.dateRegistered || new Date('2020-01-15'),
        anyEncumbrances: (record.encumbrances && record.encumbrances.length > 0) || false,
        flags: record.status !== 'VALID' ? [record.status] : []
      };
    }

    // If not found in our "Authority" DB
    if (process.env.NODE_ENV === 'development') {
       // Return a negative result if not found, to test failure cases
       return {
         verified: false,
         message: 'Record not found in Deeds Office registry'
       };
    }
    
    throw new Error('Failed to verify with Deeds Office');
  } catch (error) {
    console.error('Deeds Office verification error:', error);
    throw error;
  }
};

// Municipal Council API integration
export const verifyMunicipalRecords = async (standNumber) => {
  try {
    // In production, this would integrate with municipal council APIs
    // For testing/development, we use our local Stands model as the source of truth
    
    const stand = await Stands.findOne({ standNumber: standNumber.toUpperCase() });

    if (stand) {
      return {
        verified: stand.status !== 'DISPUTED' && stand.status !== 'UNDER_INVESTIGATION',
        councilName: stand.authority?.authorityName || 'Harare City Council',
        zoning: stand.zoning,
        ratesStatus: 'PAID', // Simplified for testing
        buildingApprovalStatus: 'APPROVED',
        lastValuation: new Date('2023-06-01'),
        flags: stand.status === 'DISPUTED' ? ['OWNERSHIP_DISPUTE'] : []
      };
    }

    // If not found in our "Municipal" DB
    if (process.env.NODE_ENV === 'development') {
      return {
        verified: false,
        message: 'Stand number not recognized by Municipal Council'
      };
    }
    
    throw new Error('Failed to verify with Municipal Council');
  } catch (error) {
    console.error('Municipal records verification error:', error);
    throw error;
  }
};

// GIS/Geolocation API integration
export const getLandCoordinates = async (address) => {
  try {
    // Using OpenStreetMap Nominatim API (free) or Mapbox/Google Maps (paid)
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: `${address.street}, ${address.suburb}, ${address.province}, Zimbabwe`,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'LandSolutions Platform'
      }
    });

    if (response.data.length === 0) {
      throw new Error('Location not found');
    }

    const location = response.data[0];
    
    return {
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
      displayName: location.display_name,
      boundingBox: location.boundingbox
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to get coordinates for address');
  }
};

// Reverse geocoding - get address from coordinates
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json'
      },
      headers: {
        'User-Agent': 'LandSolutions Platform'
      }
    });

    return {
      address: response.data.display_name,
      components: response.data.address,
      confidence: response.data.importance
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error('Failed to get address from coordinates');
  }
};

// Satellite imagery integration
export const getSatelliteImage = async (latitude, longitude, zoom = 18) => {
  try {
    // This would integrate with satellite imagery providers
    // For now, we'll return a URL to a mapping service
    
    const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=600x400&maptype=satellite&key=${process.env.GIS_API_KEY}`;
    
    return {
      imageUrl,
      attribution: 'Google Maps Satellite',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Satellite imagery error:', error);
    throw new Error('Failed to get satellite image');
  }
};

// Property boundary detection
export const getPropertyBoundaries = async (standNumber, latitude, longitude) => {
  try {
    // This would integrate with GIS systems for precise boundary detection
    // For now, we'll simulate boundary coordinates around the center point
    
    const boundaries = [];
    const offset = 0.001; // Approximately 100m offset
    
    // Create a simple rectangular boundary around the center point
    boundaries.push(
      { latitude: latitude + offset, longitude: longitude - offset },
      { latitude: latitude + offset, longitude: longitude + offset },
      { latitude: latitude - offset, longitude: longitude + offset },
      { latitude: latitude - offset, longitude: longitude - offset },
      { latitude: latitude + offset, longitude: longitude - offset } // Close the polygon
    );

    return {
      boundaries,
      area: calculatePolygonArea(boundaries),
      perimeter: calculatePolygonPerimeter(boundaries),
      confidence: 0.85 // Mock confidence score
    };
  } catch (error) {
    console.error('Property boundary detection error:', error);
    throw new Error('Failed to detect property boundaries');
  }
};

// Helper function to calculate polygon area (in square meters)
const calculatePolygonArea = (coordinates) => {
  // Using Shoelace formula for polygon area
  let area = 0;
  const n = coordinates.length - 1; // Exclude the closing point
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].longitude * coordinates[j].latitude;
    area -= coordinates[j].longitude * coordinates[i].latitude;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert from degrees to square meters (approximate)
  // 1 degree ≈ 111,320 meters
  const metersPerDegree = 111320;
  return area * metersPerDegree * metersPerDegree;
};

// Helper function to calculate polygon perimeter (in meters)
const calculatePolygonPerimeter = (coordinates) => {
  let perimeter = 0;
  const n = coordinates.length - 1; // Exclude the closing point
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const distance = calculateDistance(
      coordinates[i].latitude,
      coordinates[i].longitude,
      coordinates[j].latitude,
      coordinates[j].longitude
    );
    perimeter += distance;
  }
  
  return perimeter;
};

// Helper function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Land valuation API
export const getLandValuation = async (standNumber, size, zoning, location) => {
  try {
    // This would integrate with property valuation services
    // For now, we'll calculate a basic valuation based on factors
    
    const baseRates = {
      'HARARE': 150, // USD per square meter
      'CHITUNGWIZA': 80,
      'KADOMA': 60,
      'BULAWAYO': 120,
      'GWERU': 70,
      'MASVINGO': 65,
      'MUTARE': 85
    };

    const zoningMultipliers = {
      'RESIDENTIAL': 1.0,
      'COMMERCIAL': 2.5,
      'INDUSTRIAL': 1.8,
      'AGRICULTURAL': 0.3,
      'MIXED_USE': 2.0
    };

    const baseRate = baseRates[location.suburb] || 100;
    const multiplier = zoningMultipliers[zoning] || 1.0;
    
    const estimatedValue = size * baseRate * multiplier;
    
    return {
      estimatedValue,
      currency: 'USD',
      confidence: 0.75,
      factors: {
        location: baseRate,
        zoning: multiplier,
        size: size
      },
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Land valuation error:', error);
    throw new Error('Failed to calculate land valuation');
  }
};
