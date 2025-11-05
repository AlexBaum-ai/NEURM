import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
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
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  minHeight?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  error,
  label = 'Content',
  placeholder = 'Write your content here... (Markdown supported)',
  minHeight = '300px',
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
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getText() ? editor.getHTML() : '');
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4',
          error && 'border-accent-500'
        ),
      },
    },
  });

  // Update editor content when value changes externally
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = React.useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} <span className="text-accent-500">*</span>
        </label>
      )}
      <div
        className={cn(
          'overflow-hidden rounded-md border bg-white dark:bg-gray-900',
          error ? 'border-accent-500' : 'border-gray-300 dark:border-gray-700'
        )}
      >
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
        <EditorContent
          editor={editor}
          style={{ minHeight }}
          className="overflow-y-auto"
        />
      </div>
      {error && <p className="mt-1 text-sm text-accent-600 dark:text-accent-400">{error}</p>}
    </div>
  );
};

export default MarkdownEditor;
