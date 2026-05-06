import { errorHandler } from "../utils/error.js";
import bcryptjs from "bcryptjs";
import User from "../models/user-model.js";
import Land from "../models/landModel.js";

export const test = (req, res) => {
  res.send("Hello World!");
};

export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can only update your own account"));
  }
  try {
    let hashedPassword;
    if (req.body.password) {
      hashedPassword = bcryptjs.hashSync(req.body.password, 10);
    }

    const updateFields = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      nationalId: req.body.nationalId,
    };
    if (hashedPassword) {
      updateFields["authentication.password"] = hashedPassword;
    }
    if (req.body.profilePicture) {
      updateFields["profile.profilePicture"] = req.body.profilePicture;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateFields,
      },
      { new: true }
    );

    const rest = updatedUser.toObject();
    if (rest.authentication) {
      delete rest.authentication.password;
    }

    res.status(200).json({
      rest,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can delete only your Account"));
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie("access_token");
    res.status(200).json({
      success: true,
      message: "User deleted Successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getUserListings = async (req, res, next) => {
  if (req.user.id === req.params.id) {
    try {
      const listings = await Land.find({ owner: req.params.id });
      res.status(200).json({
        success: true,
        listings,
      });
    } catch (error) {
      console.log(
        "We are inside getUserListings handler inside user-controller.js and error occured inside catch block"
      );
      next(error);
    }
  } else {
    next(errorHandler(401, "You can only view your own listings!"));
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return next(errorHandler(404, "User not found!"));

    const rest = user.toObject();
    if (rest.authentication) delete rest.authentication.password;

    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

import { uploadToFirebase } from "../utils/fileUpload.js";

export const submitKYC = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No documents uploaded. Please provide all three required documents." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Parse docTypes sent from frontend (JSON string array)
    let docTypes = [];
    try {
      docTypes = req.body.docTypes ? JSON.parse(req.body.docTypes) : [];
    } catch (_) { docTypes = []; }

    const validDocTypes = ['NATIONAL_ID', 'PROOF_OF_ADDRESS', 'ID_WITH_SELFIE', 'SELFIE'];
    const uploadedDocs = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // Prefer the explicitly-sent docType, fall back to filename detection
      let docType = docTypes[i];
      if (!docType || !validDocTypes.includes(docType)) {
        const name = file.originalname.toUpperCase();
        if (name.includes('SELFIE') || name.includes('FACE')) docType = 'ID_WITH_SELFIE';
        else if (name.includes('NATIONAL') || name.includes('ID')) docType = 'NATIONAL_ID';
        else if (name.includes('ADDRESS') || name.includes('RESIDENCE') || name.includes('PROOF')) docType = 'PROOF_OF_ADDRESS';
        else docType = 'NATIONAL_ID'; // Default
      }

      try {
        const fileUrl = await uploadToFirebase(file, `kyc-documents/${user._id}/${docType}-${Date.now()}`);
        uploadedDocs.push({
          documentType: docType,
          documentUrl: fileUrl,
          status: 'PENDING',
          uploadedAt: new Date()
        });
      } catch (uploadErr) {
        console.error(`Failed to save file ${file.originalname}:`, uploadErr.message);
        return res.status(500).json({
          success: false,
          message: `Failed to save document "${file.originalname}". Please try again.`
        });
      }
    }

    user.verification.kycDocs = uploadedDocs;
    user.verification.kycStatus = 'PENDING';
    user.markModified('verification');

    try {
      await user.save();
    } catch (saveError) {
      console.error('User save error during KYC submission:', saveError);
      return res.status(400).json({
        success: false,
        message: saveError.message || "Failed to save your verification status. Please check your profile details (Phone, ID) are valid."
      });
    }

    res.status(200).json({
      success: true,
      message: "KYC documents submitted successfully. Our team will review and respond within 24 hours."
    });
  } catch (error) {
    console.error('submitKYC error:', error);
    next(error);
  }
};

export const submitSellerDetailsVerification = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No documents uploaded. Please provide all three required documents." });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Parse docTypes sent from frontend (JSON string array)
    let docTypes = [];
    try {
      docTypes = req.body.docTypes ? JSON.parse(req.body.docTypes) : [];
    } catch (_) { docTypes = []; }

    const validDocTypes = ['NATIONAL_ID', 'PROOF_OF_ADDRESS', 'ID_WITH_SELFIE', 'SELFIE'];
    const uploadedDocs = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      let docType = docTypes[i];
      if (!docType || !validDocTypes.includes(docType)) {
        const name = file.originalname.toUpperCase();
        if (name.includes('SELFIE') || name.includes('FACE')) docType = 'ID_WITH_SELFIE';
        else if (name.includes('NATIONAL') || name.includes('ID')) docType = 'NATIONAL_ID';
        else if (name.includes('ADDRESS') || name.includes('RESIDENCE') || name.includes('PROOF')) docType = 'PROOF_OF_ADDRESS';
        else docType = 'NATIONAL_ID';
      }

      try {
        const fileUrl = await uploadToFirebase(file, `seller-verification-documents/${user._id}/${docType}-${Date.now()}`);
        uploadedDocs.push({
          documentType: docType,
          documentUrl: fileUrl,
          status: 'PENDING',
          uploadedAt: new Date()
        });
      } catch (uploadErr) {
        console.error(`Failed to save file ${file.originalname}:`, uploadErr.message);
        return res.status(500).json({
          success: false,
          message: `Failed to save document "${file.originalname}". Please try again.`
        });
      }
    }

    user.verification.kycDocs = uploadedDocs;
    user.verification.kycStatus = 'PENDING'; // Required for officer review
    user.verification.sellerDetailsApproved = false; // Cannot be auto-approved
    user.verification.sellerDetailsSubmittedAt = new Date();
    user.markModified('verification');

    try {
      await user.save();
    } catch (saveError) {
      console.error('User save error during seller details verification:', saveError);
      return res.status(400).json({
        success: false,
        message: saveError.message || "Failed to save your verification status. Please try again."
      });
    }
    res.status(200).json({
      success: true,
      message: "Your personal details have been verified! Your listings will now appear as verified to buyers."
    });
  } catch (error) {
    console.error('submitSellerDetailsVerification error:', error);
    next(error);
  }
};

export const getPendingKYC = async (req, res, next) => {
  try {
    if (req.user.role !== 'SYSTEM_ADMIN' && req.user.role !== 'VERIFICATION_OFFICER') {
      return next(errorHandler(403, "Forbidden - Unauthorized role"));
    }
    const pendingUsers = await User.find({ "verification.kycStatus": "PENDING" }).select("-authentication");
    res.status(200).json({
      success: true,
      data: pendingUsers
    });
  } catch (error) {
    next(error);
  }
};

export const verifyKYC = async (req, res, next) => {
  try {
    if (req.user.role !== 'SYSTEM_ADMIN' && req.user.role !== 'VERIFICATION_OFFICER') {
      return next(errorHandler(403, "Forbidden - Unauthorized role"));
    }
    const { userId, status, adminNotes } = req.body;
    const user = await User.findById(userId);
    if (!user) return next(errorHandler(404, "User not found"));

    user.verification.kycStatus = status; // APPROVED or REJECTED
    user.verification.isVerified = status === 'APPROVED';
    user.verification.verifiedBy = req.user.id;
    user.verification.verificationDate = new Date();

    // Also update doc statuses if provided
    if (user.verification.kycDocs) {
      user.verification.kycDocs.forEach(doc => {
        doc.status = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
      });
    }

    await user.save();
    res.status(200).json({
      success: true,
      message: `KYC status updated to ${status}`
    });
  } catch (error) {
    next(error);
  }
};
