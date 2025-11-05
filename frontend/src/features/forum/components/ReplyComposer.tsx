/**
 * ReplyComposer Component
 * Markdown editor for creating and editing replies with @mention support
 */

import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Code2,
  Send,
  X,
} from 'lucide-react';
import { QuoteBlock } from './QuoteBlock';
import type { QuotedReply } from '../types';

interface ReplyComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  quotedReply?: QuotedReply | null;
  onRemoveQuote?: () => void;
  placeholder?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
}

// Mock mention suggestion list - in real app, fetch from API
const getMentionSuggestions = async (query: string): Promise<Array<{ id: string; label: string }>> => {
  // TODO: Replace with actual API call to search users
  const mockUsers = [
    { id: '1', label: '@user1' },
    { id: '2', label: '@user2' },
    { id: '3', label: '@johndoe' },
    { id: '4', label: '@janedoe' },
  ];

  if (!query) return mockUsers;

  return mockUsers.filter(user =>
    user.label.toLowerCase().includes(query.toLowerCase())
  );
};

export const ReplyComposer: React.FC<ReplyComposerProps> = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  quotedReply,
  onRemoveQuote,
  placeholder = 'Write your reply... (Markdown supported, use @ to mention users)',
  submitLabel = 'Post Reply',
  isSubmitting = false,
  autoFocus = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 hover:underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention text-primary-600 font-medium',
        },
        suggestion: {
          items: ({ query }: { query: string }) => getMentionSuggestions(query),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          render: () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let component: any;

            return {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onStart: (props: any) => {
                component = document.createElement('div');
                component.className = 'mention-dropdown';
                component.innerHTML = '<div class="loading">Loading...</div>';

                if (props.clientRect) {
                  const rect = props.clientRect();
                  if (rect) {
                    component.style.top = `${rect.bottom}px`;
                    component.style.left = `${rect.left}px`;
                  }
                }

                document.body.appendChild(component);
              },

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onUpdate(props: any) {
                const items = props.items;

                if (items.length) {
                  component.innerHTML = items
                    .map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (item: any) =>
                        `<div class="mention-item" data-id="${item.id}">${item.label}</div>`
                    )
                    .join('');

                  const mentionItems = component.querySelectorAll('.mention-item');
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  mentionItems.forEach((el: any, index: number) => {
                    el.addEventListener('click', () => {
                      props.command({ id: items[index].id, label: items[index].label });
                    });
                  });
                } else {
                  component.innerHTML = '<div class="no-results">No users found</div>';
                }
              },

              onExit() {
                if (component && component.parentNode) {
                  component.parentNode.removeChild(component);
                }
              },
            };
          },
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getText() ? editor.getHTML() : '');
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4 min-h-[150px]',
      },
    },
    autofocus: autoFocus ? 'end' : false,
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor?.getText().trim() || isSubmitting) return;
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Cmd+Enter or Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" onKeyDown={handleKeyDown}>
      {quotedReply && onRemoveQuote && (
        <QuoteBlock quotedReply={quotedReply} onRemove={onRemoveQuote} />
      )}

      <div className="overflow-hidden rounded-md border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('bold') && 'bg-gray-200 dark:bg-gray-700'
            )}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('italic') && 'bg-gray-200 dark:bg-gray-700'
            )}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              'rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('code') && 'bg-gray-200 dark:bg-gray-700'
            )}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              'rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('codeBlock') && 'bg-gray-200 dark:bg-gray-700'
            )}
            title="Code Block"
          >
            <Code2 className="h-4 w-4" />
          </button>
          <div className="mx-2 w-px bg-gray-300 dark:bg-gray-600" />
          <button
            type="button"
            onClick={setLink}
            className={cn(
              'rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('link') && 'bg-gray-200 dark:bg-gray-700'
            )}
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          <div className="mx-2 w-px bg-gray-300 dark:bg-gray-600" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('bulletList') && 'bg-gray-200 dark:bg-gray-700'
            )}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('orderedList') && 'bg-gray-200 dark:bg-gray-700'
            )}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              'rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700',
              editor.isActive('blockquote') && 'bg-gray-200 dark:bg-gray-700'
            )}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>
          <div className="mx-2 w-px bg-gray-300 dark:bg-gray-600" />
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rounded p-2 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rounded p-2 hover:bg-gray-200 disabled:opacity-50 dark:hover:bg-gray-700"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} className="overflow-y-auto" />
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tip: Use <kbd className="rounded border bg-gray-100 px-1 dark:bg-gray-800">@</kbd> to mention users,{' '}
          <kbd className="rounded border bg-gray-100 px-1 dark:bg-gray-800">Cmd+Enter</kbd> to submit
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!editor.getText().trim() || isSubmitting}
            className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Posting...' : submitLabel}
          </button>
        </div>
      </div>

      {/* Mention Dropdown Styles */}
      <style>{`
        .mention-dropdown {
          position: absolute;
          z-index: 50;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          max-height: 200px;
          overflow-y: auto;
          min-width: 150px;
        }

        .dark .mention-dropdown {
          background: #1f2937;
          border-color: #374151;
        }

        .mention-item {
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .mention-item:hover {
          background: #f3f4f6;
        }

        .dark .mention-item:hover {
          background: #374151;
        }

        .mention-dropdown .loading,
        .mention-dropdown .no-results {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .mention {
          color: #2563eb;
          font-weight: 500;
        }

        .dark .mention {
          color: #60a5fa;
        }
      `}</style>
    </form>
  );
};

export default ReplyComposer;
