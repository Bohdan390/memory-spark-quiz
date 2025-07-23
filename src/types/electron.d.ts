declare global {
  interface Window {
    electronAPI: {
      getDataPath: () => Promise<string>;
      saveData: (filename: string, data: any) => Promise<{ success: boolean; error?: string }>;
      loadData: (filename: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      showSaveDialog: () => Promise<any>;
      showOpenDialog: () => Promise<any>;
    };
  }
}

export {}; 