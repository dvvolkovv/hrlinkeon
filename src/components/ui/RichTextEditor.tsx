import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const modules = useMemo(
    () => ({
      toolbar: [
        ['bold', 'italic'],
        [{ list: 'ordered' }, { list: 'bullet' }],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = ['bold', 'italic', 'list', 'bullet'];

  const sanitizeHtml = (html: string): string => {
    const div = document.createElement('div');
    div.innerHTML = html;

    const allowedTags = ['P', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'BR'];
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

  const handleChange = (content: string) => {
    const sanitized = sanitizeHtml(content);
    onChange(sanitized);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div
        className={`rich-text-editor border rounded-lg ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <ReactQuill
          theme="snow"
          value={value || ''}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="bg-white"
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      <style>{`
        .rich-text-editor .ql-container {
          min-height: 150px;
          font-size: 14px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .rich-text-editor .ql-editor {
          min-height: 150px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .rich-text-editor .ql-stroke {
          stroke: #4b5563;
        }
        .rich-text-editor .ql-fill {
          fill: #4b5563;
        }
        .rich-text-editor .ql-picker-label {
          color: #4b5563;
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
