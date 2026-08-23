import React, { useRef, useState, useEffect } from 'react';

interface ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  maxClass?: string;
  shadowColor?: string; // Tailwind class, e.g. "from-[#0c0c0e]" or "from-[#1c1c1c]"
  keyDependency?: any;
}

export const ScrollContainer: React.FC<ScrollContainerProps> = ({
  children,
  className = '',
  maxClass = 'max-h-96',
  shadowColor = 'from-[#0c0c0e]',
  keyDependency
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const checkScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    // Check if scrollable
    const isScrollable = el.scrollHeight > el.clientHeight;
    // Check if scrolled to bottom
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 2; // 2px threshold for subpixel rounding

    setShowBottomShadow(isScrollable && !isAtBottom);
  };

  useEffect(() => {
    // Check scroll after DOM updates
    const timer = setTimeout(checkScroll, 50);
    return () => clearTimeout(timer);
  }, [children, keyDependency]);

  useEffect(() => {
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <div className="relative w-full flex-grow flex flex-col min-h-0">
      <div
        ref={containerRef}
        onScroll={checkScroll}
        className={`${maxClass} overflow-y-auto pr-1 ${className}`}
      >
        {children}
      </div>
      <div
        className={`absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t ${shadowColor} to-transparent pointer-events-none z-10 transition-opacity duration-300 ${
          showBottomShadow ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
