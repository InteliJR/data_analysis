import React from 'react';
import { FaSort } from "react-icons/fa";
import { Text } from '@/components/common/Text';

interface TableHeaderCellProps {
  children: React.ReactNode;
  sortable?: boolean;
}

export function TableHeaderCell({ 
  children, 
  sortable = false 
}: TableHeaderCellProps) {
  
  const content = (
    <span className="flex items-center">

      <Text 
        as="span" 
        variant="small" 
        className="font-bold uppercase tracking-wider text-gray-700"
      >
        {children}
      </Text>
      
      {sortable && <FaSort className="ml-1 h-4 w-4 text-gray-400" />}
    </span>
  );

  return (
    <th className="px-4 py-3 text-left">
      {sortable ? (
        <button className="flex items-center group focus:outline-none">
          {content}
        </button>
      ) : (
        content
      )}
    </th>
  );
}