#!/usr/bin/env node

/**
 * Authentication helper for admin operations
 * This script helps authenticate and get tokens for admin operations
 */

import axios from 'axios';

const API_BASE_URL = 'https://api-hdh3n2p6bq-uc.a.run.app';

/**
 * Initialize admin user and get authentication token
 */
async function initializeAdminAndGetToken() {
  try {
    console.log('🔐 Inicializando administrador...');
    
    // First, we need to create an admin user in Firebase Auth
    // This would typically be done through the Firebase Console or CLI
    console.log('⚠️  IMPORTANTE: Para usar este script, necesitas:');
    console.log('   1. Crear un usuario admin en Firebase Auth Console');
    console.log('   2. Obtener un token de autenticación válido');
    console.log('   3. Configurar el ADMIN_INIT_SECRET en las variables de entorno');
    
    // Example of how to initialize admin (requires existing user)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kioskoinmobiliario.com';
    const adminSecret = process.env.ADMIN_INIT_SECRET || 'default-secret-change-me';
    
    console.log(`📧 Email del admin: ${adminEmail}`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/initializeAdmin`, {
        email: adminEmail,
        adminSecret: adminSecret
      });
      
      if (response.status === 200) {
        console.log('✅ Admin inicializado exitosamente');
        console.log(`🆔 UID del admin: ${response.data.uid}`);
        return response.data;
      }
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('⚠️  Admin secret incorrecto o usuario no encontrado');
        console.log('💡 Asegúrate de:');
        console.log('   - Crear el usuario en Firebase Auth Console');
        console.log('   - Configurar ADMIN_INIT_SECRET en las variables de entorno');
        console.log('   - Usar el email correcto del usuario admin');
      } else {
        console.error('❌ Error inicializando admin:', error.response?.data || error.message);
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error en autenticación:', error.message);
    throw error;
  }
}

/**
 * Get system status to verify API is working
 */
async function checkApiStatus() {
  try {
    console.log('🔍 Verificando estado de la API...');
    
    // Try to access the docs endpoint
    const response = await axios.get(`${API_BASE_URL}/docs`);
    
    if (response.status === 200) {
      console.log('✅ API está funcionando correctamente');
      console.log(`📚 Documentación disponible en: ${API_BASE_URL}/docs`);
      return true;
    }
  } catch (error) {
    console.error('❌ API no disponible:', error.message);
    console.log('💡 Verifica que:');
    console.log('   - La API esté desplegada');
    console.log('   - La URL sea correcta');
    console.log('   - No haya problemas de conectividad');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Verificando configuración de administrador...');
    console.log(`📡 API Base URL: ${API_BASE_URL}`);
    
    // Check API status
    const apiWorking = await checkApiStatus();
    if (!apiWorking) {
      process.exit(1);
    }
    
    // Initialize admin
    await initializeAdminAndGetToken();
    
    console.log('\n✅ Configuración completada');
    console.log('💡 Ahora puedes ejecutar el script de usuarios demo:');
    console.log('   node scripts/setup-demo-users-api.js');
    
  } catch (error) {
    console.error('❌ Error en configuración:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
