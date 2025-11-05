import React, { useState } from 'react';
import { X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/common/Badge/Badge';
import type { JobFilters, LocationType, ExperienceLevel, EmploymentType } from '../types';
import { cn } from '@/lib/utils';

interface JobFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  onReset: () => void;
  className?: string;
}

const locationTypes: { value: LocationType; label: string }[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on_site', label: 'On-site' },
];

const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
];

const employmentTypes: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
];

const commonModels = [
  'GPT-4', 'GPT-3.5', 'Claude', 'Claude 2', 'Claude 3',
  'Llama 2', 'Llama 3', 'Gemini', 'PaLM 2', 'Mistral',
];

const commonFrameworks = [
  'LangChain', 'LlamaIndex', 'Haystack', 'Semantic Kernel',
  'AutoGen', 'CrewAI', 'LangGraph', 'DSPy',
];

const FilterSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-900 dark:text-white mb-3"
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="space-y-2">{children}</div>}
    </div>
  );
};

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  className,
}) => {
  const handleLocationTypeToggle = (type: LocationType) => {
    const current = filters.locationType || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, locationType: updated.length > 0 ? updated : undefined });
  };

  const handleExperienceLevelToggle = (level: ExperienceLevel) => {
    const current = filters.experienceLevel || [];
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    onFiltersChange({ ...filters, experienceLevel: updated.length > 0 ? updated : undefined });
  };

  const handleEmploymentTypeToggle = (type: EmploymentType) => {
    const current = filters.employmentType || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, employmentType: updated.length > 0 ? updated : undefined });
  };

  const handleModelToggle = (model: string) => {
    const current = filters.model || [];
    const updated = current.includes(model)
      ? current.filter((m) => m !== model)
      : [...current, model];
    onFiltersChange({ ...filters, model: updated.length > 0 ? updated : undefined });
  };

  const handleFrameworkToggle = (framework: string) => {
    const current = filters.framework || [];
    const updated = current.includes(framework)
      ? current.filter((f) => f !== framework)
      : [...current, framework];
    onFiltersChange({ ...filters, framework: updated.length > 0 ? updated : undefined });
  };

  const activeFiltersCount = [
    filters.locationType?.length || 0,
    filters.experienceLevel?.length || 0,
    filters.employmentType?.length || 0,
    filters.model?.length || 0,
    filters.framework?.length || 0,
    filters.salaryMin ? 1 : 0,
    filters.hasVisaSponsorship ? 1 : 0,
    filters.location ? 1 : 0,
    filters.minMatchScore ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Location Search */}
      <FilterSection title="Location">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="City or country"
            value={filters.location || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                location: e.target.value || undefined,
              })
            }
            className="pl-9"
          />
        </div>
      </FilterSection>

      {/* Remote Type */}
      <FilterSection title="Work Setting">
        {locationTypes.map((type) => (
          <label key={type.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.locationType?.includes(type.value) || false}
              onChange={() => handleLocationTypeToggle(type.value)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {type.label}
            </span>
          </label>
        ))}
      </FilterSection>

      {/* Experience Level */}
      <FilterSection title="Experience Level">
        {experienceLevels.map((level) => (
          <label key={level.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.experienceLevel?.includes(level.value) || false}
              onChange={() => handleExperienceLevelToggle(level.value)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {level.label}
            </span>
          </label>
        ))}
      </FilterSection>

      {/* Employment Type */}
      <FilterSection title="Employment Type">
        {employmentTypes.map((type) => (
          <label key={type.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.employmentType?.includes(type.value) || false}
              onChange={() => handleEmploymentTypeToggle(type.value)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {type.label}
            </span>
          </label>
        ))}
      </FilterSection>

      {/* Salary Range */}
      <FilterSection title="Minimum Salary">
        <Input
          type="number"
          placeholder="Min (e.g., 80000)"
          value={filters.salaryMin || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              salaryMin: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </FilterSection>

      {/* LLM Models */}
      <FilterSection title="LLM Models" defaultOpen={false}>
        {commonModels.map((model) => (
          <label key={model} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.model?.includes(model) || false}
              onChange={() => handleModelToggle(model)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{model}</span>
          </label>
        ))}
      </FilterSection>

      {/* Frameworks */}
      <FilterSection title="Frameworks" defaultOpen={false}>
        {commonFrameworks.map((framework) => (
          <label key={framework} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.framework?.includes(framework) || false}
              onChange={() => handleFrameworkToggle(framework)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{framework}</span>
          </label>
        ))}
      </FilterSection>

      {/* Visa Sponsorship */}
      <FilterSection title="Other">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasVisaSponsorship || false}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                hasVisaSponsorship: e.target.checked || undefined,
              })
            }
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Visa Sponsorship
          </span>
        </label>
      </FilterSection>

      {/* Match Score Filter */}
      <FilterSection title="Match Score">
        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Minimum Match Score (%)
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            step="10"
            placeholder="e.g., 70"
            value={filters.minMatchScore || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minMatchScore: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Only show jobs with a match score above this threshold
          </p>
        </div>
      </FilterSection>
    </div>
  );
};
