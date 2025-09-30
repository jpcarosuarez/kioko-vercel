/**
 * Notification Service
 * Business logic for sending notifications
 */

import { HttpsError } from "firebase-functions/v2/https";
import { logInfo, logError } from "../utils/logger";

export class NotificationService {
  /**
   * Send email notification
   */
  static async sendEmailNotification(
    to: string,
    subject: string,
    body?: string,
    template?: string,
    context?: { uid?: string }
  ): Promise<{ success: boolean; message: string; messageId: string }> {
    const functionContext = { functionName: "sendEmailNotification", userId: context?.uid };
    
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        throw new HttpsError("invalid-argument", "Invalid email address format");
      }

      // Validate content
      if (!body && !template) {
        throw new HttpsError("invalid-argument", "Either body or template must be provided");
      }

      // Simulate email sending
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Here you would integrate with your email service (SendGrid, Mailgun, etc.)
      // For now, we'll just simulate success
      
      logInfo(`Email notification sent`, { 
        ...functionContext, 
        to,
        subject,
        messageId,
        hasBody: !!body,
        template
      });

      return {
        success: true,
        message: "Email sent successfully",
        messageId
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error sending email notification", error as Error, functionContext);
      throw new HttpsError("internal", "Failed to send email notification");
    }
  }
}