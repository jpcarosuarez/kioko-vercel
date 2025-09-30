#!/bin/bash

# Kiosko Inmobiliario - Project Setup Script
# This script sets up the complete development environment

echo "🏢 Kiosko Inmobiliario - Configuración del Proyecto"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

echo "✅ Node.js y npm están instalados"

# Install dependencies
echo "📦 Instalando dependencias..."
npm install

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI no está instalado. Instalando..."
    npm install -g firebase-tools
fi

echo "✅ Firebase CLI está disponible"

# Login to Firebase (if not already logged in)
echo "🔐 Verificando autenticación de Firebase..."
if ! firebase projects:list &> /dev/null; then
    echo "📝 Por favor inicia sesión en Firebase:"
    firebase login
fi

# Set Firebase project
echo "🎯 Configurando proyecto de Firebase..."
firebase use kiosko-129e9

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📄 Creando archivo .env..."
    cp .env.example .env
    echo "⚠️  Por favor configura las variables de entorno en .env"
else
    echo "✅ Archivo .env ya existe"
fi

# Build the project to check for errors
echo "🔨 Compilando proyecto..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Proyecto compilado exitosamente"
else
    echo "❌ Error en la compilación. Por favor revisa los errores."
    exit 1
fi

# Setup Firebase emulators
echo "🔧 Configurando emuladores de Firebase..."
firebase emulators:start --only auth,firestore &
EMULATOR_PID=$!

# Wait for emulators to start
sleep 5

# Setup demo users (if Firebase Admin SDK is configured)
if [ -f "serviceAccountKey.json" ]; then
    echo "👥 Configurando usuarios de demostración..."
    export GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json"
    node scripts/setup-demo-users.js
else
    echo "⚠️  serviceAccountKey.json no encontrado. Los usuarios de demo no se configuraron."
    echo "   Para configurar usuarios de demo:"
    echo "   1. Descarga la clave de servicio de Firebase Console"
    echo "   2. Guárdala como serviceAccountKey.json en la raíz del proyecto"
    echo "   3. Ejecuta: node scripts/setup-demo-users.js"
fi

# Stop emulators
kill $EMULATOR_PID

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Ejecuta 'npm run dev' para iniciar el servidor de desarrollo"
echo "2. Visita http://localhost:5173 para ver la aplicación"
echo "3. Usa las credenciales de demo para probar la aplicación"
echo ""
echo "🔑 Credenciales de demo:"
echo "   Admin:  admin@kioskoinmobiliario.com / KioskoAdmin2024!"
echo "   Owner:  owner@demo.com / demo123"
echo "   Tenant: tenant@demo.com / demo123"
echo ""
echo "⚠️  IMPORTANTE: Cambia las contraseñas en producción"