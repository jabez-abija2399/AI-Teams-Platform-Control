import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function Logo({ size = 40, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d="M10 10H30V30H10V10Z" stroke="currentColor" strokeWidth="2" />
      <path d="M5 5H15V15H5V5Z" stroke="currentColor" strokeWidth="1" />
      <path d="M25 25H35V35H25V25Z" stroke="currentColor" strokeWidth="1" />
      <path d="M10 20H30" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M20 10V30" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
}
