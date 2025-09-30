/**
 * User Lifecycle Triggers
 * Handles user creation and deletion events for audit logging
 */

import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import { UserCreateData, UserDeleteData } from "../types";
import { logInfo, logError } from "../utils/logger";

/**
 * Trigger when a user document is created
 * Logs user creation for audit purposes
 */
export const onUserCreated = onDocumentCreated(
  "users/{userId}",
  async (event) => {
    const context = { functionName: "onUserCreated", userId: event.params.userId };
    
    try {
      const userData = event.data?.data() as UserCreateData;
      
      if (!userData) {
        logError("No user data found in created document", new Error("Missing user data"), context);
        return;
      }

      // Create audit log entry
      const auditLog = {
        action: "user_created",
        userId: event.params.userId,
        userEmail: userData.email,
        displayName: userData.displayName || "",
        role: userData.customClaims?.role || "tenant",
        timestamp: new Date(),
        metadata: {
          source: "firestore_trigger",
          documentPath: event.document,
        },
      };

      // Store audit log
      await getFirestore()
        .collection("audit_logs")
        .add(auditLog);

      logInfo(`User created audit log recorded for ${userData.email}`, {
        ...context,
        email: userData.email,
        role: userData.customClaims?.role,
      });

    } catch (error) {
      logError("Error processing user creation trigger", error as Error, context);
    }
  }
);

/**
 * Trigger when a user document is deleted
 * Logs user deletion and initiates cleanup
 */
export const onUserDeleted = onDocumentDeleted(
  "users/{userId}",
  async (event) => {
    const context = { functionName: "onUserDeleted", userId: event.params.userId };
    
    try {
      const userData = event.data?.data() as UserDeleteData;
      
      if (!userData) {
        logError("No user data found in deleted document", new Error("Missing user data"), context);
        return;
      }

      const firestore = getFirestore();

      // Create audit log entry
      const auditLog = {
        action: "user_deleted",
        userId: event.params.userId,
        userEmail: userData.email,
        timestamp: new Date(),
        metadata: {
          source: "firestore_trigger",
          documentPath: event.document,
        },
      };

      // Store audit log
      await firestore.collection("audit_logs").add(auditLog);

      // Clean up related data
      const batch = firestore.batch();

      // Find and mark properties for cleanup (don't delete immediately to allow for data recovery)
      const propertiesSnapshot = await firestore
        .collection("properties")
        .where("ownerId", "==", event.params.userId)
        .get();

      propertiesSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          ownerId: null,
          deletedOwner: userData.email,
          markedForCleanup: true,
          cleanupDate: new Date(),
        });
      });

      // Find and mark documents for cleanup
      const documentsSnapshot = await firestore
        .collection("documents")
        .where("ownerId", "==", event.params.userId)
        .get();

      documentsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          ownerId: null,
          deletedOwner: userData.email,
          markedForCleanup: true,
          cleanupDate: new Date(),
        });
      });

      await batch.commit();

      logInfo(`User deletion processed and cleanup initiated for ${userData.email}`, {
        ...context,
        email: userData.email,
        propertiesAffected: propertiesSnapshot.size,
        documentsAffected: documentsSnapshot.size,
      });

    } catch (error) {
      logError("Error processing user deletion trigger", error as Error, context);
    }
  }
);