/**
 * Script de prueba para el sistema de documentos
 * Ejecuta pruebas de aceptación del sistema completo
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Configuración de Firebase (usar variables de entorno)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

class DocumentSystemTester {
  constructor() {
    this.testResults = [];
    this.testDocumentId = null;
    this.testStoragePath = null;
    this.testDownloadUrl = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(testName, testFunction) {
    this.log(`Iniciando prueba: ${testName}`);
    try {
      const result = await testFunction();
      this.testResults.push({ name: testName, status: 'passed', result });
      this.log(`Prueba completada: ${testName}`, 'success');
      return result;
    } catch (error) {
      this.testResults.push({ name: testName, status: 'failed', error: error.message });
      this.log(`Prueba falló: ${testName} - ${error.message}`, 'error');
      throw error;
    }
  }

  async testDocumentCreation() {
    // Crear un documento de prueba
    const testData = {
      ownerId: 'test-owner-123',
      ownerDisplayName: 'Propietario de Prueba',
      propertyId: 'test-property-456',
      storagePath: 'propietarios/Propietario_de_Prueba/test-property-456/contrato_1696112398765.pdf',
      downloadUrl: 'https://example.com/test-download-url',
      displayName: 'Contrato de arriendo',
      originalName: 'contrato.pdf',
      mimeType: 'application/pdf',
      size: 1024000,
      uploadedBy: 'test-admin-789',
      uploadedAt: new Date(),
      tags: ['contrato', 'arriendo'],
      description: 'Contrato de prueba',
      type: 'contract',
      isActive: true
    };

    const docRef = await addDoc(collection(db, 'documents'), testData);
    this.testDocumentId = docRef.id;
    this.testStoragePath = testData.storagePath;
    this.testDownloadUrl = testData.downloadUrl;

    this.log(`Documento creado con ID: ${this.testDocumentId}`);
    this.log(`Storage Path: ${this.testStoragePath}`);
    this.log(`Download URL: ${this.testDownloadUrl}`);

    return {
      documentId: this.testDocumentId,
      storagePath: this.testStoragePath,
      downloadUrl: this.testDownloadUrl
    };
  }

  async testDocumentRetrieval() {
    // Verificar que el documento se puede recuperar
    const docsSnapshot = await getDocs(collection(db, 'documents'));
    const documents = docsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const testDoc = documents.find(doc => doc.id === this.testDocumentId);
    if (!testDoc) {
      throw new Error('Documento de prueba no encontrado');
    }

    this.log(`Documento recuperado correctamente: ${testDoc.displayName}`);
    return testDoc;
  }

  async testDocumentUpdate() {
    // Actualizar el nombre del documento
    await updateDoc(doc(db, 'documents', this.testDocumentId), {
      displayName: 'Contrato de arriendo actualizado',
      updatedAt: new Date()
    });

    this.log('Documento actualizado correctamente');
    return true;
  }

  async testDocumentDeletion() {
    // Eliminar el documento
    await deleteDoc(doc(db, 'documents', this.testDocumentId));
    this.log('Documento eliminado correctamente');
    return true;
  }

  async testIntegrityCheck() {
    // Verificar integridad de datos
    const docsSnapshot = await getDocs(collection(db, 'documents'));
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const propertiesSnapshot = await getDocs(collection(db, 'properties'));

    const documents = docsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const properties = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const orphanedDocuments = [];
    const orphanedProperties = [];

    // Verificar documentos huérfanos
    for (const doc of documents) {
      const ownerExists = users.some(user => user.uid === doc.ownerId);
      if (!ownerExists) {
        orphanedDocuments.push({
          docId: doc.id,
          issue: `ownerId '${doc.ownerId}' no existe en users`
        });
      }

      if (doc.propertyId) {
        const propertyExists = properties.some(prop => prop.id === doc.propertyId);
        if (!propertyExists) {
          orphanedDocuments.push({
            docId: doc.id,
            issue: `propertyId '${doc.propertyId}' no existe en properties`
          });
        }
      }
    }

    // Verificar propiedades huérfanas
    for (const prop of properties) {
      const ownerExists = users.some(user => user.uid === prop.ownerId);
      if (!ownerExists) {
        orphanedProperties.push({
          propId: prop.id,
          issue: `ownerId '${prop.ownerId}' no existe en users`
        });
      }
    }

    this.log(`Verificación de integridad completada:`);
    this.log(`- Documentos huérfanos: ${orphanedDocuments.length}`);
    this.log(`- Propiedades huérfanas: ${orphanedProperties.length}`);

    return {
      orphanedDocuments,
      orphanedProperties,
      totalIssues: orphanedDocuments.length + orphanedProperties.length
    };
  }

  async runAllTests() {
    this.log('Iniciando pruebas del sistema de documentos');
    
    try {
      // Prueba 1: Creación de documento
      await this.runTest('Creación de Documento', () => this.testDocumentCreation());
      
      // Prueba 2: Recuperación de documento
      await this.runTest('Recuperación de Documento', () => this.testDocumentRetrieval());
      
      // Prueba 3: Actualización de documento
      await this.runTest('Actualización de Documento', () => this.testDocumentUpdate());
      
      // Prueba 4: Verificación de integridad
      await this.runTest('Verificación de Integridad', () => this.testIntegrityCheck());
      
      // Prueba 5: Eliminación de documento
      await this.runTest('Eliminación de Documento', () => this.testDocumentDeletion());
      
      this.log('Todas las pruebas completadas exitosamente', 'success');
      
    } catch (error) {
      this.log(`Error durante las pruebas: ${error.message}`, 'error');
    }

    // Generar reporte final
    this.generateReport();
  }

  generateReport() {
    this.log('\n=== REPORTE FINAL DE PRUEBAS ===');
    
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    
    this.log(`Pruebas exitosas: ${passed}`);
    this.log(`Pruebas fallidas: ${failed}`);
    
    if (failed > 0) {
      this.log('\nPruebas fallidas:');
      this.testResults
        .filter(r => r.status === 'failed')
        .forEach(r => this.log(`- ${r.name}: ${r.error}`, 'error'));
    }
    
    this.log('\n=== EVIDENCIA DE PRUEBAS ===');
    if (this.testDocumentId) {
      this.log(`Document ID: ${this.testDocumentId}`);
    }
    if (this.testStoragePath) {
      this.log(`Storage Path: ${this.testStoragePath}`);
    }
    if (this.testDownloadUrl) {
      this.log(`Download URL: ${this.testDownloadUrl}`);
    }
  }
}

// Ejecutar pruebas si se llama directamente
const tester = new DocumentSystemTester();
tester.runAllTests().catch(console.error);

export default DocumentSystemTester;
