#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps configure environment variables for the bootstrap process
 */

import fs from 'fs';
import path from 'path';

const ENV_TEMPLATE = `# Kiosko Inmobiliario - Environment Configuration
# Copy this file to .env and fill in your values

# API Configuration
API_BASE_URL=https://api-hdh3n2p6bq-uc.a.run.app

# Bootstrap Configuration (CHANGE THESE VALUES)
BOOTSTRAP_SECRET=your-super-secret-bootstrap-key-here
ADMIN_EMAIL=contacto@kioskoinmobiliario.com
ADMIN_PASSWORD=KioskoAdmin2024!
ADMIN_NAME=Administrador Kiosko
ADMIN_PHONE=+57 (300) 123-4567

# Firebase Configuration (if needed for local development)
# VITE_FIREBASE_API_KEY=your_firebase_api_key
# VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
# VITE_FIREBASE_PROJECT_ID=your_project_id
# VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
# VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# VITE_FIREBASE_APP_ID=your_app_id
`;

const BOOTSTRAP_SCRIPT_TEMPLATE = `#!/bin/bash

# Kiosko Inmobiliario - Bootstrap Setup Script
# This script sets up the initial users for the system

echo "🚀 Kiosko Inmobiliario - Bootstrap Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    echo "💡 Run: node scripts/setup-environment.js"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if bootstrap secret is set
if [ -z "$BOOTSTRAP_SECRET" ] || [ "$BOOTSTRAP_SECRET" = "your-super-secret-bootstrap-key-here" ]; then
    echo "❌ BOOTSTRAP_SECRET not configured"
    echo "💡 Please set a secure bootstrap secret in .env"
    exit 1
fi

# Run bootstrap
echo "🔐 Running bootstrap with secret: ${BOOTSTRAP_SECRET:0:8}..."
node scripts/bootstrap-initial-users.js

echo "✅ Bootstrap setup completed!"
`;

/**
 * Create environment configuration
 */
function createEnvironmentConfig() {
  try {
    console.log('🔧 Configurando variables de entorno...');
    
    // Check if .env already exists
    if (fs.existsSync('.env')) {
      console.log('⚠️  .env file already exists');
      console.log('💡 Backing up existing .env to .env.backup');
      fs.copyFileSync('.env', '.env.backup');
    }
    
    // Create .env file
    fs.writeFileSync('.env', ENV_TEMPLATE);
    console.log('✅ .env file created');
    
    // Create bootstrap script
    fs.writeFileSync('bootstrap.sh', BOOTSTRAP_SCRIPT_TEMPLATE);
    fs.chmodSync('bootstrap.sh', '755'); // Make it executable
    console.log('✅ bootstrap.sh script created');
    
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Edita el archivo .env con tus valores');
    console.log('   2. Cambia el BOOTSTRAP_SECRET por una clave segura');
    console.log('   3. Ejecuta: ./bootstrap.sh');
    console.log('   4. O ejecuta: node scripts/bootstrap-initial-users.js');
    
  } catch (error) {
    console.error('❌ Error creando configuración:', error.message);
    process.exit(1);
  }
}

/**
 * Validate environment configuration
 */
function validateEnvironment() {
  try {
    console.log('🔍 Validando configuración...');
    
    if (!fs.existsSync('.env')) {
      console.log('❌ .env file not found');
      console.log('💡 Run: node scripts/setup-environment.js');
      return false;
    }
    
    // Read .env file
    const envContent = fs.readFileSync('.env', 'utf8');
    
    // Check for required variables
    const requiredVars = [
      'BOOTSTRAP_SECRET',
      'ADMIN_EMAIL',
      'ADMIN_PASSWORD',
      'ADMIN_NAME',
      'ADMIN_PHONE'
    ];
    
    const missingVars = [];
    requiredVars.forEach(varName => {
      if (!envContent.includes(varName) || envContent.includes(`${varName}=your-`)) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      console.log('❌ Variables faltantes o no configuradas:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
      console.log('💡 Edita el archivo .env con tus valores');
      return false;
    }
    
    console.log('✅ Configuración válida');
    return true;
    
  } catch (error) {
    console.error('❌ Error validando configuración:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🔧 Kiosko Inmobiliario - Environment Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const command = process.argv[2];
    
    if (command === 'validate') {
      const isValid = validateEnvironment();
      if (isValid) {
        console.log('✅ Configuración lista para bootstrap');
        process.exit(0);
      } else {
        console.log('❌ Configuración incompleta');
        process.exit(1);
      }
    } else {
      createEnvironmentConfig();
    }
    
  } catch (error) {
    console.error('❌ Error en setup:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
