'use client';

import React from 'react';

export function Logo() {
  return (
    <div className="flex items-center justify-center h-9 w-9 bg-primary rounded-md" title="Co-Piloto Driver">
      <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 17.06V6.94C8 6.42075 8.42075 6 9 6H11.5C13.9853 6 16 8.01472 16 10.5C16 12.9853 13.9853 15 11.5 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
