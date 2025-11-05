import React from 'react';
import { Brain, Code, Database, Cloud, Layers } from 'lucide-react';
import type { UserProfile, LLMModel } from '../types';

interface LLMExperienceSectionProps {
  profile: UserProfile;
}

/**
 * LLMExperienceSection - Display candidate's LLM technology experience
 *
 * Shows:
 * - Models worked with (proficiency stars)
 * - Frameworks (LangChain, LlamaIndex, etc.)
 * - Vector databases
 * - Cloud platforms
 * - Programming languages
 * - Use case types
 */
export const LLMExperienceSection: React.FC<LLMExperienceSectionProps> = ({ profile }) => {
  const { llmExperience } = profile;

  // Don't render if no LLM experience data
  if (!llmExperience || (
    llmExperience.models.length === 0 &&
    llmExperience.frameworks.length === 0 &&
    llmExperience.vectorDatabases.length === 0 &&
    llmExperience.cloudPlatforms.length === 0 &&
    llmExperience.programmingLanguages.length === 0 &&
    llmExperience.useCaseTypes.length === 0
  )) {
    return null;
  }

  const renderStars = (proficiency: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= proficiency
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderModelCard = (model: LLMModel) => (
    <div
      key={`${model.provider}-${model.name}`}
      className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{model.provider}</div>
        {model.category && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{model.category}</div>
        )}
      </div>
      <div className="ml-3">{renderStars(model.proficiency)}</div>
    </div>
  );

  const renderBadgeList = (items: string[], icon: React.ReactNode, title: string) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {icon}
          <span>{title}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">LLM Experience</h2>
      </div>

      <div className="space-y-6">
        {/* Models */}
        {llmExperience.models.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Models & Proficiency
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {llmExperience.models.map(renderModelCard)}
            </div>
          </div>
        )}

        {/* Frameworks */}
        {renderBadgeList(
          llmExperience.frameworks,
          <Layers className="w-4 h-4" />,
          'Frameworks & Libraries'
        )}

        {/* Vector Databases */}
        {renderBadgeList(
          llmExperience.vectorDatabases,
          <Database className="w-4 h-4" />,
          'Vector Databases'
        )}

        {/* Cloud Platforms */}
        {renderBadgeList(
          llmExperience.cloudPlatforms,
          <Cloud className="w-4 h-4" />,
          'Cloud Platforms'
        )}

        {/* Programming Languages */}
        {renderBadgeList(
          llmExperience.programmingLanguages,
          <Code className="w-4 h-4" />,
          'Programming Languages'
        )}

        {/* Use Case Types */}
        {renderBadgeList(
          llmExperience.useCaseTypes,
          <Brain className="w-4 h-4" />,
          'Use Cases'
        )}
      </div>
    </div>
  );
};

export default LLMExperienceSection;
