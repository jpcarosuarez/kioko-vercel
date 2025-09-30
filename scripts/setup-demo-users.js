#!/usr/bin/env node

/**
 * Script to set up demo users for Kiosko Inmobiliario
 * Creates admin, owner, and tenant demo users for testing
 * Updated for Cloud Functions API integration
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

async function setupDemoUsers() {
  try {
    console.log('🚀 Configurando usuarios de demostración...');

    // Initialize Firebase Admin
    const app = initializeApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    for (const userData of DEMO_USERS) {
      console.log(`\n👤 Procesando usuario: ${userData.email}`);
      
      let user;
      
      try {
        // Try to get existing user
        user = await auth.getUserByEmail(userData.email);
        console.log(`✅ Usuario existente encontrado: ${user.uid}`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create the user
          console.log('📝 Creando nuevo usuario...');
          user = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
            emailVerified: true
          });
          console.log(`✅ Usuario creado: ${user.uid}`);
        } else {
          throw error;
        }
      }

      // Set custom claims
      console.log(`🔐 Configurando rol: ${userData.role}`);
      await auth.setCustomUserClaims(user.uid, { 
        role: userData.role,
        isActive: true 
      });

      // Create/update user document in Firestore
      console.log('📄 Actualizando documento en Firestore...');
      const userDoc = {
        uid: user.uid,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').doc(user.uid).set(userDoc, { merge: true });
      console.log(`✅ Usuario ${userData.role} configurado correctamente`);
    }

    console.log('\n🎉 ¡Todos los usuarios de demostración configurados exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    DEMO_USERS.forEach(user => {
      console.log(`${user.role.toUpperCase().padEnd(10)} | ${user.email.padEnd(30)} | ${user.password}`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANTE: Cambia las contraseñas en producción');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error configurando usuarios:', error);
    process.exit(1);
  }
}

// Run the script
setupDemoUsers();