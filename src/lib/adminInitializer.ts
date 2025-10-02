import { FirebaseAuthService } from './firebaseAuth';
import { FirestoreService } from './firestore';
import { User, UserRole } from '@/types/models';

/**
 * Service to ensure admin user always exists
 */
export class AdminInitializerService {
  private static readonly ADMIN_EMAIL = 'admin@kioskoinmobiliario.com';
  private static readonly ADMIN_NAME = 'Administrador Kiosko';
  private static readonly ADMIN_PHONE = '+57 (300) 123-4567';
  
  /**
   * Check if admin user exists and create if necessary
   * This should be called during app initialization
   */
  static async ensureAdminExists(): Promise<void> {
    try {
      console.log('🔍 Verificando existencia del administrador...');
      
      // Check if admin user exists in Firestore
      const adminUsers = await FirestoreService.getUsersByRole('admin');
      const adminExists = adminUsers.some(user => user.email === this.ADMIN_EMAIL);
      
      if (adminExists) {
        console.log('✅ Usuario administrador ya existe');
        return;
      }
      
      console.log('⚠️  Usuario administrador no encontrado');
      console.log('ℹ️  Para crear el usuario administrador:');
      console.log(`   1. Crea manualmente el usuario ${this.ADMIN_EMAIL} en Firebase Console`);
      console.log('   2. O ejecuta el script: node scripts/setup-demo-users.js');
      console.log('   3. O usa la función de Cloud Function initializeAdmin');
      
    } catch (error) {
      console.error('❌ Error verificando administrador:', error);
      // Don't throw error to avoid breaking app initialization
    }
  }
  
  /**
   * Get admin user information
   */
  static getAdminInfo(): {
    email: string;
    name: string;
    phone: string;
    role: UserRole;
  } {
    return {
      email: this.ADMIN_EMAIL,
      name: this.ADMIN_NAME,
      phone: this.ADMIN_PHONE,
      role: UserRole.ADMIN
    };
  }
  
  /**
   * Check if current user is the main admin
   */
  static async isMainAdmin(userEmail: string): Promise<boolean> {
    return userEmail === this.ADMIN_EMAIL;
  }
  
  /**
   * Initialize admin user data in Firestore (for use with Cloud Functions)
   */
  static async initializeAdminInFirestore(uid: string): Promise<User> {
    try {
      const adminData = {
        uid,
        email: this.ADMIN_EMAIL,
        name: this.ADMIN_NAME,
        phone: this.ADMIN_PHONE,
        role: UserRole.ADMIN,
        isActive: true
      };
      
      const adminId = await FirestoreService.createUser(adminData);
      
      return {
        id: adminId,
        ...adminData,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      };
    } catch (error) {
      console.error('Error initializing admin in Firestore:', error);
      throw error;
    }
  }
  
  /**
   * Validate admin credentials format
   */
  static validateAdminCredentials(email: string, password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (!email || email !== this.ADMIN_EMAIL) {
      errors.push('Email de administrador inválido');
    }
    
    if (!password || password.length < 8) {
      errors.push('La contraseña del administrador debe tener al menos 8 caracteres');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get setup instructions for admin user
   */
  static getSetupInstructions(): string[] {
    return [
      '🔧 Configuración del Administrador:',
      '',
      '1. Opción A - Firebase Console:',
      '   • Ve a Firebase Console > Authentication',
      '   • Crea un usuario con email: admin@kioskoinmobiliario.com',
      '   • Establece una contraseña segura',
      '   • Usa Cloud Function para asignar rol de admin',
      '',
      '2. Opción B - Script automatizado:',
      '   • Descarga la clave de servicio de Firebase',
      '   • Guárdala como serviceAccountKey.json',
      '   • Ejecuta: node scripts/setup-demo-users.js',
      '',
      '3. Opción C - Cloud Function:',
      '   • Despliega las Cloud Functions',
      '   • Llama a initializeAdmin con el secret correcto',
      '',
      '⚠️  Importante: Cambia la contraseña después del primer login'
    ];
  }
}

export default AdminInitializerService;