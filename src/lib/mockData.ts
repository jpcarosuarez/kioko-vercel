export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'admin' | 'owner';
}

export interface Property {
  id: string;
  address: string;
  type: 'residential' | 'commercial';
  ownerId: string;
  imageUrl: string;
  purchaseDate: string;
  value: number;
}

export interface Document {
  id: string;
  propertyId: string;
  name: string;
  type: 'lease' | 'insurance' | 'maintenance' | 'financial' | 'legal' | 'inspection';
  uploadDate: string;
  fileUrl: string;
  fileSize: string;
  uploadedBy?: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@email.com',
    password: 'password123',
    name: 'Juan Pérez',
    phone: '(555) 123-4567',
    role: 'owner'
  },
  {
    id: '2',
    email: 'jane.smith@email.com',
    password: 'password123',
    name: 'María García',
    phone: '(555) 987-6543',
    role: 'owner'
  },
  {
    id: '3',
    email: 'demo@email.com',
    password: 'demo',
    name: 'Usuario Demo',
    phone: '(555) 000-0000',
    role: 'owner'
  },
  {
    id: '4',
    email: 'admin@kioskoinmobiliario.com',
    password: 'admin123',
    name: 'Administrador Kiosko',
    phone: '(555) 111-2222',
    role: 'admin'
  }
];

export const mockProperties: Property[] = [
  {
    id: '1',
    address: 'Calle Roble 123, Centro',
    type: 'residential',
    ownerId: '1',
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    purchaseDate: '2022-03-15',
    value: 1800000000
  },
  {
    id: '2',
    address: 'Avenida Pino 456, Zona Norte',
    type: 'residential',
    ownerId: '1',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    purchaseDate: '2021-07-22',
    value: 1300000000
  },
  {
    id: '3',
    address: 'Plaza Comercial 789, Distrito Empresarial',
    type: 'commercial',
    ownerId: '2',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    purchaseDate: '2023-01-10',
    value: 3000000000
  },
  {
    id: '4',
    address: 'Carrera Arce 321, Zona Residencial',
    type: 'residential',
    ownerId: '3',
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
    purchaseDate: '2022-11-05',
    value: 1520000000
  }
];

export const mockDocuments: Document[] = [
  // Property 1 documents
  {
    id: '1',
    propertyId: '1',
    name: 'Contrato de Arrendamiento 2024',
    type: 'lease',
    uploadDate: '2024-01-15',
    fileUrl: '#',
    fileSize: '2.3 MB',
    uploadedBy: '4'
  },
  {
    id: '2',
    propertyId: '1',
    name: 'Póliza de Seguro del Hogar',
    type: 'insurance',
    uploadDate: '2024-02-01',
    fileUrl: '#',
    fileSize: '1.8 MB',
    uploadedBy: '4'
  },
  {
    id: '3',
    propertyId: '1',
    name: 'Reporte de Mantenimiento HVAC',
    type: 'maintenance',
    uploadDate: '2024-08-20',
    fileUrl: '#',
    fileSize: '0.9 MB',
    uploadedBy: '4'
  },
  {
    id: '4',
    propertyId: '1',
    name: 'Estado de Impuestos Prediales',
    type: 'financial',
    uploadDate: '2024-03-10',
    fileUrl: '#',
    fileSize: '0.5 MB',
    uploadedBy: '4'
  },
  // Property 2 documents
  {
    id: '5',
    propertyId: '2',
    name: 'Contrato de Alquiler 2024',
    type: 'lease',
    uploadDate: '2024-01-01',
    fileUrl: '#',
    fileSize: '2.1 MB',
    uploadedBy: '4'
  },
  {
    id: '6',
    propertyId: '2',
    name: 'Seguro de Propiedad',
    type: 'insurance',
    uploadDate: '2024-01-15',
    fileUrl: '#',
    fileSize: '1.5 MB',
    uploadedBy: '4'
  },
  {
    id: '7',
    propertyId: '2',
    name: 'Reporte de Inspección Anual',
    type: 'inspection',
    uploadDate: '2024-06-15',
    fileUrl: '#',
    fileSize: '3.2 MB',
    uploadedBy: '4'
  },
  // Property 3 documents
  {
    id: '8',
    propertyId: '3',
    name: 'Contrato de Arrendamiento Comercial',
    type: 'lease',
    uploadDate: '2024-02-01',
    fileUrl: '#',
    fileSize: '4.1 MB',
    uploadedBy: '4'
  },
  {
    id: '9',
    propertyId: '3',
    name: 'Póliza de Seguro Empresarial',
    type: 'insurance',
    uploadDate: '2024-02-15',
    fileUrl: '#',
    fileSize: '2.7 MB',
    uploadedBy: '4'
  },
  {
    id: '10',
    propertyId: '3',
    name: 'Inspección de Seguridad Contra Incendios',
    type: 'inspection',
    uploadDate: '2024-07-10',
    fileUrl: '#',
    fileSize: '1.4 MB',
    uploadedBy: '4'
  },
  // Property 4 documents
  {
    id: '11',
    propertyId: '4',
    name: 'Contrato de Compraventa',
    type: 'legal',
    uploadDate: '2022-11-05',
    fileUrl: '#',
    fileSize: '3.8 MB',
    uploadedBy: '4'
  },
  {
    id: '12',
    propertyId: '4',
    name: 'Seguro de Propietarios',
    type: 'insurance',
    uploadDate: '2024-01-20',
    fileUrl: '#',
    fileSize: '1.9 MB',
    uploadedBy: '4'
  }
];

export const getDocumentIcon = (type: Document['type']) => {
  const icons = {
    lease: '📄',
    insurance: '🛡️',
    maintenance: '🔧',
    financial: '💰',
    legal: '⚖️',
    inspection: '🔍'
  };
  return icons[type] || '📄';
};

export const getDocumentColor = (type: Document['type']) => {
  const colors = {
    lease: 'bg-blue-100 text-blue-800',
    insurance: 'bg-green-100 text-green-800',
    maintenance: 'bg-orange-100 text-orange-800',
    financial: 'bg-purple-100 text-purple-800',
    legal: 'bg-red-100 text-red-800',
    inspection: 'bg-yellow-100 text-yellow-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

// Helper functions for localStorage operations
export const addDocument = (document: Omit<Document, 'id'>) => {
  const documents = getStoredDocuments();
  const newDocument = {
    ...document,
    id: Date.now().toString()
  };
  documents.push(newDocument);
  localStorage.setItem('documents', JSON.stringify(documents));
  return newDocument;
};

export const updateDocument = (id: string, updates: Partial<Document>) => {
  const documents = getStoredDocuments();
  const index = documents.findIndex(doc => doc.id === id);
  if (index !== -1) {
    documents[index] = { ...documents[index], ...updates };
    localStorage.setItem('documents', JSON.stringify(documents));
    return documents[index];
  }
  return null;
};

export const deleteDocument = (id: string) => {
  const documents = getStoredDocuments();
  const filtered = documents.filter(doc => doc.id !== id);
  localStorage.setItem('documents', JSON.stringify(filtered));
};

export const getStoredDocuments = (): Document[] => {
  const stored = localStorage.getItem('documents');
  return stored ? JSON.parse(stored) : mockDocuments;
};

export const addProperty = (property: Omit<Property, 'id'>) => {
  const properties = getStoredProperties();
  const newProperty = {
    ...property,
    id: Date.now().toString()
  };
  properties.push(newProperty);
  localStorage.setItem('properties', JSON.stringify(properties));
  return newProperty;
};

export const updateProperty = (id: string, updates: Partial<Property>) => {
  const properties = getStoredProperties();
  const index = properties.findIndex(prop => prop.id === id);
  if (index !== -1) {
    properties[index] = { ...properties[index], ...updates };
    localStorage.setItem('properties', JSON.stringify(properties));
    return properties[index];
  }
  return null;
};

export const deleteProperty = (id: string) => {
  const properties = getStoredProperties();
  const filtered = properties.filter(prop => prop.id !== id);
  localStorage.setItem('properties', JSON.stringify(filtered));
  
  // Also delete associated documents
  const documents = getStoredDocuments();
  const filteredDocs = documents.filter(doc => doc.propertyId !== id);
  localStorage.setItem('documents', JSON.stringify(filteredDocs));
};

export const getStoredProperties = (): Property[] => {
  const stored = localStorage.getItem('properties');
  return stored ? JSON.parse(stored) : mockProperties;
};

// User management functions
export const addUser = (user: Omit<User, 'id'>) => {
  const users = getStoredUsers();
  const newUser = {
    ...user,
    id: Date.now().toString()
  };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  return newUser;
};

export const updateUser = (id: string, updates: Partial<User>) => {
  const users = getStoredUsers();
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem('users', JSON.stringify(users));
    return users[index];
  }
  return null;
};

export const deleteUser = (id: string) => {
  const users = getStoredUsers();
  const filtered = users.filter(user => user.id !== id);
  localStorage.setItem('users', JSON.stringify(filtered));
  
  // Also delete user's properties and associated documents
  const properties = getStoredProperties();
  const userProperties = properties.filter(prop => prop.ownerId === id);
  
  userProperties.forEach(property => {
    deleteProperty(property.id);
  });
};

export const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem('users');
  return stored ? JSON.parse(stored) : mockUsers;
};

export const checkEmailExists = (email: string, excludeId?: string): boolean => {
  const users = getStoredUsers();
  return users.some(user => user.email === email && user.id !== excludeId);
};