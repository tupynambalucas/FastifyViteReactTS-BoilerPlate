import React, { Suspense } from 'react';
import type { FC, ReactNode } from 'react';

// Define the props for your layout component
interface DefaultLayoutProps {
  // 'children' will be the content of your specific page
  children: ReactNode;
  // An optional prop to set the document title for each page
}

const Default: FC<DefaultLayoutProps> = ({ children }) => {
  return (
      <main>
        {children}
      </main>
  )
};

export default Default;