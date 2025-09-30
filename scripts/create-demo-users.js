#!/usr/bin/env node

/**
 * Simple Demo Users Creation Script
 * Creates 3 users directly: admin, owner, tenant
 */

const API_BASE_URL = 'https://api-hdh3n2p6bq-uc.a.run.app';

// Demo users to create
const DEMO_USERS = [
  {
    email: 'contacto@kioskoinmobiliario.com',
    password: 'KioskoAdmin2024!',
    name: 'Administrador Kiosko',
    phone: '+57 (300) 123-4567',
    role: 'admin'
  },
  {
    email: 'propietario@demo.com',
    password: 'Demo123!',
    name: 'María García Propietaria',
    phone: '+57 (301) 234-5678',
    role: 'owner'
  },
  {
    email: 'inquilino@demo.com',
    password: 'Demo123!',
    name: 'Carlos Rodríguez Inquilino',
    phone: '+57 (302) 345-6789',
    role: 'tenant'
  }
];

/**
 * Create a single user
 */
async function createUser(userData) {
  try {
    console.log(`📝 Creando usuario: ${userData.email} (${userData.role})`);
    
    const response = await fetch(`${API_BASE_URL}/auth/bootstrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bootstrapSecret: 'bootstrap-secret-change-me',
        adminEmail: userData.email,
        adminPassword: userData.password,
        adminName: userData.name,
        adminPhone: userData.phone
      })
    });

    if (response.ok) {
      console.log(`✅ Usuario creado: ${userData.name}`);
      return { success: true, user: userData };
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Status: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
  } catch (error) {
    if (error.message.includes('already completed')) {
      console.log(`⚠️  Bootstrap ya completado - usuario ${userData.email} probablemente existe`);
      return { success: true, user: userData, exists: true };
    } else {
      console.error(`❌ Error creando ${userData.email}:`, error.message);
      return { success: false, user: userData, error: error.message };
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Creando usuarios de demostración...');
    console.log(`📡 API: ${API_BASE_URL}`);
    
    const results = [];
    
    // Create each user
    for (const userData of DEMO_USERS) {
      const result = await createUser(userData);
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Show results
    console.log('\n🎉 ¡Proceso completado!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    DEMO_USERS.forEach(user => {
      console.log(`${user.role.toUpperCase().padEnd(10)} | ${user.email.padEnd(30)} | ${user.password}`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n📊 Resultado: ${successful} exitosos, ${failed} errores`);
    
    if (failed > 0) {
      console.log('\n❌ Usuarios con errores:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.user.email}: ${r.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
