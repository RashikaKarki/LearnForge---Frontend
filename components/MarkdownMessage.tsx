import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import DOMPurify from 'dompurify';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// Check if URL is a YouTube URL
const isYouTubeUrl = (url: string): boolean => {
  return /youtube\.com|youtu\.be/.test(url);
};

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ 
  content, 
  className = '' 
}) => {
  // Convert \n to actual newlines and sanitize the content before processing
  // remarkBreaks will handle converting single newlines to <br> tags
  const processedContent = content.replace(/\\n/g, '\n');
  const sanitizedContent = DOMPurify.sanitize(processedContent);
  
  // Check if text should be white (for user messages)
  const isWhiteText = className.includes('text-white');
  const textColorClass = isWhiteText ? 'text-white' : '';
  const codeBgClass = isWhiteText ? 'bg-white/20' : 'bg-black/10';
  const borderColorClass = isWhiteText ? 'border-white/30' : 'border-gray-300';
  
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Custom styling for markdown elements with proper text color inheritance
          p: ({ children }) => <p className={`mb-2 last:mb-0 ${textColorClass}`}>{children}</p>,
          h1: ({ children }) => <h1 className={`text-xl font-bold mb-2 ${textColorClass}`}>{children}</h1>,
          h2: ({ children }) => <h2 className={`text-lg font-semibold mb-2 ${textColorClass}`}>{children}</h2>,
          h3: ({ children }) => <h3 className={`text-base font-semibold mb-1 ${textColorClass}`}>{children}</h3>,
          ul: ({ children }) => <ul className={`list-disc list-inside mb-2 space-y-1 ${textColorClass}`}>{children}</ul>,
          ol: ({ children }) => <ol className={`list-decimal list-inside mb-2 space-y-1 ${textColorClass}`}>{children}</ol>,
          li: ({ children }) => <li className={`text-sm ${textColorClass}`}>{children}</li>,
          code: ({ children, className: codeClassName }) => {
            const isInline = !codeClassName?.includes('language-');
            return isInline ? (
              <code className={`${codeBgClass} px-1 py-0.5 rounded text-sm font-mono ${textColorClass}`}>{children}</code>
            ) : (
              <code className={`block ${codeBgClass} p-2 rounded text-sm font-mono overflow-x-auto ${textColorClass}`}>{children}</code>
            );
          },
          pre: ({ children }) => <pre className={`${codeBgClass} p-2 rounded overflow-x-auto mb-2 ${textColorClass}`}>{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className={`border-l-4 ${borderColorClass} pl-4 italic mb-2 ${textColorClass}`}>{children}</blockquote>
          ),
          strong: ({ children }) => <strong className={`font-semibold ${textColorClass}`}>{children}</strong>,
          em: ({ children }) => <em className={`italic ${textColorClass}`}>{children}</em>,
          a: ({ children, href }) => {
            if (!href) return <a className={`underline hover:opacity-80 ${textColorClass}`}>{children}</a>;
            
            // Check if it's a YouTube URL and extract video ID
            if (isYouTubeUrl(href)) {
              const videoId = getYouTubeVideoId(href);
              if (videoId) {
                return (
                  <div className="my-4 w-full">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`text-xs mt-2 block underline hover:opacity-80 ${textColorClass}`}
                    >
                      {children || href}
                    </a>
                  </div>
                );
              }
            }
            
            // Regular link
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`underline hover:opacity-80 ${textColorClass}`}
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className={`min-w-full border ${borderColorClass} ${textColorClass}`}>{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className={`${isWhiteText ? 'bg-white/10' : 'bg-black/5'} ${textColorClass}`}>{children}</thead>,
          tbody: ({ children }) => <tbody className={textColorClass}>{children}</tbody>,
          tr: ({ children }) => <tr className={`border-b ${borderColorClass} ${textColorClass}`}>{children}</tr>,
          th: ({ children }) => <th className={`px-3 py-2 text-left font-semibold text-sm ${textColorClass}`}>{children}</th>,
          td: ({ children }) => <td className={`px-3 py-2 text-sm ${textColorClass}`}>{children}</td>,
          br: () => <br />,
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};
