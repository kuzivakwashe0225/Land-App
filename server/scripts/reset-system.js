import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const resetSystem = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env');
        }

        console.log('🔄 Connecting to database for system reset...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB.');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        console.log('🗑️  Clearing all system data (Users, Lands, Transactions, Messages, Notifications, Reports, AuditLogs)...');

        // Define models to clear
        const targetCollections = [
            'users', 
            'lands', 
            'transactions', 
            'messages', 
            'notifications', 
            'reports', 
            'auditlogs'
        ];

        for (const name of targetCollections) {
            if (collectionNames.includes(name)) {
                await db.collection(name).deleteMany({});
                console.log(`   - Cleared collection: ${name}`);
            }
        }

        console.log('\n✨ System data cleared successfully!');
        console.log('💡 Note: You will need to sign up again or run the seed scripts.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Reset failed:', error);
        process.exit(1);
    }
};

resetSystem();
