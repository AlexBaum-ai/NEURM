import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Eye, Settings, History, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Card } from '@/components/common/Card/Card';
import {
  RecipientList,
  TemplateSelector,
  TemplateManager,
} from '../components/messaging';
import {
  getMessageTemplates,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  sendBulkMessages,
  getRateLimitStatus,
  getBulkMessageHistory,
} from '../api/companiesApi';
import type {
  MessageTemplate,
  Recipient,
  CreateTemplateRequest,
} from '../types';

export const BulkMessagesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history'>('compose');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Queries
  const { data: templates = [] } = useSuspenseQuery({
    queryKey: ['message-templates'],
    queryFn: getMessageTemplates,
  });

  const { data: rateLimit } = useSuspenseQuery({
    queryKey: ['rate-limit'],
    queryFn: getRateLimitStatus,
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: historyData } = useSuspenseQuery({
    queryKey: ['bulk-message-history'],
    queryFn: () => getBulkMessageHistory(1, 10),
    enabled: activeTab === 'history',
  });

  // Mutations
  const sendMessagesMutation = useMutation({
    mutationFn: sendBulkMessages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-limit'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-message-history'] });
      setRecipients([]);
      setSubject('');
      setBody('');
      setSelectedTemplateId(null);
      setShowConfirmDialog(false);
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: createMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTemplateRequest }) =>
      updateMessageTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: deleteMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
  });

  // Handlers
  const handleTemplateSelect = (template: MessageTemplate | null) => {
    if (template) {
      setSelectedTemplateId(template.id);
      setSubject(template.subject);
      setBody(template.body);
    } else {
      setSelectedTemplateId(null);
    }
  };

  const handleRemoveRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSendMessages = async () => {
    if (recipients.length === 0 || !subject || !body) {
      return;
    }

    await sendMessagesMutation.mutateAsync({
      templateId: selectedTemplateId || undefined,
      subject,
      body,
      recipientIds: recipients.map((r) => r.id),
    });
  };

  const handleCreateTemplate = async (data: CreateTemplateRequest) => {
    await createTemplateMutation.mutateAsync(data);
  };

  const handleUpdateTemplate = async (id: string, data: CreateTemplateRequest) => {
    await updateTemplateMutation.mutateAsync({ id, data });
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplateMutation.mutateAsync(id);
  };

  // Preview with sample data
  const previewData = useMemo(() => {
    const sampleRecipient = recipients[0] || {
      name: 'John Doe',
      username: 'johndoe',
      skills: ['GPT-4', 'LangChain', 'Python'],
      experience: '5 years',
      location: 'San Francisco, CA',
    };

    const replacements = {
      '{{candidate_name}}': sampleRecipient.name,
      '{{candidate_username}}': sampleRecipient.username,
      '{{candidate_skills}}': sampleRecipient.skills.join(', '),
      '{{candidate_experience}}': sampleRecipient.experience,
      '{{candidate_location}}': sampleRecipient.location,
      '{{job_title}}': 'Senior LLM Engineer',
      '{{company_name}}': 'Your Company',
    };

    let previewSubject = subject;
    let previewBody = body;

    Object.entries(replacements).forEach(([key, value]) => {
      previewSubject = previewSubject.replace(new RegExp(key, 'g'), value);
      previewBody = previewBody.replace(new RegExp(key, 'g'), value);
    });

    return { subject: previewSubject, body: previewBody };
  }, [subject, body, recipients]);

  const canSend = recipients.length > 0 && subject && body && rateLimit && rateLimit.remaining > 0;

  return (
    <>
      <Helmet>
        <title>Bulk Messaging - Company Dashboard | Neurmatic</title>
        <meta name="description" content="Send templated messages to multiple candidates" />
      </Helmet>

      <div className="container-custom py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bulk Messaging
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Send personalized messages to multiple candidates at once
          </p>
        </div>

        {/* Rate Limit Warning */}
        {rateLimit && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              rateLimit.remaining < 10
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle
                className={`w-5 h-5 ${
                  rateLimit.remaining < 10
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  rateLimit.remaining < 10
                    ? 'text-red-800 dark:text-red-300'
                    : 'text-blue-800 dark:text-blue-300'
                }`}
              >
                {rateLimit.remaining}/{rateLimit.limit} messages remaining today
                {rateLimit.remaining === 0 &&
                  ` (resets ${new Date(rateLimit.resetsAt).toLocaleString()})`}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('compose')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'compose'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              Compose
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Manage Templates
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <History className="w-4 h-4 inline mr-2" />
              History
            </button>
          </nav>
        </div>

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Composer */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <TemplateSelector
                    templates={templates}
                    selectedTemplateId={selectedTemplateId}
                    onSelect={handleTemplateSelect}
                  />

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Subject
                    </label>
                    <Input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter message subject"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="body"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Message Body
                    </label>
                    <textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Hi {{candidate_name}},&#10;&#10;We're interested in your profile...&#10;&#10;Available variables: {{candidate_name}}, {{candidate_username}}, {{candidate_skills}}, {{candidate_experience}}, {{candidate_location}}, {{job_title}}, {{company_name}}"
                      rows={12}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Use variables like {'{'}
                      {'{'}candidate_name{'}'}
                      {'}'} for personalization
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowPreview(!showPreview)}
                      variant="outline"
                      disabled={!subject || !body}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showPreview ? 'Hide Preview' : 'Preview'}
                    </Button>
                    <Button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={!canSend}
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send to {recipients.length} Recipient{recipients.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Preview */}
              {showPreview && (
                <Card className="p-6 bg-gray-50 dark:bg-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Message Preview
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subject:
                      </p>
                      <p className="text-gray-900 dark:text-white">{previewData.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Body:
                      </p>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {previewData.body}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Preview uses{' '}
                    {recipients.length > 0 ? 'first recipient data' : 'sample data'}
                  </p>
                </Card>
              )}
            </div>

            {/* Recipients Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <RecipientList recipients={recipients} onRemove={handleRemoveRecipient} />
              </Card>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <Card className="p-6">
            <TemplateManager
              templates={templates}
              onCreateTemplate={handleCreateTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          </Card>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sent Messages
            </h3>
            {historyData && historyData.messages.length > 0 ? (
              <div className="space-y-3">
                {historyData.messages.map((message) => (
                  <div
                    key={message.id}
                    className="border border-gray-300 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {message.subject}
                        </p>
                        {message.templateName && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Template: {message.templateName}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(message.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {message.body}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Sent to {message.recipientCount} recipient
                      {message.recipientCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No messages sent yet
              </p>
            )}
          </Card>
        )}

        {/* Confirm Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Send
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to send this message to {recipients.length} recipient
                {recipients.length !== 1 ? 's' : ''}?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleSendMessages}
                  disabled={sendMessagesMutation.isPending}
                  className="flex-1"
                >
                  {sendMessagesMutation.isPending ? 'Sending...' : 'Confirm & Send'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={sendMessagesMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
              {sendMessagesMutation.isSuccess && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-800 dark:text-green-300">
                      Messages sent successfully!
                    </p>
                  </div>
                </div>
              )}
              {sendMessagesMutation.isError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    Failed to send messages. Please try again.
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  );
};
