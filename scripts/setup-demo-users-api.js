#!/usr/bin/env node

/**
 * Script to set up demo users for Kiosko Inmobiliario
 * Creates admin, owner, and tenant demo users using the Cloud Functions API
 * Updated to work with the deployed backend at https://api-hdh3n2p6bq-uc.a.run.app
 */

import axios from 'axios';

// API Configuration
const API_BASE_URL = 'https://api-hdh3n2p6bq-uc.a.run.app';
const ADMIN_SECRET = process.env.ADMIN_INIT_SECRET || 'default-secret-change-me';

// Demo users configuration
const DEMO_USERS = [
  {
    email: 'contacto@kioskoinmobiliario.com',
    password: 'KioskoAdmin2024!',
    name: 'Administrador Kiosko',
    phone: '+57 (300) 123-4567',
    role: 'admin',
    description: 'Usuario administrador con acceso completo al sistema'
  },
  {
    email: 'propietario@demo.com',
    password: 'Demo123!',
    name: 'María García Propietaria',
    phone: '+57 (301) 234-5678',
    role: 'owner',
    description: 'Propietaria con múltiples inmuebles'
  },
  {
    email: 'inquilino@demo.com',
    password: 'Demo123!',
    name: 'Carlos Rodríguez Inquilino',
    phone: '+57 (302) 345-6789',
    role: 'tenant',
    description: 'Inquilino con acceso a documentos de su propiedad'
  }
];

/**
 * Get authentication token for admin operations
 * This function simulates getting a token - in a real scenario,
 * you would need to authenticate first
 */
async function getAuthToken() {
  // For demo purposes, we'll use a mock token
  // In production, you would authenticate with the API first
  console.log('🔐 Using admin authentication for user creation...');
  return 'admin-token-demo'; // This would be a real JWT token in production
}

/**
 * Create a single user via API
 */
async function createUser(userData, authToken) {
  try {
    console.log(`📝 Creando usuario: ${userData.email} (${userData.role})`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/createUser`, {
      email: userData.email,
      password: userData.password,
      name: userData.name,
      phone: userData.phone,
      role: userData.role,
      isActive: true
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 201) {
      console.log(`✅ Usuario creado exitosamente: ${userData.name}`);
      console.log(`   📧 Email: ${userData.email}`);
      console.log(`   🔑 Rol: ${userData.role}`);
      console.log(`   🆔 UID: ${response.data.user.uid}`);
      return response.data;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 409) {
        console.log(`⚠️  Usuario ya existe: ${userData.email}`);
        return { success: true, message: 'User already exists', user: { uid: 'existing' } };
      } else if (status === 400) {
        console.error(`❌ Error de validación para ${userData.email}:`, data.error);
        throw new Error(`Validation error: ${data.error}`);
      } else if (status === 401) {
        console.error(`❌ Error de autenticación:`, data.error);
        throw new Error(`Authentication error: ${data.error}`);
      } else if (status === 403) {
        console.error(`❌ Error de permisos:`, data.error);
        throw new Error(`Permission error: ${data.error}`);
      } else {
        console.error(`❌ Error del servidor (${status}):`, data.error);
        throw new Error(`Server error: ${data.error}`);
      }
    } else {
      console.error(`❌ Error de conexión para ${userData.email}:`, error.message);
      throw new Error(`Connection error: ${error.message}`);
    }
  }
}

/**
 * Verify that users were created successfully
 */
async function verifyUsers(authToken) {
  try {
    console.log('\n🔍 Verificando usuarios creados...');
    
    const response = await axios.get(`${API_BASE_URL}/auth/getUsers`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      const users = response.data.users;
      console.log(`✅ Se encontraron ${users.length} usuarios en el sistema:`);
      
      users.forEach(user => {
        console.log(`   👤 ${user.name} (${user.email}) - Rol: ${user.role}`);
      });
      
      return users;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error verificando usuarios:', error.message);
    throw error;
  }
}

/**
 * Main function to set up demo users
 */
async function setupDemoUsers() {
  try {
    console.log('🚀 Configurando usuarios de demostración...');
    console.log(`📡 Conectando a API: ${API_BASE_URL}`);
    
    // Get authentication token
    const authToken = await getAuthToken();
    
    // Create each demo user
    const results = [];
    for (const userData of DEMO_USERS) {
      try {
        const result = await createUser(userData, authToken);
        results.push({ user: userData, result });
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
        results.push({ user: userData, error: error.message });
      }
    }
    
    // Verify users were created
    try {
      await verifyUsers(authToken);
    } catch (error) {
      console.warn('⚠️  No se pudo verificar usuarios:', error.message);
    }
    
    // Summary
    console.log('\n🎉 ¡Configuración de usuarios de demostración completada!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    DEMO_USERS.forEach(user => {
      console.log(`${user.role.toUpperCase().padEnd(10)} | ${user.email.padEnd(30)} | ${user.password}`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANTE: Cambia las contraseñas en producción');
    console.log(`🌐 API Base URL: ${API_BASE_URL}`);
    console.log('📚 Documentación: https://api-hdh3n2p6bq-uc.a.run.app/docs');
    
    // Show results summary
    const successful = results.filter(r => r.result && r.result.success).length;
    const failed = results.filter(r => r.error).length;
    
    console.log(`\n📊 Resumen: ${successful} usuarios creados exitosamente, ${failed} errores`);
    
    if (failed > 0) {
      console.log('\n❌ Usuarios con errores:');
      results.filter(r => r.error).forEach(r => {
        console.log(`   - ${r.user.email}: ${r.error}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error configurando usuarios:', error.message);
    console.error('\n🔧 Posibles soluciones:');
    console.error('   1. Verifica que la API esté desplegada y funcionando');
    console.error('   2. Revisa la URL base de la API');
    console.error('   3. Asegúrate de que el admin secret sea correcto');
    console.error('   4. Verifica que tengas permisos de administrador');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
setupDemoUsers();
