import React from 'react';

interface LogoProps {
  className?: string;
  textColor?: string;
}

export const Logo: React.FC<LogoProps> = ({ className, textColor }) => {
  // Define a cor base: se não informada, usa o Neon Lime (#ccff00) do tema escuro.
  const color = textColor || "#ccff00"; 

  return (
    <svg className={className} viewBox="0 0 180 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Icon Group: [ // ] */}
      <g stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {/* Rounded Square Container */}
        <rect x="5" y="5" width="46" height="46" rx="10" />
        {/* Slanted Bars */}
        <path d="M21 40L29 16" />
        <path d="M31 40L39 16" />
      </g>

      {/* Text Group: Fin */}
      <g fill={color}>
        {/* Letter F */}
        <path d="M72 12H98V19H80V25H96V32H80V45H72V12Z" />
        
        {/* Letter i */}
        <rect x="104" y="21" width="8" height="24" rx="2" />
        <rect x="104" y="12" width="8" height="7" rx="2" />

        {/* Letter n */}
        <path d="M120 45V21H128V26C130 22 134 20 139 20C148 20 151 25 151 32V45H143V33C143 29 142 27 138 27C134 27 128 30 128 36V45H120Z" />
      </g>
    </svg>
  );
};