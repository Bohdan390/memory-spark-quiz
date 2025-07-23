import { format } from 'date-fns';

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  category: string;
  message: string;
  data?: any;
  stack?: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private logFile = 'app-logs.json';
  private isElectron = typeof window !== 'undefined' && window.electronAPI;

  constructor() {
    this.setupErrorHandlers();
    this.loadExistingLogs();
  }

  private setupErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('GLOBAL_ERROR', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.error('UNHANDLED_PROMISE', event.reason?.message || 'Unhandled promise rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // React error boundary integration
    if (typeof window !== 'undefined') {
      (window as any).__REACT_ERROR_HANDLER__ = (error: Error, errorInfo: any) => {
        this.error('REACT_ERROR', error.message, {
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      };
    }
  }

  private async loadExistingLogs() {
    if (this.isElectron) {
      try {
        const result = await window.electronAPI.loadData(this.logFile);
        if (result.success && result.data) {
          this.logs = result.data.slice(-this.maxLogs);
        }
      } catch (error) {
        console.warn('Failed to load existing logs:', error);
      }
    }
  }

  private async saveLogs() {
    if (this.isElectron) {
      try {
        await window.electronAPI.saveData(this.logFile, this.logs);
      } catch (error) {
        console.error('Failed to save logs:', error);
      }
    }
  }

  private createLogEntry(level: LogEntry['level'], category: string, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS'),
      level,
      category,
      message,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    if (data) {
      entry.data = typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data;
    }

    if (level === 'ERROR') {
      entry.stack = new Error().stack;
    }

    return entry;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    const consoleMethod = entry.level.toLowerCase() as 'debug' | 'info' | 'warn' | 'error';
    console[consoleMethod](`[${entry.timestamp}] ${entry.category}: ${entry.message}`, entry.data || '');

    // Save to file (debounced)
    this.debouncedSave();
  }

  private saveTimeout?: NodeJS.Timeout;
  private debouncedSave = () => {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveLogs();
    }, 1000);
  };

  debug(category: string, message: string, data?: any) {
    this.addLog(this.createLogEntry('DEBUG', category, message, data));
  }

  info(category: string, message: string, data?: any) {
    this.addLog(this.createLogEntry('INFO', category, message, data));
  }

  warn(category: string, message: string, data?: any) {
    this.addLog(this.createLogEntry('WARN', category, message, data));
  }

  error(category: string, message: string, data?: any) {
    this.addLog(this.createLogEntry('ERROR', category, message, data));
  }

  // Specific logging methods for different app areas
  userAction(action: string, details?: any) {
    this.info('USER_ACTION', action, details);
  }

  apiCall(endpoint: string, method: string, data?: any) {
    this.debug('API_CALL', `${method} ${endpoint}`, data);
  }

  apiResponse(endpoint: string, status: number, data?: any) {
    this.debug('API_RESPONSE', `${endpoint} - ${status}`, data);
  }

  dataOperation(operation: string, details?: any) {
    this.info('DATA_OPERATION', operation, details);
  }

  navigation(from: string, to: string) {
    this.info('NAVIGATION', `${from} -> ${to}`);
  }

  quiz(action: string, details?: any) {
    this.info('QUIZ', action, details);
  }

  note(action: string, details?: any) {
    this.info('NOTE', action, details);
  }

  // Get logs for debugging
  getLogs(level?: LogEntry['level'], category?: string, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  // Export logs as formatted text
  exportLogs(): string {
    return this.logs.map(log => {
      let output = `[${log.timestamp}] ${log.level} ${log.category}: ${log.message}`;
      if (log.data) {
        output += `\nData: ${JSON.stringify(log.data, null, 2)}`;
      }
      if (log.stack) {
        output += `\nStack: ${log.stack}`;
      }
      return output;
    }).join('\n\n');
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
    this.saveLogs();
    this.info('LOGGER', 'Logs cleared');
  }
}

// Create singleton instance
export const logger = new Logger();

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
} 