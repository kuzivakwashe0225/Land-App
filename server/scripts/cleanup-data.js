import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanupData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB.');

        const Land = mongoose.model('Land', new mongoose.Schema({}, { strict: false }));
        
        console.log('🧹 Synchronizing isPublic flag for verified stands...');
        
        const result = await Land.updateMany(
            { 
                'verification.status': { $in: ['VERIFIED', 'AUTO_VERIFIED'] },
                $or: [{ isPublic: { $ne: true } }, { isPublic: { $exists: false } }]
            },
            { $set: { isPublic: true } }
        );

        console.log(`✅ Updated ${result.modifiedCount} stands to be public.`);

        console.log('🧹 Ensuring isVerified boolean matches status...');
        const result2 = await Land.updateMany(
            { 'verification.status': { $in: ['VERIFIED', 'AUTO_VERIFIED'] } },
            { $set: { 'verification.isVerified': true } }
        );
        console.log(`✅ Verified boolean updated for ${result2.modifiedCount} stands.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
};

cleanupData();
