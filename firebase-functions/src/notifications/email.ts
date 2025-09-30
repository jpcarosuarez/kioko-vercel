/**
 * Email Notification Functions
 * Handles email notifications for user management events
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  EmailNotificationRequest,
  EmailNotificationResponse,
  CallableRequest,
} from "../types";
import { requireAdmin, isValidEmail } from "../utils/validation";
import { logInfo, logError } from "../utils/logger";

/**
 * Email templates for different notification types
 */
const emailTemplates = {
  user_created: {
    subject: "Welcome to Kiosko Inmobiliario",
    template: (data: any) => `
      <h2>Welcome to Kiosko Inmobiliario Document Management System</h2>
      <p>Hello ${data.name},</p>
      <p>Your account has been created successfully with the following details:</p>
      <ul>
        <li><strong>Email:</strong> ${data.email}</li>
        <li><strong>Role:</strong> ${data.role}</li>
        <li><strong>Created:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>You can now log in to the system using your email and the password provided by your administrator.</p>
      <p>Best regards,<br>Kiosko Inmobiliario Team</p>
    `,
  },
  user_deleted: {
    subject: "Account Deletion Notification",
    template: (data: any) => `
      <h2>Account Deletion Notification</h2>
      <p>Hello ${data.name},</p>
      <p>This is to inform you that your account in the Kiosko Inmobiliario Document Management System has been deleted.</p>
      <p><strong>Account Details:</strong></p>
      <ul>
        <li><strong>Email:</strong> ${data.email}</li>
        <li><strong>Deleted on:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>If you believe this was done in error, please contact your system administrator.</p>
      <p>Best regards,<br>Kiosko Inmobiliario Team</p>
    `,
  },
  role_changed: {
    subject: "Role Update Notification",
    template: (data: any) => `
      <h2>Role Update Notification</h2>
      <p>Hello ${data.name},</p>
      <p>Your role in the Kiosko Inmobiliario Document Management System has been updated.</p>
      <p><strong>Role Change Details:</strong></p>
      <ul>
        <li><strong>Previous Role:</strong> ${data.previousRole}</li>
        <li><strong>New Role:</strong> ${data.newRole}</li>
        <li><strong>Updated on:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>Your access permissions have been updated according to your new role.</p>
      <p>Best regards,<br>Kiosko Inmobiliario Team</p>
    `,
  },
  property_assigned: {
    subject: "Property Assignment Notification",
    template: (data: any) => `
      <h2>Property Assignment Notification</h2>
      <p>Hello ${data.ownerName},</p>
      <p>A property has been assigned to you in the Kiosko Inmobiliario Document Management System.</p>
      <p><strong>Property Details:</strong></p>
      <ul>
        <li><strong>Address:</strong> ${data.address}</li>
        <li><strong>Type:</strong> ${data.type}</li>
        <li><strong>Value:</strong> $${data.value?.toLocaleString()}</li>
        <li><strong>Assigned on:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      <p>You can now view and manage documents for this property in the system.</p>
      <p>Best regards,<br>Kiosko Inmobiliario Team</p>
    `,
  },
};

/**
 * Simulates sending an email (in a real implementation, this would integrate with a service like SendGrid, Mailgun, etc.)
 * For now, we'll log the email content and store it in a collection for tracking
 */
const sendEmail = async (to: string, subject: string, htmlContent: string): Promise<string> => {
  // In a real implementation, you would integrate with an email service here
  // For now, we'll simulate by storing the email in Firestore
  
  const { getFirestore } = await import("firebase-admin/firestore");
  const firestore = getFirestore();
  
  const emailRecord = {
    to,
    subject,
    htmlContent,
    status: "sent", // In real implementation, this would be updated based on actual sending
    sentAt: new Date(),
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  await firestore.collection("email_logs").add(emailRecord);
  
  // Log the email for development purposes
  console.log(`📧 Email would be sent to: ${to}`);
  console.log(`📧 Subject: ${subject}`);
  console.log(`📧 Content: ${htmlContent}`);
  
  return emailRecord.messageId;
};

/**
 * Cloud Function for sending email notifications
 * Only admins can call this function
 */
export const sendEmailNotification = onCall<EmailNotificationRequest>(
  async (request: CallableRequest<EmailNotificationRequest>): Promise<EmailNotificationResponse> => {
    const context = { functionName: "sendEmailNotification", userId: request.auth?.uid };
    
    try {
      // Require admin role
      requireAdmin(request.auth);

      const { type, recipientEmail, data } = request.data;

      if (!type || !recipientEmail || !data) {
        throw new HttpsError("invalid-argument", "Type, recipientEmail, and data are required");
      }

      // Validate email format
      if (!isValidEmail(recipientEmail)) {
        throw new HttpsError("invalid-argument", "Invalid recipient email format");
      }

      // Get email template
      const template = emailTemplates[type];
      if (!template) {
        throw new HttpsError("invalid-argument", `Invalid notification type: ${type}`);
      }

      // Generate email content
      const subject = template.subject;
      const htmlContent = template.template(data);

      logInfo(`Sending ${type} notification to ${recipientEmail}`, {
        ...context,
        type,
        recipientEmail,
      });

      // Send email
      const messageId = await sendEmail(recipientEmail, subject, htmlContent);

      logInfo(`Email notification sent successfully`, {
        ...context,
        type,
        recipientEmail,
        messageId,
      });

      return {
        success: true,
        messageId,
      };

    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error sending email notification", error as Error, context);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
);

/**
 * Helper function to send welcome email for new users
 * Can be called from other functions
 */
export const sendWelcomeEmail = async (userEmail: string, userName: string, userRole: string): Promise<void> => {
  try {
    const template = emailTemplates.user_created;
    const htmlContent = template.template({
      name: userName,
      email: userEmail,
      role: userRole,
    });

    await sendEmail(userEmail, template.subject, htmlContent);
    
    logInfo(`Welcome email sent to new user`, {
      functionName: "sendWelcomeEmail",
      email: userEmail,
      role: userRole,
    });
  } catch (error) {
    logError("Error sending welcome email", error as Error, {
      functionName: "sendWelcomeEmail",
      email: userEmail,
    });
  }
};