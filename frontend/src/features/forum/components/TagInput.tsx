import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  suggestions?: string[];
  error?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  maxTags = 5,
  suggestions = [],
  error,
}) => {
  const [input, setInput] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = React.useMemo(() => {
    if (!input) return [];
    return suggestions
      .filter((tag) =>
        tag.toLowerCase().includes(input.toLowerCase()) &&
        !tags.includes(tag)
      )
      .slice(0, 10);
  }, [input, suggestions, tags]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();

    if (!trimmedTag) return;
    if (tags.length >= maxTags) return;
    if (tags.includes(trimmedTag)) return;
    if (trimmedTag.length > 50) return;

    onChange([...tags, trimmedTag]);
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onChange(newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setShowSuggestions(value.length > 0);
  };

  const handleBlur = () => {
    // Delay to allow clicking on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tags (Optional)
      </label>

      {/* Tag Display */}
      <div
        className={cn(
          'relative flex min-h-[42px] w-full flex-wrap gap-2 rounded-md border bg-white px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2 dark:bg-gray-900',
          error ? 'border-accent-500' : 'border-gray-300 dark:border-gray-700'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="rounded-full hover:bg-primary-200 dark:hover:bg-primary-800"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => input && setShowSuggestions(true)}
            onBlur={handleBlur}
            placeholder={tags.length === 0 ? 'Add tags (press Enter)' : ''}
            className="min-w-[120px] flex-1 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            maxLength={50}
          />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="relative">
          <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addTag(suggestion)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        {tags.length} of {maxTags} tags • Press Enter to add • Max 50 characters per tag
      </p>

      {error && <p className="mt-1 text-sm text-accent-600 dark:text-accent-400">{error}</p>}
    </div>
  );
};

export default TagInput;
