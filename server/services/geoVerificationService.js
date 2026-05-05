import AuthorityRecord from '../models/authority-records-model.js';
import Land from '../models/landModel.js';

async function calculateScore({ distanceMeters, authorityRecord, listing, seller }) {
  let score = 0;
  const notes = [];

  // Check for duplicate listings in our own system (not the authority registry)
  if (listing.standNumber) {
    const duplicate = await Land.findOne({
      standNumber: { $regex: new RegExp(`^${listing.standNumber.trim()}$`, 'i') },
      _id: { $ne: listing._id },
      isActive: true,
      'verification.status': { $ne: 'REJECTED' }
    });
    if (duplicate) {
      return {
        score: 0,
        notes: ['CRITICAL: Stand number is already listed in the system (Duplicate).'],
        isDuplicate: true,
        rejectionReason: 'Duplicate stand number already listed in the system'
      };
    }
  }

  if (!authorityRecord) {
    return {
      score: 0,
      notes: ['No matching authority record found for the provided Title Deed or Stand Number.'],
    };
  }

  // 1. ID MATCHING (PRIORITY) - Title Deed or Stand Number (40 pts)
  let idMatch = false;
  if (listing.titleDeedNumber && authorityRecord.titleDeedNumber === listing.titleDeedNumber) {
    score += 40;
    idMatch = true;
    notes.push('Title Deed Number matches authority registry (Match).');
  } else if (listing.standNumber && authorityRecord.standNumber === listing.standNumber.toUpperCase()) {
    score += 30;
    idMatch = true;
    notes.push('Stand Number matches authority registry (Match).');
  } else {
    notes.push('No direct ID match found in authority registry (Mismatch).');
  }

  // 2. Location Match (20 pts)
  if (distanceMeters !== null && distanceMeters !== undefined) {
    if (distanceMeters <= 50) {
      score += 20;
      notes.push('GPS Location is within 50m of authority record (Match).');
    } else if (distanceMeters <= 150) {
      score += 10;
      notes.push('GPS Location is within 150m of authority record (Partial Match).');
    } else {
      notes.push('GPS Location mismatch: coordinates are too far from authority record.');
    }
  } else {
    notes.push('GPS coordinates not provided; skipped spatial verification.');
  }

  // 3. Land Use (20 pts)
  const listingZoning = listing.landDetails?.zoning || 'RESIDENTIAL';
  if (authorityRecord.landUseType === listingZoning) {
    score += 20;
    notes.push(`Zoning (${listingZoning}) matches authority record (Match).`);
  } else {
    notes.push(`Zoning mismatch: Listing says ${listingZoning}, Registry says ${authorityRecord.landUseType}.`);
  }

  // 4. Status (10 pts)
  if (['VALID', 'PROCESSED', 'SOLD'].includes(authorityRecord.status)) {
    score += 10;
    notes.push('Stand status is valid/processed in registry (Match).');
  } else {
    notes.push(`Stand status in registry is ${authorityRecord.status} (Warning).`);
  }

  // 5. Identity Match (10 pts)
  if (seller) {
    const sellerName = `${seller.firstName} ${seller.lastName}`.trim().toUpperCase();
    const ownerName = (authorityRecord.currentOwner?.name || '').trim().toUpperCase();
    const sellerId = (seller.nationalId || '').trim().toUpperCase();
    const ownerId = (authorityRecord.currentOwner?.nationalId || '').trim().toUpperCase();

    if (sellerId && ownerId && sellerId === ownerId) {
      score += 10;
      notes.push('Seller National ID matches authority record (Match).');
    } else if (sellerName && ownerName && sellerName === ownerName) {
      score += 10;
      notes.push('Seller name matches authority record owner (Match).');
    } else {
      notes.push(`Seller identity does not match authority record owner (Mismatch).`);
    }
  }

  return { score, notes };
}

export async function verifyListingByGeo(listing, seller = null) {
  let authorityRecord = null;
  let distanceMeters = null;

  // 1. Try to find Authority Record by Title Deed Number (Highest Priority)
  if (listing.titleDeedNumber) {
    authorityRecord = await AuthorityRecord.findOne({ titleDeedNumber: listing.titleDeedNumber });
  }

  // 2. Fallback to Stand Number
  if (!authorityRecord && listing.standNumber) {
    authorityRecord = await AuthorityRecord.findOne({ standNumber: listing.standNumber.toUpperCase() });
  }

  // 3. Fallback to Geospatial proximity if coordinates are present
  const hasCoords = listing.location?.coordinates?.coordinates && listing.location.coordinates.coordinates.length >= 2;
  
  if (!authorityRecord && hasCoords) {
    const [lng, lat] = listing.location.coordinates.coordinates;
    const nearestRecords = await AuthorityRecord.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          spherical: true,
          maxDistance: 500,
          query: { status: { $in: ['VALID', 'PROCESSED', 'SOLD'] } },
        },
      },
      { $limit: 1 },
    ]);
    if (nearestRecords.length > 0) {
      authorityRecord = nearestRecords[0];
      distanceMeters = authorityRecord.distanceMeters;
    }
  }

  // If we found the record by ID, calculate distance if coords are present
  if (authorityRecord && hasCoords && distanceMeters === null) {
    const [lng, lat] = listing.location.coordinates.coordinates;
    const authCoords = authorityRecord.location?.coordinates;
    if (authCoords && authCoords.length >= 2) {
      // Manual distance calculation if needed, or just let it be null for scoring
      // For now we assume if we found it by ID, we use it.
    }
  }

  const { score, notes, isDuplicate, rejectionReason: dupReason } = await calculateScore({
    distanceMeters,
    authorityRecord,
    listing,
    seller
  });

  if (isDuplicate) {
    return {
      verificationStatus: 'REJECTED',
      verificationScore: 0,
      verificationNotes: notes,
      rejectionReason: dupReason,
      isDuplicate: true
    };
  }

  let verificationStatus = 'REQUIRES_REVIEW';
  let isPublic = false;
  let rejectionReason = null;

  if (!authorityRecord) {
    verificationStatus = 'REJECTED';
    rejectionReason = 'No matching authority record found for Title Deed, Stand Number, or Location';
  } else if (score < 50) { // Lowered threshold since GPS might be missing
    verificationStatus = 'REJECTED';
    rejectionReason = `Verification score (${score}%) below minimum threshold of 50%`;
  } else if (score >= 80) {
    verificationStatus = 'AUTO_VERIFIED';
    isPublic = true;
  } else {
    verificationStatus = 'REQUIRES_REVIEW';
  }

  return {
    verificationStatus,
    verificationScore: score,
    verificationNotes: notes,
    rejectionReason,
    matchedAuthorityRecord: authorityRecord?._id || null,
    distanceMeters: distanceMeters,
    isPublic,
  };
}
