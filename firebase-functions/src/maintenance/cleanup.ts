/**
 * Data Cleanup Functions
 * Handles cleanup of orphaned data and maintenance tasks
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import {
    CleanupRequest,
    CleanupResponse,
    CallableRequest,
} from "../types";
import { requireAdmin } from "../utils/validation";
import { logInfo, logError } from "../utils/logger";

/**
 * Finds and cleans up orphaned documents
 * Documents that reference non-existent properties or owners
 */
const cleanupOrphanedDocuments = async (dryRun: boolean = false): Promise<{ processed: number; deleted: number; errors: string[] }> => {
    const firestore = getFirestore();
    const errors: string[] = [];
    let processed = 0;
    let deleted = 0;

    try {
        // Get all documents
        const documentsSnapshot = await firestore.collection("documents").get();
        processed = documentsSnapshot.size;

        const batch = firestore.batch();
        const documentsToDelete: string[] = [];

        for (const docSnapshot of documentsSnapshot.docs) {
            const docData = docSnapshot.data();
            let shouldDelete = false;

            // Check if property exists
            if (docData.propertyId) {
                try {
                    const propertyDoc = await firestore.collection("properties").doc(docData.propertyId).get();
                    if (!propertyDoc.exists) {
                        shouldDelete = true;
                        errors.push(`Document ${docSnapshot.id} references non-existent property ${docData.propertyId}`);
                    }
                } catch (error) {
                    errors.push(`Error checking property ${docData.propertyId} for document ${docSnapshot.id}`);
                }
            }

            // Check if owner exists
            if (docData.ownerId && !shouldDelete) {
                try {
                    const ownerDoc = await firestore.collection("users").doc(docData.ownerId).get();
                    if (!ownerDoc.exists) {
                        shouldDelete = true;
                        errors.push(`Document ${docSnapshot.id} references non-existent owner ${docData.ownerId}`);
                    }
                } catch (error) {
                    errors.push(`Error checking owner ${docData.ownerId} for document ${docSnapshot.id}`);
                }
            }

            // Check if marked for cleanup and cleanup date has passed
            if (docData.markedForCleanup && docData.cleanupDate) {
                const cleanupDate = docData.cleanupDate.toDate();
                const now = new Date();
                const daysSinceCleanup = (now.getTime() - cleanupDate.getTime()) / (1000 * 60 * 60 * 24);

                if (daysSinceCleanup > 30) { // 30 days grace period
                    shouldDelete = true;
                }
            }

            if (shouldDelete) {
                documentsToDelete.push(docSnapshot.id);
                if (!dryRun) {
                    batch.delete(docSnapshot.ref);
                }
                deleted++;
            }
        }

        if (!dryRun && documentsToDelete.length > 0) {
            await batch.commit();
        }

        return { processed, deleted, errors };
    } catch (error) {
        errors.push(`Error during document cleanup: ${(error as Error).message}`);
        return { processed, deleted, errors };
    }
};

/**
 * Finds and cleans up orphaned properties
 * Properties that reference non-existent owners
 */
const cleanupOrphanedProperties = async (dryRun: boolean = false): Promise<{ processed: number; deleted: number; errors: string[] }> => {
    const firestore = getFirestore();
    const errors: string[] = [];
    let processed = 0;
    let deleted = 0;

    try {
        // Get all properties
        const propertiesSnapshot = await firestore.collection("properties").get();
        processed = propertiesSnapshot.size;

        const batch = firestore.batch();
        const propertiesToDelete: string[] = [];

        for (const propSnapshot of propertiesSnapshot.docs) {
            const propData = propSnapshot.data();
            let shouldDelete = false;

            // Check if owner exists (null ownerId means marked for cleanup)
            if (propData.ownerId === null && propData.markedForCleanup) {
                const cleanupDate = propData.cleanupDate?.toDate();
                if (cleanupDate) {
                    const now = new Date();
                    const daysSinceCleanup = (now.getTime() - cleanupDate.getTime()) / (1000 * 60 * 60 * 24);

                    if (daysSinceCleanup > 30) { // 30 days grace period
                        shouldDelete = true;
                    }
                }
            } else if (propData.ownerId) {
                try {
                    const ownerDoc = await firestore.collection("users").doc(propData.ownerId).get();
                    if (!ownerDoc.exists) {
                        shouldDelete = true;
                        errors.push(`Property ${propSnapshot.id} references non-existent owner ${propData.ownerId}`);
                    }
                } catch (error) {
                    errors.push(`Error checking owner ${propData.ownerId} for property ${propSnapshot.id}`);
                }
            }

            if (shouldDelete) {
                propertiesToDelete.push(propSnapshot.id);
                if (!dryRun) {
                    batch.delete(propSnapshot.ref);
                }
                deleted++;
            }
        }

        if (!dryRun && propertiesToDelete.length > 0) {
            await batch.commit();
        }

        return { processed, deleted, errors };
    } catch (error) {
        errors.push(`Error during property cleanup: ${(error as Error).message}`);
        return { processed, deleted, errors };
    }
};

/**
 * Cloud Function for cleaning up orphaned data
 * Only admins can call this function
 */
export const cleanupOrphanedData = onCall<CleanupRequest>(
    async (request: CallableRequest<CleanupRequest>): Promise<CleanupResponse> => {
        const context = { functionName: "cleanupOrphanedData", userId: request.auth?.uid };

        try {
            // Require admin role
            requireAdmin(request.auth);

            const { type, dryRun = false } = request.data;

            if (!type) {
                throw new HttpsError("invalid-argument", "Cleanup type is required");
            }

            let totalProcessed = 0;
            let totalDeleted = 0;
            const allErrors: string[] = [];

            logInfo(`Starting cleanup operation: ${type} (dryRun: ${dryRun})`, context);

            switch (type) {
                case "orphaned_documents": {
                    const result = await cleanupOrphanedDocuments(dryRun);
                    totalProcessed += result.processed;
                    totalDeleted += result.deleted;
                    allErrors.push(...result.errors);
                    break;
                }
                case "orphaned_properties": {
                    const result = await cleanupOrphanedProperties(dryRun);
                    totalProcessed += result.processed;
                    totalDeleted += result.deleted;
                    allErrors.push(...result.errors);
                    break;
                }
                case "all": {
                    const docResult = await cleanupOrphanedDocuments(dryRun);
                    const propResult = await cleanupOrphanedProperties(dryRun);
                    totalProcessed += docResult.processed + propResult.processed;
                    totalDeleted += docResult.deleted + propResult.deleted;
                    allErrors.push(...docResult.errors, ...propResult.errors);
                    break;
                }
                default:
                    throw new HttpsError("invalid-argument", "Invalid cleanup type");
            }

            logInfo(`Cleanup operation completed: ${type}`, {
                ...context,
                processed: totalProcessed,
                deleted: totalDeleted,
                errorCount: allErrors.length,
                dryRun,
            });

            return {
                success: true,
                itemsProcessed: totalProcessed,
                itemsDeleted: totalDeleted,
                errors: allErrors.length > 0 ? allErrors : undefined,
            };

        } catch (error) {
            if (error instanceof HttpsError) {
                throw error;
            }
            logError("Error in cleanup operation", error as Error, context);
            throw new HttpsError("internal", "Cleanup operation failed");
        }
    }
);