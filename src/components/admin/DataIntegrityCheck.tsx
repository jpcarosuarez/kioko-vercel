import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  RefreshCw,
  FileText,
  Building,
  User
} from 'lucide-react';
import { DocumentService, DocumentIntegrityReport } from '../../lib/documentService';
import { toast } from 'sonner';

export const DataIntegrityCheck: React.FC = () => {
  const [report, setReport] = useState<DocumentIntegrityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const runIntegrityCheck = async () => {
    try {
      setLoading(true);
      const integrityReport = await DocumentService.checkDataIntegrity();
      setReport(integrityReport);
      
      if (integrityReport.totalIssues === 0) {
        toast.success('No se encontraron problemas de integridad');
      } else {
        toast.warning(`Se encontraron ${integrityReport.totalIssues} problemas de integridad`);
      }
    } catch (error) {
      console.error('Error checking integrity:', error);
      toast.error('Error al verificar la integridad de datos');
    } finally {
      setLoading(false);
    }
  };

  const cleanupOrphanedData = async () => {
    if (!report) return;

    const orphanedDocIds = report.orphanedDocuments
      .filter(doc => doc.recommendedAction === 'delete')
      .map(doc => doc.docId);

    const orphanedPropIds = report.orphanedProperties
      .filter(prop => prop.recommendedAction === 'delete')
      .map(prop => prop.propId);

    if (orphanedDocIds.length === 0 && orphanedPropIds.length === 0) {
      toast.info('No hay datos para limpiar automáticamente');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar ${orphanedDocIds.length} documentos y marcar ${orphanedPropIds.length} propiedades como huérfanas?`)) {
      return;
    }

    try {
      setCleaning(true);
      const result = await DocumentService.cleanupOrphanedData(
        orphanedDocIds,
        orphanedPropIds,
        true
      );

      if (result.success) {
        toast.success(`Limpieza completada: ${result.deletedCount} elementos procesados`);
        // Re-run integrity check
        await runIntegrityCheck();
      } else {
        toast.error(result.error || 'Error durante la limpieza');
      }
    } catch (error) {
      console.error('Error cleaning up data:', error);
      toast.error('Error al limpiar datos huérfanos');
    } finally {
      setCleaning(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'delete':
        return <Badge variant="destructive">Eliminar</Badge>;
      case 'reassign':
        return <Badge variant="secondary">Reasignar</Badge>;
      case 'mark_orphaned':
        return <Badge variant="outline">Marcar huérfano</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verificación de Integridad de Datos
          </CardTitle>
          <CardDescription>
            Verifica y corrige inconsistencias en los datos de Firestore
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={runIntegrityCheck}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {loading ? 'Verificando...' : 'Verificar Integridad'}
            </Button>
            
            {report && report.totalIssues > 0 && (
              <Button
                onClick={cleanupOrphanedData}
                disabled={cleaning}
                variant="destructive"
                className="flex items-center gap-2"
              >
                {cleaning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {cleaning ? 'Limpiando...' : 'Limpiar Datos Huérfanos'}
              </Button>
            )}
          </div>

          {report && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Se encontraron {report.totalIssues} problemas de integridad
                </AlertDescription>
              </Alert>

              {/* Orphaned Documents */}
              {report.orphanedDocuments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-4 w-4" />
                      Documentos Huérfanos ({report.orphanedDocuments.length})
                    </CardTitle>
                    <CardDescription>
                      Documentos con referencias a usuarios o propiedades inexistentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.orphanedDocuments.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{doc.path}</p>
                            <p className="text-sm text-gray-600">{doc.issue}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getActionBadge(doc.recommendedAction)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Orphaned Properties */}
              {report.orphanedProperties.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building className="h-4 w-4" />
                      Propiedades Huérfanas ({report.orphanedProperties.length})
                    </CardTitle>
                    <CardDescription>
                      Propiedades con referencias a propietarios inexistentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.orphanedProperties.map((prop, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{prop.path}</p>
                            <p className="text-sm text-gray-600">{prop.issue}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getActionBadge(prop.recommendedAction)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {report.totalIssues === 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ¡Excelente! No se encontraron problemas de integridad en los datos.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
