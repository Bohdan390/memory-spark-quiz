import React from 'react';
import { useApp } from '@/context/AppContext';
import { LoadingProgress } from './loading-progress';

interface AppLoadingProps {
  children: React.ReactNode;
}

export const AppLoading: React.FC<AppLoadingProps> = ({ children }) => {
  const { isLoadingData, loadingProgress } = useApp();

  // Show loading screen until data loading is complete
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <LoadingProgress 
            progress={loadingProgress} 
            message="Loading your notes, folders, and quiz data..."
          />
        </div>
      </div>
    );
  }

  // Only render children when data loading is complete
  return <>{children}</>;
}; 