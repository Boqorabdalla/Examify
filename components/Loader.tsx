
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-4 h-4 rounded-full animate-pulse bg-amber-300"></div>
      <div className="w-4 h-4 rounded-full animate-pulse bg-amber-300" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-4 h-4 rounded-full animate-pulse bg-amber-300" style={{ animationDelay: '0.4s' }}></div>
      <span className="ml-2">Generating...</span>
    </div>
  );
};

export default Loader;