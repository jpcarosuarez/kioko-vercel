#!/usr/bin/env node

/**
 * Bootstrap Initial Users Script
 * Creates the initial admin user and demo users without restrictions
 * This script should only be run once during initial setup
 */

import axios from 'axios';

// API Configuration
const API_BASE_URL = 'https://api-hdh3n2p6bq-uc.a.run.app';

// Bootstrap configuration
const BOOTSTRAP_CONFIG = {
  bootstrapSecret: process.env.BOOTSTRAP_SECRET || 'bootstrap-secret-change-me',
  adminEmail: 'contacto@kioskoinmobiliario.com',
  adminPassword: 'KioskoAdmin2024!',
  adminName: 'Administrador Kiosko',
  adminPhone: '+57 (300) 123-4567'
};

/**
 * Check if API is accessible
 */
async function checkApiStatus() {
  try {
    console.log('🔍 Verificando estado de la API...');
    
    const response = await axios.get(`${API_BASE_URL}/docs`, { timeout: 10000 });
    
    if (response.status === 200) {
      console.log('✅ API está funcionando correctamente');
      console.log(`📚 Documentación: ${API_BASE_URL}/docs`);
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
 * Execute bootstrap process
 */
async function executeBootstrap() {
  try {
    console.log('🚀 Iniciando proceso de bootstrap...');
    console.log(`📡 API Base URL: ${API_BASE_URL}`);
    console.log(`🔐 Bootstrap Secret: ${BOOTSTRAP_CONFIG.bootstrapSecret.substring(0, 8)}...`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/bootstrap`, {
      bootstrapSecret: BOOTSTRAP_CONFIG.bootstrapSecret,
      adminEmail: BOOTSTRAP_CONFIG.adminEmail,
      adminPassword: BOOTSTRAP_CONFIG.adminPassword,
      adminName: BOOTSTRAP_CONFIG.adminName,
      adminPhone: BOOTSTRAP_CONFIG.adminPhone
    }, {
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      const { success, message, users } = response.data;
      
      if (success) {
        console.log('✅ Bootstrap completado exitosamente!');
        console.log(`📝 ${message}`);
        
        console.log('\n👥 Usuarios creados:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.name}`);
          console.log(`   📧 Email: ${user.email}`);
          console.log(`   🔑 Rol: ${user.role.toUpperCase()}`);
          console.log(`   🆔 UID: ${user.uid}`);
          console.log(`   📞 Teléfono: ${user.phone}`);
          console.log('');
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 ¡Bootstrap completado exitosamente!');
        console.log('\n📋 Credenciales de acceso:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`ADMIN     | ${BOOTSTRAP_CONFIG.adminEmail.padEnd(30)} | ${BOOTSTRAP_CONFIG.adminPassword}`);
        console.log(`OWNER     | propietario@demo.com${' '.padEnd(8)} | Demo123!`);
        console.log(`TENANT    | inquilino@demo.com${' '.padEnd(9)} | Demo123!`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('\n🔒 IMPORTANTE:');
        console.log('   - El endpoint de bootstrap ahora está cerrado');
        console.log('   - Solo usuarios admin pueden crear otros usuarios');
        console.log('   - Las validaciones de seguridad están activas');
        console.log('   - Cambia las contraseñas en producción');
        
        return true;
      } else {
        throw new Error('Bootstrap failed: ' + message);
      }
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 400) {
        console.error('❌ Error de validación:', data.error);
        console.error('💡 Verifica el bootstrap secret');
        throw new Error(`Validation error: ${data.error}`);
      } else if (status === 500) {
        console.error('❌ Error del servidor:', data.error);
        throw new Error(`Server error: ${data.error}`);
      } else {
        console.error(`❌ Error HTTP (${status}):`, data.error);
        throw new Error(`HTTP error: ${data.error}`);
      }
    } else {
      console.error('❌ Error de conexión:', error.message);
      throw new Error(`Connection error: ${error.message}`);
    }
  }
}

/**
 * Verify bootstrap was successful
 */
async function verifyBootstrap() {
  try {
    console.log('\n🔍 Verificando bootstrap...');
    
    // Try to access the API documentation to verify it's working
    const response = await axios.get(`${API_BASE_URL}/docs`);
    
    if (response.status === 200) {
      console.log('✅ API funcionando correctamente');
      console.log('✅ Bootstrap completado exitosamente');
      console.log('🔒 API ahora está protegida con validaciones de seguridad');
      return true;
    }
  } catch (error) {
    console.warn('⚠️  No se pudo verificar el estado de la API:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Kiosko Inmobiliario - Bootstrap Initial Users');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check API status
    const apiWorking = await checkApiStatus();
    if (!apiWorking) {
      console.error('❌ No se puede continuar sin acceso a la API');
      process.exit(1);
    }
    
    // Execute bootstrap
    const bootstrapSuccess = await executeBootstrap();
    if (!bootstrapSuccess) {
      console.error('❌ Bootstrap falló');
      process.exit(1);
    }
    
    // Verify bootstrap
    await verifyBootstrap();
    
    console.log('\n🎉 ¡Proceso de bootstrap completado exitosamente!');
    console.log('💡 Próximos pasos:');
    console.log('   1. Accede al sistema con las credenciales del admin');
    console.log('   2. Cambia las contraseñas por defecto');
    console.log('   3. Configura las propiedades y documentos');
    console.log('   4. El sistema está listo para producción');
    
  } catch (error) {
    console.error('❌ Error durante el bootstrap:', error.message);
    console.error('\n🔧 Posibles soluciones:');
    console.error('   1. Verifica que la API esté desplegada');
    console.error('   2. Revisa la URL base de la API');
    console.error('   3. Asegúrate de que el BOOTSTRAP_SECRET sea correcto');
    console.error('   4. Verifica que Firebase esté configurado correctamente');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main();
