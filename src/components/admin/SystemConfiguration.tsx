/**
 * System Configuration Component
 * Provides system-wide configuration and monitoring tools
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { useApiService } from '../../hooks/useApiService';
import { 
  Settings, 
  Server, 
  Database, 
  Shield, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Activity,
  Clock,
  HardDrive,
  Cpu
} from 'lucide-react';

interface SystemMetrics {
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
  requestsPerMinute: number;
}

export const SystemConfiguration: React.FC = () => {
  const { api, useSystemStatus, useCheckIntegrity } = useApiService();
  
  const systemStatus = useSystemStatus();
  const integrityCheck = useCheckIntegrity();
  
  // Mock system metrics (in a real app, these would come from monitoring APIs)
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: '0d 0h 0m',
    memoryUsage: 0,
    cpuUsage: 0,
    diskUsage: 0,
    activeConnections: 0,
    requestsPerMinute: 0
  });

  const [adminSecret, setAdminSecret] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [initLoading, setInitLoading] = useState(false);
  const [initResult, setInitResult] = useState<any>(null);

  useEffect(() => {
    // Load initial system status
    systemStatus.execute();
    
    // Simulate metrics updates
    const interval = setInterval(() => {
      setMetrics({
        uptime: `${Math.floor(Date.now() / 86400000)}d ${Math.floor((Date.now() % 86400000) / 3600000)}h ${Math.floor((Date.now() % 3600000) / 60000)}m`,
        memoryUsage: Math.random() * 100,
        cpuUsage: Math.random() * 100,
        diskUsage: 45 + Math.random() * 20,
        activeConnections: Math.floor(Math.random() * 50) + 10,
        requestsPerMinute: Math.floor(Math.random() * 100) + 20
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleInitializeAdmin = async () => {
    if (!adminEmail || !adminSecret) return;

    setInitLoading(true);
    try {
      const result = await api.initializeAdmin({
        email: adminEmail,
        adminSecret: adminSecret
      });
      setInitResult(result);
      setAdminEmail('');
      setAdminSecret('');
    } catch (error) {
      setInitResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setInitLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMetricColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => systemStatus.execute()}
              disabled={systemStatus.loading}
            >
              <RefreshCw className={`w-4 h-4 ${systemStatus.loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {systemStatus.data ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(systemStatus.data.status)}
                  <span className={`font-medium ${getStatusColor(systemStatus.data.status)}`}>
                    {systemStatus.data.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {systemStatus.data ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(systemStatus.data.services.database)}
                  <span className={`font-medium ${getStatusColor(systemStatus.data.services.database)}`}>
                    {systemStatus.data.services.database.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Firestore connection active
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Functions</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {systemStatus.data ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(systemStatus.data.services.functions)}
                  <span className={`font-medium ${getStatusColor(systemStatus.data.services.functions)}`}>
                    {systemStatus.data.services.functions.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Cloud Functions operational
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>System Metrics</span>
          </CardTitle>
          <CardDescription>Real-time system performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{metrics.uptime}</div>
              <div className="text-xs text-gray-500">Uptime</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Cpu className="w-4 h-4 text-green-500" />
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.cpuUsage, { warning: 70, critical: 90 })}`}>
                {metrics.cpuUsage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">CPU Usage</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-4 h-4 text-purple-500" />
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.memoryUsage, { warning: 80, critical: 95 })}`}>
                {metrics.memoryUsage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Memory</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <HardDrive className="w-4 h-4 text-orange-500" />
              </div>
              <div className={`text-2xl font-bold ${getMetricColor(metrics.diskUsage, { warning: 80, critical: 95 })}`}>
                {metrics.diskUsage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Disk Usage</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Server className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold">{metrics.activeConnections}</div>
              <div className="text-xs text-gray-500">Connections</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold">{metrics.requestsPerMinute}</div>
              <div className="text-xs text-gray-500">Req/min</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Integrity Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Data Integrity</span>
          </CardTitle>
          <CardDescription>Check and monitor data integrity across the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => integrityCheck.execute()} 
            disabled={integrityCheck.loading}
            className="w-full"
          >
            {integrityCheck.loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking Integrity...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Run Integrity Check
              </>
            )}
          </Button>

          {integrityCheck.data && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {integrityCheck.data.issues.length === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
                <span className="font-medium">{integrityCheck.data.message}</span>
              </div>

              {integrityCheck.data.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Issues Found:</h4>
                  {integrityCheck.data.issues.map((issue, index) => (
                    <Alert key={index} className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{issue.collection}:</strong> {issue.issue} ({issue.count} items affected)
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              <div className="text-sm text-gray-600">
                <strong>Collections checked:</strong> {integrityCheck.data.collectionsChecked.join(', ')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Initialization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Admin Initialization</span>
          </CardTitle>
          <CardDescription>Initialize the first admin user for the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <Label htmlFor="admin-secret">Admin Secret</Label>
              <Input
                id="admin-secret"
                type="password"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                placeholder="Enter admin secret"
              />
            </div>
          </div>

          <Button 
            onClick={handleInitializeAdmin}
            disabled={initLoading || !adminEmail || !adminSecret}
            className="w-full"
          >
            {initLoading ? 'Initializing...' : 'Initialize Admin'}
          </Button>

          {initResult && (
            <Alert className={initResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription>
                {initResult.success ? (
                  <div>
                    <strong>Success:</strong> {initResult.message}
                    {initResult.uid && <div className="mt-1 text-sm">User ID: {initResult.uid}</div>}
                  </div>
                ) : (
                  <div>
                    <strong>Error:</strong> {initResult.error}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};