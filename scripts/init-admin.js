#!/usr/bin/env node

/**
 * Script to initialize the admin user for Kiosko Inmobiliario
 * This script creates the admin@kioskoinmobiliario.com user if it doesn't exist
 * and sets the admin role via Firebase Admin SDK
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Configuration
const ADMIN_EMAIL = 'contacto@kioskoinmobiliario.com';
const ADMIN_PASSWORD = 'KioskoAdmin2024!';
const ADMIN_NAME = 'Administrador Kiosko';

async function initializeAdmin() {
  try {
    console.log('🚀 Inicializando administrador de Kiosko Inmobiliario...');

    // Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS env var)
    const app = initializeApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    let adminUser;
    
    try {
      // Try to get existing user
      adminUser = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log(`✅ Usuario administrador encontrado: ${adminUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create the admin user
        console.log('👤 Creando usuario administrador...');
        adminUser = await auth.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          displayName: ADMIN_NAME,
          emailVerified: true
        });
        console.log(`✅ Usuario administrador creado: ${adminUser.uid}`);
      } else {
        throw error;
      }
    }

    // Set admin custom claims
    console.log('🔐 Configurando permisos de administrador...');
    await auth.setCustomUserClaims(adminUser.uid, { 
      role: 'admin',
      isActive: true 
    });

    // Create user document in Firestore
    console.log('📄 Creando documento de usuario en Firestore...');
    const userDoc = {
      uid: adminUser.uid,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      phone: '+57 (300) 123-4567',
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(adminUser.uid).set(userDoc, { merge: true });

    console.log('🎉 ¡Administrador inicializado exitosamente!');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Contraseña:', ADMIN_PASSWORD);
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inicializando administrador:', error);
    process.exit(1);
  }
}

// Run the script
initializeAdmin();