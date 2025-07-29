import React from 'react';
import { Progress } from '@/components/ui/progress';

interface LoadingProgressProps {
  progress: number;
  message?: string;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({ 
  progress, 
  message = "Loading your data..." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Loading Application</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>
      
      <div className="text-xs text-muted-foreground">
        {progress < 25 && "Connecting to database..."}
        {progress >= 25 && progress < 50 && "Loading folders and notes..."}
        {progress >= 50 && progress < 75 && "Processing quiz data..."}
        {progress >= 75 && progress < 100 && "Finalizing setup..."}
        {progress === 100 && "Ready!"}
      </div>
    </div>
  );
}; 