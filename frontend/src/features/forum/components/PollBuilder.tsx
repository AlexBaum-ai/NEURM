import React from 'react';
import { cn } from '@/lib/utils';
import { Plus, X, Calendar } from 'lucide-react';
import { Input } from '@/components/common/Input/Input';

interface PollOption {
  text: string;
  votes: number;
}

interface Poll {
  question: string;
  options: PollOption[];
  multipleChoice: boolean;
  expiresAt?: string;
}

interface PollBuilderProps {
  poll: Poll | null;
  onChange: (poll: Poll | null) => void;
  error?: string;
}

export const PollBuilder: React.FC<PollBuilderProps> = ({ poll, onChange, error }) => {
  const [isOpen, setIsOpen] = React.useState(!!poll);

  const createEmptyPoll = (): Poll => ({
    question: '',
    options: [
      { text: '', votes: 0 },
      { text: '', votes: 0 },
    ],
    multipleChoice: false,
  });

  const handleToggle = () => {
    if (isOpen) {
      onChange(null);
      setIsOpen(false);
    } else {
      onChange(createEmptyPoll());
      setIsOpen(true);
    }
  };

  const updateQuestion = (question: string) => {
    if (!poll) return;
    onChange({ ...poll, question });
  };

  const updateOption = (index: number, text: string) => {
    if (!poll) return;
    const newOptions = [...poll.options];
    newOptions[index] = { ...newOptions[index], text };
    onChange({ ...poll, options: newOptions });
  };

  const addOption = () => {
    if (!poll || poll.options.length >= 10) return;
    onChange({
      ...poll,
      options: [...poll.options, { text: '', votes: 0 }],
    });
  };

  const removeOption = (index: number) => {
    if (!poll || poll.options.length <= 2) return;
    const newOptions = poll.options.filter((_, i) => i !== index);
    onChange({ ...poll, options: newOptions });
  };

  const toggleMultipleChoice = () => {
    if (!poll) return;
    onChange({ ...poll, multipleChoice: !poll.multipleChoice });
  };

  const updateExpiresAt = (expiresAt: string) => {
    if (!poll) return;
    onChange({ ...poll, expiresAt: expiresAt || undefined });
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Add Poll (Optional)
        </label>
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            isOpen
              ? 'bg-accent-100 text-accent-700 hover:bg-accent-200 dark:bg-accent-900/30 dark:text-accent-300'
              : 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300'
          )}
        >
          {isOpen ? 'Remove Poll' : 'Add Poll'}
        </button>
      </div>

      {isOpen && poll && (
        <div className="space-y-4 rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          {/* Poll Question */}
          <div>
            <Input
              label="Poll Question"
              value={poll.question}
              onChange={(e) => updateQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              maxLength={255}
              required
            />
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {poll.question.length}/255 characters
            </p>
          </div>

          {/* Poll Options */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Options <span className="text-accent-500">*</span>
            </label>
            <div className="space-y-2">
              {poll.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    maxLength={200}
                    required
                  />
                  {poll.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="rounded-md p-2 text-accent-600 hover:bg-accent-100 dark:text-accent-400 dark:hover:bg-accent-900/30"
                      title="Remove option"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {poll.options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </button>
            )}

            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {poll.options.length} of 10 options (minimum 2)
            </p>
          </div>

          {/* Poll Settings */}
          <div className="space-y-3">
            {/* Multiple Choice */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={poll.multipleChoice}
                onChange={toggleMultipleChoice}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Allow multiple choices
              </span>
            </label>

            {/* Expiration Date */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="h-4 w-4" />
                Poll Expiration (Optional)
              </label>
              <input
                type="datetime-local"
                value={poll.expiresAt ? poll.expiresAt.slice(0, 16) : ''}
                onChange={(e) => updateExpiresAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900"
              />
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Leave empty for no expiration
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-accent-600 dark:text-accent-400">{error}</p>}
    </div>
  );
};

export default PollBuilder;
