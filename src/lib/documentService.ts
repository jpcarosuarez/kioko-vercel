import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Document, CreateDocumentData, UpdateDocumentData, User, Property } from '../types/models';
import { uploadOwnerDocument } from './firebaseStorage';

export interface DocumentIntegrityReport {
  orphanedDocuments: Array<{
    docId: string;
    path: string;
    issue: string;
    recommendedAction: 'delete' | 'reassign' | 'mark_orphaned';
  }>;
  orphanedProperties: Array<{
    propId: string;
    path: string;
    issue: string;
    recommendedAction: 'delete' | 'reassign' | 'mark_orphaned';
  }>;
  totalIssues: number;
}

export class DocumentService {
  /**
   * Crear un documento con validaciones de integridad
   */
  static async createDocument(
    file: File,
    ownerId: string,
    propertyId: string | null,
    displayName: string,
    description: string,
    type: string,
    tags: string[],
    uploadedBy: string,
    visibility: string
  ): Promise<{ success: boolean; documentId?: string; error?: string }> {
    try {
      // 1. Validar que el propietario existe
      const ownerDoc = await getDoc(doc(db, 'users', ownerId));
      if (!ownerDoc.exists()) {
        return { success: false, error: 'Propietario no encontrado' };
      }
      const ownerData = ownerDoc.data() as User;
      const ownerDisplayName = ownerData.name;

      // 2. Si hay propiedad, validar que existe y pertenece al propietario
      if (propertyId) {
        const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
        if (!propertyDoc.exists()) {
          return { success: false, error: 'Propiedad no encontrada' };
        }
        const propertyData = propertyDoc.data() as Property;
        if (propertyData.ownerId !== ownerId) {
          return { success: false, error: 'La propiedad no pertenece al propietario seleccionado' };
        }
      }

      // 3. Generar storagePath
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || '';
      const sanitizedName = displayName.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedOwnerName = ownerDisplayName.replace(/[^a-zA-Z0-9]/g, '_');
      
      const storagePath = propertyId 
        ? `propietarios/${sanitizedOwnerName}/${propertyId}/${sanitizedName}_${timestamp}.${fileExtension}`
        : `propietarios/${sanitizedOwnerName}/sinPropiedad/${sanitizedName}_${timestamp}.${fileExtension}`;

      // 4. Subir archivo a Firebase Storage
      const uploadResult = await uploadOwnerDocument(
        file,
        ownerDisplayName,
        propertyId || 'sinPropiedad',
        displayName
      );

      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error || 'Error al subir el archivo' };
      }

      // 5. Crear documento en Firestore
      const documentData: CreateDocumentData = {
        ownerId,
        ownerDisplayName,
        propertyId,
        storagePath: uploadResult.file!.path,
        downloadUrl: uploadResult.file!.url,
        displayName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        uploadedBy,
        uploadedAt: serverTimestamp() as Timestamp,
        tags: tags || [],
        description: description || '',
        type: type as any,
        visibility: visibility as any,
        isActive: true
      };

      const docRef = await addDoc(collection(db, 'documents'), documentData);

      return { success: true, documentId: docRef.id };
    } catch (error) {
      console.error('Error creating document:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Obtener documentos por propietario con filtrado de visibilidad
   */
  static async getDocumentsByOwner(ownerId: string, userRole?: string): Promise<Document[]> {
    try {
      const q = query(
        collection(db, 'documents'),
        where('ownerId', '==', ownerId),
        where('isActive', '==', true),
        orderBy('uploadedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt
      })) as Document[];

      // Filtrar por visibilidad si no es admin
      if (userRole && userRole !== 'admin') {
        return documents.filter(doc => {
          if (userRole === 'owner') {
            return doc.visibility === 'both' || doc.visibility === 'owner';
          } else if (userRole === 'tenant') {
            return doc.visibility === 'both' || doc.visibility === 'tenant';
          }
          return true;
        });
      }

      return documents;
    } catch (error) {
      console.error('Error getting documents by owner:', error);
      return [];
    }
  }

  /**
   * Obtener documentos por propiedad con filtrado de visibilidad
   */
  static async getDocumentsByProperty(propertyId: string, userRole?: string): Promise<Document[]> {
    try {
      const q = query(
        collection(db, 'documents'),
        where('propertyId', '==', propertyId),
        where('isActive', '==', true),
        orderBy('uploadedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt
      })) as Document[];

      // Filtrar por visibilidad si no es admin
      if (userRole && userRole !== 'admin') {
        return documents.filter(doc => {
          if (userRole === 'owner') {
            return doc.visibility === 'both' || doc.visibility === 'owner';
          } else if (userRole === 'tenant') {
            return doc.visibility === 'both' || doc.visibility === 'tenant';
          }
          return true;
        });
      }

      return documents;
    } catch (error) {
      console.error('Error getting documents by property:', error);
      return [];
    }
  }

  /**
   * Actualizar documento (solo campos editables)
   */
  static async updateDocument(
    documentId: string, 
    updates: UpdateDocumentData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'documents', documentId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating document:', error);
      return { success: false, error: 'Error al actualizar el documento' };
    }
  }

  /**
   * Obtener documentos por inquilino con filtrado de visibilidad
   */
  static async getDocumentsByTenant(tenantId: string): Promise<Document[]> {
    try {
      // Obtener todas las propiedades del inquilino
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('tenantId', '==', tenantId),
        where('isActive', '==', true)
      );
      const propertiesSnapshot = await getDocs(propertiesQuery);
      const propertyIds = propertiesSnapshot.docs.map(doc => doc.id);

      if (propertyIds.length === 0) {
        return [];
      }

      // Obtener documentos de las propiedades del inquilino
      const documentsQuery = query(
        collection(db, 'documents'),
        where('propertyId', 'in', propertyIds),
        where('isActive', '==', true),
        orderBy('uploadedAt', 'desc')
      );
      const documentsSnapshot = await getDocs(documentsQuery);
      const documents = documentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt
      })) as Document[];

      // Filtrar por visibilidad (inquilino solo ve documentos con visibility 'ambos' o 'inquilino')
      return documents.filter(doc => 
        doc.visibility === 'both' || doc.visibility === 'tenant'
      );
    } catch (error) {
      console.error('Error getting documents by tenant:', error);
      return [];
    }
  }

  /**
   * Eliminar documento (archivo + registro)
   */
  static async deleteDocument(documentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Obtener datos del documento
      const docRef = doc(db, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: 'Documento no encontrado' };
      }

      const documentData = docSnap.data() as Document;
      const storagePath = documentData.storagePath;

      // 2. Eliminar archivo de Storage
      try {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn('Error deleting file from storage:', storageError);
        // Continuar con la eliminación del documento aunque falle el storage
      }

      // 3. Eliminar documento de Firestore
      await deleteDoc(docRef);

      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: 'Error al eliminar el documento' };
    }
  }

  /**
   * Verificar integridad de datos
   */
  static async checkDataIntegrity(): Promise<DocumentIntegrityReport> {
    const report: DocumentIntegrityReport = {
      orphanedDocuments: [],
      orphanedProperties: [],
      totalIssues: 0
    };

    try {
      // 1. Verificar documentos huérfanos
      const documentsSnapshot = await getDocs(collection(db, 'documents'));
      
      for (const docSnap of documentsSnapshot.docs) {
        const docData = docSnap.data() as Document;
        
        // Verificar ownerId
        const ownerDoc = await getDoc(doc(db, 'users', docData.ownerId));
        if (!ownerDoc.exists()) {
          report.orphanedDocuments.push({
            docId: docSnap.id,
            path: `documents/${docSnap.id}`,
            issue: `ownerId '${docData.ownerId}' no existe en users`,
            recommendedAction: 'delete'
          });
        }

        // Verificar propertyId si existe
        if (docData.propertyId) {
          const propertyDoc = await getDoc(doc(db, 'properties', docData.propertyId));
          if (!propertyDoc.exists()) {
            report.orphanedDocuments.push({
              docId: docSnap.id,
              path: `documents/${docSnap.id}`,
              issue: `propertyId '${docData.propertyId}' no existe en properties`,
              recommendedAction: 'mark_orphaned'
            });
          }
        }
      }

      // 2. Verificar propiedades huérfanas
      const propertiesSnapshot = await getDocs(collection(db, 'properties'));
      
      for (const propSnap of propertiesSnapshot.docs) {
        const propData = propSnap.data() as Property;
        
        const ownerDoc = await getDoc(doc(db, 'users', propData.ownerId));
        if (!ownerDoc.exists()) {
          report.orphanedProperties.push({
            propId: propSnap.id,
            path: `properties/${propSnap.id}`,
            issue: `ownerId '${propData.ownerId}' no existe en users`,
            recommendedAction: 'mark_orphaned'
          });
        }
      }

      report.totalIssues = report.orphanedDocuments.length + report.orphanedProperties.length;
    } catch (error) {
      console.error('Error checking data integrity:', error);
    }

    return report;
  }

  /**
   * Limpiar datos huérfanos (requiere confirmación)
   */
  static async cleanupOrphanedData(
    orphanedDocuments: string[],
    orphanedProperties: string[],
    confirmDelete: boolean = false
  ): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    if (!confirmDelete) {
      return { success: false, deletedCount: 0, error: 'Se requiere confirmación para eliminar datos' };
    }

    let deletedCount = 0;

    try {
      // Eliminar documentos huérfanos
      for (const docId of orphanedDocuments) {
        const result = await this.deleteDocument(docId);
        if (result.success) {
          deletedCount++;
        }
      }

      // Marcar propiedades huérfanas como inactivas
      for (const propId of orphanedProperties) {
        await updateDoc(doc(db, 'properties', propId), {
          isActive: false,
          orphaned: true,
          updatedAt: serverTimestamp()
        });
        deletedCount++;
      }

      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error cleaning up orphaned data:', error);
      return { success: false, deletedCount, error: 'Error durante la limpieza' };
    }
  }
}
