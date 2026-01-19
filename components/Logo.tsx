
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "h-12 w-12", showText = false }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Background rounded rect */}
        <rect width="200" height="200" rx="40" fill="#1e293b" />
        
        {/* Brain Part (Gold) */}
        <path d="M100 35C85 35 73 42 68 52C60 52 53 59 53 67C53 70 54 73 56 75C51 77 48 83 48 89C48 97 54 103 62 104V106C62 113 68 119 75 119C77 119 79 119 81 118C83 124 89 128 96 128V128C100 128 103 127 106 125C109 127 113 128 117 128V128C124 128 130 124 132 118C134 119 136 119 138 119C145 119 151 113 151 106V104C159 103 165 97 165 89C165 83 162 77 157 75C159 73 160 70 160 67C160 59 153 52 145 52C140 42 128 35 113 35H100Z" stroke="#fcd34d" strokeWidth="3" fill="none" opacity="0.8"/>
        <path d="M100 40V120" stroke="#fcd34d" strokeWidth="2" opacity="0.4"/>
        <circle cx="100" cy="80" r="30" stroke="#fcd34d" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"/>
        
        {/* Open Book (White) */}
        <path d="M100 150L145 135V105L100 120M100 150L55 135V105L100 120" stroke="white" strokeWidth="6" fill="none" strokeLinejoin="round" />
        <path d="M100 120V150" stroke="white" strokeWidth="4" />
        
        {/* Checkmark (Cyan/Blue) */}
        <path d="M75 105L95 125L155 65" stroke="#22d3ee" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showText && (
        <div className="mt-2 text-center">
          <div className="text-xl font-bold text-white tracking-widest uppercase">Examify</div>
          <div className="text-[8px] text-slate-400 tracking-[0.2em] uppercase">Exam Generator</div>
        </div>
      )}
    </div>
  );
};

export default Logo;
