# Property Document Management System - MVP Todo

## Core Features to Implement:
1. **Authentication System** - Simple login/logout with mock users
2. **Property Owner Dashboard** - View owned properties and documents
3. **Document Viewer** - Display and download property documents
4. **Responsive Design** - Mobile-friendly interface

## Files to Create/Modify:

### 1. **src/pages/Index.tsx** - Landing/Login Page
- Login form with email/password
- Real estate agency branding
- Redirect to dashboard after login

### 2. **src/pages/Dashboard.tsx** - Property Owner Dashboard  
- Display owned properties
- Navigation to document viewer
- User profile info and logout

### 3. **src/pages/DocumentViewer.tsx** - Document Management
- List documents by property
- Document preview/download functionality
- Filter and search documents

### 4. **src/components/AuthProvider.tsx** - Authentication Context
- Manage login state
- Mock authentication with predefined users
- Route protection

### 5. **src/components/PropertyCard.tsx** - Property Display Component
- Show property details
- Link to documents
- Property image and info

### 6. **src/components/DocumentList.tsx** - Document Display Component
- List property documents
- Document type icons
- Download/view actions

### 7. **src/lib/mockData.ts** - Sample Data
- Mock users and properties
- Sample documents and file references
- Property and document types

### 8. **Update src/App.tsx** - Add new routes and auth protection

## Implementation Strategy:
- Use localStorage for authentication state (simple MVP)
- Mock data for properties and documents  
- Responsive design with Tailwind CSS
- Clean, professional real estate agency aesthetic