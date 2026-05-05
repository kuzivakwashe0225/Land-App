import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { verifyToken } from '../server/utils/verifyUser.js';
import User from '../server/models/user-model.js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

async function runTest() {
    console.log("--- Starting Middleware Verification Test ---");

    // Mock Request, Response, and Next
    const req = {
        cookies: {
            access_token: jwt.sign({ id: '65e1a2b3c4d5e6f7a8b9c0d1' }, process.env.JWT_SECRET_KEY || 'testsecret')
        }
    };
    const res = {
        status: (code) => ({
            json: (data) => {
                console.error(`Response Error ${code}:`, data);
                return data;
            }
        })
    };
    const next = (err) => {
        if (err) {
            console.error("Next called with error:", err.message);
        } else {
            console.log("Success: Next called without error");
            console.log("Resulting req.user:", JSON.stringify(req.user, null, 2));
            if (req.user && req.user.role) {
                console.log("✅ VERIFICATION PASSED: req.user.role is populated.");
            } else {
                console.log("❌ VERIFICATION FAILED: req.user.role is missing.");
            }
        }
    };

    try {
        // We need a DB connection or a mock for User.findById
        // For this quick check, I'll attempt a real connection if MONGODB_URI is available
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log("Connected to MongoDB for testing.");

            // Note: This requires a user with the specific ID to exist, 
            // or we need to find ANY user and use their ID.
            const anyUser = await User.findOne();
            if (anyUser) {
                console.log(`Using real user for test: ${anyUser.email} (${anyUser.role})`);
                req.cookies.access_token = jwt.sign({ id: anyUser._id }, process.env.JWT_SECRET_KEY);
                await verifyToken(req, res, next);
            } else {
                console.log("No users found in database to test with.");
            }

            await mongoose.disconnect();
        } else {
            console.log("MONGODB_URI not found, skipping real DB test.");
        }
    } catch (error) {
        console.error("Test execution error:", error);
    } finally {
        process.exit();
    }
}

runTest();
