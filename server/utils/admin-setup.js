import User from '../models/user-model.js';
import bcryptjs from 'bcryptjs';

import fs from 'fs';
import path from 'path';

export const ensureSuperAdmin = async () => {
  const logFile = path.join(process.cwd(), 'admin-setup.log');
  const log = (msg) => fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
  
  try {
    log('Starting super admin check...');
    const adminEmail = 'admin@landsolutions.co.zw';
    const adminPassword = 'AdminPassword123!';
    
    const existingUser = await User.findOne({ email: adminEmail });
    
    if (existingUser) {
      log(`Found existing user: ${adminEmail}`);
      // Ensure it has the correct role and is verified
      if (existingUser.role !== 'SYSTEM_ADMIN' || !existingUser.isEmailVerified) {
        existingUser.role = 'SYSTEM_ADMIN';
        existingUser.isEmailVerified = true;
        await existingUser.save();
        log('Updated existing user to SYSTEM_ADMIN');
      }
      return;
    }

    log(`Creating new super admin: ${adminEmail}`);
    const hashedPassword = bcryptjs.hashSync(adminPassword, 12);

    const superAdmin = new User({
      firstName: 'System',
      lastName: 'Administrator',
      email: adminEmail,
      phoneNumber: '+263999999999',
      nationalId: '99-9999999Z99',
      role: 'SYSTEM_ADMIN',
      isEmailVerified: true,
      authentication: {
        password: hashedPassword
      },
      activity: {
        accountStatus: 'ACTIVE'
      }
    });

    await superAdmin.save();
    log('Super Admin account created successfully');
  } catch (error) {
    log(`ERROR: ${error.message}`);
    console.error('❌ Failed to ensure super admin:', error.message);
  }
};
