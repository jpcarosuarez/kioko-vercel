/**
 * Backup and Data Integrity Functions
 * Handles data backup and integrity checks
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import {
  BackupRequest,
  BackupResponse,
  CallableRequest,
} from "../types";
import { requireAdmin } from "../utils/validation";
import { logInfo, logError } from "../utils/logger";

/**
 * Creates a backup of specified collections
 * Stores backup data in a dedicated backup collection
 */
const createBackup = async (collections: string[], includeSubcollections: boolean = false): Promise<{ backupId: string; timestamp: string; collections: string[] }> => {
  const firestore = getFirestore();
  const timestamp = new Date().toISOString();
  const backupId = `backup_${Date.now()}`;
  
  const backupData: any = {
    id: backupId,
    timestamp,
    collections: collections,
    includeSubcollections,
    status: "in_progress",
    createdAt: new Date(),
  };

  // Create backup metadata document
  await firestore.collection("backups").doc(backupId).set(backupData);

  try {
    // Backup each collection
    for (const collectionName of collections) {
      const collectionSnapshot = await firestore.collection(collectionName).get();
      const documents: any[] = [];

      for (const doc of collectionSnapshot.docs) {
        const docData: any = {
          id: doc.id,
          data: doc.data(),
          path: doc.ref.path,
        };

        // Include subcollections if requested
        if (includeSubcollections) {
          const subcollections = await doc.ref.listCollections();
          docData.subcollections = {};

          for (const subcollection of subcollections) {
            const subSnapshot = await subcollection.get();
            docData.subcollections[subcollection.id] = subSnapshot.docs.map(subDoc => ({
              id: subDoc.id,
              data: subDoc.data(),
              path: subDoc.ref.path,
            }));
          }
        }

        documents.push(docData);
      }

      // Store collection backup
      await firestore
        .collection("backups")
        .doc(backupId)
        .collection("data")
        .doc(collectionName)
        .set({
          collection: collectionName,
          documentCount: documents.length,
          documents,
          backedUpAt: new Date(),
        });
    }

    // Update backup status to completed
    await firestore.collection("backups").doc(backupId).update({
      status: "completed",
      completedAt: new Date(),
    });

    return { backupId, timestamp, collections };
  } catch (error) {
    // Update backup status to failed
    await firestore.collection("backups").doc(backupId).update({
      status: "failed",
      error: (error as Error).message,
      failedAt: new Date(),
    });
    throw error;
  }
};

/**
 * Performs data integrity checks
 * Validates relationships between collections
 */
const performIntegrityCheck = async (): Promise<{ issues: string[]; summary: any }> => {
  const firestore = getFirestore();
  const issues: string[] = [];
  const summary = {
    usersChecked: 0,
    propertiesChecked: 0,
    documentsChecked: 0,
    issuesFound: 0,
  };

  try {
    // Check user data integrity
    const usersSnapshot = await firestore.collection("users").get();
    summary.usersChecked = usersSnapshot.size;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Check required fields
      if (!userData.email) {
        issues.push(`User ${userDoc.id} missing email`);
      }
      if (!userData.name) {
        issues.push(`User ${userDoc.id} missing name`);
      }
      if (!userData.role || !["admin", "owner", "tenant"].includes(userData.role)) {
        issues.push(`User ${userDoc.id} has invalid role: ${userData.role}`);
      }
    }

    // Check property data integrity
    const propertiesSnapshot = await firestore.collection("properties").get();
    summary.propertiesChecked = propertiesSnapshot.size;

    for (const propertyDoc of propertiesSnapshot.docs) {
      const propertyData = propertyDoc.data();
      
      // Check required fields
      if (!propertyData.address) {
        issues.push(`Property ${propertyDoc.id} missing address`);
      }
      if (!propertyData.type || !["residential", "commercial"].includes(propertyData.type)) {
        issues.push(`Property ${propertyDoc.id} has invalid type: ${propertyData.type}`);
      }
      
      // Check owner reference
      if (propertyData.ownerId) {
        const ownerDoc = await firestore.collection("users").doc(propertyData.ownerId).get();
        if (!ownerDoc.exists) {
          issues.push(`Property ${propertyDoc.id} references non-existent owner ${propertyData.ownerId}`);
        }
      }
    }

    // Check document data integrity
    const documentsSnapshot = await firestore.collection("documents").get();
    summary.documentsChecked = documentsSnapshot.size;

    for (const documentDoc of documentsSnapshot.docs) {
      const documentData = documentDoc.data();
      
      // Check required fields
      if (!documentData.name) {
        issues.push(`Document ${documentDoc.id} missing name`);
      }
      if (!documentData.driveFileId) {
        issues.push(`Document ${documentDoc.id} missing driveFileId`);
      }
      
      // Check property reference
      if (documentData.propertyId) {
        const propertyDoc = await firestore.collection("properties").doc(documentData.propertyId).get();
        if (!propertyDoc.exists) {
          issues.push(`Document ${documentDoc.id} references non-existent property ${documentData.propertyId}`);
        }
      }
      
      // Check owner reference
      if (documentData.ownerId) {
        const ownerDoc = await firestore.collection("users").doc(documentData.ownerId).get();
        if (!ownerDoc.exists) {
          issues.push(`Document ${documentDoc.id} references non-existent owner ${documentData.ownerId}`);
        }
      }
    }

    summary.issuesFound = issues.length;
    return { issues, summary };
  } catch (error) {
    issues.push(`Error during integrity check: ${(error as Error).message}`);
    summary.issuesFound = issues.length;
    return { issues, summary };
  }
};

/**
 * Cloud Function for creating data backups
 * Only admins can call this function
 */
export const createDataBackup = onCall<BackupRequest>(
  async (request: CallableRequest<BackupRequest>): Promise<BackupResponse> => {
    const context = { functionName: "createDataBackup", userId: request.auth?.uid };
    
    try {
      // Require admin role
      requireAdmin(request.auth);

      const { collections, includeSubcollections = false } = request.data;

      if (!collections || collections.length === 0) {
        throw new HttpsError("invalid-argument", "Collections array is required");
      }

      // Validate collection names
      const validCollections = ["users", "properties", "documents", "audit_logs"];
      const invalidCollections = collections.filter(col => !validCollections.includes(col));
      
      if (invalidCollections.length > 0) {
        throw new HttpsError("invalid-argument", `Invalid collections: ${invalidCollections.join(", ")}`);
      }

      logInfo(`Starting backup creation for collections: ${collections.join(", ")}`, {
        ...context,
        collections,
        includeSubcollections,
      });

      const result = await createBackup(collections, includeSubcollections);

      logInfo(`Backup created successfully: ${result.backupId}`, {
        ...context,
        backupId: result.backupId,
        collections: result.collections,
      });

      return {
        success: true,
        backupId: result.backupId,
        timestamp: result.timestamp,
        collections: result.collections,
      };

    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error creating backup", error as Error, context);
      throw new HttpsError("internal", "Backup creation failed");
    }
  }
);

/**
 * Cloud Function for data integrity checks
 * Only admins can call this function
 */
export const checkDataIntegrity = onCall(
  async (request: CallableRequest<{}>): Promise<{ issues: string[]; summary: any }> => {
    const context = { functionName: "checkDataIntegrity", userId: request.auth?.uid };
    
    try {
      // Require admin role
      requireAdmin(request.auth);

      logInfo("Starting data integrity check", context);

      const result = await performIntegrityCheck();

      logInfo(`Data integrity check completed`, {
        ...context,
        issuesFound: result.issues.length,
        summary: result.summary,
      });

      return result;

    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error during integrity check", error as Error, context);
      throw new HttpsError("internal", "Data integrity check failed");
    }
  }
);