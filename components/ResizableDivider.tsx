import React, { useEffect, useState } from 'react';

interface ResizableDividerProps {
  onResize: (journeyWidth: number, chatWidth: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const ResizableDivider: React.FC<ResizableDividerProps> = ({
  onResize,
  containerRef,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startJourneyWidth, setStartJourneyWidth] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const deltaX = e.clientX - startX;
      
      // Calculate new widths as percentages
      const newJourneyWidth = ((startJourneyWidth + deltaX) / containerWidth) * 100;
      
      // Constrain between 30% and 50% for journey map (chat stays between 50% and 70%)
      const constrainedJourneyWidth = Math.max(30, Math.min(50, newJourneyWidth));
      const chatWidth = 100 - constrainedJourneyWidth;
      
      onResize(constrainedJourneyWidth, chatWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, startX, startJourneyWidth, onResize, containerRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    e.preventDefault();
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const journeyMap = container.querySelector('[data-journey-map]') as HTMLElement;
    
    if (journeyMap) {
      const journeyWidth = journeyMap.getBoundingClientRect().width;
      setStartX(e.clientX);
      setStartJourneyWidth(journeyWidth - containerRect.left);
      setIsDragging(true);
    }
  };

  return (
    <div
      className="hidden lg:flex w-1 bg-soft-gray hover:bg-gray-300 cursor-col-resize transition-colors relative group z-10"
      onMouseDown={handleMouseDown}
    >
      <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-1 bg-transparent hover:bg-sky-blue/50 transition-colors" />
    </div>
  );
};

