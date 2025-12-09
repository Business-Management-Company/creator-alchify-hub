import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HighlightTarget {
  id: string;
  label: string;
  selector: string;
}

// Map of keywords to UI element selectors
const UI_ELEMENT_MAP: Record<string, HighlightTarget> = {
  'upload': { id: 'upload', label: 'Upload', selector: '[data-ui-element="upload"], [href="/upload"]' },
  'clips': { id: 'clips', label: 'Clips Tab', selector: '[data-ui-element="clips"], [data-tab="clips"]' },
  'captions': { id: 'captions', label: 'Captions', selector: '[data-ui-element="captions"], [data-tab="captions"]' },
  'audio': { id: 'audio', label: 'Audio Tab', selector: '[data-ui-element="audio"], [data-tab="audio"]' },
  'video': { id: 'video', label: 'Video Tab', selector: '[data-ui-element="video"], [data-tab="video"]' },
  'distribute': { id: 'distribute', label: 'Distribute', selector: '[data-ui-element="distribute"], [data-tab="distribute"]' },
  'projects': { id: 'projects', label: 'Projects', selector: '[data-ui-element="projects"], [href="/projects"]' },
  'library': { id: 'library', label: 'Library', selector: '[data-ui-element="library"], [href="/library"]' },
  'refiner': { id: 'refiner', label: 'Refiner Studio', selector: '[data-ui-element="refiner"]' },
  'recording': { id: 'recording', label: 'Recording Studio', selector: '[data-ui-element="recording"], [href="/recording-studio"]' },
  'settings': { id: 'settings', label: 'Settings', selector: '[data-ui-element="settings"], [href="/settings"]' },
  'dashboard': { id: 'dashboard', label: 'Dashboard', selector: '[data-ui-element="dashboard"], [href="/dashboard"]' },
  'export': { id: 'export', label: 'Export', selector: '[data-ui-element="export"], [data-tab="distribute"]' },
  'transcript': { id: 'transcript', label: 'Transcript', selector: '[data-ui-element="transcript"]' },
  'timeline': { id: 'timeline', label: 'Timeline', selector: '[data-ui-element="timeline"]' },
};

// Detect UI references in text
export function detectUIReferences(text: string): HighlightTarget[] {
  const lowerText = text.toLowerCase();
  const found: HighlightTarget[] = [];
  
  // Check for specific patterns
  const patterns = [
    { keywords: ['upload', 'upload button', 'upload page'], target: UI_ELEMENT_MAP['upload'] },
    { keywords: ['clips tab', 'create clips', 'clip generator', 'clips section'], target: UI_ELEMENT_MAP['clips'] },
    { keywords: ['captions tab', 'add captions', 'caption editor'], target: UI_ELEMENT_MAP['captions'] },
    { keywords: ['audio tab', 'clean audio', 'audio section'], target: UI_ELEMENT_MAP['audio'] },
    { keywords: ['video tab', 'video section', 'speaker focus'], target: UI_ELEMENT_MAP['video'] },
    { keywords: ['distribute tab', 'export tab', 'export section'], target: UI_ELEMENT_MAP['distribute'] },
    { keywords: ['projects page', 'projects list', 'your projects'], target: UI_ELEMENT_MAP['projects'] },
    { keywords: ['library', 'media library'], target: UI_ELEMENT_MAP['library'] },
    { keywords: ['recording studio', 'start recording'], target: UI_ELEMENT_MAP['recording'] },
    { keywords: ['settings page', 'settings menu'], target: UI_ELEMENT_MAP['settings'] },
  ];

  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      if (lowerText.includes(keyword) && !found.some(f => f.id === pattern.target.id)) {
        found.push(pattern.target);
        break;
      }
    }
  }

  return found;
}

interface HighlightPointerProps {
  target: HighlightTarget;
  onDismiss: () => void;
}

function HighlightPointer({ target, onDismiss }: HighlightPointerProps) {
  const [position, setPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const findElement = () => {
      const element = document.querySelector(target.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
        setVisible(true);
      }
    };

    // Try immediately and with a small delay
    findElement();
    const timeout = setTimeout(findElement, 100);

    return () => clearTimeout(timeout);
  }, [target.selector]);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timeout = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [onDismiss]);

  if (!position || !visible) return null;

  return createPortal(
    <>
      {/* Spotlight overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[100] pointer-events-none transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `radial-gradient(circle at ${position.left + position.width / 2}px ${position.top + position.height / 2}px, transparent 0px, transparent ${Math.max(position.width, position.height) + 20}px, rgba(0,0,0,0.5) ${Math.max(position.width, position.height) + 40}px)`,
        }}
      />

      {/* Highlight ring */}
      <div
        className={cn(
          "fixed z-[101] pointer-events-none transition-all duration-300",
          "border-2 border-primary rounded-lg",
          "animate-pulse",
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        style={{
          top: position.top - 4,
          left: position.left - 4,
          width: position.width + 8,
          height: position.height + 8,
        }}
      />

      {/* Bold arrow pointer - Creatomate style */}
      <div
        className={cn(
          "fixed z-[102] pointer-events-auto cursor-pointer",
          "animate-in slide-in-from-right-4 fade-in duration-500",
          visible ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: position.top + position.height / 2 - 20,
          left: position.left + position.width + 24,
        }}
        onClick={onDismiss}
      >
        {/* Arrow SVG - bold style pointing left */}
        <svg
          width="120"
          height="40"
          viewBox="0 0 120 40"
          fill="none"
          className="drop-shadow-lg"
        >
          {/* Arrow shaft */}
          <path
            d="M120 20 L40 20"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Arrow head */}
          <path
            d="M50 8 L38 20 L50 32"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        
        {/* Label below arrow */}
        <div className="absolute top-full left-0 mt-2 flex items-center gap-2 whitespace-nowrap">
          <span className="text-sm font-semibold text-primary">{target.label}</span>
          <button className="hover:bg-muted rounded p-1 transition-colors">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

interface UIHighlighterProps {
  targets: HighlightTarget[];
  onClear: () => void;
}

export function UIHighlighter({ targets, onClear }: UIHighlighterProps) {
  const [activeTargets, setActiveTargets] = useState<HighlightTarget[]>(targets);

  useEffect(() => {
    setActiveTargets(targets);
  }, [targets]);

  const handleDismiss = useCallback((id: string) => {
    setActiveTargets(prev => {
      const newTargets = prev.filter(t => t.id !== id);
      if (newTargets.length === 0) {
        onClear();
      }
      return newTargets;
    });
  }, [onClear]);

  if (activeTargets.length === 0) return null;

  return (
    <>
      {activeTargets.map(target => (
        <HighlightPointer
          key={target.id}
          target={target}
          onDismiss={() => handleDismiss(target.id)}
        />
      ))}
    </>
  );
}
