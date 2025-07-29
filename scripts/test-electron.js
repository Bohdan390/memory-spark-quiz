const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

const createTestWindow = async () => {
  try {
    console.log('Creating test window...');
    
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false
      },
      show: false
    });

    // Test different paths
    const testPaths = [
      path.join(__dirname, '..', 'dist', 'test.html'),
      path.join(__dirname, '..', 'dist', 'index.html'),
      path.join(process.cwd(), 'dist', 'test.html'),
      path.join(process.cwd(), 'dist', 'index.html')
    ];

    console.log('Testing paths:');
    testPaths.forEach((testPath, index) => {
      const exists = fs.existsSync(testPath);
      console.log(`${index + 1}. ${testPath} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    });

    // Try to load test.html first
    const testPath = path.join(__dirname, '..', 'dist', 'test.html');
    if (fs.existsSync(testPath)) {
      console.log(`Loading test page from: ${testPath}`);
      await mainWindow.loadFile(testPath);
      console.log('Test page loaded successfully');
    } else {
      console.log('Test page not found, trying index.html');
      const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        await mainWindow.loadFile(indexPath);
        console.log('Index page loaded successfully');
      } else {
        throw new Error('No HTML files found');
      }
    }

    mainWindow.once('ready-to-show', () => {
      console.log('Window ready to show');
      mainWindow.show();
      mainWindow.webContents.openDevTools();
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // Add error handlers
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load:', errorCode, errorDescription, validatedURL);
    });

  } catch (error) {
    console.error('Error creating test window:', error);
    process.exit(1);
  }
};

app.whenReady().then(createTestWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createTestWindow();
  }
});