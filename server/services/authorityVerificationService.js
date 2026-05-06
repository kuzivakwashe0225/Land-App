import AuthorityRecord from '../models/authority-records-model.js';
import Land from '../models/landModel.js';

/**
 * Authority Verification Service
 *
 * Verifies a land listing against the Zimbabwe authority database (simulated).
 *
 * BUSINESS RULE:
 *   - Seller identity is verified via KYC (national ID + selfie).
 *     That process is handled separately in the user verification flow.
 *   - This service ONLY verifies the stand itself:
 *       1. Does the title deed exist in the authority registry?
 *       2. Is the zoning correct?
 *       3. Is there any dispute or encumbrance?
 *       4. Do the GPS coordinates match?
 *       5. Are rates cleared?
 *
 * SCORING (100 pts total):
 *   Title deed found in registry   : 40 pts
 *   Zoning matches listing          : 20 pts
 *   No dispute / encumbrance        : 20 pts
 *   GPS within 150m of registry pt  : 10 pts
 *   Rates cleared                   : 10 pts
 *
 * DECISIONS:
 *   85–100 → AUTO_APPROVE  (status: AUTHORITY_VERIFIED)
 *   65–84  → HUMAN_REVIEW  (status: PENDING_VERIFICATION)
 *   0–64   → AUTO_REJECT   (status: REJECTED)
 */

// ── Haversine distance calculator ─────────────────────────────────────────────
function haversineMeters([lng1, lat1], [lng2, lat2]) {
  const R = 6371000; // metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ── Normalise a string for loose comparison ────────────────────────────────────
function normalise(str) {
  return (str || '').trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Checks whether this stand number is already listed in our own Land collection
 * (duplicate detection — not related to authority registry).
 */
async function checkDuplicate(land) {
  const dupe = await Land.findOne({
    standNumber: { $regex: new RegExp(`^${land.standNumber.trim()}$`, 'i') },
    _id: { $ne: land._id },
    isActive: true,
    'verification.status': { $nin: ['REJECTED'] }
  });
  return !!dupe;
}

/**
 * Core scoring function — purely about the stand, not the seller.
 */
function scoreStand({ authorityRecord, listing, distanceMeters }) {
  let score = 0;
  const flags = [];
  const notes = [];

  // ── 1. Title Deed Match (40 pts) ──────────────────────────────────────────
  if (
    listing.titleDeedNumber &&
    normalise(authorityRecord.titleDeedNumber) === normalise(listing.titleDeedNumber)
  ) {
    score += 40;
    notes.push('✅ Title deed number matched in authority registry (40 pts).');
  } else if (
    listing.standNumber &&
    normalise(authorityRecord.standNumber) === normalise(listing.standNumber)
  ) {
    // Partial credit for stand number only match (title deed missing/different)
    score += 20;
    flags.push('TITLE_DEED_NOT_MATCHED');
    notes.push('⚠️ Stand number matched but title deed differs. Partial credit (20 pts).');
  } else {
    flags.push('NO_REGISTRY_MATCH');
    notes.push('❌ Neither title deed nor stand number matched in authority registry.');
  }

  // ── 2. Zoning Match (20 pts) ──────────────────────────────────────────────
  const listingZoning = listing.landDetails?.zoning || 'RESIDENTIAL';
  const authorityZoning = authorityRecord.landUseType || authorityRecord.zoning;
  if (authorityZoning && normalise(authorityZoning) === normalise(listingZoning)) {
    score += 20;
    notes.push(`✅ Zoning matches registry: ${listingZoning} (20 pts).`);
  } else {
    flags.push('ZONING_MISMATCH');
    notes.push(`❌ Zoning mismatch: listing says ${listingZoning}, registry says ${authorityZoning}.`);
  }

  // ── 3. No Dispute / Encumbrance (20 pts) ─────────────────────────────────
  const hasDispute = authorityRecord.disputeStatus && authorityRecord.disputeStatus !== 'NONE';
  const hasEncumbrance = authorityRecord.encumbrances && authorityRecord.encumbrances.length > 0;
  const authorityStatusBad = ['DISPUTED', 'UNDER_INVESTIGATION', 'DUPLICATE'].includes(authorityRecord.status);

  if (!hasDispute && !hasEncumbrance && !authorityStatusBad) {
    score += 20;
    notes.push('✅ No disputes or encumbrances found (20 pts).');
  } else {
    flags.push('DISPUTE_OR_ENCUMBRANCE_FOUND');
    if (hasDispute) notes.push(`❌ Stand has dispute: ${authorityRecord.disputeStatus}.`);
    if (hasEncumbrance) notes.push(`❌ Stand has encumbrances: ${authorityRecord.encumbrances.join(', ')}.`);
    if (authorityStatusBad) notes.push(`❌ Authority registry status: ${authorityRecord.status}.`);
  }

  // ── 4. GPS Proximity (10 pts) ─────────────────────────────────────────────
  if (distanceMeters !== null && distanceMeters !== undefined) {
    if (distanceMeters <= 50) {
      score += 10;
      notes.push(`✅ GPS coordinates within 50m of registry point (10 pts). Distance: ${Math.round(distanceMeters)}m.`);
    } else if (distanceMeters <= 150) {
      score += 5;
      flags.push('LOCATION_APPROXIMATE');
      notes.push(`⚠️ GPS coordinates within 150m of registry point (5 pts). Distance: ${Math.round(distanceMeters)}m.`);
    } else {
      flags.push('LOCATION_MISMATCH');
      notes.push(`❌ GPS coordinates are ${Math.round(distanceMeters)}m from registry point (max 150m).`);
    }
  } else {
    flags.push('GPS_NOT_PROVIDED');
    notes.push('⚠️ No GPS coordinates provided — location not verified.');
  }

  // ── 5. Rates Cleared (10 pts) ─────────────────────────────────────────────
  if (authorityRecord.ratesCleared !== false) {
    score += 10;
    notes.push('✅ Rates are cleared (10 pts).');
  } else {
    flags.push('RATES_NOT_CLEARED');
    notes.push('❌ Rates are not cleared on this stand.');
  }

  return { score, flags, notes };
}

/**
 * Main export: verify a land listing against the authority database.
 *
 * @param {Object} land     - Mongoose Land document (or plain object from controller)
 * @param {boolean} sellerKycApproved - Whether the seller has passed KYC
 * @returns {Object} verification result
 */
export async function verifyListingAgainstAuthority(land, sellerKycApproved = false) {
  const result = {
    passed: false,
    score: 0,
    decision: 'AUTO_REJECT',
    verificationStatus: 'REJECTED',
    flags: [],
    notes: [],
    authorityRecordId: null,
    distanceMeters: null,
    isDuplicate: false
  };

  // ── Gate 1: Seller KYC Check (Non-Blocking) ──────────────────────────────
  // Seller KYC is verified separately. A stand can be verified even if the seller isn't yet.
  if (!sellerKycApproved) {
    result.flags.push('SELLER_KYC_PENDING');
    result.notes.push('⚠️ Seller KYC is pending, but proceeding with stand verification.');
  }

  // ── Gate 2: Duplicate stand detection ────────────────────────────────────
  const isDuplicate = await checkDuplicate(land);
  if (isDuplicate) {
    result.isDuplicate = true;
    result.flags.push('DUPLICATE_STAND_NUMBER');
    result.notes.push('❌ This stand number is already listed in the system.');
    result.verificationStatus = 'REJECTED';
    result.decision = 'AUTO_REJECT';
    return result;
  }

  // ── Find Authority Record ─────────────────────────────────────────────────
  let authorityRecord = null;

  // Priority 1: Title deed number (strongest match)
  if (land.titleDeedNumber) {
    authorityRecord = await AuthorityRecord.findOne({
      titleDeedNumber: { $regex: new RegExp(`^${normalise(land.titleDeedNumber)}$`, 'i') }
    });
  }

  // Priority 2: Stand number (medium match)
  if (!authorityRecord && land.standNumber) {
    authorityRecord = await AuthorityRecord.findOne({
      standNumber: normalise(land.standNumber)
    });
  }

  // Priority 3: Geospatial proximity (fallback — within 200m)
  const coords = land.location?.coordinates?.coordinates;
  const hasCoords = Array.isArray(coords) && coords.length >= 2;

  if (!authorityRecord && hasCoords) {
    const [lng, lat] = coords;
    const nearestRecords = await AuthorityRecord.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'calcDistanceMeters',
          spherical: true,
          maxDistance: 200,
          query: { status: { $in: ['VALID', 'UNALLOCATED'] } }
        }
      },
      { $limit: 1 }
    ]);
    if (nearestRecords.length > 0) {
      authorityRecord = nearestRecords[0];
      result.distanceMeters = nearestRecords[0].calcDistanceMeters;
    }
  }

  // No authority record found at all
  if (!authorityRecord) {
    result.flags.push('TITLE_DEED_NOT_FOUND_IN_REGISTRY');
    result.notes.push('❌ Title deed and stand number not found in the authority registry.');
    // Could still be a valid stand not yet in our dummy DB — send to human review
    result.verificationStatus = 'PENDING_VERIFICATION';
    result.decision = 'HUMAN_REVIEW';
    result.score = 0;
    return result;
  }

  result.authorityRecordId = authorityRecord._id;

  // ── Calculate distance if not already set ─────────────────────────────────
  if (result.distanceMeters === null && hasCoords && authorityRecord.geoLocation?.coordinates?.length >= 2) {
    result.distanceMeters = haversineMeters(coords, authorityRecord.geoLocation.coordinates);
  }

  // ── Run scoring ───────────────────────────────────────────────────────────
  const { score, flags, notes } = scoreStand({
    authorityRecord,
    listing: land,
    distanceMeters: result.distanceMeters
  });

  result.score = score;
  result.flags = flags;
  result.notes = notes;

  // ── Apply decision ────────────────────────────────────────────────────────
  if (score >= 85) {
    result.decision = 'AUTO_APPROVE';
    result.verificationStatus = 'AUTHORITY_VERIFIED';
    result.passed = true;
  } else if (score >= 65) {
    result.decision = 'HUMAN_REVIEW';
    result.verificationStatus = 'PENDING_VERIFICATION';
  } else {
    result.decision = 'AUTO_REJECT';
    result.verificationStatus = 'REJECTED';
  }

  return result;
}

export default { verifyListingAgainstAuthority };
