import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  maxLength?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  error,
  label,
  maxLength = 2000,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline hover:text-primary-700',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-3 py-2',
      },
    },
  });

  const currentLength = editor?.getText().length || 0;

  const setLink = React.useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

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
          {label}
        </label>
      )}

      <div
        className={cn(
          'rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900',
          error && 'border-accent-500'
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b border-gray-300 dark:border-gray-700 p-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
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
              'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
              editor.isActive('italic') && 'bg-gray-200 dark:bg-gray-700'
            )}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
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
              'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
              editor.isActive('orderedList') && 'bg-gray-200 dark:bg-gray-700'
            )}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
          <button
            type="button"
            onClick={setLink}
            className={cn(
              'p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
              editor.isActive('link') && 'bg-gray-200 dark:bg-gray-700'
            )}
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>

          <div className="ml-auto text-xs text-gray-500">
            {currentLength}/{maxLength}
          </div>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>

      {error && (
        <p className="mt-1 text-sm text-accent-600 dark:text-accent-400">{error}</p>
      )}
    </div>
  );
};

export default RichTextEditor;
