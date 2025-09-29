'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { ReactNode } from 'react';

interface MobileTableProps {
  children: ReactNode;
  className?: string;
}

export function MobileTable({ children, className = "" }: MobileTableProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className={`mobile-table ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      {children}
    </div>
  );
}

interface MobileTableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileTableRow({ children, className = "", onClick }: MobileTableRowProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div 
        className={`mobile-table-card ${className} ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <tr className={className} onClick={onClick}>
      {children}
    </tr>
  );
}

interface MobileTableCellProps {
  children: ReactNode;
  className?: string;
  header?: boolean;
}

export function MobileTableCell({ children, className = "", header = false }: MobileTableCellProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className={`mobile-table-cell ${className} ${header ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
        {children}
      </div>
    );
  }

  if (header) {
    return (
      <th className={`px-4 py-2 text-left font-medium text-gray-900 ${className}`}>
        {children}
      </th>
    );
  }

  return (
    <td className={`px-4 py-2 text-gray-600 ${className}`}>
      {children}
    </td>
  );
}
