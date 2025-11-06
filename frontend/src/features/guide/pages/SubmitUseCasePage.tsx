import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Send, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import RichTextEditor from '@/components/editors/RichTextEditor';
import { Select } from '@/components/forms';
import { useSubmitUseCase } from '../hooks/useUseCases';
import type { SubmitUseCaseData, ResultsMetrics } from '../types';

const CATEGORIES = [
  { value: 'NLP', label: 'Natural Language Processing' },
  { value: 'COMPUTER_VISION', label: 'Computer Vision' },
  { value: 'AUTOMATION', label: 'Automation & Workflow' },
  { value: 'ANALYTICS', label: 'Analytics & Insights' },
  { value: 'CODE_GENERATION', label: 'Code Generation' },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service' },
  { value: 'CONTENT_CREATION', label: 'Content Creation' },
  { value: 'OTHER', label: 'Other' },
];

const INDUSTRIES = [
  { value: 'TECH', label: 'Technology' },
  { value: 'FINANCE', label: 'Finance & Banking' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'RETAIL', label: 'Retail & E-commerce' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'MEDIA', label: 'Media & Entertainment' },
  { value: 'CONSULTING', label: 'Consulting' },
  { value: 'OTHER', label: 'Other' },
];

const IMPLEMENTATION_TYPES = [
  { value: 'FULL_INTEGRATION', label: 'Full Integration' },
  { value: 'PILOT', label: 'Pilot Program' },
  { value: 'PROOF_OF_CONCEPT', label: 'Proof of Concept' },
  { value: 'RESEARCH', label: 'Research' },
];

const COMPANY_SIZES = [
  { value: 'STARTUP', label: 'Startup (1-50)' },
  { value: 'SME', label: 'SME (51-500)' },
  { value: 'ENTERPRISE', label: 'Enterprise (500+)' },
];

const SubmitUseCasePage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: submitUseCase, isPending } = useSubmitUseCase();

  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState<SubmitUseCaseData>({
    title: '',
    summary: '',
    companyName: '',
    companySize: '',
    industry: '',
    category: '',
    implementationType: '',
    problemStatement: '',
    solutionDescription: '',
    architectureDetails: '',
    implementationDetails: '',
    challengesFaced: '',
    lessonsLearned: '',
    recommendedPractices: '',
    resourceLinks: '',
    techStack: [],
    relatedModels: [],
    resultsMetrics: [],
    hasCode: false,
    hasROI: false,
  });

  const [techInput, setTechInput] = useState('');
  const [metricInput, setMetricInput] = useState<ResultsMetrics>({
    metric: '',
    value: '',
    improvement: '',
  });

  const handleInputChange = (field: keyof SubmitUseCaseData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTech = () => {
    if (techInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        techStack: [...prev.techStack, techInput.trim()],
      }));
      setTechInput('');
    }
  };

  const handleRemoveTech = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.filter((_, i) => i !== index),
    }));
  };

  const handleAddMetric = () => {
    if (metricInput.metric && metricInput.value) {
      setFormData((prev) => ({
        ...prev,
        resultsMetrics: [...(prev.resultsMetrics || []), metricInput],
      }));
      setMetricInput({ metric: '', value: '', improvement: '' });
    }
  };

  const handleRemoveMetric = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      resultsMetrics: prev.resultsMetrics?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitUseCase(formData, {
      onSuccess: (response) => {
        navigate(`/guide/use-cases/${response.slug}`);
      },
    });
  };

  const isFormValid =
    formData.title &&
    formData.summary &&
    formData.industry &&
    formData.category &&
    formData.implementationType &&
    formData.techStack.length > 0;

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowPreview(false)}
                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isPending ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Preview</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {formData.title}
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">{formData.summary}</p>

            {formData.companyName && (
              <div className="mb-4">
                <span className="font-medium">Company:</span> {formData.companyName} •{' '}
                {formData.industry}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {formData.techStack.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                >
                  {tech}
                </span>
              ))}
            </div>

            {formData.problemStatement && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-3">The Problem</h2>
                <div
                  className="prose dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: formData.problemStatement }}
                />
              </div>
            )}

            {formData.solutionDescription && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-3">Solution</h2>
                <div
                  className="prose dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: formData.solutionDescription }}
                />
              </div>
            )}

            {formData.resultsMetrics && formData.resultsMetrics.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-3">Results</h2>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
                  {formData.resultsMetrics.map((metric, idx) => (
                    <div key={idx}>
                      <strong>{metric.metric}:</strong> {metric.value}
                      {metric.improvement && <span className="ml-2">({metric.improvement})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/guide/use-cases"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Use Cases
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Submit Use Case
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your LLM implementation story with the community
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h2>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="e.g., AI-Powered Customer Support with GPT-4"
              />
            </div>

            {/* Summary */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Summary *
              </label>
              <textarea
                required
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Brief overview of your use case (2-3 sentences)"
              />
            </div>

            {/* Company Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Size
                </label>
                <Select
                  value={formData.companySize || ''}
                  onChange={(e) => handleInputChange('companySize', e.target.value)}
                >
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Industry, Category, Implementation Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Industry *
                </label>
                <Select
                  required
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                >
                  <option value="">Select</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <Select
                  required
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="">Select</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type *
                </label>
                <Select
                  required
                  value={formData.implementationType}
                  onChange={(e) => handleInputChange('implementationType', e.target.value)}
                >
                  <option value="">Select</option>
                  {IMPLEMENTATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Tech Stack */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tech Stack * (add at least one)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTech();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="e.g., GPT-4, LangChain, Python"
                />
                <button
                  type="button"
                  onClick={handleAddTech}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.techStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(idx)}
                      className="hover:text-primary-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Detailed Description
            </h2>

            <div className="space-y-4">
              <RichTextEditor
                label="Problem Statement"
                value={formData.problemStatement || ''}
                onChange={(value) => handleInputChange('problemStatement', value)}
                placeholder="Describe the problem you were trying to solve..."
              />

              <RichTextEditor
                label="Solution Description"
                value={formData.solutionDescription || ''}
                onChange={(value) => handleInputChange('solutionDescription', value)}
                placeholder="How did you solve it?"
              />

              <RichTextEditor
                label="Architecture Details"
                value={formData.architectureDetails || ''}
                onChange={(value) => handleInputChange('architectureDetails', value)}
                placeholder="Technical architecture and design..."
              />

              <RichTextEditor
                label="Implementation Details"
                value={formData.implementationDetails || ''}
                onChange={(value) => handleInputChange('implementationDetails', value)}
                placeholder="How was it implemented?"
              />

              <RichTextEditor
                label="Challenges Faced"
                value={formData.challengesFaced || ''}
                onChange={(value) => handleInputChange('challengesFaced', value)}
                placeholder="What challenges did you encounter?"
              />

              <RichTextEditor
                label="Lessons Learned"
                value={formData.lessonsLearned || ''}
                onChange={(value) => handleInputChange('lessonsLearned', value)}
                placeholder="What did you learn?"
              />

              <RichTextEditor
                label="Recommended Practices"
                value={formData.recommendedPractices || ''}
                onChange={(value) => handleInputChange('recommendedPractices', value)}
                placeholder="Tips and best practices..."
              />

              <RichTextEditor
                label="Resources & Links"
                value={formData.resourceLinks || ''}
                onChange={(value) => handleInputChange('resourceLinks', value)}
                placeholder="Helpful resources, documentation, etc."
              />
            </div>
          </div>

          {/* Results Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Results & Metrics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                value={metricInput.metric}
                onChange={(e) => setMetricInput({ ...metricInput, metric: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Metric name"
              />
              <input
                type="text"
                value={metricInput.value}
                onChange={(e) => setMetricInput({ ...metricInput, value: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Value"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={metricInput.improvement || ''}
                  onChange={(e) =>
                    setMetricInput({ ...metricInput, improvement: e.target.value })
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Improvement %"
                />
                <button
                  type="button"
                  onClick={handleAddMetric}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {formData.resultsMetrics?.map((metric, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                >
                  <div>
                    <strong>{metric.metric}:</strong> {metric.value}
                    {metric.improvement && <span className="ml-2">({metric.improvement})</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMetric(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hasCode}
                  onChange={(e) => handleInputChange('hasCode', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Includes code examples
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hasROI}
                  onChange={(e) => handleInputChange('hasROI', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Includes ROI data</span>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={!isFormValid}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <Eye className="h-5 w-5" />
              Preview
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              {isPending ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitUseCasePage;
