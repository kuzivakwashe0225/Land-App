import AuthorityRecords from '../models/authority-records-model.js';

/**
 * Verification Scoring Service
 * Compares submitted land data against authority records
 * Calculates verification score (0-100%)
 */

class VerificationScoringService {
  /**
   * Compare seller's submitted data with authority records
   * Returns detailed comparison and score
   */
  async compareWithAuthority(submittedData) {
    try {
      // Find matching authority record
      const authorityRecord = await AuthorityRecords.findOne({
        standNumber: submittedData.standNumber?.toUpperCase()
      });

      const result = {
        found: false,
        matches: {},
        mismatches: {},
        warnings: [],
        score: 0,
        recommendation: 'AUTO_REJECT'
      };

      // If no authority record found
      if (!authorityRecord) {
        result.warnings.push('Stand number not found in authority records');
        result.score = 20; // Very low score for unknown stands
        return result;
      }

      result.found = true;

      // 1. Stand Number Match (10 points)
      const standMatch = submittedData.standNumber?.toUpperCase() === authorityRecord.standNumber;
      if (standMatch) {
        result.matches.standNumber = true;
        result.score += 10;
      } else {
        result.mismatches.standNumber = {
          submitted: submittedData.standNumber,
          authority: authorityRecord.standNumber
        };
      }

      // 2. Title Deed Number Match (15 points)
      if (submittedData.titleDeedNumber && authorityRecord.titleDeedNumber) {
        const deedMatch = submittedData.titleDeedNumber === authorityRecord.titleDeedNumber;
        if (deedMatch) {
          result.matches.titleDeedNumber = true;
          result.score += 15;
        } else {
          result.mismatches.titleDeedNumber = {
            submitted: submittedData.titleDeedNumber,
            authority: authorityRecord.titleDeedNumber
          };
        }
      }

      // 3. Owner Name Match (15 points)
      if (submittedData.ownerName && authorityRecord.ownerFullName) {
        const nameMatch = this.compareNames(
          submittedData.ownerName,
          authorityRecord.ownerFullName
        );
        if (nameMatch) {
          result.matches.ownerName = true;
          result.score += 15;
        } else {
          result.mismatches.ownerName = {
            submitted: submittedData.ownerName,
            authority: authorityRecord.ownerFullName
          };
          result.warnings.push('Owner name does not match authority record');
        }
      }

      // 4. National ID Match (15 points)
      if (submittedData.nationalId && authorityRecord.nationalId) {
        const idMatch = submittedData.nationalId === authorityRecord.nationalId;
        if (idMatch) {
          result.matches.nationalId = true;
          result.score += 15;
        } else {
          result.mismatches.nationalId = {
            submitted: submittedData.nationalId,
            authority: authorityRecord.nationalId
          };
          result.warnings.push('National ID does not match authority record');
        }
      }

      // 5. Stand Size Match (10 points)
      if (submittedData.standSize && authorityRecord.standSize?.squareMeters) {
        const sizeDiff = Math.abs(
          submittedData.standSize - authorityRecord.standSize.squareMeters
        );
        const sizePercent = (sizeDiff / authorityRecord.standSize.squareMeters) * 100;

        if (sizePercent < 5) {
          result.matches.standSize = true;
          result.score += 10;
        } else if (sizePercent < 15) {
          result.warnings.push(`Stand size difference: ${sizePercent.toFixed(1)}%`);
          result.score += 5; // Partial credit
        } else {
          result.mismatches.standSize = {
            submitted: submittedData.standSize,
            authority: authorityRecord.standSize.squareMeters,
            difference: sizePercent.toFixed(1) + '%'
          };
        }
      }

      // 6. Suburb Match (10 points)
      if (submittedData.suburb && authorityRecord.location?.suburb) {
        const suburbMatch = submittedData.suburb.toUpperCase() ===
                           authorityRecord.location.suburb.toUpperCase();
        if (suburbMatch) {
          result.matches.suburb = true;
          result.score += 10;
        } else {
          result.mismatches.suburb = {
            submitted: submittedData.suburb,
            authority: authorityRecord.location.suburb
          };
          result.warnings.push('Suburb does not match authority record');
        }
      }

      // 7. GPS Coordinate Accuracy (15 points)
      if (submittedData.latitude && submittedData.longitude) {
        const distance = this.calculateDistance(
          submittedData.latitude,
          submittedData.longitude,
          authorityRecord.gpsCoordinates.latitude,
          authorityRecord.gpsCoordinates.longitude
        );

        if (distance < 100) {
          result.matches.gpsAccuracy = true;
          result.score += 15;
        } else if (distance < 500) {
          result.warnings.push(`GPS coordinates differ by ${distance.toFixed(0)}m`);
          result.score += 8; // Partial credit
        } else {
          result.mismatches.gpsAccuracy = {
            submitted: {
              lat: submittedData.latitude,
              lng: submittedData.longitude
            },
            authority: {
              lat: authorityRecord.gpsCoordinates.latitude,
              lng: authorityRecord.gpsCoordinates.longitude
            },
            distanceMeters: distance.toFixed(0)
          };
          result.warnings.push(`GPS coordinates differ significantly: ${distance.toFixed(0)}m`);
        }
      }

      // 8. Authority Record Status Check (variable points)
      if (authorityRecord.status === 'SOLD') {
        result.warnings.push('Stand marked as SOLD in authority records');
        result.score -= 20;
      } else if (authorityRecord.status === 'DISPUTED') {
        result.warnings.push('Stand is under DISPUTE in authority records');
        result.score -= 15;
      } else if (authorityRecord.status === 'DUPLICATE') {
        result.warnings.push('Stand marked as DUPLICATE in authority records');
        result.score -= 20;
      } else if (authorityRecord.status === 'UNDER_INVESTIGATION') {
        result.warnings.push('Stand is UNDER_INVESTIGATION in authority records');
        result.score -= 10;
      }

      // Ensure score is between 0-100
      result.score = Math.max(0, Math.min(100, result.score));

      // Recommendation based on score
      if (result.score >= 90) {
        result.recommendation = 'AUTO_VERIFIED';
      } else if (result.score >= 70) {
        result.recommendation = 'NEEDS_REVIEW';
      } else {
        result.recommendation = 'AUTO_REJECT';
      }

      return result;
    } catch (error) {
      console.error('Error in verification scoring:', error);
      throw error;
    }
  }

  /**
   * Check for duplicate listings
   * Returns true if duplicate found
   */
  async checkForDuplicates(standNumber, excludeLandId = null) {
    try {
      const query = {
        standNumber: standNumber.toUpperCase(),
        'verification.status': { $in: ['VERIFIED', 'PENDING', 'REQUIRES_REVIEW'] }
      };

      if (excludeLandId) {
        query._id = { $ne: excludeLandId };
      }

      const duplicates = await global.landModel.find(query).lean();

      return {
        hasDuplicates: duplicates.length > 0,
        count: duplicates.length,
        duplicates: duplicates.map(d => ({
          id: d._id,
          standNumber: d.standNumber,
          owner: d.owner,
          status: d.verification.status,
          createdAt: d.createdAt
        }))
      };
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      throw error;
    }
  }

  /**
   * Compare two names for similarity
   * Handles common name variations
   */
  compareNames(name1, name2) {
    if (!name1 || !name2) return false;

    const normalize = (str) => str
      .toLowerCase()
      .trim()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ');

    const normalized1 = normalize(name1);
    const normalized2 = normalize(name2);

    // Exact match
    if (normalized1 === normalized2) return true;

    // Check if one contains the other (handles abbreviated names)
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return true;
    }

    // Levenshtein distance for fuzzy matching (allow small variations)
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxDistance = Math.max(normalized1.length, normalized2.length) * 0.2; // 20% tolerance

    return distance <= maxDistance;
  }

  /**
   * Calculate distance between two GPS coordinates (in meters)
   * Uses Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Levenshtein distance for string similarity
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get verification score interpretation
   */
  interpretScore(score) {
    if (score >= 90) {
      return {
        level: 'EXCELLENT',
        status: 'AUTO_VERIFIED',
        message: 'All critical fields match. Stand is verified.'
      };
    } else if (score >= 70) {
      return {
        level: 'GOOD',
        status: 'NEEDS_REVIEW',
        message: 'Most fields match. Requires manual review.'
      };
    } else if (score >= 50) {
      return {
        level: 'FAIR',
        status: 'SUSPICIOUS',
        message: 'Several mismatches detected. Suspicious activity.'
      };
    } else {
      return {
        level: 'POOR',
        status: 'REJECTED',
        message: 'Multiple critical mismatches. Likely fraudulent.'
      };
    }
  }
}

export default new VerificationScoringService();
