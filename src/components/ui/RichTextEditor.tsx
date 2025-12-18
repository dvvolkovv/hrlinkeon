import { useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export const RichTextEditor = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  className = '',
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const sanitizeHtml = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;

    const allowedTags = ['P', 'STRONG', 'EM', 'B', 'I', 'UL', 'OL', 'LI', 'BR', 'DIV'];
    const removeNodes: Node[] = [];

    const walk = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (!allowedTags.includes(element.tagName)) {
          removeNodes.push(node);
          return;
        }
      }
      node.childNodes.forEach(walk);
    };

    walk(div);
    removeNodes.forEach((node) => {
      if (node.parentNode) {
        while (node.firstChild) {
          node.parentNode.insertBefore(node.firstChild, node);
        }
        node.parentNode.removeChild(node);
      }
    });

    return div.innerHTML;
  };

  const handleInput = () => {
    if (editorRef.current) {
      const sanitized = sanitizeHtml(editorRef.current.innerHTML);
      onChange(sanitized);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div
        className={`rich-text-editor border rounded-lg overflow-hidden ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <div className="toolbar flex gap-1 p-2 bg-gray-50 border-b border-gray-200">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Bold"
          >
            <Bold size={16} className="text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Italic"
          >
            <Italic size={16} className="text-gray-700" />
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Bullet List"
          >
            <List size={16} className="text-gray-700" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Numbered List"
          >
            <ListOrdered size={16} className="text-gray-700" />
          </button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="editor-content p-3 min-h-[150px] focus:outline-none bg-white"
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      <style>{`
        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .editor-content p {
          margin: 0 0 0.5rem 0;
        }
        .editor-content p:last-child {
          margin-bottom: 0;
        }
        .editor-content ul,
        .editor-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .editor-content li {
          margin: 0.25rem 0;
        }
        .rich-text-editor:focus-within {
          outline: none;
          border-color: #2d5f47;
          box-shadow: 0 0 0 2px rgba(45, 95, 71, 0.2);
        }
        .rich-text-editor.border-red-500:focus-within {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  );
};
