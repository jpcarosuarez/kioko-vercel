/**
 * API Management Component
 * Comprehensive admin interface for all API endpoints
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { useApiService, useSetUserRole, useValidateUserData, useSendNotification } from '../../hooks/useApiService';
import { 
  Shield, 
  Database, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Users, 
  FileCheck,
  Server,
  Trash2,
  Download,
  Send,
  RefreshCw
} from 'lucide-react';

export const ApiManagement: React.FC = () => {
  const { 
    api, 
    utils, 
    useSystemStatus, 
    useCheckIntegrity, 
    useUserRole 
  } = useApiService();
  
  const { setUserRole, loading: roleLoading } = useSetUserRole();
  const { validateData, loading: validationLoading } = useValidateUserData();
  const { sendEmail, loading: emailLoading } = useSendNotification();

  // System status
  const systemStatus = useSystemStatus();
  const integrityCheck = useCheckIntegrity();
  const userRole = useUserRole();

  // Form states
  const [roleForm, setRoleForm] = useState({ uid: '', role: 'tenant' as 'admin' | 'owner' | 'tenant' });
  const [validationForm, setValidationForm] = useState({ data: '', schema: 'user' as 'user' | 'document' | 'property' | 'transaction' });
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '', template: '' });
  const [bulkEmailForm, setBulkEmailForm] = useState({ recipients: '', subject: '', body: '', template: '' });
  const [cleanupForm, setCleanupForm] = useState({ dryRun: true });
  const [backupForm, setBackupForm] = useState({ collections: '', destination: '' });
  const [adminForm, setAdminForm] = useState({ email: '', adminSecret: '' });

  // Results states
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    // Load initial data
    systemStatus.execute();
    userRole.fetchRole();
  }, []);

  const handleSetUserRole = async () => {
    try {
      const success = await setUserRole(roleForm.uid, roleForm.role);
      if (success) {
        setResults(prev => ({ ...prev, setRole: { success: true, message: `Role updated to ${roleForm.role}` } }));
        setRoleForm({ uid: '', role: 'tenant' });
      }
    } catch (error) {
      setResults(prev => ({ ...prev, setRole: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } }));
    }
  };

  const handleValidateData = async () => {
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(validationForm.data);
      } catch {
        parsedData = validationForm.data;
      }
      
      const result = await validateData(parsedData, validationForm.schema);
      setResults(prev => ({ ...prev, validation: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, validation: { valid: false, error: error instanceof Error ? error.message : 'Unknown error' } }));
    }
  };

  const handleSendEmail = async () => {
    try {
      const result = await sendEmail(
        emailForm.to, 
        emailForm.subject, 
        emailForm.body || undefined, 
        emailForm.template as any || undefined
      );
      setResults(prev => ({ ...prev, email: result }));
      setEmailForm({ to: '', subject: '', body: '', template: '' });
    } catch (error) {
      setResults(prev => ({ ...prev, email: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } }));
    }
  };

  const handleSendBulkEmail = async () => {
    try {
      const recipients = bulkEmailForm.recipients.split(',').map(email => email.trim()).filter(Boolean);
      const result = await api.sendBulkEmail({
        recipients,
        subject: bulkEmailForm.subject,
        body: bulkEmailForm.body || undefined,
        template: bulkEmailForm.template as any || undefined
      });
      setResults(prev => ({ ...prev, bulkEmail: result }));
      setBulkEmailForm({ recipients: '', subject: '', body: '', template: '' });
    } catch (error) {
      setResults(prev => ({ ...prev, bulkEmail: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } }));
    }
  };

  const handleCleanupData = async () => {
    try {
      const result = await api.cleanupOrphanedData({ dryRun: cleanupForm.dryRun });
      setResults(prev => ({ ...prev, cleanup: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, cleanup: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } }));
    }
  };

  const handleCreateBackup = async () => {
    try {
      const collections = backupForm.collections ? backupForm.collections.split(',').map(c => c.trim()).filter(Boolean) : undefined;
      const result = await api.createDataBackup({
        collections,
        destination: backupForm.destination || undefined
      });
      setResults(prev => ({ ...prev, backup: result }));
      setBackupForm({ collections: '', destination: '' });
    } catch (error) {
      setResults(prev => ({ ...prev, backup: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } }));
    }
  };

  const handleInitializeAdmin = async () => {
    try {
      const result = await api.initializeAdmin({
        email: adminForm.email,
        adminSecret: adminForm.adminSecret
      });
      setResults(prev => ({ ...prev, initAdmin: result }));
      setAdminForm({ email: '', adminSecret: '' });
    } catch (error) {
      setResults(prev => ({ ...prev, initAdmin: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } }));
    }
  };

  const ResultDisplay: React.FC<{ result: any; title: string }> = ({ result, title }) => {
    if (!result) return null;

    return (
      <Alert className={result.success !== false ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>{title}:</strong>
          <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(result, null, 2)}
          </pre>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span>System Status</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => systemStatus.execute()}
              disabled={systemStatus.loading}
            >
              <RefreshCw className={`w-4 h-4 ${systemStatus.loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemStatus.data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Badge variant={systemStatus.data.status === 'operational' ? 'default' : 'destructive'}>
                  {systemStatus.data.status}
                </Badge>
                <span className="text-sm">Overall Status</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={systemStatus.data.services.database === 'healthy' ? 'default' : 'destructive'}>
                  {systemStatus.data.services.database}
                </Badge>
                <span className="text-sm">Database</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={systemStatus.data.services.functions === 'healthy' ? 'default' : 'destructive'}>
                  {systemStatus.data.services.functions}
                </Badge>
                <span className="text-sm">Functions</span>
              </div>
            </div>
          )}
          {userRole.role && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{userRole.role}</Badge>
                <span className="text-sm">Your Role</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="auth" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="auth" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Auth</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4" />
            <span>Validation</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Authentication Tab */}
        <TabsContent value="auth" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Set User Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Set User Role</span>
                </CardTitle>
                <CardDescription>Assign roles to users (Admin only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="uid">User ID</Label>
                  <Input
                    id="uid"
                    value={roleForm.uid}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, uid: e.target.value }))}
                    placeholder="Ingresa ID de usuario"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={roleForm.role} onValueChange={(value: any) => setRoleForm(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="tenant">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSetUserRole} disabled={roleLoading || !roleForm.uid}>
                  {roleLoading ? 'Setting...' : 'Set Role'}
                </Button>
                <ResultDisplay result={results.setRole} title="Resultado de Asignación de Rol" />
              </CardContent>
            </Card>

            {/* Initialize Admin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Initialize Admin</span>
                </CardTitle>
                <CardDescription>Set up the first admin user</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-secret">Admin Secret</Label>
                  <Input
                    id="admin-secret"
                    type="password"
                    value={adminForm.adminSecret}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, adminSecret: e.target.value }))}
                    placeholder="Ingresa secreto de administrador"
                  />
                </div>
                <Button onClick={handleInitializeAdmin} disabled={!adminForm.email || !adminForm.adminSecret}>
                  Initialize Admin
                </Button>
                <ResultDisplay result={results.initAdmin} title="Resultado de Inicialización de Admin" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5" />
                <span>Data Validation</span>
              </CardTitle>
              <CardDescription>Validate data against predefined schemas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="validation-schema">Schema</Label>
                <Select value={validationForm.schema} onValueChange={(value: any) => setValidationForm(prev => ({ ...prev, schema: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="validation-data">Data (JSON)</Label>
                <Textarea
                  id="validation-data"
                  value={validationForm.data}
                  onChange={(e) => setValidationForm(prev => ({ ...prev, data: e.target.value }))}
                  placeholder='{"email": "usuario@ejemplo.com", "name": "Juan Pérez"}'
                  rows={4}
                />
              </div>
              <Button onClick={handleValidateData} disabled={validationLoading || !validationForm.data}>
                {validationLoading ? 'Validating...' : 'Validate Data'}
              </Button>
              <ResultDisplay result={results.validation} title="Resultado de Validación" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Cleanup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trash2 className="w-5 h-5" />
                  <span>Data Cleanup</span>
                </CardTitle>
                <CardDescription>Remove orphaned data (Admin only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dry-run"
                    checked={cleanupForm.dryRun}
                    onChange={(e) => setCleanupForm(prev => ({ ...prev, dryRun: e.target.checked }))}
                  />
                  <Label htmlFor="dry-run">Dry Run (don't delete data)</Label>
                </div>
                <Button onClick={handleCleanupData}>
                  {cleanupForm.dryRun ? 'Preview Cleanup' : 'Run Cleanup'}
                </Button>
                <ResultDisplay result={results.cleanup} title="Resultado de Limpieza" />
              </CardContent>
            </Card>

            {/* Data Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Data Backup</span>
                </CardTitle>
                <CardDescription>Create system backups (Admin only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="collections">Collections (comma-separated)</Label>
                  <Input
                    id="collections"
                    value={backupForm.collections}
                    onChange={(e) => setBackupForm(prev => ({ ...prev, collections: e.target.value }))}
                    placeholder="usuarios,documentos,propiedades"
                  />
                </div>
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={backupForm.destination}
                    onChange={(e) => setBackupForm(prev => ({ ...prev, destination: e.target.value }))}
                    placeholder="gs://backup-bucket/daily"
                  />
                </div>
                <Button onClick={handleCreateBackup}>
                  Create Backup
                </Button>
                <ResultDisplay result={results.backup} title="Backup Result" />
              </CardContent>
            </Card>

            {/* Data Integrity Check */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Data Integrity Check</span>
                </CardTitle>
                <CardDescription>Check data integrity across collections (Admin only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => integrityCheck.execute()} disabled={integrityCheck.loading}>
                  {integrityCheck.loading ? 'Checking...' : 'Check Integrity'}
                </Button>
                {integrityCheck.data && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={integrityCheck.data.issues.length === 0 ? 'default' : 'destructive'}>
                        {integrityCheck.data.issues.length === 0 ? 'No Issues' : `${integrityCheck.data.issues.length} Issues`}
                      </Badge>
                      <span className="text-sm">{integrityCheck.data.message}</span>
                    </div>
                    {integrityCheck.data.issues.length > 0 && (
                      <div className="space-y-1">
                        {integrityCheck.data.issues.map((issue, index) => (
                          <div key={index} className="text-sm bg-red-50 p-2 rounded border">
                            <strong>{issue.collection}:</strong> {issue.issue} ({issue.count} items)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Send Email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>Send Email</span>
                </CardTitle>
                <CardDescription>Send individual email notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email-to">To</Label>
                  <Input
                    id="email-to"
                    type="email"
                    value={emailForm.to}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <Label htmlFor="email-template">Template (optional)</Label>
                  <Select value={emailForm.template} onValueChange={(value) => setEmailForm(prev => ({ ...prev, template: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No template</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="password-reset">Password Reset</SelectItem>
                      <SelectItem value="document-approved">Document Approved</SelectItem>
                      <SelectItem value="document-rejected">Document Rejected</SelectItem>
                      <SelectItem value="maintenance-notice">Maintenance Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="email-body">Body (optional if using template)</Label>
                  <Textarea
                    id="email-body"
                    value={emailForm.body}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Email body content"
                    rows={3}
                  />
                </div>
                <Button onClick={handleSendEmail} disabled={emailLoading || !emailForm.to || !emailForm.subject}>
                  {emailLoading ? 'Sending...' : 'Send Email'}
                </Button>
                <ResultDisplay result={results.email} title="Email Result" />
              </CardContent>
            </Card>

            {/* Send Bulk Email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Send Bulk Email</span>
                </CardTitle>
                <CardDescription>Send emails to multiple recipients</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bulk-recipients">Recipients (comma-separated)</Label>
                  <Textarea
                    id="bulk-recipients"
                    value={bulkEmailForm.recipients}
                    onChange={(e) => setBulkEmailForm(prev => ({ ...prev, recipients: e.target.value }))}
                    placeholder="user1@example.com, user2@example.com"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="bulk-subject">Subject</Label>
                  <Input
                    id="bulk-subject"
                    value={bulkEmailForm.subject}
                    onChange={(e) => setBulkEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <Label htmlFor="bulk-template">Template (optional)</Label>
                  <Select value={bulkEmailForm.template} onValueChange={(value) => setBulkEmailForm(prev => ({ ...prev, template: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No template</SelectItem>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="password-reset">Password Reset</SelectItem>
                      <SelectItem value="document-approved">Document Approved</SelectItem>
                      <SelectItem value="document-rejected">Document Rejected</SelectItem>
                      <SelectItem value="maintenance-notice">Maintenance Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bulk-body">Body (optional if using template)</Label>
                  <Textarea
                    id="bulk-body"
                    value={bulkEmailForm.body}
                    onChange={(e) => setBulkEmailForm(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Email body content"
                    rows={3}
                  />
                </div>
                <Button onClick={handleSendBulkEmail} disabled={!bulkEmailForm.recipients || !bulkEmailForm.subject}>
                  Send Bulk Email
                </Button>
                <ResultDisplay result={results.bulkEmail} title="Bulk Email Result" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};