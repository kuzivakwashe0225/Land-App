import express from "express";
import {
  signup,
  signin,
  google,
  signout,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/auth-controller.js";
const router = express.Router();

router.route("/signup").post(signup);
router.route("/signin").post(signin);
router.route("/google").post(google);
router.route("/signout").get(signout);
router.route("/verify-email/:token").get(verifyEmail);
router.route("/resend-verification").post(resendVerificationEmail);

export default router;
