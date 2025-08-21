"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo,
  Redo,
} from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { markdownToHtml } from "@/lib/utils/markdown-utils";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  isMarkdown?: boolean; // Flag to indicate if content is markdown
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing your blog post...",
  editable = true,
  isMarkdown = false,
}: TiptapEditorProps) {
  // Memoize the processed content to avoid recreating it on every render
  const processedContent = useMemo(() => {
    return isMarkdown ? markdownToHtml(content) : content;
  }, [content, isMarkdown]);

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
          class: "text-blue-600 hover:text-blue-800 underline",
        },
      }),
      Typography,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: processedContent,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Update the local content but don't trigger auto-save
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[400px] p-6",
      },
    },
  });

  // Update editor content when processed content changes
  useEffect(() => {
    if (editor && processedContent !== undefined) {
      const currentContent = editor.getHTML();

      // Only update if content is different to avoid unnecessary re-renders
      if (currentContent !== processedContent) {
        editor.commands.setContent(processedContent);

        // For read-only mode, ensure focus is removed
        if (!editable) {
          editor.commands.blur();
        }
      }
    }
  }, [editor, processedContent, editable]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg shadow-sm bg-white">
      {/* Toolbar */}
      {editable && (
        <div className="border-b bg-gray-50/50 p-3 flex flex-wrap gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            data-active={editor.isActive("heading", { level: 1 })}
            className="data-[active=true]:bg-gray-200"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            data-active={editor.isActive("heading", { level: 2 })}
            className="data-[active=true]:bg-gray-200"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            data-active={editor.isActive("heading", { level: 3 })}
            className="data-[active=true]:bg-gray-200"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            data-active={editor.isActive("bold")}
            className="data-[active=true]:bg-gray-200"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            data-active={editor.isActive("italic")}
            className="data-[active=true]:bg-gray-200"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setLink}
            data-active={editor.isActive("link")}
            className="data-[active=true]:bg-gray-200"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            data-active={editor.isActive("bulletList")}
            className="data-[active=true]:bg-gray-200"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            data-active={editor.isActive("orderedList")}
            className="data-[active=true]:bg-gray-200"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor */}
      <div className="tiptap-editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
