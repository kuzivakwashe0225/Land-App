import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB.');

        const Land = mongoose.model('Land', new mongoose.Schema({}, { strict: false }));
        
        const allLands = await Land.find({});
        console.log(`Total Lands: ${allLands.length}`);

        allLands.forEach(l => {
            console.log(`- Stand: ${l.standNumber}, Status: ${l.verification?.status}, isPublic: ${l.isPublic}`);
        });

        const verifiedCount = await Land.countDocuments({ 
            'verification.status': { $in: ['VERIFIED', 'AUTO_VERIFIED'] }, 
            isPublic: true 
        });
        console.log(`Verified count (with isPublic:true): ${verifiedCount}`);

        const verifiedWithoutPublic = await Land.countDocuments({ 
            'verification.status': { $in: ['VERIFIED', 'AUTO_VERIFIED'] }
        });
        console.log(`Verified count (without isPublic check): ${verifiedWithoutPublic}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    }
};

checkData();
