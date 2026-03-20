import * as React from 'react';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export type OpenClawAction = {
  type: 'NAVIGATE' | 'SCROLL' | 'HIGHLIGHT' | 'WAIT' | 'CLICK' | 'TYPE';
  target?: string;
  text?: string;
  duration?: number;
};

interface OpenClawContextType {
  isAutoPilotActive: boolean;
  executeActions: (actions: OpenClawAction[]) => Promise<void>;
  currentActionText: string | null;
}

const OpenClawContext = createContext<OpenClawContextType | undefined>(undefined);

export const OpenClawProvider: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [isAutoPilotActive, setIsAutoPilotActive] = useState(false);
  const [currentActionText, setCurrentActionText] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const executeNavigate = async (target: string) => {
    setCurrentActionText(`Navigating to ${target}...`);
    if (location.pathname !== target) {
        navigate(target);
        await delay(2000); // Increased delay for stability
    }
  };

  const executeScroll = async (target: string) => {
    setCurrentActionText(`Scrolling to ${target}...`);
    if (target === 'bottom') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      await delay(1000);
    } else if (target === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await delay(1000);
    } else {
      const el = document.querySelector(target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await delay(1000);
      }
    }
  };

  const executeHighlight = async (target: string) => {
    setCurrentActionText(`Analyzing ${target}...`);
    const el = document.querySelector(target) as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(500);
      
      const originalOutline = el.style.outline;
      const originalBoxShadow = el.style.boxShadow;
      const originalTransition = el.style.transition;
      
      el.style.transition = 'all 0.3s ease-in-out';
      el.style.outline = '3px solid #10b981'; // Green-500
      el.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.6)';
      
      await delay(2000);
      
      el.style.outline = originalOutline;
      el.style.boxShadow = originalBoxShadow;
      el.style.transition = originalTransition;
    }
  };

  const executeClick = async (target: string) => {
    setCurrentActionText(`Clicking ${target}...`);
    const el = document.querySelector(target) as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(500);
      el.click();
      await delay(800);
    }
  };

  const executeType = async (target: string, text: string) => {
      setCurrentActionText(`Typing into ${target}...`);
      const el = document.querySelector(target) as HTMLInputElement | HTMLTextAreaElement;
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await delay(500);
          
          // Simulate typing
          el.value = '';
          for (let i = 0; i < text.length; i++) {
              el.value += text[i];
              el.dispatchEvent(new Event('input', { bubbles: true }));
              await delay(50);
          }
          el.dispatchEvent(new Event('change', { bubbles: true }));
          await delay(500);
      }
  };

  const executeActions = useCallback(async (actions: OpenClawAction[]) => {
    if (actions.length === 0) return;
    
    setIsAutoPilotActive(true);
    
    try {
      for (const action of actions) {
        switch (action.type) {
          case 'NAVIGATE':
            if (action.target) await executeNavigate(action.target);
            break;
          case 'SCROLL':
            if (action.target) await executeScroll(action.target);
            break;
          case 'HIGHLIGHT':
            if (action.target) await executeHighlight(action.target);
            break;
          case 'CLICK':
            if (action.target) await executeClick(action.target);
            break;
          case 'TYPE':
            if (action.target && action.text) await executeType(action.target, action.text);
            break;
          case 'WAIT':
            setCurrentActionText(`Processing...`);
            await delay(action.duration || 1000);
            break;
        }
        await delay(300); // Small pause between actions
      }
    } catch (error) {
      console.error("OpenClaw Execution Error:", error);
    } finally {
      setIsAutoPilotActive(false);
      setCurrentActionText(null);
    }
  }, [navigate, location.pathname]);

  return (
    <OpenClawContext.Provider value={{ isAutoPilotActive, executeActions, currentActionText }}>
      {children}
      {isAutoPilotActive && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-900/90 backdrop-blur-md border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] px-6 py-3 rounded-full flex items-center gap-4 animate-in fade-in slide-in-from-top-10">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                 ⚡ OpenClaw Auto-Pilot
              </p>
              {currentActionText && (
                 <p className="text-green-300 text-xs font-medium animate-pulse">{currentActionText}</p>
              )}
            </div>
        </div>
      )}
    </OpenClawContext.Provider>
  );
};

export const useOpenClaw = () => {
  const context = useContext(OpenClawContext);
  if (context === undefined) {
    throw new Error('useOpenClaw must be used within an OpenClawProvider');
  }
  return context;
};
