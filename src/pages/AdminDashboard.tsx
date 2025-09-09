import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Users, FileText, Home, CheckCircle, AlertCircle, TestTube } from 'lucide-react';
import { mockUsers, mockProperties, mockDocuments } from '@/lib/mockData';
import { 
  initializeGoogleDrive, 
  authenticateUser, 
  uploadFileToGoogleDrive, 
  getOrCreateMainFolder,
  getOrCreateDocumentsFolder,
  getOrCreateOwnerFolder,
  uploadTestFile,
  isAuthenticated,
  GoogleDriveFile
} from '@/lib/googleDrive';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner';
  properties?: string[];
}

interface Property {
  id: string;
  address: string;
  type: string;
  owner: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  owner: string;
  url?: string;
  driveFileId?: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [documentType, setDocumentType] = useState('');
  const [customDocumentName, setCustomDocumentName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isGoogleDriveReady, setIsGoogleDriveReady] = useState(false);

  // New user form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'owner' as 'admin' | 'owner'
  });

  useEffect(() => {
    initializeGoogleDrive()
      .then(() => {
        setIsGoogleDriveReady(true);
        console.log('Google Drive inicializado correctamente');
      })
      .catch((error) => {
        console.error('Error inicializando Google Drive:', error);
        setUploadStatus('error');
        setUploadMessage('Error inicializando Google Drive. Verifica la configuración.');
      });
  }, []);

  const handleCreateUser = () => {
    if (newUser.name && newUser.email) {
      const user: User = {
        id: Date.now().toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        properties: []
      };
      setUsers([...users, user]);
      setNewUser({ name: '', email: '', role: 'owner' });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setUploadStatus('error');
        setUploadMessage('El archivo es demasiado grande. Máximo 10MB.');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setUploadStatus('error');
        setUploadMessage('Tipo de archivo no permitido. Solo PDF, DOC, DOCX, JPG, PNG.');
        return;
      }
      
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

  const handleOwnerSelection = (ownerId: string, checked: boolean) => {
    if (checked) {
      setSelectedOwners([...selectedOwners, ownerId]);
    } else {
      setSelectedOwners(selectedOwners.filter(id => id !== ownerId));
    }
  };

  const handleTestUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');
    setUploadMessage('Iniciando prueba de subida...');

    try {
      if (!isGoogleDriveReady) {
        await initializeGoogleDrive();
        setIsGoogleDriveReady(true);
      }

      if (!isAuthenticated()) {
        setUploadMessage('Autenticando con Google Drive...');
        await authenticateUser();
      }

      setUploadMessage('Subiendo archivo de prueba...');
      const result = await uploadTestFile();
      
      setUploadStatus('success');
      setUploadMessage(`¡Archivo de prueba subido exitosamente! ID: ${result.id}`);
      
      // Add to documents list
      const newDocument: Document = {
        id: Date.now().toString(),
        name: 'prueba.txt',
        type: 'Archivo de Prueba',
        uploadDate: new Date().toLocaleDateString('es-ES'),
        owner: 'Sistema',
        url: result.webViewLink,
        driveFileId: result.id
      };
      setDocuments([...documents, newDocument]);

    } catch (error) {
      console.error('Error en la prueba de subida:', error);
      setUploadStatus('error');
      setUploadMessage(`Error en la prueba: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || selectedOwners.length === 0 || !documentType) {
      setUploadStatus('error');
      setUploadMessage('Por favor selecciona archivo, propietarios y tipo de documento.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');
    setUploadMessage('Iniciando subida...');

    try {
      if (!isGoogleDriveReady) {
        await initializeGoogleDrive();
        setIsGoogleDriveReady(true);
      }

      if (!isAuthenticated()) {
        setUploadMessage('Autenticando con Google Drive...');
        await authenticateUser();
      }

      // Get folder structure
      setUploadMessage('Preparando carpetas...');
      const mainFolderId = await getOrCreateMainFolder();
      const documentsFolderId = await getOrCreateDocumentsFolder(mainFolderId);

      // Upload for each selected owner
      for (let i = 0; i < selectedOwners.length; i++) {
        const ownerId = selectedOwners[i];
        const owner = users.find(u => u.id === ownerId);
        
        if (owner) {
          setUploadMessage(`Subiendo para ${owner.name}...`);
          
          const ownerFolderId = await getOrCreateOwnerFolder(owner.name, documentsFolderId);
          
          // Use custom name if provided, otherwise use document type
          const baseName = customDocumentName.trim() || documentType;
          const fileName = `${baseName}_${owner.name}_${Date.now()}.${selectedFile.name.split('.').pop()}`;
          
          const result: GoogleDriveFile = await uploadFileToGoogleDrive(
            selectedFile,
            fileName,
            ownerFolderId,
            (progress) => {
              const totalProgress = ((i / selectedOwners.length) + (progress / 100 / selectedOwners.length)) * 100;
              setUploadProgress(totalProgress);
            }
          );

          // Add document to list
          const newDocument: Document = {
            id: Date.now().toString() + i,
            name: fileName,
            type: documentType,
            uploadDate: new Date().toLocaleDateString('es-ES'),
            owner: owner.name,
            url: result.webViewLink,
            driveFileId: result.id
          };
          setDocuments(prev => [...prev, newDocument]);
        }
      }

      setUploadStatus('success');
      setUploadMessage(`¡Documento subido exitosamente para ${selectedOwners.length} propietario(s)!`);
      
      // Reset form
      setSelectedFile(null);
      setSelectedOwners([]);
      setDocumentType('');
      setCustomDocumentName('');
      
    } catch (error) {
      console.error('Error subiendo documento:', error);
      setUploadStatus('error');
      setUploadMessage(`Error al subir archivo a Google Drive. ${error instanceof Error ? error.message : 'Verifica tu conexión y permisos.'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const owners = users.filter(user => user.role === 'owner');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona usuarios, propiedades y documentos</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          {isGoogleDriveReady ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              Google Drive Conectado
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Conectando Google Drive...
            </>
          )}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propietarios</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{owners.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Crear Usuario
            </CardTitle>
            <CardDescription>Agregar nuevo propietario al sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Ej: María García"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="maria@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={newUser.role} onValueChange={(value: 'admin' | 'owner') => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Propietario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleCreateUser} className="w-full">
              Crear Usuario
            </Button>
          </CardContent>
        </Card>

        {/* Upload Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Subir Documentos
            </CardTitle>
            <CardDescription>Cargar documentos a Google Drive para propietarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test Upload Button */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TestTube className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Prueba de Conexión</span>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                Sube un archivo de prueba para verificar que Google Drive funciona correctamente
              </p>
              <Button 
                onClick={handleTestUpload}
                disabled={isUploading}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isUploading ? 'Subiendo prueba...' : 'Subir Archivo de Prueba'}
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="file">Seleccionar Archivo</Label>
              <Input
                id="file"
                type="file"
                accept="/images/FileUpload.jpg"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="docType">Tipo de Documento</Label>
              <Select value={documentType} onValueChange={setDocumentType} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contrato">Contrato de Arrendamiento</SelectItem>
                  <SelectItem value="Arrendamiento">Arrendamiento</SelectItem>
                  <SelectItem value="Seguro">Seguro de Propiedad</SelectItem>
                  <SelectItem value="Mantenimiento">Reporte de Mantenimiento</SelectItem>
                  <SelectItem value="Factura">Factura</SelectItem>
                  <SelectItem value="Otro">Otro Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customName">Nombre Personalizado del Documento (Opcional)</Label>
              <Input
                id="customName"
                value={customDocumentName}
                onChange={(e) => setCustomDocumentName(e.target.value)}
                placeholder="Ej: Contrato_Enero_2025"
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Si no especificas un nombre, se usará el tipo de documento seleccionado
              </p>
            </div>

            <div className="space-y-2">
              <Label>Propietarios</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {owners.map((owner) => (
                  <div key={owner.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={owner.id}
                      checked={selectedOwners.includes(owner.id)}
                      onCheckedChange={(checked) => handleOwnerSelection(owner.id, checked as boolean)}
                      disabled={isUploading}
                    />
                    <Label htmlFor={owner.id} className="text-sm">
                      {owner.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso de subida</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {uploadMessage && (
              <Alert className={uploadStatus === 'error' ? 'border-red-200 bg-red-50' : uploadStatus === 'success' ? 'border-green-200 bg-green-50' : ''}>
                <AlertDescription className={uploadStatus === 'error' ? 'text-red-800' : uploadStatus === 'success' ? 'text-green-800' : ''}>
                  {uploadMessage}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleUploadDocument} 
              className="w-full"
              disabled={isUploading || !selectedFile || selectedOwners.length === 0 || !documentType}
            >
              {isUploading ? 'Subiendo...' : 'Subir Documento'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Usuarios registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? 'Administrador' : 'Propietario'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Subidos</CardTitle>
          <CardDescription>Documentos almacenados en Google Drive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{doc.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {doc.type} • {doc.owner} • {doc.uploadDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{doc.type}</Badge>
                  {doc.url && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      Ver en Drive
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}