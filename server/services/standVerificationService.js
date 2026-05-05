import axios from 'axios';

/**
 * Stand Verification Service
 * Integrates with Zimbabwe Deeds Office and Municipal Council databases
 * to verify the authenticity of residential stands
 */

class StandVerificationService {
  constructor() {
    this.deedsOfficeUrl = process.env.DEEDS_OFFICE_API_URL || 'https://deeds.gov.zw/api';
    this.municipalUrl = process.env.MUNICIPAL_API_URL || 'https://municipal.gov.zw/api';
    this.verificationCache = new Map(); // Local cache for testing
  }

  /**
   * Comprehensive stand authentication check
   * Returns verification result with all checks performed
   */
  async verifyStandAuthenticity(standData) {
    const {
      standNumber,
      titleDeedNumber,
      ownerName,
      suburb,
      coordinates,
      sellerNationalId
    } = standData;

    const verificationResult = {
      standNumber,
      titleDeedNumber,
      isAuthentic: false,
      authenticationScore: 0, // 0-100 score
      checks: {
        deedsOfficeMatch: false,
        municipalMatch: false,
        ownershipMatch: false,
        coordinatesMatch: false,
        documentsValid: false,
        noDisputes: true,
        noEncumbrances: false,
        ratiosCleared: true
      },
      flags: [],
      warnings: [],
      details: {},
      timestamp: new Date(),
      verificationId: this._generateVerificationId()
    };

    try {
      // Check 1: Deeds Office Verification
      console.log(`[VERIFICATION] Checking Deeds Office records for ${titleDeedNumber}...`);
      const deedsCheck = await this._verifyDeedsOffice(titleDeedNumber, ownerName, sellerNationalId);
      verificationResult.checks.deedsOfficeMatch = deedsCheck.verified;
      verificationResult.details.deedsOffice = deedsCheck;

      if (!deedsCheck.verified) {
        verificationResult.flags.push('Deeds Office record not found or mismatch');
      }

      // Check 2: Municipal Records Verification
      console.log(`[VERIFICATION] Checking Municipal records for ${standNumber}...`);
      const municipalCheck = await this._verifyMunicipalRecords(standNumber, suburb);
      verificationResult.checks.municipalMatch = municipalCheck.verified;
      verificationResult.details.municipal = municipalCheck;

      if (!municipalCheck.verified) {
        verificationResult.flags.push('Municipal records not found or mismatch');
      }

      // Check 3: Ownership Verification
      console.log(`[VERIFICATION] Verifying ownership match...`);
      const ownershipCheck = await this._verifyOwnership(
        titleDeedNumber,
        ownerName,
        sellerNationalId,
        deedsCheck
      );
      verificationResult.checks.ownershipMatch = ownershipCheck.matches;
      verificationResult.details.ownership = ownershipCheck;

      if (!ownershipCheck.matches) {
        verificationResult.flags.push(`Ownership mismatch: Expected ${ownershipCheck.recordedOwner}, got ${ownerName}`);
      }

      // Check 4: Coordinates/Boundary Verification
      console.log(`[VERIFICATION] Verifying coordinates...`);
      const coordinatesCheck = await this._verifyCoordinates(
        standNumber,
        coordinates,
        suburb
      );
      verificationResult.checks.coordinatesMatch = coordinatesCheck.withinBounds;
      verificationResult.details.coordinates = coordinatesCheck;

      if (!coordinatesCheck.withinBounds) {
        verificationResult.warnings.push('Coordinates outside expected municipal boundary');
      }

      // Check 5: Encumbrance Check (mortgages, liens)
      console.log(`[VERIFICATION] Checking for encumbrances...`);
      const encumbranceCheck = await this._checkEncumbrances(titleDeedNumber);
      verificationResult.checks.noEncumbrances = !encumbranceCheck.hasEncumbrances;
      verificationResult.details.encumbrances = encumbranceCheck;

      if (encumbranceCheck.hasEncumbrances) {
        verificationResult.warnings.push(
          `Property has encumbrances: ${encumbranceCheck.details.join(', ')}`
        );
      }

      // Check 6: Dispute Check
      console.log(`[VERIFICATION] Checking for ownership disputes...`);
      const disputeCheck = await this._checkDisputes(titleDeedNumber);
      verificationResult.checks.noDisputes = !disputeCheck.hasDisputes;
      verificationResult.details.disputes = disputeCheck;

      if (disputeCheck.hasDisputes) {
        verificationResult.flags.push(
          `ALERT: Ownership dispute detected - ${disputeCheck.disputeDetails}`
        );
      }

      // Check 7: Rates/Tax Status
      console.log(`[VERIFICATION] Checking rates/tax status...`);
      const ratesCheck = await this._checkRatesStatus(standNumber, suburb);
      verificationResult.checks.ratiosCleared = ratesCheck.cleared;
      verificationResult.details.rates = ratesCheck;

      if (!ratesCheck.cleared) {
        verificationResult.warnings.push(`Outstanding rates: ${ratesCheck.amount}`);
      }

      // Calculate Authentication Score
      const passedChecks = Object.values(verificationResult.checks).filter(v => v === true).length;
      const totalChecks = Object.keys(verificationResult.checks).length;
      verificationResult.authenticationScore = Math.round((passedChecks / totalChecks) * 100);

      // Determine overall authenticity
      // Score >= 80 = Authentic, >= 60 = Requires Review, < 60 = Reject
      if (verificationResult.flags.length === 0 && verificationResult.authenticationScore >= 80) {
        verificationResult.isAuthentic = true;
      }

      console.log(`[VERIFICATION] Authentication score: ${verificationResult.authenticationScore}%`);
      console.log(`[VERIFICATION] Flags: ${verificationResult.flags.length}, Warnings: ${verificationResult.warnings.length}`);

      return verificationResult;
    } catch (error) {
      console.error('[VERIFICATION ERROR]', error);
      verificationResult.flags.push(`Verification service error: ${error.message}`);
      verificationResult.authenticationScore = 0;
      return verificationResult;
    }
  }

  /**
   * Check Deeds Office records
   */
  async _verifyDeedsOffice(titleDeedNumber, ownerName, nationalId) {
    try {
      // In production: call actual Deeds Office API
      // For now: use mock database

      const mockDeedsDatabase = {
        'TD-2024-001': {
          titleNumber: 'TD-2024-001',
          owner: 'John Doe',
          nationalId: '12-1234567A89',
          suburb: 'HARARE',
          standNumber: 'A123',
          registrationDate: '2023-01-15',
          verified: true
        },
        'TD-2024-002': {
          titleNumber: 'TD-2024-002',
          owner: 'Jane Smith',
          nationalId: '23-7654321B90',
          suburb: 'BULAWAYO',
          standNumber: 'B456',
          registrationDate: '2023-06-20',
          verified: true
        }
      };

      const deedsRecord = mockDeedsDatabase[titleDeedNumber];

      if (!deedsRecord) {
        return {
          verified: false,
          error: 'Title deed not found in Deeds Office records',
          titleNumber: titleDeedNumber
        };
      }

      // Verify ownership name matches
      const ownerMatch = deedsRecord.owner.toLowerCase() === ownerName.toLowerCase();

      return {
        verified: ownerMatch,
        titleNumber: deedsRecord.titleNumber,
        owner: deedsRecord.owner,
        ownerMatch,
        registrationDate: deedsRecord.registrationDate,
        registeredLocation: deedsRecord.suburb,
        recordedData: deedsRecord
      };
    } catch (error) {
      console.error('[DEEDS OFFICE ERROR]', error);
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Check Municipal Council records
   */
  async _verifyMunicipalRecords(standNumber, suburb) {
    try {
      // Mock municipal database
      const mockMunicipalDatabase = {
        'A123': {
          standNumber: 'A123',
          suburb: 'HARARE',
          zone: 'Borrowdale',
          zoning: 'RESIDENTIAL',
          plotSize: '500 sqm',
          serviced: true,
          waterConnection: true,
          sewerConnection: true,
          electricityConnection: true,
          roadAccess: true,
          lastInspection: '2024-01-10',
          approved: true
        },
        'B456': {
          standNumber: 'B456',
          suburb: 'BULAWAYO',
          zone: 'Suburbs',
          zoning: 'RESIDENTIAL',
          plotSize: '450 sqm',
          serviced: true,
          waterConnection: true,
          sewerConnection: true,
          electricityConnection: true,
          roadAccess: true,
          lastInspection: '2024-02-05',
          approved: true
        }
      };

      const municipalRecord = mockMunicipalDatabase[standNumber];

      if (!municipalRecord) {
        return {
          verified: false,
          error: 'Stand not found in municipal records',
          standNumber
        };
      }

      return {
        verified: municipalRecord.suburb === suburb,
        standNumber: municipalRecord.standNumber,
        suburb: municipalRecord.suburb,
        zoning: municipalRecord.zoning,
        plotSize: municipalRecord.plotSize,
        serviced: municipalRecord.serviced,
        utilities: {
          water: municipalRecord.waterConnection,
          sewer: municipalRecord.sewerConnection,
          electricity: municipalRecord.electricityConnection,
          road: municipalRecord.roadAccess
        },
        lastInspection: municipalRecord.lastInspection,
        approved: municipalRecord.approved
      };
    } catch (error) {
      console.error('[MUNICIPAL ERROR]', error);
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Verify ownership matches across records
   */
  async _verifyOwnership(titleDeedNumber, claimedOwner, nationalId, deedsData) {
    try {
      // Check if national ID matches deeds office record
      const nationalIdMatch = deedsData.recordedData?.nationalId === nationalId;
      const ownerMatch = deedsData.ownerMatch;

      return {
        matches: nationalIdMatch && ownerMatch,
        recordedOwner: deedsData.recordedData?.owner,
        claimedOwner,
        nationalIdMatch,
        ownerMatch,
        verificationStatus: nationalIdMatch && ownerMatch ? 'VERIFIED' : 'MISMATCH'
      };
    } catch (error) {
      console.error('[OWNERSHIP VERIFICATION ERROR]', error);
      return {
        matches: false,
        error: error.message
      };
    }
  }

  /**
   * Verify coordinates within municipal boundaries
   */
  async _verifyCoordinates(standNumber, coordinates, suburb) {
    try {
      // Zimbabwe geographic bounds for each suburb
      const suburbBounds = {
        'HARARE': {
          minLat: -17.95,
          maxLat: -17.70,
          minLng: 30.95,
          maxLng: 31.20
        },
        'BULAWAYO': {
          minLat: -20.25,
          maxLat: -20.05,
          minLng: 28.45,
          maxLng: 28.75
        },
        'CHITUNGWIZA': {
          minLat: -18.10,
          maxLat: -17.95,
          minLng: 31.00,
          maxLng: 31.20
        }
      };

      const bounds = suburbBounds[suburb];
      if (!bounds) {
        return {
          withinBounds: false,
          error: `No bounds defined for suburb: ${suburb}`
        };
      }

      const { latitude, longitude } = coordinates;
      const withinBounds =
        latitude >= bounds.minLat && latitude <= bounds.maxLat &&
        longitude >= bounds.minLng && longitude <= bounds.maxLng;

      return {
        withinBounds,
        coordinates,
        expectedBounds: bounds,
        suburb
      };
    } catch (error) {
      console.error('[COORDINATES VERIFICATION ERROR]', error);
      return {
        withinBounds: false,
        error: error.message
      };
    }
  }

  /**
   * Check for mortgages, liens, or other encumbrances
   */
  async _checkEncumbrances(titleDeedNumber) {
    try {
      // Mock encumbrance database
      const mockEncumbranceDatabase = {
        'TD-2024-001': {
          hasEncumbrances: false,
          details: []
        },
        'TD-2024-002': {
          hasEncumbrances: true,
          details: [
            'Mortgage to XYZ Bank - $15,000 outstanding',
            'Cession in favor of ABC Finance'
          ]
        },
        'SUSPICIOUS-001': {
          hasEncumbrances: true,
          details: [
            'Multiple mortgages detected',
            'Recent legal claim filed'
          ]
        }
      };

      const encumbranceRecord = mockEncumbranceDatabase[titleDeedNumber] || {
        hasEncumbrances: false,
        details: []
      };

      return encumbranceRecord;
    } catch (error) {
      console.error('[ENCUMBRANCE CHECK ERROR]', error);
      return {
        hasEncumbrances: false,
        error: error.message
      };
    }
  }

  /**
   * Check for ownership disputes or legal claims
   */
  async _checkDisputes(titleDeedNumber) {
    try {
      // Mock dispute database
      const mockDisputeDatabase = {
        'DISPUTED-001': {
          hasDisputes: true,
          disputeDetails: 'Ownership claim by second party filed at High Court'
        },
        'DISPUTED-002': {
          hasDisputes: true,
          disputeDetails: 'Inheritance dispute - case in progress'
        }
      };

      const disputeRecord = mockDisputeDatabase[titleDeedNumber] || {
        hasDisputes: false,
        disputeDetails: null
      };

      return disputeRecord;
    } catch (error) {
      console.error('[DISPUTE CHECK ERROR]', error);
      return {
        hasDisputes: false,
        error: error.message
      };
    }
  }

  /**
   * Check rates/tax payment status with municipal council
   */
  async _checkRatesStatus(standNumber, suburb) {
    try {
      // Mock rates database
      const mockRatesDatabase = {
        'A123': {
          standNumber: 'A123',
          cleared: true,
          amount: 0,
          lastPayment: '2024-02-01'
        },
        'DELINQUENT-001': {
          standNumber: 'DELINQUENT-001',
          cleared: false,
          amount: 2500, // USD
          lastPayment: '2023-06-01'
        }
      };

      const ratesRecord = mockRatesDatabase[standNumber] || {
        cleared: true,
        amount: 0
      };

      return ratesRecord;
    } catch (error) {
      console.error('[RATES CHECK ERROR]', error);
      return {
        cleared: false,
        error: error.message
      };
    }
  }

  /**
   * Generate unique verification ID
   */
  _generateVerificationId() {
    return `VER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get verification report for admin review
   */
  getVerificationReport(verificationResult) {
    return {
      verificationId: verificationResult.verificationId,
      standNumber: verificationResult.standNumber,
      titleDeedNumber: verificationResult.titleDeedNumber,
      timestamp: verificationResult.timestamp,
      authenticationScore: verificationResult.authenticationScore,
      isAuthentic: verificationResult.isAuthentic,
      summary: this._generateSummary(verificationResult),
      checks: verificationResult.checks,
      flags: verificationResult.flags,
      warnings: verificationResult.warnings,
      recommendation: this._getRecommendation(verificationResult)
    };
  }

  /**
   * Generate human-readable summary
   */
  _generateSummary(result) {
    const checks = result.checks;
    const checklist = [];

    if (checks.deedsOfficeMatch) checklist.push('✅ Deeds Office verified');
    else checklist.push('❌ Deeds Office verification failed');

    if (checks.municipalMatch) checklist.push('✅ Municipal records verified');
    else checklist.push('❌ Municipal records verification failed');

    if (checks.ownershipMatch) checklist.push('✅ Ownership verified');
    else checklist.push('❌ Ownership verification failed');

    if (checks.coordinatesMatch) checklist.push('✅ Coordinates verified');
    else checklist.push('⚠️ Coordinates outside expected area');

    if (!checks.noEncumbrances) checklist.push('⚠️ Property has encumbrances');
    if (!checks.noDisputes) checklist.push('❌ ALERT: Ownership dispute exists');
    if (!checks.ratiosCleared) checklist.push('⚠️ Outstanding rates');

    return checklist.join('\n');
  }

  /**
   * Recommend admin action
   */
  _getRecommendation(result) {
    if (result.authenticationScore >= 85) {
      return {
        action: 'APPROVE',
        reason: 'All major verification checks passed. Stand appears authentic.',
        confidence: 'HIGH'
      };
    } else if (result.authenticationScore >= 70) {
      return {
        action: 'REVIEW',
        reason: 'Some verification checks require manual review. Minor discrepancies found.',
        confidence: 'MEDIUM'
      };
    } else if (result.authenticationScore >= 50) {
      return {
        action: 'INVESTIGATE',
        reason: 'Multiple verification failures. Requires detailed investigation before approval.',
        confidence: 'LOW'
      };
    } else {
      return {
        action: 'REJECT',
        reason: 'Critical verification failures. Stand authenticity cannot be confirmed.',
        confidence: 'CRITICAL'
      };
    }
  }
}

export default new StandVerificationService();
