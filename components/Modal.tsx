import React from 'react';
import { playSound } from '../services/audioService';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-sm relative flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="bg-yellow-300 border-b-4 border-black p-4 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-2xl font-bold uppercase text-black">{title}</h2>
          <button onClick={() => { playSound('click'); onClose(); }} className="hover:scale-110 transition-transform">
             <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-black stroke-2 fill-none strokeLinecap-round">
               <path d="M18 6L6 18M6 6l12 12" />
             </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto text-left text-black">
          {children}
        </div>
      </div>
    </div>
  );
};