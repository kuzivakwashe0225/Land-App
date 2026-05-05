import nodemailer from 'nodemailer';
import User from '../models/user-model.js';
import Notification from '../models/notification-model.js';

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Create notification in database (for in-app notifications)
export const createNotification = async (userId, type, data = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const notificationMessages = {
      'LAND_VERIFIED': {
        title: 'Land Verified',
        message: `Your land listing ${data.standNumber} has been verified with a score of ${data.verificationScore}%`,
        actionUrl: `/lands/${data.landId}`
      },
      'LAND_VERIFICATION_REJECTED': {
        title: 'Land Verification Rejected',
        message: `Your land listing ${data.standNumber} verification was rejected. Reason: ${data.reason || 'See admin notes'}. Score: ${data.score}%`,
        actionUrl: `/lands/${data.landId}`
      },
      'AUTO_REJECTED_LISTING': {
        title: 'Auto-Rejected Listing',
        message: `Land listing ${data.standNumber} by ${data.sellerName} was automatically rejected. ${data.isDuplicate ? '(Duplicate Stand)' : ''} Reason: ${data.reason}. Score: ${data.score}%`,
        actionUrl: `/lands/${data.landId}`
      },
      'FRAUD_REPORT': {
        title: 'Fraud Report Received',
        message: `Fraud report received for land ${data.standNumber}. Type: ${data.fraudType}`,
        actionUrl: `/admin/reports/${data.reportId}`
      },
      'KYC_APPROVED': {
        title: 'KYC Approved',
        message: 'Your Know Your Customer verification has been approved',
        actionUrl: `/profile/verification`
      },
      'KYC_REJECTED': {
        title: 'KYC Rejected',
        message: `Your Know Your Customer verification was rejected. Reason: ${data.reason || 'See admin notes'}`,
        actionUrl: `/profile/verification`
      },
      'LAND_FLAGGED': {
        title: 'Land Flagged',
        message: `Your land listing ${data.standNumber} has been flagged for review`,
        actionUrl: `/lands/${data.landId}`
      },
      'PAYMENT_RECEIVED': {
        title: 'Payment Received',
        message: `Payment received for transaction ${data.transactionId}`,
        actionUrl: `/transactions/${data.transactionId}`
      },
      'VERIFICATION_REQUIRED': {
        title: 'Verification Required',
        message: 'Please complete your identity verification to continue',
        actionUrl: `/profile/verification`
      },
      'SUSPICIOUS_ACTIVITY': {
        title: 'Suspicious Activity Reported',
        message: `Suspicious activity reported for land ${data.standNumber}`,
        actionUrl: `/admin/lands/${data.landId}`
      },
      'NEW_MESSAGE': {
        title: 'New Message',
        message: `You have a new message from ${data.senderName || 'a user'}`,
        actionUrl: `/messages`
      }
    };

    const notificationContent = notificationMessages[type] || {
      title: 'Notification',
      message: 'You have a new notification',
      actionUrl: '/dashboard'
    };

    // Store notification in database (in-app notification)
    const notification = new Notification({
      userId,
      type,
      title: notificationContent.title,
      message: notificationContent.message,
      data,
      actionUrl: notificationContent.actionUrl
    });

    await notification.save();

    // Send email notification if enabled
    if (user.preferences?.notifications?.email) {
      await sendEmailNotification(user.email, notificationContent);
    }

    // Send SMS notification if enabled
    if (user.preferences?.notifications?.sms && user.phoneNumber) {
      await sendSMSNotification(user.phoneNumber, notificationContent);
    }

    // Send push notification if enabled
    if (user.preferences?.notifications?.push) {
      await sendPushNotification(userId, notificationContent);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Send email notification
export const sendEmailNotification = async (email, notification) => {
  try {
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `LandSolutions - ${notification.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">LandSolutions</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Zimbabwe Land Verification Platform</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">${notification.title}</h2>
            <p style="color: #666; line-height: 1.6;">${notification.message}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}${notification.actionUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 25px; display: inline-block; font-weight: bold;">
                View Details
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This is an automated message from LandSolutions.</p>
            <p>If you didn't expect this email, please contact support.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

// Send SMS notification (placeholder - would integrate with SMS service)
export const sendSMSNotification = async (phoneNumber, notification) => {
  try {
    // This would integrate with SMS services like Twilio, Africa's Talking, etc.
    console.log('SMS notification would be sent to:', phoneNumber);
    console.log('Message:', notification.message);

    // Example implementation with Africa's Talking:
    /*
    const africastalking = require('africastalking')({
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME
    });

    await africastalking.SMS.send({
      to: phoneNumber,
      message: `LandSolutions: ${notification.title} - ${notification.message}`,
      from: 'LandSolutions'
    });
    */
  } catch (error) {
    console.error('Error sending SMS notification:', error);
  }
};

// Send push notification (placeholder - would integrate with push service)
export const sendPushNotification = async (userId, notification) => {
  try {
    // This would integrate with push notification services like Firebase Cloud Messaging
    console.log('Push notification would be sent to user:', userId);
    console.log('Notification:', notification);

    // Example implementation with Firebase:
    /*
    const admin = require('firebase-admin');
    
    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        actionUrl: notification.actionUrl
      },
      token: userDeviceToken
    };

    await admin.messaging().send(message);
    */
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// Send bulk notifications to multiple users
export const sendBulkNotifications = async (userIds, type, data) => {
  try {
    const notifications = userIds.map(userId => createNotification(userId, type, data));
    await Promise.all(notifications);
    console.log(`Bulk notifications sent to ${userIds.length} users`);
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
  }
};

// Send notification to all users with specific role
export const sendNotificationToRole = async (role, type, data) => {
  try {
    const users = await User.find({
      role,
      'activity.accountStatus': 'ACTIVE',
      'preferences.notifications.email': true
    });

    const userIds = users.map(user => user._id);
    await sendBulkNotifications(userIds, type, data);
  } catch (error) {
    console.error('Error sending notification to role:', error);
  }
};

// Send email verification link to new users
export const sendVerificationEmail = async (user, token) => {
  try {
    const transporter = createEmailTransporter();
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Verify Your LandSolutions Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Verify Your Email</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">LandSolutions Email Verification</p>
          </div>

          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Welcome, ${user.firstName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for signing up for LandSolutions. To complete your registration and start browsing verified land listings, please verify your email address.
            </p>

            <p style="color: #666; line-height: 1.6;">
              Click the button below to verify your email address. This link expires in <strong>24 hours</strong>.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; padding: 12px 30px; text-decoration: none;
                        border-radius: 25px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>

            <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 15px;">
              If you didn't create this account, please disregard this email.<br>
              If the button doesn't work, copy and paste this link:<br>
              <code style="color: #666; word-break: break-all;">${verificationUrl}</code>
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This is an automated message from LandSolutions.</p>
            <p>Secure • Transparent • Verified</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully to:', user.email);
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};

// Send welcome email to new users
export const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to LandSolutions - Secure Land Transactions in Zimbabwe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to LandSolutions</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Your Gateway to Secure Land Transactions</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Welcome, ${user.firstName}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for joining LandSolutions, Zimbabwe's premier platform for secure and verified land transactions.
            </p>
            
            <h3 style="color: #333; margin-top: 25px;">What's Next?</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>Complete your profile verification</li>
              <li>Browse verified land listings</li>
              <li>Submit your land for verification</li>
              <li>Connect with verified buyers and sellers</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 25px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This is an automated message from LandSolutions.</p>
            <p>Secure • Transparent • Verified</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully');
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createEmailTransporter();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'LandSolutions - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Password Reset</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">LandSolutions Security</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #666; line-height: 1.6;">
              Hi ${user.firstName}, we received a request to reset your password. Click the button below to reset it.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 12px 30px; text-decoration: none; 
                        border-radius: 25px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; text-align: center;">
              This link expires in 1 hour. If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>This is an automated message from LandSolutions.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};
