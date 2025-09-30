/**
 * Swagger/OpenAPI Configuration
 * Complete API documentation for Kiosko Inmobiliario Cloud Functions
 */

import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kiosko Inmobiliario API",
      version: "1.0.0",
      description: "Complete API documentation for Kiosko Inmobiliario Document Management System",
      contact: {
        name: "API Support",
        email: "support@kiosko-inmobiliario.com"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: "https://us-central1-kiosko-129e9.cloudfunctions.net/api",
        description: "Production server"
      },
      {
        url: "http://localhost:5001/kiosko-129e9/us-central1/api",
        description: "Local development server"
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Firebase ID Token"
        }
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error type"
            },
            message: {
              type: "string",
              description: "Error message"
            }
          },
          required: ["error", "message"]
        },
        ValidationError: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "Missing required fields"
            },
            required: {
              type: "array",
              items: {
                type: "string"
              },
              example: ["uid", "role"]
            }
          }
        },
        UserClaims: {
          type: "object",
          properties: {
            uid: {
              type: "string",
              description: "User ID"
            },
            email: {
              type: "string",
              format: "email",
              description: "User email"
            },
            customClaims: {
              type: "object",
              properties: {
                role: {
                  type: "string",
                  enum: ["admin", "owner", "tenant"],
                  description: "User role"
                }
              }
            }
          }
        },
        SetCustomClaimsRequest: {
          type: "object",
          properties: {
            uid: {
              type: "string",
              description: "Target user ID"
            },
            role: {
              type: "string",
              enum: ["admin", "owner", "tenant"],
              description: "Role to assign"
            }
          },
          required: ["uid", "role"]
        },
        SetCustomClaimsResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean"
            },
            message: {
              type: "string"
            }
          }
        },
        InitializeAdminRequest: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "Admin user email"
            },
            adminSecret: {
              type: "string",
              description: "Admin initialization secret"
            }
          },
          required: ["email", "adminSecret"]
        },
        ValidateDataRequest: {
          type: "object",
          properties: {
            data: {
              type: "object",
              description: "Data to validate"
            },
            schema: {
              type: "string",
              enum: ["user", "document", "property", "transaction"],
              description: "Validation schema to use"
            }
          },
          required: ["data", "schema"]
        },
        ValidateDataResponse: {
          type: "object",
          properties: {
            valid: {
              type: "boolean"
            },
            errors: {
              type: "array",
              items: {
                type: "string"
              }
            },
            message: {
              type: "string"
            }
          }
        },
        CleanupRequest: {
          type: "object",
          properties: {
            dryRun: {
              type: "boolean",
              default: false,
              description: "If true, only simulate cleanup without deleting data"
            }
          }
        },
        CleanupResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean"
            },
            message: {
              type: "string"
            },
            itemsProcessed: {
              type: "integer"
            },
            itemsDeleted: {
              type: "integer"
            }
          }
        },
        BackupRequest: {
          type: "object",
          properties: {
            collections: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Collections to backup"
            },
            destination: {
              type: "string",
              description: "Backup destination"
            }
          }
        },
        BackupResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean"
            },
            message: {
              type: "string"
            },
            backupId: {
              type: "string"
            },
            collections: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        IntegrityResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean"
            },
            message: {
              type: "string"
            },
            issues: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  collection: {
                    type: "string"
                  },
                  issue: {
                    type: "string"
                  },
                  count: {
                    type: "integer"
                  }
                }
              }
            },
            collectionsChecked: {
              type: "array",
              items: {
                type: "string"
              }
            }
          }
        },
        EmailRequest: {
          type: "object",
          properties: {
            to: {
              type: "string",
              format: "email",
              description: "Recipient email"
            },
            subject: {
              type: "string",
              description: "Email subject"
            },
            body: {
              type: "string",
              description: "Email body (plain text or HTML)"
            },
            template: {
              type: "string",
              enum: ["welcome", "password-reset", "document-approved", "document-rejected", "maintenance-notice"],
              description: "Email template to use"
            }
          },
          required: ["to", "subject"]
        },
        EmailResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean"
            },
            message: {
              type: "string"
            },
            messageId: {
              type: "string"
            }
          }
        },
        BulkEmailRequest: {
          type: "object",
          properties: {
            recipients: {
              type: "array",
              items: {
                type: "string",
                format: "email"
              },
              description: "List of recipient emails"
            },
            subject: {
              type: "string",
              description: "Email subject"
            },
            body: {
              type: "string",
              description: "Email body (plain text or HTML)"
            },
            template: {
              type: "string",
              enum: ["welcome", "password-reset", "document-approved", "document-rejected", "maintenance-notice"],
              description: "Email template to use"
            }
          },
          required: ["recipients", "subject"]
        },
        SystemStatus: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["operational", "degraded", "down"]
            },
            services: {
              type: "object",
              properties: {
                database: {
                  type: "string",
                  enum: ["healthy", "degraded", "down"]
                },
                storage: {
                  type: "string",
                  enum: ["healthy", "degraded", "down"]
                },
                functions: {
                  type: "string",
                  enum: ["healthy", "degraded", "down"]
                }
              }
            },
            lastMaintenance: {
              type: "string",
              format: "date-time"
            }
          }
        }
      }
    },
    tags: [
      {
        name: "System",
        description: "System health and information endpoints"
      },
      {
        name: "Authentication",
        description: "User authentication and authorization management"
      },
      {
        name: "Validation",
        description: "Data validation services"
      },
      {
        name: "Maintenance",
        description: "System maintenance and backup operations (Admin only)"
      },
      {
        name: "Notifications",
        description: "Email and notification services"
      }
    ],
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: [
    "./src/routes/*.ts", // Path to the API files
  ],
};

export const specs = swaggerJsdoc(options);