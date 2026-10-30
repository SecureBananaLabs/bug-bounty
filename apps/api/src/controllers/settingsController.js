import { ok } from "../utils/response.js";

/**
 * Available account settings with descriptions (#2822).
 */
const ACCOUNT_SETTINGS = [
  {
    key: "email_notifications",
    label: "Email Notifications",
    description: "Receive email notifications for new messages and job alerts",
    type: "toggle",
    defaultValue: true,
  },
  {
    key: "two_factor_auth",
    label: "Two-Factor Authentication",
    description: "Add an extra layer of security to your account",
    type: "action",
    actionLabel: "Enable 2FA",
    actionUrl: "/settings/2fa/setup",
  },
  {
    key: "change_password",
    label: "Change Password",
    description: "Update your account password",
    type: "action",
    actionLabel: "Change Password",
    actionUrl: "/settings/password",
  },
  {
    key: "profile_visibility",
    label: "Profile Visibility",
    description: "Control who can see your freelancer profile",
    type: "select",
    options: ["public", "registered_users", "private"],
    defaultValue: "public",
  },
  {
    key: "delete_account",
    label: "Delete Account",
    description: "Permanently delete your account and all associated data. This action cannot be undone.",
    type: "danger",
    actionLabel: "Delete Account",
    actionUrl: "/settings/delete",
  },
];

/**
 * GET /settings
 * Returns actionable account controls for the settings page (#2822).
 */
export async function getSettings(req, res) {
  return ok(res, { controls: ACCOUNT_SETTINGS });
}
