import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, HashRouter } from "react-router-dom";
import ErrorBoundary from "@/components/ui/error-boundary";

import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider } from "./hooks/use-theme";
import { logger } from './utils/logger';

import MainLayout from "./components/layout/MainLayout";
import { LoadingProgress } from "./components/ui/loading-progress";

// Lazy load components for code splitting
const Index = React.lazy(() => import("./pages/Index"));
const FoldersPage = React.lazy(() => import("./pages/FoldersPage"));
const FolderDetailPage = React.lazy(() => import("./pages/FolderDetailPage"));
const NoteDetailPage = React.lazy(() => import("./pages/NoteDetailPage"));
const QuizPage = React.lazy(() => import("./pages/QuizPage"));
const QuizManagementPage = React.lazy(() => import("./pages/QuizManagementPage"));
const RecentPage = React.lazy(() => import("./pages/RecentPage"));
const QuizzesPage = React.lazy(() => import("./pages/QuizzesPage"));
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const QuizDebug = React.lazy(() => import("./components/debug/QuizDebug"));

const queryClient = new QueryClient();

// Loading component for Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Component to track navigation
function NavigationTracker() {
  const location = useLocation();
  
  React.useEffect(() => {
    logger.navigation(document.referrer || 'direct', location.pathname);
  }, [location]);
  
  return null;
}

// Component to prevent navigation until data is loaded
const DataLoadingGuard = ({ children }: { children: React.ReactNode }) => {
  const { isLoadingData, loadingProgress } = useApp();

  // If data is still loading, show loading screen
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

const AppRoutes = () => {
  return (
    <DataLoadingGuard>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/folders" replace />} />
          
          <Route element={<MainLayout />}>
            <Route path="/folders" element={<FoldersPage />} />
            <Route path="/folders/:folderId" element={<FolderDetailPage />} />
            <Route path="/folders/:folderId/notes/:noteId" element={<NoteDetailPage />} />
            <Route path="/folders/:folderId/quiz" element={<QuizPage />} />
            <Route path="/folders/:folderId/manage" element={<QuizManagementPage />} />
            <Route path="/recent" element={<RecentPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/debug/quiz" element={<QuizDebug />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </DataLoadingGuard>
  );
}

// Conditional Router Component
const ConditionalRouter = ({ children }: { children: React.ReactNode }) => {
  const isDevelopment = import.meta.env.MODE === "development";
  
  // Use a stable key to prevent router switching issues
  const routerKey = isDevelopment ? "browser" : "hash";
  
  return (
    <React.Fragment key={routerKey}>
      {isDevelopment ? (
        <BrowserRouter>
          {children}
        </BrowserRouter>
      ) : (
        <HashRouter>
          {children}
        </HashRouter>
      )}
    </React.Fragment>
  );
};

const App = () => {
  React.useEffect(() => {
    logger.info('APP_STARTUP', 'MemoQuiz application started', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      isElectron: typeof window !== 'undefined' && window.electronAPI ? true : false,
      mode: import.meta.env.MODE
    });

    // Log when app is about to close
    const handleBeforeUnload = () => {
      logger.info('APP_SHUTDOWN', 'Application is closing');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system">
          <AppProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ConditionalRouter>
                <NavigationTracker />
                <AppRoutes />
              </ConditionalRouter>
            </TooltipProvider>
          </AppProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
