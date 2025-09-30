/**
 * Notification Center Component
 * Centralized notification management using the new API
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { useSendNotification, useApiService } from '../../hooks/useApiService';
import { 
  Mail, 
  Send, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  MessageSquare
} from 'lucide-react';

interface NotificationHistory {
  id: string;
  type: 'single' | 'bulk';
  recipients: string[];
  subject: string;
  template?: string;
  status: 'sent' | 'failed' | 'pending';
  timestamp: Date;
  messageId?: string;
  error?: string;
}

export const NotificationCenter: React.FC = () => {
  const { sendEmail } = useSendNotification();
  const { api } = useApiService();
  
  // Form states
  const [singleEmailForm, setSingleEmailForm] = useState({
    to: '',
    subject: '',
    body: '',
    template: ''
  });
  
  const [bulkEmailForm, setBulkEmailForm] = useState({
    recipients: '',
    subject: '',
    body: '',
    template: ''
  });

  // Available templates
  const [templates, setTemplates] = useState<string[]>([]);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadHistory();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.getEmailTemplates();
      setTemplates(response.templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadHistory = () => {
    // Load from localStorage for now
    const savedHistory = localStorage.getItem('notification-history');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
  };

  const saveToHistory = (notification: Omit<NotificationHistory, 'id' | 'timestamp'>) => {
    const newNotification: NotificationHistory = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    const updatedHistory = [newNotification, ...history].slice(0, 50); // Keep last 50
    setHistory(updatedHistory);
    localStorage.setItem('notification-history', JSON.stringify(updatedHistory));
  };

  const handleSendSingleEmail = async () => {
    if (!singleEmailForm.to || !singleEmailForm.subject) return;

    setLoading(true);
    try {
      const result = await sendEmail(
        singleEmailForm.to,
        singleEmailForm.subject,
        singleEmailForm.body || undefined,
        singleEmailForm.template as any || undefined
      );

      saveToHistory({
        type: 'single',
        recipients: [singleEmailForm.to],
        subject: singleEmailForm.subject,
        template: singleEmailForm.template || undefined,
        status: 'sent',
        messageId: result.messageId
      });

      // Reset form
      setSingleEmailForm({ to: '', subject: '', body: '', template: '' });
    } catch (error) {
      saveToHistory({
        type: 'single',
        recipients: [singleEmailForm.to],
        subject: singleEmailForm.subject,
        template: singleEmailForm.template || undefined,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!bulkEmailForm.recipients || !bulkEmailForm.subject) return;

    const recipients = bulkEmailForm.recipients
      .split(',')
      .map(email => email.trim())
      .filter(Boolean);

    if (recipients.length === 0) return;

    setLoading(true);
    try {
      const result = await api.sendBulkEmail({
        recipients,
        subject: bulkEmailForm.subject,
        body: bulkEmailForm.body || undefined,
        template: bulkEmailForm.template as any || undefined
      });

      saveToHistory({
        type: 'bulk',
        recipients,
        subject: bulkEmailForm.subject,
        template: bulkEmailForm.template || undefined,
        status: result.summary.failed === 0 ? 'sent' : 'failed',
        error: result.summary.failed > 0 ? `${result.summary.failed} emails failed` : undefined
      });

      // Reset form
      setBulkEmailForm({ recipients: '', subject: '', body: '', template: '' });
    } catch (error) {
      saveToHistory({
        type: 'bulk',
        recipients,
        subject: bulkEmailForm.subject,
        template: bulkEmailForm.template || undefined,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      sent: 'default',
      failed: 'destructive',
      pending: 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="w-5 h-5" />
              <span>Send Single Email</span>
            </CardTitle>
            <CardDescription>Send an email to a single recipient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="single-to">Recipient Email</Label>
              <Input
                id="single-to"
                type="email"
                value={singleEmailForm.to}
                onChange={(e) => setSingleEmailForm(prev => ({ ...prev, to: e.target.value }))}
                placeholder="recipient@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="single-subject">Subject</Label>
              <Input
                id="single-subject"
                value={singleEmailForm.subject}
                onChange={(e) => setSingleEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>

            <div>
              <Label htmlFor="single-template">Template (Optional)</Label>
              <Select 
                value={singleEmailForm.template} 
                onValueChange={(value) => setSingleEmailForm(prev => ({ ...prev, template: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template} value={template}>
                      {template.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="single-body">Body (Optional if using template)</Label>
              <Textarea
                id="single-body"
                value={singleEmailForm.body}
                onChange={(e) => setSingleEmailForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Email body content..."
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSendSingleEmail}
              disabled={loading || !singleEmailForm.to || !singleEmailForm.subject}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </CardContent>
        </Card>

        {/* Bulk Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
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
                placeholder="user1@example.com, user2@example.com, user3@example.com"
                rows={3}
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
              <Label htmlFor="bulk-template">Template (Optional)</Label>
              <Select 
                value={bulkEmailForm.template} 
                onValueChange={(value) => setBulkEmailForm(prev => ({ ...prev, template: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template} value={template}>
                      {template.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bulk-body">Body (Optional if using template)</Label>
              <Textarea
                id="bulk-body"
                value={bulkEmailForm.body}
                onChange={(e) => setBulkEmailForm(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Email body content..."
                rows={4}
              />
            </div>

            <Button 
              onClick={handleSendBulkEmail}
              disabled={loading || !bulkEmailForm.recipients || !bulkEmailForm.subject}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Bulk Email'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Notification History</span>
          </CardTitle>
          <CardDescription>Recent email notifications sent through the system</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((notification) => (
                <div key={notification.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(notification.status)}
                      <span className="font-medium">{notification.subject}</span>
                      {getStatusBadge(notification.status)}
                      <Badge variant="outline">
                        {notification.type === 'single' ? '1 recipient' : `${notification.recipients.length} recipients`}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {notification.timestamp.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <strong>Recipients:</strong> {notification.recipients.join(', ')}
                  </div>
                  
                  {notification.template && (
                    <div className="text-sm text-gray-600">
                      <strong>Template:</strong> {notification.template}
                    </div>
                  )}
                  
                  {notification.messageId && (
                    <div className="text-sm text-gray-600">
                      <strong>Message ID:</strong> {notification.messageId}
                    </div>
                  )}
                  
                  {notification.error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-700">
                        <strong>Error:</strong> {notification.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};