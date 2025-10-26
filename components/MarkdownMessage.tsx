import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import DOMPurify from 'dompurify';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ 
  content, 
  className = '' 
}) => {
  // Sanitize the content before processing
  const sanitizedContent = DOMPurify.sanitize(content);
  
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Custom styling for markdown elements
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mb-1">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          code: ({ children, className }) => {
            const isInline = !className?.includes('language-');
            return isInline ? (
              <code className="bg-black/10 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
            ) : (
              <code className="block bg-black/10 p-2 rounded text-sm font-mono overflow-x-auto">{children}</code>
            );
          },
          pre: ({ children }) => <pre className="bg-black/10 p-2 rounded overflow-x-auto mb-2">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2">{children}</blockquote>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-current/20">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-black/5">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-current/10">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-sm">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-sm">{children}</td>,
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};
