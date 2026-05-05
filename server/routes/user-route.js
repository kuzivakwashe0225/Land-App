import express from "express";
import {
  test,
  updateUser,
  deleteUser,
  getUserListings,
  getUser,
  submitKYC,
  getPendingKYC,
  verifyKYC,
  submitSellerDetailsVerification,
} from "../controllers/user-controller.js";
import { verifyToken } from "../utils/verifyUser.js";
import { uploadDocuments } from "../middlewares/upload-middleware.js";
const router = express.Router();

router.get("/test", test);
router.post("/update/:id", verifyToken, updateUser);
router.delete("/delete/:id", verifyToken, deleteUser);
// router.route("/listings/:id").get(verifyToken, getUserListings);
router.get("/listings/:id", verifyToken, getUserListings);
router.post("/kyc/submit", verifyToken, uploadDocuments, submitKYC);
router.get("/kyc/pending", verifyToken, getPendingKYC);
router.post("/kyc/verify", verifyToken, verifyKYC);
router.post("/verify-seller-details/submit", verifyToken, uploadDocuments, submitSellerDetailsVerification);
router.get("/:id", verifyToken, getUser);

export default router;
