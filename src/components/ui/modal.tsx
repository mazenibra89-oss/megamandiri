import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className={cn("bg-card text-card-foreground rounded-xl shadow-xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200", maxWidth)}>
        <div className="flex items-center justify-between p-4 border-b bg-muted/20">
          <h2 className="font-semibold text-lg tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
