import React, { useMemo, memo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
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

// Memoized YouTube iframe component to prevent re-renders and thumbnail refetches
const YouTubeEmbed = memo<{ videoId: string; href: string; textColorClass: string; children?: React.ReactNode }>(
  ({ videoId, href, textColorClass, children }) => {
    // Use a stable embed URL with caching-friendly parameters
    const embedUrl = useMemo(() => `https://www.youtube.com/embed/${videoId}`, [videoId]);
    
    return (
      <div className="my-4 w-full">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            key={videoId} // Key ensures React reuses the same iframe instance
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy" // Lazy load to reduce initial network requests
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
);

YouTubeEmbed.displayName = 'YouTubeEmbed';

const MarkdownMessageComponent: React.FC<MarkdownMessageProps> = ({ 
  content, 
  className = '' 
}) => {
  // Memoize processed content to prevent unnecessary re-processing
  const processedContent = useMemo(() => {
    return content.replace(/\\n/g, '\n');
  }, [content]);
  
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(processedContent);
  }, [processedContent]);
  
  // Memoize style classes to prevent recalculation
  const isWhiteText = useMemo(() => className.includes('text-white'), [className]);
  const textColorClass = useMemo(() => isWhiteText ? 'text-white' : '', [isWhiteText]);
  const codeBgClass = useMemo(() => isWhiteText ? 'bg-white/20' : 'bg-black/10', [isWhiteText]);
  const borderColorClass = useMemo(() => isWhiteText ? 'border-white/30' : 'border-gray-300', [isWhiteText]);
  
  // Memoize components object to prevent ReactMarkdown from re-rendering unnecessarily
  const markdownComponents = useMemo<Partial<Components>>(() => ({
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
            <YouTubeEmbed 
              videoId={videoId} 
              href={href} 
              textColorClass={textColorClass}
            >
              {children}
            </YouTubeEmbed>
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
  }), [textColorClass, codeBgClass, borderColorClass, isWhiteText]);
  
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={markdownComponents}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders and thumbnail refetches
export const MarkdownMessage = memo(MarkdownMessageComponent);
