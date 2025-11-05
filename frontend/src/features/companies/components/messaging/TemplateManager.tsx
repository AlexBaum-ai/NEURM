import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import type { MessageTemplate, CreateTemplateRequest } from '../../types';

interface TemplateManagerProps {
  templates: MessageTemplate[];
  onCreateTemplate: (data: CreateTemplateRequest) => Promise<void>;
  onUpdateTemplate: (id: string, data: CreateTemplateRequest) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
}

interface TemplateFormData {
  name: string;
  subject: string;
  body: string;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    subject: '',
    body: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({ name: '', subject: '', body: '' });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (template: MessageTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
    });
    setEditingId(template.id);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingId) {
        await onUpdateTemplate(editingId, formData);
      } else {
        await onCreateTemplate(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await onDeleteTemplate(id);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const showForm = isCreating || editingId !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Message Templates
        </h3>
        {!showForm && (
          <Button onClick={handleStartCreate} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <div className="space-y-4">
            <div>
              <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Name
              </label>
              <Input
                id="template-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Interview Invitation"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="template-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <Input
                id="template-subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Use {{candidate_name}}, {{job_title}}, etc."
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="template-body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message Body
              </label>
              <textarea
                id="template-body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Hi {{candidate_name}},&#10;&#10;We're impressed with your {{candidate_skills}}...&#10;&#10;Available variables: {{candidate_name}}, {{candidate_username}}, {{candidate_skills}}, {{candidate_experience}}, {{candidate_location}}, {{job_title}}, {{company_name}}"
                rows={8}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Available variables: {'{'}
                {'{'}candidate_name{'}'}{'}'},  {'{'}
                {'{'}candidate_username{'}'}{'}'},  {'{'}
                {'{'}candidate_skills{'}'}{'}'},  {'{'}
                {'{'}candidate_experience{'}'}{'}'},  {'{'}
                {'{'}candidate_location{'}'}{'}'},  {'{'}
                {'{'}job_title{'}'}{'}'},  {'{'}
                {'{'}company_name{'}'}
                {'}'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : editingId ? 'Update Template' : 'Create Template'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {templates.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No templates yet. Create one to get started.
          </p>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Subject: {template.subject}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
                    {template.body}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(template)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
