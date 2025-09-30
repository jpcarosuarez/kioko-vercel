/**
 * Security Dashboard Component
 * Displays security monitoring information for administrators
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Database, 
  Mail, 
  RefreshCw,
  Download,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { AdminOnly } from "../common/RoleBasedAccess";
import { useSecurityMonitor } from "../../hooks/useSecurityMonitor";
import { 
  cleanupOrphanedData, 
  createDataBackup, 
  checkDataIntegrity,
  CleanupResponse,
  BackupResponse
} from "../../lib/secureApiCalls";
import { toast } from "sonner";
import { LoadingState } from "../common/LoadingState";

interface SecurityDashboardProps {
  className?: string;
}

/**
 * Security Dashboard for administrators
 */
export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className = "" }) => {
  const { isSecure, securityEvents, refreshToken, clearSecurityEvents } = useSecurityMonitor();
  const [loading, setLoading] = useState(false);
  const [integrityResults, setIntegrityResults] = useState<{ issues: string[]; summary: any } | null>(null);
  const [lastBackup, setLastBackup] = useState<BackupResponse | null>(null);
  const [lastCleanup, setLastCleanup] = useState<CleanupResponse | null>(null);

  // Handle data integrity check
  const handleIntegrityCheck = async () => {
    setLoading(true);
    try {
      const results = await checkDataIntegrity();
      setIntegrityResults(results);
      toast.success("Verificación de integridad completada");
    } catch (error) {
      toast.error("Error al verificar integridad de datos");
    } finally {
      setLoading(false);
    }
  };

  // Handle data backup
  const handleBackup = async () => {
    setLoading(true);
    try {
      const backup = await createDataBackup(["users", "properties", "documents", "audit_logs"]);
      setLastBackup(backup);
      toast.success(`Respaldo creado: ${backup.backupId}`);
    } catch (error) {
      toast.error("Error al crear respaldo");
    } finally {
      setLoading(false);
    }
  };

  // Handle cleanup
  const handleCleanup = async (dryRun: boolean = true) => {
    setLoading(true);
    try {
      const cleanup = await cleanupOrphanedData("all", dryRun);
      setLastCleanup(cleanup);
      
      if (dryRun) {
        toast.info(`Simulación completada: ${cleanup.itemsDeleted} elementos serían eliminados`);
      } else {
        toast.success(`Limpieza completada: ${cleanup.itemsDeleted} elementos eliminados`);
      }
    } catch (error) {
      toast.error("Error durante la limpieza");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Procesando operación de seguridad..." />;
  }

  return (
    <AdminOnly>
      <div className={`space-y-6 ${className}`}>
        {/* Security Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado de Seguridad</CardTitle>
              <Shield className={`h-4 w-4 ${isSecure ? "text-green-600" : "text-red-600"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isSecure ? "Seguro" : "Alerta"}
              </div>
              <Badge variant={isSecure ? "default" : "destructive"} className="mt-1">
                {isSecure ? "Sistema protegido" : "Requiere atención"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos de Seguridad</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityEvents.length}</div>
              <p className="text-xs text-muted-foreground">
                Últimos eventos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integridad de Datos</CardTitle>
              <Database className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {integrityResults ? integrityResults.issues.length : "?"}
              </div>
              <p className="text-xs text-muted-foreground">
                Problemas detectados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Respaldo</CardTitle>
              <Download className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastBackup ? "OK" : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {lastBackup ? new Date(lastBackup.timestamp).toLocaleDateString() : "Sin respaldos"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Security Management Tabs */}
        <Tabs defaultValue="monitoring" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monitoring">Monitoreo</TabsTrigger>
            <TabsTrigger value="integrity">Integridad</TabsTrigger>
            <TabsTrigger value="backup">Respaldos</TabsTrigger>
            <TabsTrigger value="cleanup">Limpieza</TabsTrigger>
          </TabsList>

          {/* Security Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Monitoreo de Seguridad
                </CardTitle>
                <CardDescription>
                  Eventos de seguridad y estado del sistema en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={refreshToken} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar Token
                  </Button>
                  <Button onClick={clearSecurityEvents} variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar Eventos
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Eventos Recientes</h4>
                  {securityEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay eventos registrados</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {securityEvents.map((event, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {event.type === "security_violation" ? (
                              <XCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            <span className="text-sm font-medium">{event.type}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {event.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Integrity Tab */}
          <TabsContent value="integrity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Verificación de Integridad
                </CardTitle>
                <CardDescription>
                  Verifica la consistencia y validez de los datos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleIntegrityCheck} disabled={loading}>
                  <Database className="h-4 w-4 mr-2" />
                  Verificar Integridad
                </Button>

                {integrityResults && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {integrityResults.summary.usersChecked}
                        </div>
                        <p className="text-sm text-muted-foreground">Usuarios</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {integrityResults.summary.propertiesChecked}
                        </div>
                        <p className="text-sm text-muted-foreground">Propiedades</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {integrityResults.summary.documentsChecked}
                        </div>
                        <p className="text-sm text-muted-foreground">Documentos</p>
                      </div>
                    </div>

                    {integrityResults.issues.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Problemas Detectados</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {integrityResults.issues.map((issue, index) => (
                            <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              {issue}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Respaldos de Datos
                </CardTitle>
                <CardDescription>
                  Crear y gestionar respaldos de seguridad del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleBackup} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Crear Respaldo
                </Button>

                {lastBackup && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Último Respaldo</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <p><strong>ID:</strong> {lastBackup.backupId}</p>
                      <p><strong>Fecha:</strong> {new Date(lastBackup.timestamp).toLocaleString()}</p>
                      <p><strong>Colecciones:</strong> {lastBackup.collections.join(", ")}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cleanup Tab */}
          <TabsContent value="cleanup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Limpieza de Datos
                </CardTitle>
                <CardDescription>
                  Eliminar datos huérfanos y mantener la base de datos limpia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => handleCleanup(true)} variant="outline" disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Simular Limpieza
                  </Button>
                  <Button onClick={() => handleCleanup(false)} variant="destructive" disabled={loading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Ejecutar Limpieza
                  </Button>
                </div>

                {lastCleanup && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Última Limpieza</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <p><strong>Elementos procesados:</strong> {lastCleanup.itemsProcessed}</p>
                      <p><strong>Elementos eliminados:</strong> {lastCleanup.itemsDeleted}</p>
                      {lastCleanup.errors && lastCleanup.errors.length > 0 && (
                        <div>
                          <p><strong>Errores:</strong></p>
                          <ul className="list-disc list-inside ml-2">
                            {lastCleanup.errors.map((error, index) => (
                              <li key={index} className="text-red-600">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminOnly>
  );
};