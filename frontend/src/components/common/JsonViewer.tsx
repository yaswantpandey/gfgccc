import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  title?: string;
  maxHeight?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title,
  maxHeight = 'max-h-64',
}) => {
  const [copied, setCopied] = useState(false);

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatHighlightedJson = (json: string) => {
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let style = 'color: #fbbf24;'; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            style = 'color: #a5b4fc; font-weight: 500;'; // key
          } else {
            style = 'color: #86efac;'; // string
          }
        } else if (/true|false/.test(match)) {
          style = 'color: #c084fc;'; // boolean
        } else if (/null/.test(match)) {
          style = 'color: #f87171; font-style: italic;'; // null
        }
        return `<span style="${style}">${match}</span>`;
      }
    );
  };

  return (
    <div
      className="rounded-lg overflow-hidden text-xs mono"
      style={{ background: '#111113', border: '1px solid #222224' }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: '#161619', borderBottom: '1px solid #222224' }}
      >
        <span className="text-[11px] font-medium" style={{ color: '#888890' }}>
          {title || 'Payload'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors"
          style={{ background: '#222225', color: '#c8c8d0', border: '1px solid #2a2a2e' }}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <pre
        className={`p-3 overflow-x-auto overflow-y-auto leading-relaxed ${maxHeight}`}
        style={{ color: '#c8c8d0' }}
        dangerouslySetInnerHTML={{ __html: formatHighlightedJson(jsonString) }}
      />
    </div>
  );
};
