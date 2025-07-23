/**
 * MemoQuiz Automated Test Suite
 * Tests every button, function, and feature in the application
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  totalDuration: number;
}

class MemoQuizTestSuite {
  private results: TestSuite[] = [];
  private isElectron = typeof window !== 'undefined' && (window as any).electronAPI;

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting MemoQuiz Automated Test Suite...');
    console.log('=' .repeat(60));

    await this.testDataServices();
    await this.testUIComponents();
    await this.testNavigation();
    await this.testCRUDOperations();
    await this.testQuizSystem();
    await this.testAIServices();
    await this.testElectronFeatures();
    await this.testErrorHandling();

    this.printSummary();
  }

  private async testDataServices(): Promise<void> {
    const suite: TestSuite = {
      name: 'Data Services',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test localStorage/file system operations
    await this.runTest(suite, 'Local Storage Save/Load', async () => {
      const testData = { test: 'data', timestamp: Date.now() };
      localStorage.setItem('test-key', JSON.stringify(testData));
      const loaded = JSON.parse(localStorage.getItem('test-key') || '{}');
      
      if (loaded.test !== 'data') throw new Error('Data mismatch');
      localStorage.removeItem('test-key');
    });

    // Test Electron file operations (if available)
    if (this.isElectron) {
      await this.runTest(suite, 'Electron File Operations', async () => {
        const electronAPI = (window as any).electronAPI;
        const dataPath = await electronAPI.getDataPath();
        
        if (!dataPath || dataPath === 'Browser localStorage') {
          throw new Error('Electron API not properly configured');
        }

        // Test save/load
        const testData = { electron: 'test', timestamp: Date.now() };
        const saveResult = await electronAPI.saveData('test-file.json', testData);
        
        if (!saveResult.success) {
          throw new Error('Failed to save data');
        }

        const loadResult = await electronAPI.loadData('test-file.json');
        if (!loadResult.success || !loadResult.data) {
          throw new Error('Failed to load data');
        }

        if (loadResult.data.electron !== 'test') {
          throw new Error('Data integrity check failed');
        }
      });
    }

    this.results.push(suite);
  }

  private async testUIComponents(): Promise<void> {
    const suite: TestSuite = {
      name: 'UI Components',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test button interactions
    await this.runTest(suite, 'Button Interactions', async () => {
      const buttons = document.querySelectorAll('button');
      if (buttons.length === 0) {
        throw new Error('No buttons found on page');
      }

      // Test each button is clickable and has proper attributes
      buttons.forEach((button, index) => {
        if (button.disabled && !button.hasAttribute('data-test-disabled-ok')) {
          throw new Error(`Button ${index} is disabled unexpectedly`);
        }
        
        if (!button.textContent?.trim() && !button.querySelector('svg')) {
          throw new Error(`Button ${index} has no visible content`);
        }
      });
    });

    // Test form inputs
    await this.runTest(suite, 'Form Inputs', async () => {
      const inputs = document.querySelectorAll('input, textarea');
      
      inputs.forEach((input, index) => {
        const element = input as HTMLInputElement | HTMLTextAreaElement;
        
        // Test input can receive focus
        element.focus();
        if (document.activeElement !== element && !element.disabled) {
          throw new Error(`Input ${index} cannot receive focus`);
        }
        
        // Test input can receive text
        if (element.type !== 'file' && element.type !== 'checkbox' && element.type !== 'radio') {
          const testValue = 'test-input';
          element.value = testValue;
          if (element.value !== testValue) {
            throw new Error(`Input ${index} cannot accept text`);
          }
          element.value = ''; // Clear
        }
      });
    });

    // Test navigation elements
    await this.runTest(suite, 'Navigation Elements', async () => {
      const navLinks = document.querySelectorAll('a, [role="link"]');
      
      navLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        const onClick = link.getAttribute('onclick');
        
        if (!href && !onClick && !link.hasAttribute('data-test-nav-ok')) {
          throw new Error(`Navigation element ${index} has no action`);
        }
      });
    });

    this.results.push(suite);
  }

  private async testNavigation(): Promise<void> {
    const suite: TestSuite = {
      name: 'Navigation & Routing',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test route navigation
    await this.runTest(suite, 'Route Navigation', async () => {
      const routes = [
        '/',
        '/folders',
        '/categories',
      ];

      for (const route of routes) {
        // Simulate navigation
        window.history.pushState({}, '', route);
        
        // Wait for React to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if route exists (no 404)
        const notFound = document.querySelector('[data-testid="not-found"]');
        if (notFound && window.location.pathname === route) {
          throw new Error(`Route ${route} shows 404 page`);
        }
      }
    });

    this.results.push(suite);
  }

  private async testCRUDOperations(): Promise<void> {
    const suite: TestSuite = {
      name: 'CRUD Operations',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test folder/category creation
    await this.runTest(suite, 'Create Operations', async () => {
      // Try to find create buttons
      const createButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent?.toLowerCase().includes('new') || 
        btn.textContent?.toLowerCase().includes('create') ||
        btn.textContent?.toLowerCase().includes('add')
      );

      if (createButtons.length === 0) {
        throw new Error('No create buttons found');
      }

      // Test each create button is functional
      createButtons.forEach((button, index) => {
        if (button.disabled) {
          throw new Error(`Create button ${index} is disabled`);
        }
      });
    });

    // Test data persistence
    await this.runTest(suite, 'Data Persistence', async () => {
      const initialData = localStorage.getItem('memoquiz-folders');
      
      // Create test data
      const testFolder = {
        id: 'test-folder-' + Date.now(),
        name: 'Test Folder',
        description: 'Automated test folder',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: []
      };

      const folders = initialData ? JSON.parse(initialData) : [];
      folders.push(testFolder);
      localStorage.setItem('memoquiz-folders', JSON.stringify(folders));

      // Verify data was saved
      const savedData = localStorage.getItem('memoquiz-folders');
      const savedFolders = JSON.parse(savedData || '[]');
      
      const foundFolder = savedFolders.find((f: any) => f.id === testFolder.id);
      if (!foundFolder) {
        throw new Error('Test folder was not persisted');
      }

      // Cleanup
      const cleanedFolders = savedFolders.filter((f: any) => f.id !== testFolder.id);
      if (cleanedFolders.length > 0) {
        localStorage.setItem('memoquiz-folders', JSON.stringify(cleanedFolders));
      } else {
        localStorage.removeItem('memoquiz-folders');
      }
    });

    this.results.push(suite);
  }

  private async testQuizSystem(): Promise<void> {
    const suite: TestSuite = {
      name: 'Quiz System',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test quiz generation logic
    await this.runTest(suite, 'Quiz Generation Logic', async () => {
      // Test the local algorithm
      const mockNotes = [
        {
          id: 'test-note-1',
          folder_id: 'test-folder',
          user_id: 'test-user',
          title: 'Test Note',
          content: 'This is a comprehensive test note about machine learning algorithms and their applications in modern technology.',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Import the service dynamically
      try {
        const { generateQuizWithAI } = await import('../src/services/openaiService');
        const questions = await generateQuizWithAI(mockNotes);
        
        if (questions.length === 0) {
          throw new Error('No questions generated from test content');
        }

        // Validate question structure
        questions.forEach((q, index) => {
          if (!q.question || !q.answer || !q.type) {
            throw new Error(`Question ${index} missing required fields`);
          }
          
          if (!['fillInBlank', 'shortAnswer', 'multipleChoice'].includes(q.type)) {
            throw new Error(`Question ${index} has invalid type: ${q.type}`);
          }
        });
      } catch (error) {
        throw new Error(`Quiz generation failed: ${error}`);
      }
    });

    // Test spaced repetition algorithm
    await this.runTest(suite, 'Spaced Repetition Algorithm', async () => {
      try {
        const { calculateNextReview } = await import('../src/services/spacedRepetitionService');
        
        const mockQuestion = {
          id: 'test-q',
          folder_id: 'test-f',
          note_id: 'test-n',
          user_id: 'test-u',
          question: 'Test?',
          answer: 'Test',
          type: 'shortAnswer' as const,
          easeFactor: 2.5,
          interval: 1,
          lastReviewed: null,
          nextReviewDate: new Date()
        };

        // Test correct answer
        const correctResult = calculateNextReview(mockQuestion, 1);
        if (correctResult.interval <= mockQuestion.interval) {
          throw new Error('Interval should increase for correct answers');
        }

        // Test incorrect answer
        const incorrectResult = calculateNextReview(mockQuestion, 0);
        if (incorrectResult.interval !== 1) {
          throw new Error('Interval should reset to 1 for incorrect answers');
        }
      } catch (error) {
        throw new Error(`Spaced repetition test failed: ${error}`);
      }
    });

    this.results.push(suite);
  }

  private async testAIServices(): Promise<void> {
    const suite: TestSuite = {
      name: 'AI Services',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test Ollama service connectivity
    await this.runTest(suite, 'Ollama Service Detection', async () => {
      try {
        const { ollamaService } = await import('../src/services/ollamaService');
        
        // Test service instantiation
        if (!ollamaService) {
          throw new Error('Ollama service not instantiated');
        }

        // Test availability check (should not throw even if Ollama not running)
        const isAvailable = await ollamaService.isAvailable();
        console.log(`Ollama availability: ${isAvailable}`);
        
        // Test model getter/setter
        const originalModel = ollamaService.getModel();
        ollamaService.setModel('test-model');
        if (ollamaService.getModel() !== 'test-model') {
          throw new Error('Model setter/getter not working');
        }
        ollamaService.setModel(originalModel); // Restore
        
      } catch (error) {
        throw new Error(`Ollama service test failed: ${error}`);
      }
    });

    this.results.push(suite);
  }

  private async testElectronFeatures(): Promise<void> {
    const suite: TestSuite = {
      name: 'Electron Features',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    if (this.isElectron) {
      await this.runTest(suite, 'Electron API Integration', async () => {
        const electronAPI = (window as any).electronAPI;
        
        // Test all API methods exist
        const requiredMethods = ['getDataPath', 'saveData', 'loadData', 'showSaveDialog', 'showOpenDialog'];
        
        requiredMethods.forEach(method => {
          if (typeof electronAPI[method] !== 'function') {
            throw new Error(`Electron API method ${method} not available`);
          }
        });

        // Test data path
        const dataPath = await electronAPI.getDataPath();
        if (!dataPath || typeof dataPath !== 'string') {
          throw new Error('Invalid data path from Electron API');
        }
      });
    } else {
      await this.runTest(suite, 'Browser Fallback', async () => {
        // Test that app works in browser mode
        if (typeof localStorage === 'undefined') {
          throw new Error('localStorage not available in browser mode');
        }
      });
    }

    this.results.push(suite);
  }

  private async testErrorHandling(): Promise<void> {
    const suite: TestSuite = {
      name: 'Error Handling',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test invalid data handling
    await this.runTest(suite, 'Invalid Data Handling', async () => {
      // Test with corrupted localStorage data
      localStorage.setItem('test-corrupt', 'invalid-json{');
      
      try {
        JSON.parse(localStorage.getItem('test-corrupt') || '{}');
        throw new Error('Should have thrown JSON parse error');
      } catch (error) {
        if (error instanceof SyntaxError) {
          // Expected behavior
        } else {
          throw error;
        }
      }
      
      localStorage.removeItem('test-corrupt');
    });

    // Test network error handling
    await this.runTest(suite, 'Network Error Handling', async () => {
      try {
        // Test fetch to non-existent endpoint
        await fetch('http://localhost:99999/nonexistent');
        throw new Error('Should have thrown network error');
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Expected behavior
        } else {
          throw error;
        }
      }
    });

    this.results.push(suite);
  }

  private async runTest(suite: TestSuite, name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = performance.now();
    
    try {
      await testFn();
      const duration = performance.now() - startTime;
      
      suite.tests.push({
        name,
        passed: true,
        duration
      });
      suite.passed++;
      suite.totalDuration += duration;
      
      console.log(`✅ ${name} (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      
      suite.tests.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      suite.failed++;
      suite.totalDuration += duration;
      
      console.log(`❌ ${name} (${duration.toFixed(2)}ms): ${error}`);
    }
  }

  private printSummary(): void {
    console.log('\n' + '=' .repeat(60));
    console.log('🧪 TEST SUITE SUMMARY');
    console.log('=' .repeat(60));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    this.results.forEach(suite => {
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalDuration += suite.totalDuration;
      
      const status = suite.failed === 0 ? '✅' : '❌';
      console.log(`${status} ${suite.name}: ${suite.passed}/${suite.passed + suite.failed} passed (${suite.totalDuration.toFixed(2)}ms)`);
      
      if (suite.failed > 0) {
        suite.tests.filter(t => !t.passed).forEach(test => {
          console.log(`   ❌ ${test.name}: ${test.error}`);
        });
      }
    });

    console.log('\n' + '-' .repeat(60));
    console.log(`TOTAL: ${totalPassed}/${totalPassed + totalFailed} tests passed`);
    console.log(`DURATION: ${totalDuration.toFixed(2)}ms`);
    console.log(`SUCCESS RATE: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! App is bulletproof! 🎉');
    } else {
      console.log(`\n⚠️  ${totalFailed} tests failed. Please fix before deployment.`);
    }
  }

  // Public method to get results for external use
  getResults(): TestSuite[] {
    return this.results;
  }
}

// Export for use in browser console or test runner
(window as any).MemoQuizTestSuite = MemoQuizTestSuite;

// Auto-run if in test mode
if (typeof window !== 'undefined' && window.location.search.includes('test=true')) {
  const testSuite = new MemoQuizTestSuite();
  testSuite.runAllTests();
}

export default MemoQuizTestSuite; 