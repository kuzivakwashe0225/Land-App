import Land from '../models/landModel.js';
import User from '../models/user-model.js';
import Transaction from '../models/transactionModel.js';
import AuthorityRecord from '../models/authority-records-model.js';
import { uploadToFirebase } from '../utils/fileUpload.js';
import { verifyDeedsOffice, verifyMunicipalRecords } from '../utils/externalApis.js';
import { createNotification } from '../utils/notifications.js';
import { runFullVerification, haversineDistance } from '../services/verificationService.js';
import { verifyListingByGeo } from '../services/geoVerificationService.js';

// ── Create Land Listing — with authority validation + auto-verification ─────────
export const createLandListing = async (req, res) => {
  try {
    console.log('=== Creating Land Listing ===');
    const {
      standNumber,
      titleDeedNumber,
      location,
      landDetails,
      transaction
    } = req.body;

    // Validate required fields
    if (!standNumber || !titleDeedNumber || !location || !landDetails || !transaction) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: standNumber, titleDeedNumber, location, landDetails, transaction'
      });
    }

    // Get user for listing ownership
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // GPS Coordinates are now RECOMMENDED but not MANDATORY
    const hasCoordinates = location.latitude != null && location.longitude != null;
    const lat = hasCoordinates ? parseFloat(location.latitude) : null;
    const lng = hasCoordinates ? parseFloat(location.longitude) : null;

    if (hasCoordinates && (isNaN(lat) || isNaN(lng))) {
      return res.status(400).json({
        success: false,
        message: 'Provided coordinates must be valid numbers'
      });
    }

    // Zimbabwe bounds validation (only if coordinates are provided)
    if (hasCoordinates && (lat < -22.4 || lat > -8.3 || lng < 24.5 || lng > 34.3)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be within Zimbabwe boundaries'
      });
    }

    // Check if stand number or title deed already exists
    const existingLand = await Land.findOne({
      $or: [
        { standNumber: standNumber.toUpperCase() },
        { titleDeedNumber }
      ],
      'verification.status': { $ne: 'REJECTED' }
    });

    if (existingLand) {
      return res.status(409).json({
        success: false,
        message: 'This stand number or title deed is already listed.'
      });
    }

    // ── FRAUD DETECTION (RATE LIMITING) ───────────────────────────────────
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentListingsByUser = await Land.countDocuments({
      owner: req.user.id,
      createdAt: { $gte: yesterday },
      'verification.status': { $ne: 'REJECTED' }
    });

    let fraudFlags = [];
    if (recentListingsByUser >= 5) {
      fraudFlags.push({
        flagType: 'SUSPICIOUS_ACTIVITY',
        reportedBy: null,
        description: 'User created 5+ listings within 24 hours',
        evidence: null,
        triggeredBySystem: true,
        status: 'PENDING'
      });
    }

    // Create land listing initial structure
    const land = new Land({
      standNumber: standNumber.toUpperCase(),
      titleDeedNumber,
      owner: req.user.id,
      location: {
        address: location.address || {},
        ...(hasCoordinates && {
          coordinates: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        })
      },
      landDetails: landDetails || {},
      transaction: transaction || { status: 'AVAILABLE' },
      verification: {
        status: 'PENDING_VERIFICATION',
        isVerified: false,
        authorityVerified: false
      },
      fraudFlags: fraudFlags
    });

    // ── GEO VERIFICATION LOGIC ───────────────────────────────────────────
    const sellerUser = await User.findById(req.user.id);
    const verificationResult = await verifyListingByGeo(land, sellerUser);

    land.verification.status = verificationResult.verificationStatus;
    land.verification.autoVerification = {
      ranAt: new Date(),
      verificationScore: verificationResult.verificationScore,
      riskScore: 100 - verificationResult.verificationScore,
      decision: verificationResult.verificationStatus === 'AUTO_VERIFIED' ? 'AUTO_APPROVE' : (verificationResult.verificationStatus === 'REJECTED' ? 'AUTO_REJECT' : 'HUMAN_REVIEW'),
      reason: verificationResult.rejectionReason,
      isDuplicateRejection: verificationResult.isDuplicate || false,
      flags: verificationResult.verificationNotes
    };
    land.verification.isVerified = verificationResult.verificationStatus === 'AUTO_VERIFIED';
    land.verification.authorityVerified = verificationResult.matchedAuthorityRecord != null;
    land.verification.rejectionReason = verificationResult.rejectionReason;
    land.matchedAuthorityRecord = verificationResult.matchedAuthorityRecord;

    if (verificationResult.verificationStatus === 'AUTO_VERIFIED') {
      land.isPublic = true;
    }

    // System admin override
    if (req.user.role === 'SYSTEM_ADMIN' && req.body.verificationStatus) {
      land.verification.status = req.body.verificationStatus;
    }
    // Override transaction status if flagged
    if (fraudFlags.length > 0) {
      land.transaction.status = 'FLAGGED';
    }

    await land.save();
    console.log('Land listing saved:', land._id);

    // ── AUTO-REJECTION NOTIFICATIONS ─────────────────────────────────────
    if (verificationResult.verificationStatus === 'REJECTED') {
      setImmediate(async () => {
        try {
          // Notify seller about auto-rejection
          await createNotification(req.user.id, 'LAND_VERIFICATION_REJECTED', {
            landId: land._id,
            standNumber: land.standNumber,
            reason: verificationResult.rejectionReason,
            score: verificationResult.verificationScore
          });

          // Notify all verification officers and admins
          const targetRoles = ['MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'];
          const officers = await User.find({
            role: { $in: targetRoles },
            'activity.accountStatus': 'ACTIVE'
          });

          for (const officer of officers) {
            await createNotification(officer._id, 'AUTO_REJECTED_LISTING', {
              landId: land._id,
              standNumber: land.standNumber,
              sellerName: `${sellerUser.firstName} ${sellerUser.lastName}`,
              reason: verificationResult.rejectionReason,
              score: verificationResult.verificationScore,
              isDuplicate: verificationResult.isDuplicate
            });
          }
        } catch (notifErr) {
          console.warn('Auto-rejection notification error:', notifErr.message);
        }
      });
    }

    // ── OFFICER NOTIFICATIONS FOR NEW LISTINGS ──────────────────────────
    if (verificationResult.verificationStatus !== 'REJECTED') {
      setImmediate(async () => {
        try {
          const targetRoles = ['MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'];
          const officers = await User.find({
            role: { $in: targetRoles },
            'activity.accountStatus': 'ACTIVE'
          });

          for (const officer of officers) {
            await createNotification(officer._id, 'NEW_LAND_LISTING', {
              landId: land._id,
              standNumber: land.standNumber,
              owner: req.user.id,
              flagged: fraudFlags.length > 0,
              score: verificationResult.verificationScore
            });
          }
        } catch (notifErr) {
          console.warn('Notification error:', notifErr.message);
        }
      });
    }

    res.status(201).json({
      success: true,
      message: land.verification.status === 'AUTO_VERIFIED' ? 'Land listing created and automatically verified.' : 'Land listing created successfully. Pending verification.',
      data: land,
      verificationResult
    });
  } catch (error) {
    console.error('Error creating land listing:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `A land listing with this ${field} already exists. Please use a different ${field}.`
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + messages.join(', ')
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Get public listings
export const getPublicListings = async (req, res, next) => {
  try {
    const listings = await Land.find({
      isPublic: true,
      'verification.status': { $in: ['AUTO_VERIFIED', 'VERIFIED'] },
      isActive: true,
    }).populate('owner', 'firstName lastName email');

    res.status(200).json({
      success: true,
      listings,
    });
  } catch (error) {
    console.error('Error fetching public listings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Live check for location verification
export const checkLocation = async (req, res) => {
  try {
    const { lat, lng, standNumber } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const dummyListing = {
      standNumber: standNumber || '',
      location: {
        coordinates: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        }
      }
    };

    const sellerUser = req.user ? await User.findById(req.user.id) : null;
    const verificationResult = await verifyListingByGeo(dummyListing, sellerUser);

    res.status(200).json({
      success: true,
      verificationStatus: verificationResult.verificationStatus,
      verificationScore: verificationResult.verificationScore,
      notes: verificationResult.verificationNotes,
      distanceMeters: verificationResult.distanceMeters,
      matchedAuthorityRecord: verificationResult.matchedAuthorityRecord
    });
  } catch (error) {
    console.error('Error in live location check:', error);
    res.status(500).json({ success: false, message: 'Internal server error during location check' });
  }
};

// Search authority registry by address
export const searchAuthorityRegistry = async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ success: false, message: 'Address query is required' });
    }

    // Clean address for better matching
    const cleanAddress = address.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

    // Search for authority records that match the street or stand number
    const records = await AuthorityRecord.find({
      $or: [
        { 'address.street': { $regex: address, $options: 'i' } },
        { standNumber: { $regex: address, $options: 'i' } }
      ]
    }).limit(5);

    res.status(200).json({
      success: true,
      data: records.map(r => ({
        address: r.address?.street,
        suburb: r.address?.suburb,
        standNumber: r.standNumber,
        coordinates: {
          lat: r.location.coordinates[1],
          lng: r.location.coordinates[0]
        },
        owner: r.currentOwner?.name
      }))
    });
  } catch (error) {
    console.error('Authority registry search error:', error);
    res.status(500).json({ success: false, message: 'Error searching registry' });
  }
};

// Get all land listings with filters
export const getLandListings = async (req, res) => {
  try {
    const {
      suburb,
      zoning,
      status,
      verified,
      minPrice,
      maxPrice,
      minSize,
      maxSize,
      owner,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter query
    const filter = {};

    // Filter by owner if provided
    if (owner) {
      filter['owner'] = owner;
    }

    if (suburb) {
      filter['location.address.suburb'] = suburb;
    }

    if (zoning) {
      filter['landDetails.zoning'] = zoning;
    }

    if (status) {
      const transactionStatuses = ['AVAILABLE', 'PENDING_SALE', 'SOLD', 'UNDER_REVIEW', 'FLAGGED'];
      const verificationStatuses = ['VERIFIED', 'REJECTED', 'PENDING_VERIFICATION', 'SUSPICIOUS', 'AUTO_VERIFIED'];
      
      if (transactionStatuses.includes(status)) {
        filter['transaction.status'] = status;
      } else if (verificationStatuses.includes(status)) {
        filter['verification.status'] = status;
      }
    }

    if (verified !== undefined) {
      filter['verification.isVerified'] = verified === 'true';
    }

    if (minPrice || maxPrice) {
      filter['transaction.listedPrice.amount'] = {};
      if (minPrice) filter['transaction.listedPrice.amount'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['transaction.listedPrice.amount'].$lte = parseFloat(maxPrice);
    }

    if (minSize || maxSize) {
      filter['landDetails.size.squareMeters'] = {};
      if (minSize) filter['landDetails.size.squareMeters'].$gte = parseFloat(minSize);
      if (maxSize) filter['landDetails.size.squareMeters'].$lte = parseFloat(maxSize);
    }

    // Only show verified and active lands to buyers
    if (req.user.role === 'BUYER') {
      filter['verification.status'] = { $in: ['VERIFIED', 'AUTO_VERIFIED'] };
      filter['verification.isVerified'] = true;
      filter['transaction.status'] = 'AVAILABLE';
      filter['isActive'] = true;
      filter['listingStatus'] = 'verified';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const lands = await Land.find(filter)
      .populate('owner', 'firstName lastName email verification.isVerified verification.sellerDetailsApproved')
      .select('standNumber titleDeedNumber location landDetails transaction verification.status verification.isVerified verification.authorityVerified verification.verifiedBy verification.verificationDate verification.deedsOfficeVerified verification.municipalVerified verification.autoVerification.verificationScore verification.autoVerification.riskScore verification.autoVerification.decision verification.autoVerification.reason verification.autoVerification.isDuplicateRejection verification.autoVerification.flags images owner createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Land.countDocuments(filter);

    // Transform coordinates from GeoJSON format to latitude/longitude for frontend
    const transformedLands = lands.map(land => {
      const landObj = land.toObject ? land.toObject() : land;
      if (landObj.location?.coordinates?.coordinates) {
        const [lng, lat] = landObj.location.coordinates.coordinates;
        landObj.location.coordinates = { latitude: lat, longitude: lng };
      }
      return landObj;
    });

    res.status(200).json({
      success: true,
      data: transformedLands,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting land listings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search lands by various criteria
export const searchLands = async (req, res) => {
  try {
    const { q } = req.query;
    const searchRegex = new RegExp(q, 'i');

    const lands = await Land.find({
      $or: [
        { standNumber: searchRegex },
        { titleDeedNumber: searchRegex },
        { 'location.address.street': searchRegex },
        { 'location.address.suburb': searchRegex }
      ],
      'verification.isVerified': true,
      'transaction.status': 'AVAILABLE'
    })
      .populate('owner', 'firstName lastName email')
      .limit(50);

    res.status(200).json({
      success: true,
      data: lands
    });
  } catch (error) {
    console.error('Error searching lands:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get specific land by ID with role-based field stripping
export const getLandById = async (req, res) => {
  try {
    const { landId } = req.params;

    const land = await Land.findById(landId)
      .populate('owner', 'firstName lastName email phoneNumber verification.isVerified verification.sellerDetailsApproved')
      .populate('verification.verifiedBy', 'firstName lastName')
      .populate('fraudFlags.reportedBy', 'firstName lastName');

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // Buyer can only see VERIFIED listings
    if (req.user.role === 'BUYER' && land.verification?.status !== 'VERIFIED') {
      return res.status(403).json({
        success: false,
        message: 'This land is not verified yet'
      });
    }

    // Convert to plain object for manipulation
    const landObj = land.toObject();
    const userRole = req.user.role;
    const userId = req.user._id.toString();
    const isOwner = land.owner?._id?.toString() === userId;

    // Transform coordinates from GeoJSON format to latitude/longitude for frontend
    if (landObj.location?.coordinates?.coordinates) {
      const [lng, lat] = landObj.location.coordinates.coordinates;
      landObj.location.coordinates = { latitude: lat, longitude: lng };
    }

    // ── ROLE-BASED FIELD STRIPPING ──────────────────────────────────────
    if (userRole === 'BUYER') {
      // Check if buyer has completed transaction
      const completedTx = await Transaction.findOne({
        land: landId,
        buyer: req.user._id,
        'transactionDetails.status': 'COMPLETED'
      });

      if (!completedTx) {
        // Strip documents and fraud flags from buyers without completed transaction
        delete landObj.verification.verificationDocuments;
        delete landObj.fraudFlags;
      }

      // Always strip owner sensitive fields
      if (landObj.owner) {
        delete landObj.owner.nationalId;
        delete landObj.owner.kycDocs;
      }
    } else if (userRole === 'SELLER') {
      if (!isOwner) {
        // Non-owner sellers cannot see documents or fraud flags
        delete landObj.verification.verificationDocuments;
        delete landObj.fraudFlags;
      }
      // Strip other owner's sensitive info
      if (landObj.owner && !isOwner) {
        delete landObj.owner.nationalId;
        delete landObj.owner.kycDocs;
      }
    } else if (['VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER', 'SYSTEM_ADMIN'].includes(userRole)) {
      // Officers/admins get full access to documents and fraud flags
      // But still strip owner national ID to avoid KYC exposure (separate interface for KYC review)
      if (landObj.owner) {
        delete landObj.owner.nationalId;
        delete landObj.owner.kycDocs;
      }
    }

    res.status(200).json({
      success: true,
      data: landObj
    });
  } catch (error) {
    console.error('Error getting land by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update land listing
export const updateLandListing = async (req, res) => {
  try {
    const { landId } = req.params;
    const updates = req.body;

    const land = await Land.findById(landId);

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // Check if user owns this land or is admin/municipal officer
    if (land.owner.toString() !== req.user.id && req.user.role === 'SELLER') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own land listings'
      });
    }

    // Lifecycle guard: sellers can only edit draft, pending_verification, or rejected listings
    const editableStatuses = ['draft', 'pending_verification', 'rejected'];
    if (req.user.role === 'SELLER' && !editableStatuses.includes(land.listingStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a ${land.listingStatus} listing. To modify a verified listing, request a new revision.`
      });
    }

    // Update land details
    Object.keys(updates).forEach(key => {
      if (key === 'transaction') {
        Object.assign(land.transaction, updates[key]);
      } else if (key === 'landDetails') {
        Object.assign(land.landDetails, updates[key]);
      } else {
        land[key] = updates[key];
      }
    });

    await land.save();

    res.status(200).json({
      success: true,
      message: 'Land listing updated successfully',
      data: land
    });
  } catch (error) {
    console.error('Error updating land listing:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Withdraw land listing (soft delete)
export const deleteLandListing = async (req, res) => {
  try {
    const { landId } = req.params;
    const land = await Land.findById(landId);
    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }
    // Check if user owns this land or is admin/municipal officer
    if (land.owner.toString() !== req.user.id && req.user.role === 'SELLER') {
      return res.status(403).json({
        success: false,
        message: 'You can only withdraw your own land listings'
      });
    }

    // Soft delete: mark as withdrawn instead of hard delete
    land.listingStatus = 'withdrawn';
    land.isActive = false;
    land.withdrawnAt = new Date();
    await land.save();

    res.status(200).json({
      success: true,
      message: 'Land listing withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing land listing:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Mark land listing as sold
export const markLandAsSold = async (req, res) => {
  try {
    const { landId } = req.params;
    const land = await Land.findById(landId);

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // Check ownership
    if (land.owner.toString() !== req.user.id && req.user.role === 'SELLER') {
      return res.status(403).json({
        success: false,
        message: 'You can only mark your own listings as sold'
      });
    }

    // Update listing status
    land.listingStatus = 'sold';
    land.isActive = false;
    land.soldAt = new Date();
    land.transaction.status = 'SOLD';
    await land.save();

    res.status(200).json({
      success: true,
      message: 'Land listing marked as sold',
      data: land
    });
  } catch (error) {
    console.error('Error marking land as sold:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create a new revision of a verified listing for editing
export const createListingRevision = async (req, res) => {
  try {
    const { landId } = req.params;
    const updates = req.body;

    const originalListing = await Land.findById(landId);

    if (!originalListing) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // Check ownership
    if (originalListing.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only create revisions for your own listings'
      });
    }

    // Only allow revisions for verified listings
    if (originalListing.listingStatus !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Revisions can only be created for verified listings'
      });
    }

    // Create new listing with incremented version
    const newListing = new Land({
      standNumber: originalListing.standNumber,
      titleDeedNumber: originalListing.titleDeedNumber,
      owner: originalListing.owner,
      location: originalListing.location,
      landDetails: originalListing.landDetails,
      transaction: {
        status: 'AVAILABLE',
        listedPrice: updates.transaction?.listedPrice || originalListing.transaction.listedPrice
      },
      verification: {
        status: 'PENDING_VERIFICATION',
        isVerified: false
      },
      gpsProof: originalListing.gpsProof,
      fraudFlags: [],
      listingStatus: 'pending_verification',
      isActive: true,
      version: (originalListing.version || 1) + 1,
      parentListingId: originalListing._id
    });

    // Apply updates
    if (updates.landDetails) {
      Object.assign(newListing.landDetails, updates.landDetails);
    }

    await newListing.save();

    res.status(201).json({
      success: true,
      message: 'New listing revision created successfully. It will need re-verification.',
      data: newListing
    });
  } catch (error) {
    console.error('Error creating listing revision:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify land ownership
export const verifyLandOwnership = async (req, res) => {
  try {
    const { landId } = req.params;
    const { verificationStatus, verificationNotes } = req.body;

    const land = await Land.findById(landId).populate('owner');

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // --- DUPLICATE REJECTION PROTECTION: Cannot override duplicates ---
    if (verificationStatus === 'VERIFIED' && land.verification?.autoVerification?.isDuplicateRejection) {
      return res.status(403).json({
        success: false,
        message: 'Cannot Approve Duplicate: This listing was auto-rejected for being a duplicate stand number. It cannot be approved.',
        details: `Duplicate detected: Stand ${land.standNumber} is already listed in the system.`
      });
    }

    // Get the verification score (0-100)
    const verificationScore = land.verification?.autoVerification?.verificationScore || 0;

    // --- ANTI-BRIBERY & OVERRIDE PROTECTION ---
    // If trying to approve a low-score listing, a reason is MANDATORY for all roles (Officer/Admin)
    if (verificationStatus === 'VERIFIED' && verificationScore < 70) {
      if (!verificationNotes || verificationNotes.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Reason Required: A verification score below 70% requires a mandatory explanation/justification for the audit trail.',
          details: `Current Score: ${verificationScore}%`
        });
      }

      // Log the override to audit trail for accountability
      console.warn(`[AUDIT] Verification Override by ${req.user.role} (${req.user.id}) for land ${land._id}. Score: ${verificationScore}%. Reason: ${verificationNotes}`);
    }

    const deedsOfficeResult = await verifyDeedsOffice(land.titleDeedNumber);
    const municipalResult = await verifyMunicipalRecords(land.standNumber);

    land.verification.status = verificationStatus; // VERIFIED, REJECTED, SUSPENDED
    land.verification.isVerified = verificationStatus === 'VERIFIED';
    land.verification.verifiedBy = req.user.id;
    land.verification.verificationDate = new Date();
    land.verification.deedsOfficeVerified = deedsOfficeResult.verified;
    land.verification.municipalVerified = municipalResult.verified;

    if (verificationStatus === 'VERIFIED') {
      // RESIDENTIAL-ONLY SYSTEM: Block commercial and non-residential zoning
      if (land.landDetails?.zoning !== 'RESIDENTIAL') {
        return res.status(400).json({
          success: false,
          message: 'This system only accepts RESIDENTIAL properties',
          details: `Stand zoning is ${land.landDetails?.zoning}. Only RESIDENTIAL stands can be verified.`
        });
      }

      land.listingStatus = 'verified';
      land.transaction.status = 'AVAILABLE';
      land.isPublic = true; // Ensure verified stands are visible to the public

      // Notify land owner
      createNotification(land.owner._id, 'LAND_VERIFIED', {
        landId: land._id,
        standNumber: land.standNumber,
        verifiedBy: req.user.id
      });
    } else if (verificationStatus === 'REJECTED') {
      land.listingStatus = 'rejected';
      land.transaction.status = 'FLAGGED';

      // Notify land owner about rejection
      createNotification(land.owner._id, 'LAND_VERIFICATION_REJECTED', {
        landId: land._id,
        standNumber: land.standNumber,
        notes: verificationNotes
      });
    }

    await land.save();

    res.status(200).json({
      success: true,
      message: `Land ${verificationStatus.toLowerCase()} successfully`,
      data: land
    });
  } catch (error) {
    console.error('Error verifying land ownership:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get verification status
export const getVerificationStatus = async (req, res) => {
  try {
    const { landId } = req.params;

    const land = await Land.findById(landId)
      .select('verification standNumber titleDeedNumber transaction.status')
      .populate('verification.verifiedBy', 'firstName lastName');

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    res.status(200).json({
      success: true,
      data: land.verification
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};



// Flag land as suspicious (user-reported flag)
export const flagLandAsSuspicious = async (req, res) => {
  try {
    const { landId } = req.params;
    const { flagType, description, evidence } = req.body;

    const land = await Land.findById(landId);

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    // Get the flagging user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Flag abuse prevention guards

    // 1. Check permanent flagging ban
    if (user.flagging?.permanentBan) {
      return res.status(403).json({
        success: false,
        message: 'Your flagging privileges have been permanently revoked due to repeated false reports.'
      });
    }

    // 2. Check temporary flagging ban
    if (user.flagging?.bannedUntil && user.flagging.bannedUntil > Date.now()) {
      return res.status(403).json({
        success: false,
        message: `Your flagging privileges are suspended until ${user.flagging.bannedUntil.toDateString()} due to false reports.`
      });
    }

    // 3. Cannot flag own listing
    if (land.owner.toString() === req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot flag your own listing.'
      });
    }

    // 4. Check duplicate flag guard - user already flagged this land with PENDING status
    const alreadyFlagged = land.fraudFlags.some(f =>
      f.reportedBy?.toString() === req.user.id.toString() && f.status === 'PENDING'
    );
    if (alreadyFlagged) {
      return res.status(409).json({
        success: false,
        message: 'You have already flagged this listing. Your report is under review.'
      });
    }

    // 5. Check 24-hour rate limit - max 3 flags per user per 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentFlags = user.flagging?.flagHistory?.filter(f => f.flaggedAt > oneDayAgo) || [];
    if (recentFlags.length >= 3) {
      return res.status(429).json({
        success: false,
        message: 'You have reached the daily limit of 3 flag reports. Please try again tomorrow.'
      });
    }

    // 6. Evidence required for FAKE_DOCUMENTS
    if (flagType === 'FAKE_DOCUMENTS' && !evidence) {
      return res.status(400).json({
        success: false,
        message: 'Evidence is required when flagging for fake documents.'
      });
    }

    // Add fraud flag with evidence and user attribution
    land.fraudFlags.push({
      flagType,
      reportedBy: req.user.id,
      reportedAt: new Date(),
      description,
      evidence: evidence || null,
      triggeredBySystem: false,
      status: 'PENDING'
    });

    // Update transaction status if needed
    if (land.transaction.status === 'AVAILABLE') {
      land.transaction.status = 'FLAGGED';
    }

    await land.save();

    // Update user's flagging record
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'flagging.totalSubmitted': 1 },
      $push: { 'flagging.flagHistory': { landId: land._id, flaggedAt: new Date() } }
    });

    // Notify relevant officers
    const targetRoles = ['MUNICIPAL_OFFICER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'];
    const officers = await User.find({
      role: { $in: targetRoles },
      'activity.accountStatus': 'ACTIVE'
    });

    officers.forEach(officer => {
      createNotification(officer._id, 'SUSPICIOUS_ACTIVITY', {
        landId: land._id,
        standNumber: land.standNumber,
        flagType,
        reportedBy: req.user.id
      });
    });

    res.status(200).json({
      success: true,
      message: 'Land flagged successfully. Municipal officers have been notified.',
      data: land
    });
  } catch (error) {
    console.error('Error flagging land:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Resolve a fraud flag (for officers/admin)
export const resolveFraudFlag = async (req, res) => {
  try {
    const { landId, flagIndex } = req.params;
    const { resolution } = req.body;

    const land = await Land.findById(landId);
    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land not found'
      });
    }

    const flagIdx = parseInt(flagIndex);
    if (isNaN(flagIdx) || flagIdx < 0 || flagIdx >= land.fraudFlags.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flag index'
      });
    }

    const flag = land.fraudFlags[flagIdx];
    const reporterId = flag.reportedBy;

    // Update flag status
    flag.status = resolution;
    await land.save();

    // If FALSE_ALARM, process user strikes
    if (resolution === 'FALSE_ALARM' && reporterId) {
      const reporter = await User.findById(reporterId);
      if (reporter) {
        // Increment false flag count
        reporter.flagging.falseFlagCount = (reporter.flagging.falseFlagCount || 0) + 1;

        // Check if 3 false flags = 1 strike
        if (reporter.flagging.falseFlagCount >= 3) {
          reporter.flagging.falseFlagCount = 0;
          reporter.flagging.strikeCount = (reporter.flagging.strikeCount || 0) + 1;

          const strikeCount = reporter.flagging.strikeCount;

          if (strikeCount === 1) {
            // Strike 1: ban for 7 days
            reporter.flagging.bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            // Send notification about strike
            createNotification(reporterId, 'FLAG_ABUSE_WARNING', {
              strikeCount: 1,
              banDays: 7,
              message: 'You have received your first warning for submitting false land flags. Your flagging privileges have been suspended for 7 days.'
            });
          } else if (strikeCount === 2) {
            // Strike 2: ban for 30 days
            reporter.flagging.bannedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            createNotification(reporterId, 'FLAG_ABUSE_WARNING', {
              strikeCount: 2,
              banDays: 30,
              message: 'You have received your second warning for submitting false land flags. Your flagging privileges have been suspended for 30 days.'
            });
          } else if (strikeCount >= 3) {
            // Strike 3+: permanent ban and account suspension
            reporter.flagging.permanentBan = true;
            reporter.activity.accountStatus = 'SUSPENDED';
            createNotification(reporterId, 'FLAG_ABUSE_PERMANENT_BAN', {
              message: 'Your account has been suspended due to repeated submission of false land flags. Your flagging privileges have been permanently revoked.'
            });
          }
        }

        await reporter.save();
      }
    }

    // Check if all flags are now resolved, and if so, revert FLAGGED status if no VALID flags
    const hasValidFlag = land.fraudFlags.some(f => f.status === 'VALID');
    if (!hasValidFlag && land.fraudFlags.every(f => ['VALID', 'FALSE_ALARM'].includes(f.status))) {
      if (land.transaction.status === 'FLAGGED') {
        land.transaction.status = 'AVAILABLE';
        await land.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Flag marked as ${resolution}${resolution === 'FALSE_ALARM' ? ' and reporter consequences applied.' : '.'}`,
      data: land
    });
  } catch (error) {
    console.error('Error resolving fraud flag:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload land documents
export const uploadLandDocuments = async (req, res) => {
  try {
    const { landId } = req.params;
    const land = await Land.findById(landId);

    if (!land) {
      return res.status(404).json({
        success: false,
        message: 'Land listing not found'
      });
    }

    // Handle files from upload.fields() which returns an object with field names as keys
    const files = [];
    if (req.files) {
      if (req.files.titleDeed) files.push(...req.files.titleDeed);
      if (req.files.documents) files.push(...req.files.documents);
      if (req.files.images) files.push(...req.files.images);
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No documents or images provided'
      });
    }

    const uploadedDocs = [];
    const uploadedImages = [];

    // Process images separately
    if (req.files.images) {
      for (const file of req.files.images) {
        try {
          const fileUrl = await uploadToFirebase(file, `land-images/${landId}/img-${Date.now()}`);
          uploadedImages.push(fileUrl);
          console.log(`✅ Image uploaded: ${fileUrl}`);
        } catch (uploadErr) {
          console.error(`Failed to upload land image ${file.originalname}:`, uploadErr);
        }
      }
    }

    // Process documents (titleDeed + documents fields)
    const docFiles = [...(req.files.titleDeed || []), ...(req.files.documents || [])];
    for (const file of docFiles) {
      // Determine document type from fieldname or originalname
      let documentType = 'TITLE_DEED'; // Default
      const name = file.originalname.toUpperCase();
      if (name.includes('SURVEY')) documentType = 'SURVEY_PLAN';
      else if (name.includes('RATES')) documentType = 'RATES_CLEARANCE';
      else if (name.includes('ZONING')) documentType = 'ZONING_CERTIFICATE';

      try {
        const fileUrl = await uploadToFirebase(file, `land-documents/${landId}/${documentType}-${Date.now()}`);
        uploadedDocs.push({
          documentType,
          documentUrl: fileUrl,
          uploadedAt: new Date()
        });
        console.log(`✅ Document uploaded: ${fileUrl}`);
      } catch (uploadErr) {
        console.error(`Failed to upload land document ${file.originalname}:`, uploadErr);
      }
    }

    // Add new docs to existing ones
    if (!land.verification.verificationDocuments) {
      land.verification.verificationDocuments = [];
    }
    land.verification.verificationDocuments.push(...uploadedDocs);

    // Add new images
    if (uploadedImages.length > 0) {
      if (!land.images) land.images = [];
      land.images.push(...uploadedImages);
    }

    await land.save();

    res.status(200).json({
      success: true,
      message: `${uploadedDocs.length} documents and ${uploadedImages.length} images uploaded successfully`,
      data: {
        documentsCount: uploadedDocs.length,
        imagesCount: uploadedImages.length,
        documents: uploadedDocs,
        images: uploadedImages
      }
    });
  } catch (error) {
    console.error('Error uploading land documents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during document upload'
    });
  }
};

// Get land analytics
export const getLandAnalytics = async (req, res) => {
  try {
    const analytics = await Promise.all([
      // Total lands
      Land.countDocuments(),

      // Verified lands
      Land.countDocuments({ 'verification.status': { $in: ['VERIFIED', 'AUTO_VERIFIED'] } }),
      
      // Pending verifications
      Land.countDocuments({ 'verification.status': { $in: ['PENDING_VERIFICATION', 'REQUIRES_REVIEW'] } }),
      
      // Suspended/Flagged lands
      Land.countDocuments({ 'verification.status': { $in: ['SUSPENDED', 'SUSPICIOUS'] } }),

      // Lands by suburb
      Land.aggregate([
        { $group: { _id: '$location.address.suburb', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Lands by zoning
      Land.aggregate([
        { $group: { _id: '$landDetails.zoning', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Transaction status distribution
      Land.aggregate([
        { $group: { _id: '$transaction.status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Fraud flags distribution
      Land.aggregate([
        { $unwind: '$fraudFlags' },
        { $group: { _id: '$fraudFlags.flagType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Recent listings (last 30 days)
      Land.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    const [
      totalLands,
      verifiedLands,
      pendingVerifications,
      suspendedLands,
      landsBySuburb,
      landsByZoning,
      transactionStatuses,
      fraudFlags,
      recentListingsCount
    ] = analytics;

    res.status(200).json({
      success: true,
      data: {
        totalLands,
        verifiedLands,
        pendingVerifications,
        suspendedLands,
        verificationRate: totalLands > 0 ? (verifiedLands / totalLands * 100).toFixed(2) : 0,
        landsBySuburb,
        landsByZoning,
        transactionStatuses,
        fraudFlags,
        recentListingsCount,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error getting land analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
