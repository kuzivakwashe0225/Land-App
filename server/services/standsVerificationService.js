import Stands from '../models/stands-model.js';

const TOLERANCE_METERS = 100; // GPS tolerance for matching

// Haversine distance formula
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Verify if coordinates are within allocated/vacant stands database
 */
export const verifyCoordinatesAgainstStands = async (latitude, longitude, suburb) => {
  try {
    // Get all stands in the suburb
    const stands = await Stands.find({ suburb });

    if (stands.length === 0) {
      return {
        valid: false,
        message: `No stands registered for ${suburb} in the authority database`,
        riskScore: 100,
        reason: 'SUBURB_NOT_FOUND'
      };
    }

    // Find closest stand
    let closestStand = null;
    let minDistance = Infinity;

    stands.forEach(stand => {
      const distance = haversineDistance(
        latitude,
        longitude,
        stand.coordinates.latitude,
        stand.coordinates.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestStand = stand;
      }
    });

    // Check if coordinates are within tolerance
    if (minDistance > TOLERANCE_METERS) {
      return {
        valid: false,
        message: `Coordinates are ${Math.round(minDistance)}m away from nearest registered stand. Stands must be within ${TOLERANCE_METERS}m of registered locations.`,
        riskScore: 85,
        reason: 'COORDINATES_NOT_AUTHORIZED',
        closestStand: {
          standNumber: closestStand.standNumber,
          distance: Math.round(minDistance)
        }
      };
    }

    // Check stand availability and zoning
    if (closestStand.status === 'ALLOCATED') {
      return {
        valid: false,
        message: `Stand ${closestStand.standNumber} is already allocated to another owner. Cannot list this location.`,
        riskScore: 95,
        reason: 'STAND_ALREADY_ALLOCATED',
        standDetails: {
          standNumber: closestStand.standNumber,
          allocatedTo: closestStand.allocation?.allocatedTo,
          allocatedDate: closestStand.allocation?.allocationDate
        }
      };
    }

    if (closestStand.status === 'DISPUTED') {
      return {
        valid: false,
        message: `Stand ${closestStand.standNumber} has an ownership dispute. Cannot list this location.`,
        riskScore: 90,
        reason: 'STAND_DISPUTED'
      };
    }

    // If we get here, coordinates are valid
    return {
      valid: true,
      message: `Coordinates verified against Harare City Council stand database`,
      riskScore: 5,
      reason: 'AUTHORIZED_STAND',
      standDetails: {
        standNumber: closestStand.standNumber,
        zoning: closestStand.zoning,
        intendedUse: closestStand.intendedUse,
        status: closestStand.status,
        size: closestStand.size,
        compliance: closestStand.compliance
      }
    };
  } catch (error) {
    console.error('Stand verification error:', error);
    return {
      valid: false,
      message: 'Error verifying coordinates against stand database',
      riskScore: 50,
      reason: 'VERIFICATION_ERROR',
      error: error.message
    };
  }
};

/**
 * Verify zoning compatibility
 */
export const verifyZoningCompatibility = async (latitude, longitude, requestedZoning, suburb) => {
  try {
    const stands = await Stands.find({ suburb });

    let closestStand = null;
    let minDistance = Infinity;

    stands.forEach(stand => {
      const distance = haversineDistance(
        latitude,
        longitude,
        stand.coordinates.latitude,
        stand.coordinates.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestStand = stand;
      }
    });

    if (!closestStand) {
      return {
        compatible: false,
        message: 'No stand found near coordinates'
      };
    }

    const authorized = [closestStand.zoning, closestStand.intendedUse, 'MIXED_USE'];
    const isCompatible = authorized.includes(requestedZoning);

    return {
      compatible: isCompatible,
      allocatedZoning: closestStand.zoning,
      requestedZoning: requestedZoning,
      message: isCompatible
        ? `Zoning is compatible: Stand is zoned for ${closestStand.zoning}`
        : `Zoning mismatch: Stand is zoned for ${closestStand.zoning}, you requested ${requestedZoning}`,
      restrictions: closestStand.compliance?.restrictions || []
    };
  } catch (error) {
    console.error('Zoning verification error:', error);
    return {
      compatible: false,
      message: 'Error checking zoning compatibility',
      error: error.message
    };
  }
};

/**
 * Get stand information by coordinates
 */
export const getStandByCoordinates = async (latitude, longitude, suburb) => {
  try {
    const stands = await Stands.find({ suburb });

    let closestStand = null;
    let minDistance = Infinity;

    stands.forEach(stand => {
      const distance = haversineDistance(
        latitude,
        longitude,
        stand.coordinates.latitude,
        stand.coordinates.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestStand = stand;
      }
    });

    if (!closestStand || minDistance > TOLERANCE_METERS) {
      return null;
    }

    return {
      ...closestStand.toObject(),
      distanceFromCoordinates: Math.round(minDistance)
    };
  } catch (error) {
    console.error('Error getting stand:', error);
    return null;
  }
};

/**
 * Get all vacant stands in a suburb
 */
export const getVacantStands = async (suburb) => {
  try {
    const stands = await Stands.find({
      suburb,
      status: 'VACANT'
    }).select('standNumber coordinates zoning intendedUse size');

    return stands;
  } catch (error) {
    console.error('Error getting vacant stands:', error);
    return [];
  }
};

/**
 * Verify stand number against database
 */
export const verifyStandNumber = async (standNumber, suburb) => {
  try {
    const stand = await Stands.findOne({
      standNumber: standNumber.toUpperCase(),
      suburb
    });

    if (!stand) {
      return {
        valid: false,
        message: `Stand ${standNumber} is not registered in ${suburb}`,
        riskScore: 80
      };
    }

    if (stand.status === 'ALLOCATED') {
      return {
        valid: false,
        message: `Stand ${standNumber} is already allocated`,
        riskScore: 90,
        allocatedTo: stand.allocation?.allocatedTo
      };
    }

    return {
      valid: true,
      message: `Stand ${standNumber} is available`,
      riskScore: 5,
      standDetails: stand
    };
  } catch (error) {
    console.error('Stand verification error:', error);
    return {
      valid: false,
      message: 'Error verifying stand number',
      riskScore: 50
    };
  }
};

/**
 * Get stand statistics for a suburb
 */
export const getStandStatistics = async (suburb) => {
  try {
    const stats = await Stands.aggregate([
      { $match: { suburb } },
      {
        $group: {
          _id: null,
          totalStands: { $sum: 1 },
          vacantStands: {
            $sum: { $cond: [{ $eq: ['$status', 'VACANT'] }, 1, 0] }
          },
          allocatedStands: {
            $sum: { $cond: [{ $eq: ['$status', 'ALLOCATED'] }, 1, 0] }
          },
          residentialZoned: {
            $sum: { $cond: [{ $eq: ['$zoning', 'RESIDENTIAL'] }, 1, 0] }
          },
          commercialZoned: {
            $sum: { $cond: [{ $eq: ['$zoning', 'COMMERCIAL'] }, 1, 0] }
          },
          avgSize: { $avg: '$size.squareMeters' }
        }
      }
    ]);

    return stats.length > 0 ? stats[0] : null;
  } catch (error) {
    console.error('Error getting statistics:', error);
    return null;
  }
};

export default {
  verifyCoordinatesAgainstStands,
  verifyZoningCompatibility,
  getStandByCoordinates,
  getVacantStands,
  verifyStandNumber,
  getStandStatistics
};
