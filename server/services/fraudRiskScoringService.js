/**
 * Fraud Risk Scoring Service
 * Detects suspicious patterns and calculates fraud risk score (0-100)
 * 0 = Low Risk, 100 = High Risk
 */

class FraudRiskScoringService {
  /**
   * Calculate fraud risk score for a land listing
   */
  async calculateFraudRisk(landData, verificationResult = null) {
    let riskScore = 0;
    const riskFactors = [];

    // 1. Verification Score (if available)
    if (verificationResult?.score) {
      if (verificationResult.score < 70) {
        riskScore += 25;
        riskFactors.push({
          factor: 'Low Verification Score',
          weight: 25,
          details: `Verification score: ${verificationResult.score}%`
        });
      } else if (verificationResult.score < 85) {
        riskScore += 10;
        riskFactors.push({
          factor: 'Medium Verification Score',
          weight: 10,
          details: `Verification score: ${verificationResult.score}%`
        });
      }
    }

    // 2. Missing Critical Documents
    const requiredDocs = ['TITLE_DEED', 'SURVEY_PLAN'];
    const uploadedDocTypes = landData.uploadedDocuments?.map(d => d.documentType) || [];
    const missingDocs = requiredDocs.filter(doc => !uploadedDocTypes.includes(doc));

    if (missingDocs.length > 0) {
      riskScore += missingDocs.length * 8;
      riskFactors.push({
        factor: 'Missing Documents',
        weight: missingDocs.length * 8,
        details: `Missing: ${missingDocs.join(', ')}`
      });
    }

    // 3. Document Upload Patterns
    if (landData.uploadedDocuments?.length === 0) {
      riskScore += 20;
      riskFactors.push({
        factor: 'No Documents Uploaded',
        weight: 20,
        details: 'Seller has not uploaded any supporting documents'
      });
    }

    // 4. Seller Account Age
    if (landData.sellerJoinDate) {
      const accountAgeDays = this.calculateDaysSince(landData.sellerJoinDate);
      if (accountAgeDays < 7) {
        riskScore += 15;
        riskFactors.push({
          factor: 'New Seller Account',
          weight: 15,
          details: `Account created ${accountAgeDays} days ago`
        });
      } else if (accountAgeDays < 30) {
        riskScore += 8;
        riskFactors.push({
          factor: 'Recently Created Account',
          weight: 8,
          details: `Account created ${accountAgeDays} days ago`
        });
      }
    }

    // 5. Multiple Listings by Same Seller
    if (landData.sellerListingCount > 5) {
      riskScore += 5; // Slightly suspicious if too many listings
      riskFactors.push({
        factor: 'High Volume Seller',
        weight: 5,
        details: `Seller has ${landData.sellerListingCount} active listings`
      });
    }

    // 6. Price Anomaly
    if (landData.pricePerSqm && landData.standSize) {
      const pricePerSqm = landData.price / (landData.standSize / 10000);
      const anomaly = this.checkPriceAnomaly(pricePerSqm, landData.suburb);

      if (anomaly) {
        riskScore += 12;
        riskFactors.push({
          factor: 'Unusual Pricing',
          weight: 12,
          details: `Price per sqm (${pricePerSqm.toFixed(2)}) is unusual for ${landData.suburb}`
        });
      }
    }

    // 7. GPS Coordinate Accuracy
    if (verificationResult?.gpsAccuracy === false) {
      riskScore += 15;
      riskFactors.push({
        factor: 'GPS Coordinates Mismatch',
        weight: 15,
        details: 'Coordinates significantly differ from authority records'
      });
    }

    // 8. Previous Fraud Reports
    if (landData.fraudReportCount && landData.fraudReportCount > 0) {
      riskScore += Math.min(landData.fraudReportCount * 10, 30);
      riskFactors.push({
        factor: 'Fraud Reports',
        weight: Math.min(landData.fraudReportCount * 10, 30),
        details: `${landData.fraudReportCount} fraud report(s) received`
      });
    }

    // 9. Seller with Rejected Listings
    if (landData.sellerRejectedListingsCount > 2) {
      riskScore += 10;
      riskFactors.push({
        factor: 'Seller Has Rejected Listings',
        weight: 10,
        details: `${landData.sellerRejectedListingsCount} listings rejected`
      });
    }

    // 10. Rapid Re-listing (Same stand listed multiple times quickly)
    if (landData.previousListingWithinDays && landData.previousListingWithinDays < 7) {
      riskScore += 20;
      riskFactors.push({
        factor: 'Rapid Re-listing',
        weight: 20,
        details: 'Same stand re-listed within a few days of previous listing'
      });
    }

    // 11. Document Tampering Indicators
    if (landData.documentTamperedIndicators?.detected) {
      riskScore += 25;
      riskFactors.push({
        factor: 'Possible Document Tampering',
        weight: 25,
        details: landData.documentTamperedIndicators.details
      });
    }

    // 12. Name Variations (Seller name doesn't match across documents)
    if (landData.nameVariationDetected) {
      riskScore += 12;
      riskFactors.push({
        factor: 'Name Variations',
        weight: 12,
        details: 'Seller name varies across uploaded documents'
      });
    }

    // 13. Duplicate Stand Numbers
    if (landData.hasDuplicateStandNumbers) {
      riskScore += 30;
      riskFactors.push({
        factor: 'Duplicate Stand Number',
        weight: 30,
        details: 'This stand number already exists in system'
      });
    }

    // 14. IP/Location Anomalies (If available)
    if (landData.locationAnomaly) {
      riskScore += 8;
      riskFactors.push({
        factor: 'Location Anomaly',
        weight: 8,
        details: 'Listing uploaded from unusual location'
      });
    }

    // Ensure score is between 0-100
    riskScore = Math.max(0, Math.min(100, riskScore));

    return {
      score: riskScore,
      level: this.getRiskLevel(riskScore),
      factors: riskFactors,
      recommendation: this.getFraudRecommendation(riskScore),
      summary: this.getFraudSummary(riskScore)
    };
  }

  /**
   * Get risk level based on score
   */
  getRiskLevel(score) {
    if (score < 30) return 'LOW_RISK';
    if (score < 60) return 'MEDIUM_RISK';
    if (score < 80) return 'HIGH_RISK';
    return 'CRITICAL_RISK';
  }

  /**
   * Get recommendation based on fraud score
   */
  getFraudRecommendation(score) {
    if (score < 30) {
      return {
        action: 'PROCEED',
        message: 'Proceed with normal verification process'
      };
    } else if (score < 60) {
      return {
        action: 'REVIEW_CAREFULLY',
        message: 'Review documents carefully and verify with authority'
      };
    } else if (score < 80) {
      return {
        action: 'ESCALATE',
        message: 'Escalate to supervisor for additional verification'
      };
    } else {
      return {
        action: 'REJECT',
        message: 'Reject listing and consider reporting to authorities'
      };
    }
  }

  /**
   * Get fraud risk summary
   */
  getFraudSummary(score) {
    const level = this.getRiskLevel(score);

    const summaries = {
      LOW_RISK: 'This listing appears legitimate based on automated checks',
      MEDIUM_RISK: 'This listing has some concerning factors that require review',
      HIGH_RISK: 'This listing has multiple red flags and should be investigated',
      CRITICAL_RISK: 'This listing shows strong indicators of fraud and should be rejected'
    };

    return summaries[level] || 'Unable to determine risk';
  }

  /**
   * Check for price anomalies
   * Compares price against market rates for the area
   */
  checkPriceAnomaly(pricePerSqm, suburb) {
    // Dummy market rate data (in real system, this would be from actual market data)
    const marketRates = {
      'HARARE': { min: 100, max: 500, average: 300 },
      'BULAWAYO': { min: 80, max: 400, average: 250 },
      'CHITUNGWIZA': { min: 50, max: 200, average: 120 },
      'GWERU': { min: 60, max: 250, average: 150 },
      'MUTARE': { min: 70, max: 300, average: 180 },
      'KADOMA': { min: 75, max: 350, average: 200 },
      'MASVINGO': { min: 60, max: 280, average: 170 }
    };

    const rates = marketRates[suburb];
    if (!rates) return false;

    // Flag as anomaly if price is outside reasonable range (very cheap or very expensive)
    return pricePerSqm < rates.min * 0.5 || pricePerSqm > rates.max * 1.5;
  }

  /**
   * Calculate days since a date
   */
  calculateDaysSince(date) {
    const now = new Date();
    const past = new Date(date);
    const diff = now - past;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Combine verification score and fraud risk score
   * Returns final recommendation
   */
  getFinalRecommendation(verificationScore, fraudRiskScore) {
    // Create a decision matrix
    const decision = {
      verificationScore,
      fraudRiskScore,
      status: '',
      action: '',
      requiresAdminReview: false
    };

    // High verification, low fraud risk = AUTO VERIFIED
    if (verificationScore >= 90 && fraudRiskScore < 30) {
      decision.status = 'VERIFIED';
      decision.action = 'AUTO_APPROVE';
      decision.requiresAdminReview = false;
    }
    // Good verification, acceptable fraud risk = NEEDS REVIEW
    else if (verificationScore >= 70 && fraudRiskScore < 60) {
      decision.status = 'PENDING_REVIEW';
      decision.action = 'SEND_TO_VERIFIER';
      decision.requiresAdminReview = true;
    }
    // Low verification OR high fraud risk = REJECT
    else if (verificationScore < 70 || fraudRiskScore >= 80) {
      decision.status = 'REJECTED';
      decision.action = 'AUTO_REJECT';
      decision.requiresAdminReview = false;
    }
    // Medium verification with medium fraud risk = ESCALATE
    else {
      decision.status = 'SUSPICIOUS';
      decision.action = 'ESCALATE_TO_ADMIN';
      decision.requiresAdminReview = true;
    }

    return decision;
  }
}

export default new FraudRiskScoringService();
