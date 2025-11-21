import React from 'react';

interface LoaderProps {
  text: string;
}

export const Loader: React.FC<LoaderProps> = ({ text }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-xs text-center animate-bounce text-black">
        <div className="text-4xl mb-4">🤔</div>
        <h2 className="text-2xl font-bold uppercase">{text}</h2>
        <p className="text-sm mt-2 italic text-gray-600">Hold tight!</p>
      </div>
    </div>
  );
};