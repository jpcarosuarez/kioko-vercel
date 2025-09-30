/**
 * Validation Service
 * Business logic for data validation
 */

import { HttpsError } from "firebase-functions/v2/https";
import { logInfo, logError } from "../utils/logger";

export class ValidationService {
  /**
   * Validate data against a schema
   */
  static async validateData(
    data: any,
    schema: string,
    context?: { uid?: string }
  ): Promise<{ valid: boolean; errors?: string[]; message: string }> {
    const functionContext = { functionName: "validateData", userId: context?.uid };
    
    try {
      // Basic validation logic - you can expand this
      const errors: string[] = [];
      
      switch (schema) {
        case "user":
          if (!data.email) errors.push("Email is required");
          if (!data.name) errors.push("Name is required");
          break;
          
        case "document":
          if (!data.title) errors.push("Document title is required");
          if (!data.type) errors.push("Document type is required");
          break;
          
        case "property":
          if (!data.address) errors.push("Property address is required");
          if (!data.price) errors.push("Property price is required");
          break;
          
        default:
          throw new HttpsError("invalid-argument", `Unknown schema: ${schema}`);
      }

      const isValid = errors.length === 0;
      
      logInfo(`Data validation completed for schema ${schema}`, { 
        ...functionContext, 
        schema, 
        valid: isValid,
        errorCount: errors.length 
      });

      return {
        valid: isValid,
        errors: errors.length > 0 ? errors : undefined,
        message: isValid ? "Data is valid" : `Validation failed with ${errors.length} errors`
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logError("Error validating data", error as Error, functionContext);
      throw new HttpsError("internal", "Failed to validate data");
    }
  }
}