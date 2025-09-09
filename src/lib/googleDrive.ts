// Google Drive API integration
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: { apiKey?: string; discoveryDocs: string[] }) => Promise<void>;
        getToken: () => { access_token: string } | null;
        setToken: (token: string) => void;
        drive: {
          files: {
            create: (params: { resource: Record<string, unknown> }) => Promise<{ result: { id: string } }>;
            get: (params: { fileId: string; fields: string }) => Promise<{ result: { id: string; name: string; webViewLink: string; webContentLink: string } }>;
            list: (params: { q: string; fields: string }) => Promise<{ result: { files: Array<{ id: string; name: string }> } }>;
          };
          permissions: {
            create: (params: { fileId: string; resource: { role: string; type: string } }) => Promise<void>;
          };
        };
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: { client_id: string; scope: string; callback: string | ((resp: { error?: string }) => void) }) => {
            callback: string | ((resp: { error?: string }) => void);
            requestAccessToken: (params: { prompt: string }) => void;
          };
          revoke: (token: string) => void;
        };
      };
    };
  }
}

const CLIENT_ID = '1032948620721-dneuat63u09dm5m104r8gugd6puv3hsa.apps.googleusercontent.com';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapi: Window['gapi'];
let tokenClient: ReturnType<typeof window.google.accounts.oauth2.initTokenClient>;
let isInitialized = false;

export interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
}

// Initialize Google API
export const initializeGoogleDrive = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isInitialized) {
      resolve();
      return;
    }

    console.log('Inicializando Google Drive API...');

    // Load Google API script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            discoveryDocs: [DISCOVERY_DOC],
          });
          
          gapi = window.gapi;
          console.log('Google API Client inicializado');
          
          // Load Google Identity Services
          const gisScript = document.createElement('script');
          gisScript.src = 'https://accounts.google.com/gsi/client';
          gisScript.onload = () => {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: CLIENT_ID,
              scope: SCOPES,
              callback: '', // Will be set dynamically
            });
            
            console.log('Google Identity Services inicializado');
            isInitialized = true;
            resolve();
          };
          gisScript.onerror = (error) => {
            console.error('Error cargando Google Identity Services:', error);
            reject(error);
          };
          document.head.appendChild(gisScript);
        } catch (error) {
          console.error('Error inicializando Google API Client:', error);
          reject(error);
        }
      });
    };
    script.onerror = (error) => {
      console.error('Error cargando Google API script:', error);
      reject(error);
    };
    document.head.appendChild(script);
  });
};

// Authenticate user
export const authenticateUser = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      console.error('Google Drive no inicializado');
      reject(new Error('Google Drive no inicializado'));
      return;
    }

    console.log('Iniciando autenticación...');

    tokenClient.callback = (resp: { error?: string }) => {
      if (resp.error !== undefined) {
        console.error('Error de autenticación:', resp);
        reject(resp);
        return;
      }
      console.log('Autenticación exitosa');
      resolve();
    };

    if (gapi.client.getToken() === null) {
      console.log('Solicitando nuevo token...');
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      console.log('Usando token existente...');
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

// Create folder in Google Drive
export const createFolder = async (name: string, parentFolderId?: string): Promise<string> => {
  console.log(`Creando carpeta: ${name}`);
  
  const metadata = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentFolderId ? [parentFolderId] : undefined,
  };

  try {
    const response = await gapi.client.drive.files.create({
      resource: metadata,
    });
    console.log(`Carpeta creada con ID: ${response.result.id}`);
    return response.result.id;
  } catch (error) {
    console.error('Error creando carpeta:', error);
    throw error;
  }
};

// Upload file to Google Drive
export const uploadFileToGoogleDrive = async (
  file: File,
  fileName: string,
  folderId?: string,
  onProgress?: (progress: number) => void
): Promise<GoogleDriveFile> => {
  console.log(`Subiendo archivo: ${fileName} a carpeta: ${folderId || 'root'}`);
  
  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        console.log(`Progreso de subida: ${progress.toFixed(2)}%`);
        onProgress(progress);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          console.log('Archivo subido exitosamente');
          const response = JSON.parse(xhr.responseText) as { id: string };
          
          // Get the file details with sharing link
          gapi.client.drive.files.get({
            fileId: response.id,
            fields: 'id,name,webViewLink,webContentLink'
          }).then((fileResponse) => {
            console.log('Obteniendo detalles del archivo...');
            
            // Make file publicly viewable
            gapi.client.drive.permissions.create({
              fileId: response.id,
              resource: {
                role: 'reader',
                type: 'anyone'
              }
            }).then(() => {
              console.log('Permisos de lectura pública configurados');
              resolve({
                id: fileResponse.result.id,
                name: fileResponse.result.name,
                webViewLink: fileResponse.result.webViewLink,
                webContentLink: fileResponse.result.webContentLink
              });
            }).catch((error) => {
              console.error('Error configurando permisos:', error);
              reject(error);
            });
          }).catch((error) => {
            console.error('Error obteniendo detalles del archivo:', error);
            reject(error);
          });
        } else {
          console.error(`Error en la subida: ${xhr.status} - ${xhr.statusText}`);
          console.error('Respuesta del servidor:', xhr.responseText);
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => {
      console.error('Error de red durante la subida');
      reject(new Error('Network error during upload'));
    };

    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
    const token = gapi.client.getToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token.access_token}`);
      console.log('Token de autorización configurado');
    } else {
      console.error('No se encontró token de autorización');
      reject(new Error('No authorization token found'));
      return;
    }
    
    console.log('Enviando archivo...');
    xhr.send(form);
  });
};

// Get or create main folder for the app
export const getOrCreateMainFolder = async (): Promise<string> => {
  const folderName = 'Kiosko Inmobiliario';
  
  console.log(`Buscando carpeta principal: ${folderName}`);
  
  try {
    // Search for existing folder
    const response = await gapi.client.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    if (response.result.files.length > 0) {
      console.log(`Carpeta principal encontrada: ${response.result.files[0].id}`);
      return response.result.files[0].id;
    } else {
      console.log('Carpeta principal no encontrada, creando nueva...');
      return await createFolder(folderName);
    }
  } catch (error) {
    console.error('Error buscando/creando carpeta principal:', error);
    throw error;
  }
};

// Get or create documents subfolder
export const getOrCreateDocumentsFolder = async (mainFolderId: string): Promise<string> => {
  const folderName = 'Documentos';
  
  console.log(`Buscando subcarpeta: ${folderName}`);
  
  try {
    // Search for existing folder
    const response = await gapi.client.drive.files.list({
      q: `name='${folderName}' and '${mainFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    if (response.result.files.length > 0) {
      console.log(`Subcarpeta encontrada: ${response.result.files[0].id}`);
      return response.result.files[0].id;
    } else {
      console.log('Subcarpeta no encontrada, creando nueva...');
      return await createFolder(folderName, mainFolderId);
    }
  } catch (error) {
    console.error('Error buscando/creando subcarpeta:', error);
    throw error;
  }
};

// Get or create owner folder
export const getOrCreateOwnerFolder = async (ownerName: string, documentsFolderId: string): Promise<string> => {
  const folderName = `Propietario - ${ownerName}`;
  
  console.log(`Buscando carpeta de propietario: ${folderName}`);
  
  try {
    // Search for existing folder
    const response = await gapi.client.drive.files.list({
      q: `name='${folderName}' and '${documentsFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    if (response.result.files.length > 0) {
      console.log(`Carpeta de propietario encontrada: ${response.result.files[0].id}`);
      return response.result.files[0].id;
    } else {
      console.log('Carpeta de propietario no encontrada, creando nueva...');
      return await createFolder(folderName, documentsFolderId);
    }
  } catch (error) {
    console.error('Error buscando/creando carpeta de propietario:', error);
    throw error;
  }
};

// Upload test file
export const uploadTestFile = async (): Promise<GoogleDriveFile> => {
  console.log('Iniciando subida de archivo de prueba...');
  
  try {
    // Initialize if needed
    if (!isInitialized) {
      await initializeGoogleDrive();
    }
    
    // Authenticate if needed
    if (!isAuthenticated()) {
      await authenticateUser();
    }
    
    // Get folder structure
    const mainFolderId = await getOrCreateMainFolder();
    const documentsFolderId = await getOrCreateDocumentsFolder(mainFolderId);
    
    // Create test file content
    const testContent = `Este es un archivo de prueba para verificar la integración con Google Drive.
Fecha: ${new Date().toLocaleString('es-ES')}
Sistema: Kiosko Inmobiliario - Gestión de Documentos
Propósito: Verificar conectividad y permisos de Google Drive API

¡Si puedes ver este archivo en tu Google Drive, la integración está funcionando correctamente!`;
    
    const testFile = new File([testContent], 'prueba.txt', { type: 'text/plain' });
    
    // Upload file
    const result = await uploadFileToGoogleDrive(testFile, 'prueba.txt', documentsFolderId);
    
    console.log('Archivo de prueba subido exitosamente:', result);
    return result;
    
  } catch (error) {
    console.error('Error en la subida del archivo de prueba:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return gapi && gapi.client.getToken() !== null;
};

// Sign out user
export const signOut = (): void => {
  const token = gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
  }
};