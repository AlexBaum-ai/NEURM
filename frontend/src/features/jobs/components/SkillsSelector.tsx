import React, { useState } from 'react';
import { Plus, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JobSkill } from '../types';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import { Select } from '@/components/forms/Select';

interface SkillsSelectorProps {
  skills: JobSkill[];
  onChange: (skills: JobSkill[]) => void;
  error?: string;
}

const SKILL_TYPES = [
  { value: 'prompt_engineering', label: 'Prompt Engineering' },
  { value: 'fine_tuning', label: 'Fine-Tuning' },
  { value: 'rag', label: 'RAG' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'deployment', label: 'Deployment' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'other', label: 'Other' }
];

const SkillsSelector: React.FC<SkillsSelectorProps> = ({ skills, onChange, error }) => {
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillType, setNewSkillType] = useState('prompt_engineering');
  const [newSkillLevel, setNewSkillLevel] = useState(3);

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;

    const newSkill: JobSkill = {
      skillName: newSkillName.trim(),
      skillType: newSkillType as any,
      requiredLevel: newSkillLevel
    };

    onChange([...skills, newSkill]);
    setNewSkillName('');
    setNewSkillType('prompt_engineering');
    setNewSkillLevel(3);
  };

  const handleRemoveSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const handleUpdateLevel = (index: number, level: number) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = { ...updatedSkills[index], requiredLevel: level };
    onChange(updatedSkills);
  };

  const renderStarRating = (level: number, onSelect?: (level: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onSelect?.(star)}
            className={cn(
              'transition-colors',
              onSelect && 'cursor-pointer hover:text-yellow-500',
              !onSelect && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                'h-5 w-5',
                star <= level
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300 dark:text-gray-600'
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Add Skill Form */}
      <div className="rounded-lg border border-gray-300 dark:border-gray-700 p-4 space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Add Required Skill</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Skill Name"
            placeholder="e.g., Prompt Engineering, RAG"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill();
              }
            }}
          />

          <Select
            label="Skill Category"
            value={newSkillType}
            onChange={(e) => setNewSkillType(e.target.value)}
            options={SKILL_TYPES}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Required Proficiency Level
          </label>
          <div className="flex items-center gap-4">
            {renderStarRating(newSkillLevel, setNewSkillLevel)}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {newSkillLevel === 1 && 'Basic'}
              {newSkillLevel === 2 && 'Elementary'}
              {newSkillLevel === 3 && 'Intermediate'}
              {newSkillLevel === 4 && 'Advanced'}
              {newSkillLevel === 5 && 'Expert'}
            </span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAddSkill}
          variant="secondary"
          disabled={!newSkillName.trim()}
          className="w-full md:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Skill
        </Button>
      </div>

      {/* Skills List */}
      {skills.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Required Skills ({skills.length}/20)
          </h4>
          <div className="space-y-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {skill.skillName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                      {SKILL_TYPES.find((t) => t.value === skill.skillType)?.label || skill.skillType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStarRating(skill.requiredLevel, (level) => handleUpdateLevel(index, level))}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (Click to change level)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(index)}
                  className="ml-4 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Remove skill"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {skills.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No skills added yet. Add at least one required skill.
        </p>
      )}
    </div>
  );
};

export default SkillsSelector;
