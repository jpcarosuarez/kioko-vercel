/**
 * Centralized API Service
 * Handles all communication with Cloud Functions API
 */

import { auth } from './firebase';

// API Configuration
const API_BASE_URL = '/api';

// Types for API requests and responses
export interface ApiError {
    error: string;
    message: string;
}

export interface SetCustomClaimsRequest {
    uid: string;
    role: 'admin' | 'owner' | 'tenant';
}

export interface SetCustomClaimsResponse {
    success: boolean;
    message: string;
}

export interface UserClaims {
    uid: string;
    email: string;
    customClaims: {
        role?: 'admin' | 'owner' | 'tenant';
    };
}

export interface InitializeAdminRequest {
    email: string;
    adminSecret: string;
}

export interface ValidateDataRequest {
    data: any;
    schema: 'user' | 'document' | 'property' | 'transaction';
}

export interface ValidateDataResponse {
    valid: boolean;
    errors?: string[];
    message: string;
}

export interface CleanupRequest {
    dryRun?: boolean;
}

export interface CleanupResponse {
    success: boolean;
    message: string;
    itemsProcessed: number;
    itemsDeleted: number;
}

export interface BackupRequest {
    collections?: string[];
    destination?: string;
}

export interface BackupResponse {
    success: boolean;
    message: string;
    backupId: string;
    collections: string[];
}

export interface IntegrityResponse {
    success: boolean;
    message: string;
    issues: Array<{
        collection: string;
        issue: string;
        count: number;
    }>;
    collectionsChecked: string[];
}

export interface EmailRequest {
    to: string;
    subject: string;
    body?: string;
    template?: 'welcome' | 'password-reset' | 'document-approved' | 'document-rejected' | 'maintenance-notice';
}

export interface EmailResponse {
    success: boolean;
    message: string;
    messageId: string;
}

export interface BulkEmailRequest {
    recipients: string[];
    subject: string;
    body?: string;
    template?: 'welcome' | 'password-reset' | 'document-approved' | 'document-rejected' | 'maintenance-notice';
}

export interface SystemStatus {
    status: 'operational' | 'degraded' | 'down';
    services: {
        database: 'healthy' | 'degraded' | 'down';
        storage: 'healthy' | 'degraded' | 'down';
        functions: 'healthy' | 'degraded' | 'down';
    };
    lastMaintenance: string;
}

/**
 * Get authentication token for API calls
 */
async function getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    try {
        // Force refresh token to ensure it's valid
        return await user.getIdToken(true);
    } catch (error) {
        console.error('Error getting auth token:', error);
        throw new Error('Failed to get authentication token');
    }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    try {
        const token = await getAuthToken();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData: ApiError = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API request failed for ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Make unauthenticated API request (for public endpoints)
 */
async function publicApiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData: ApiError = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Public API request failed for ${endpoint}:`, error);
        throw error;
    }
}

// API Service Class
export class ApiService {
    // System endpoints
    static async getHealthCheck() {
        return publicApiRequest<{
            status: string;
            message: string;
            timestamp: string;
            version: string;
            documentation: string;
        }>('/');
    }

    // Authentication endpoints
    static async setCustomClaims(request: SetCustomClaimsRequest): Promise<SetCustomClaimsResponse> {
        return apiRequest<SetCustomClaimsResponse>('/auth/setCustomClaims', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    static async getUserClaims(uid?: string): Promise<UserClaims> {
        const queryParam = uid ? `?uid=${encodeURIComponent(uid)}` : '';
        return apiRequest<UserClaims>(`/auth/getUserClaims${queryParam}`);
    }

    static async initializeAdmin(request: InitializeAdminRequest): Promise<SetCustomClaimsResponse & { uid: string }> {
        return publicApiRequest<SetCustomClaimsResponse & { uid: string }>('/auth/initializeAdmin', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    // Validation endpoints
    static async validateData(request: ValidateDataRequest): Promise<ValidateDataResponse> {
        return apiRequest<ValidateDataResponse>('/validation/validateData', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    static async getValidationSchemas(): Promise<{ message: string; schemas: string[] }> {
        return publicApiRequest<{ message: string; schemas: string[] }>('/validation/schemas');
    }

    // Maintenance endpoints (Admin only)
    static async cleanupOrphanedData(request: CleanupRequest = {}): Promise<CleanupResponse> {
        return apiRequest<CleanupResponse>('/maintenance/cleanup', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    static async createDataBackup(request: BackupRequest = {}): Promise<BackupResponse> {
        return apiRequest<BackupResponse>('/maintenance/backup', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    static async checkDataIntegrity(collections?: string[]): Promise<IntegrityResponse> {
        const queryParam = collections ? `?collections=${collections.join(',')}` : '';
        return apiRequest<IntegrityResponse>(`/maintenance/integrity${queryParam}`);
    }

    static async getSystemStatus(): Promise<SystemStatus> {
        return publicApiRequest<SystemStatus>('/maintenance/status');
    }

    // Notification endpoints
    static async sendEmail(request: EmailRequest): Promise<EmailResponse> {
        return apiRequest<EmailResponse>('/notifications/email', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    static async sendBulkEmail(request: BulkEmailRequest): Promise<{
        message: string;
        results: Array<{
            recipient: string;
            status: 'sent' | 'failed';
            result?: EmailResponse;
            error?: string;
        }>;
        summary: {
            total: number;
            sent: number;
            failed: number;
        };
    }> {
        return apiRequest('/notifications/bulk-email', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    static async getEmailTemplates(): Promise<{ message: string; templates: string[] }> {
        return publicApiRequest<{ message: string; templates: string[] }>('/notifications/templates');
    }

    // User Management endpoints
    static async createUser(userData: {
        email: string;
        password: string;
        name: string;
        phone: string;
        role: 'admin' | 'owner' | 'tenant';
        isActive?: boolean;
    }): Promise<{ success: boolean; message: string; user: any }> {
        return apiRequest<{ success: boolean; message: string; user: any }>('/auth/createUser', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    static async updateUser(userId: string, updates: {
        name?: string;
        phone?: string;
        role?: 'admin' | 'owner' | 'tenant';
        isActive?: boolean;
    }): Promise<{ success: boolean; message: string; user: any }> {
        return apiRequest<{ success: boolean; message: string; user: any }>(`/auth/updateUser/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    static async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
        return apiRequest<{ success: boolean; message: string }>('/auth/deleteUser', {
            method: 'DELETE',
            body: JSON.stringify({ uid: userId }),
        });
    }

    static async getUsers(filters?: {
        role?: 'admin' | 'owner' | 'tenant';
        isActive?: boolean;
        search?: string;
    }): Promise<{ success: boolean; users: any[] }> {
        const queryParams = new URLSearchParams();
        if (filters?.role) queryParams.append('role', filters.role);
        if (filters?.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
        if (filters?.search) queryParams.append('search', filters.search);
        
        const queryString = queryParams.toString();
        const endpoint = queryString ? `/auth/getUsers?${queryString}` : '/auth/getUsers';
        
        return apiRequest<{ success: boolean; users: any[] }>(endpoint);
    }

    static async getUserById(userId: string): Promise<{ success: boolean; user: any }> {
        return apiRequest<{ success: boolean; user: any }>(`/auth/getUser/${userId}`);
    }

    static async toggleUserStatus(userId: string): Promise<{ success: boolean; message: string; user: any }> {
        return apiRequest<{ success: boolean; message: string; user: any }>(`/auth/toggleUserStatus/${userId}`, {
            method: 'PUT',
        });
    }

    /**
     * Change user password (Admin only)
     */
    static async changePassword(uid: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await authenticatedApiRequest<{ success: boolean; message: string }>('/auth/changePassword', {
                method: 'POST',
                body: JSON.stringify({
                    uid,
                    newPassword
                })
            });
            return response;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }
}

// Utility functions for common operations
export const apiUtils = {
    /**
     * Check if user has admin role
     */
    async isAdmin(): Promise<boolean> {
        try {
            const claims = await ApiService.getUserClaims();
            return claims.customClaims.role === 'admin';
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    },

    /**
     * Get current user role
     */
    async getCurrentUserRole(): Promise<'admin' | 'owner' | 'tenant' | null> {
        try {
            const claims = await ApiService.getUserClaims();
            return claims.customClaims.role || null;
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    },

    /**
     * Validate user data before submission
     */
    async validateUserData(userData: any): Promise<{ valid: boolean; errors?: string[] }> {
        try {
            const result = await ApiService.validateData({
                data: userData,
                schema: 'user'
            });
            return { valid: result.valid, errors: result.errors };
        } catch (error) {
            console.error('Error validating user data:', error);
            return { valid: false, errors: ['Validation service unavailable'] };
        }
    },

    /**
     * Send welcome email to new user
     */
    async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
        try {
            await ApiService.sendEmail({
                to: email,
                subject: 'Welcome to Kiosko Inmobiliario',
                template: 'welcome'
            });
            return true;
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return false;
        }
    },

    /**
     * Check system health
     */
    async checkSystemHealth(): Promise<boolean> {
        try {
            const health = await ApiService.getHealthCheck();
            return health.status === 'ok';
        } catch (error) {
            console.error('Error checking system health:', error);
            return false;
        }
    }
};