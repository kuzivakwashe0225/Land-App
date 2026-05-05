import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const clearData = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is missing');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Land = mongoose.model('Land', new mongoose.Schema({}, { strict: false }));
    const AuditLog = mongoose.model('AuditLog', new mongoose.Schema({}, { strict: false }));
    const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));

    const userCount = await User.countDocuments();
    console.log(`Current user count: ${userCount}`);

    // Delete all users except the super admin
    const adminEmail = 'admin@landsolutions.co.zw';
    const deleteUsersResult = await User.deleteMany({ email: { $ne: adminEmail } });
    console.log(`Deleted ${deleteUsersResult.deletedCount} users.`);

    // Delete all land listings
    const deleteLandsResult = await Land.deleteMany({});
    console.log(`Deleted ${deleteLandsResult.deletedCount} land listings.`);

    // Delete all audit logs and notifications for a clean slate
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared audit logs and notifications.');

    console.log('Database cleanup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
};

clearData();
