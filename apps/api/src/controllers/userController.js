const User = require('../models/User'); // Assuming a User model exists based on context
const bcrypt = require('bcryptjs');

// Existing functions (placeholder for context)
// ...

/**
 * GET /api/users/settings
 * Returns a comprehensive, static overview of the user's account state.
 * Includes: Profile, Notifications, Security, and Billing/Payouts.
 */
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user data with necessary fields
    const user = await User.findById(userId).select(
      'username email isVerified profileVisibility notificationPreferences securitySettings billingSettings'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Construct the actionable settings object
    const settings = {
      account: {
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        profileVisibility: user.profileVisibility || 'public', // Default to public if not set
        joinedDate: user.createdAt,
      },
      notifications: {
        emailAlerts: user.notificationPreferences?.emailAlerts ?? true,
        pushNotifications: user.notificationPreferences?.pushNotifications ?? true,
        jobAlerts: user.notificationPreferences?.jobAlerts ?? false,
        marketingEmails: user.notificationPreferences?.marketingEmails ?? false,
      },
      security: {
        twoFactorEnabled: user.securitySettings?.twoFactorEnabled ?? false,
        lastPasswordChange: user.securitySettings?.lastPasswordChange || null,
        activeSessions: user.securitySettings?.activeSessionsCount || 1,
        loginHistory: user.securitySettings?.loginHistory || [],
      },
      billing: {
        currentPlan: user.billingSettings?.currentPlan || 'free',
        paymentMethodLast4: user.billingSettings?.paymentMethodLast4 || null,
        payoutMethod: user.billingSettings?.payoutMethod || 'bank_transfer',
        payoutStatus: user.billingSettings?.payoutStatus || 'active',
      },
    };

    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return res.status(500).json({ message: 'Internal server error while fetching settings' });
  }
};

// Ensure other existing exports remain intact
// exports.getProfile = ...
// exports.updateProfile = ...