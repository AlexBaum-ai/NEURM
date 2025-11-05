import React, { useCallback, useRef, useState } from 'react';
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
  Paperclip,
  Send,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button/Button';

interface MessageComposerProps {
  onSend: (content: string, attachments?: File[]) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3 min-h-[60px] max-h-[200px] overflow-y-auto',
      },
    },
    editable: !disabled,
  });

  const handleSend = useCallback(async () => {
    if (!editor || isSending) return;

    const content = editor.getHTML();
    const text = editor.getText().trim();

    if (!text && attachments.length === 0) return;

    setIsSending(true);
    try {
      await onSend(content, attachments);
      editor.commands.clearContent();
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [editor, onSend, attachments, isSending]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 5)); // Max 5 files
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  if (!editor) return null;

  return (
    <div className="border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
              >
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="hover:text-accent-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
            editor.isActive('bold') && 'bg-gray-200 dark:bg-gray-700'
          )}
          title="Bold"
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
            editor.isActive('italic') && 'bg-gray-200 dark:bg-gray-700'
          )}
          title="Italic"
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
            editor.isActive('bulletList') && 'bg-gray-200 dark:bg-gray-700'
          )}
          title="Bullet List"
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
            editor.isActive('orderedList') && 'bg-gray-200 dark:bg-gray-700'
          )}
          title="Numbered List"
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={setLink}
          className={cn(
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
            editor.isActive('link') && 'bg-gray-200 dark:bg-gray-700'
          )}
          title="Add Link"
          disabled={disabled}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Attach File"
          disabled={disabled || attachments.length >= 5}
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>

      {/* Editor */}
      <div onKeyDown={handleKeyDown}>
        <EditorContent editor={editor} />
      </div>

      {/* Send Button */}
      <div className="px-4 py-2 flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Press Ctrl+Enter to send
        </p>
        <Button
          onClick={handleSend}
          disabled={disabled || isSending}
          size="sm"
          className="gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageComposer;
