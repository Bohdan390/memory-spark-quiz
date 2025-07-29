const { app, BrowserWindow, Menu, ipcMain, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');
let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development';
const isDebug = process.argv.includes('--debug') || process.env.ELECTRON_DEBUG === 'true';
// Storage paths
const DOCUMENTS_PATH = path.join(os.homedir(), 'Documents', 'MemoQuiz');
const FOLDERS_FILE = path.join(DOCUMENTS_PATH, 'folders.json');
const NOTES_FILE = path.join(DOCUMENTS_PATH, 'notes.json');
const QUIZ_QUESTIONS_DIR = path.join(DOCUMENTS_PATH, 'quiz-questions');
const QUIZ_RESULTS_DIR = path.join(DOCUMENTS_PATH, 'quiz-results');
const SETTINGS_FILE = path.join(DOCUMENTS_PATH, 'settings.json');
// Ensure storage directories exist
const ensureDirectories = () => {
    const dirs = [DOCUMENTS_PATH, QUIZ_QUESTIONS_DIR, QUIZ_RESULTS_DIR];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};
ensureDirectories();
// Check if port is available
const checkPort = (port) => {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, () => {
            server.once('close', () => resolve(true));
            server.close();
        });
        server.on('error', () => resolve(false));
    });
};
// Find available development server
const findDevServer = async () => {
    const ports = [8080, 8081, 8082, 8083];
    for (const port of ports) {
        try {
            const response = await fetch(`http://localhost:${port}`);
            if (response.ok) {
                console.log(`Found development server on port ${port}`);
                return `http://localhost:${port}`;
            }
        }
        catch (error) {
            // Port not available or server not responding
        }
    }
    // Fallback to checking if any port is available
    for (const port of ports) {
        const available = await checkPort(port);
        if (available) {
            console.log(`Port ${port} is available but no server running`);
            return `http://localhost:${port}`;
        }
    }
    throw new Error('No development server found on any port');
};
const createWindow = async () => {
    try {
        // Create the browser window
        mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
                webSecurity: !isDev, // Allow local resources in dev
            },
            titleBarStyle: 'default',
            show: false, // Don't show until ready
            icon: path.join(__dirname, '../assets/icons/icon.png'), // App icon
        });
        // Load the app
        let loadUrl;
        if (isDev) {
            try {
                loadUrl = await findDevServer();
                console.log(`Trying to load development server from: ${loadUrl}`);
                await mainWindow.loadURL(loadUrl);
                console.log(`Successfully loaded from ${loadUrl}`);
                // Open DevTools in development
                mainWindow.webContents.openDevTools();
            }
            catch (error) {
                console.error('Failed to load development server:', error);
                // Fallback to production build
                const indexPath = path.join(__dirname, '../dist/index.html');
                console.log(`Fallback: Loading production app from: ${indexPath}`);
                await mainWindow.loadFile(indexPath);
            }
        }
        else if (isDebug) {
            // Debug mode: Load test page first
            const testPath = path.join(__dirname, '..', 'dist', 'test.html');
            console.log(`Debug mode: Loading test page from: ${testPath}`);
            if (fs.existsSync(testPath)) {
                await mainWindow.loadFile(testPath);
                console.log('Test page loaded successfully');
            }
            else {
                console.error('Test page not found, trying main app');
                const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
                await mainWindow.loadFile(indexPath);
            }
            // Open DevTools in debug mode
            mainWindow.webContents.openDevTools();
        }
        else {
            // In production, the dist folder is packaged with the app
            // Try multiple possible paths for different build configurations
            const possiblePaths = [
                path.join(__dirname, '..', 'dist', 'index.html'),
                path.join(__dirname, 'dist', 'index.html'),
                path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
                path.join(__dirname, '..', 'app', 'dist', 'index.html')
            ];
            let indexPath = null;
            for (const testPath of possiblePaths) {
                if (fs.existsSync(testPath)) {
                    indexPath = testPath;
                    console.log(`Found index.html at: ${indexPath}`);
                    break;
                }
            }
            if (!indexPath) {
                throw new Error(`Could not find index.html. Tried paths: ${possiblePaths.join(', ')}`);
            }
            console.log(`Loading production app from: ${indexPath}`);
            await mainWindow.loadFile(indexPath);
        }
        // Show window when ready
        mainWindow.once('ready-to-show', () => {
            if (mainWindow) {
                mainWindow.show();
                // Focus the window
                if (isDev) {
                    mainWindow.focus();
                }
            }
        });
        // Handle window closed
        mainWindow.on('closed', () => {
            mainWindow = null;
        });
        // Add error handler for failed loads
        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            console.error('Failed to load:', errorCode, errorDescription, validatedURL);
            // Show error page
            mainWindow.loadURL(`data:text/html,
        <html>
          <head><title>Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 50px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #e74c3c;">Failed to Load Application</h1>
              <p><strong>Error Code:</strong> ${errorCode}</p>
              <p><strong>Error:</strong> ${errorDescription}</p>
              <p><strong>URL:</strong> ${validatedURL}</p>
              <p>Please restart the application or check the console for more details.</p>
              <button onclick="window.location.reload()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Reload</button>
            </div>
          </body>
        </html>
      `);
        });
    }
    catch (error) {
        console.error('Error creating window:', error);
        // Show error dialog
        if (mainWindow) {
            await mainWindow.loadURL(`data:text/html,
        <html>
          <head><title>Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 50px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #e74c3c;">Failed to Load Application</h1>
              <p><strong>Error:</strong> ${error}</p>
              <p>Please restart the application.</p>
              <button onclick="window.location.reload()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Reload</button>
            </div>
          </body>
        </html>
      `);
            mainWindow.show();
        }
    }
};
// File operation helpers
const readJsonFile = (filePath, defaultValue) => {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    }
    catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return defaultValue;
    }
};
const writeJsonFile = (filePath, data) => {
    try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    }
    catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
};
// IPC handlers for folders
ipcMain.handle('get-folders', () => {
    return readJsonFile(FOLDERS_FILE, []);
});
ipcMain.handle('save-folders', (_, folders) => {
    return writeJsonFile(FOLDERS_FILE, folders);
});
// IPC handlers for notes
ipcMain.handle('get-notes', () => {
    return readJsonFile(NOTES_FILE, []);
});
ipcMain.handle('save-notes', (_, notes) => {
    return writeJsonFile(NOTES_FILE, notes);
});
// Generic data save handler
ipcMain.handle('save-data', (_, data) => {
    // This is a generic handler for saving any data
    // You can implement specific logic here if needed
    return true;
});
// IPC handlers for quiz questions (per folder)
ipcMain.handle('get-quiz-questions', (_, folderId) => {
    const filePath = path.join(QUIZ_QUESTIONS_DIR, `${folderId}.json`);
    return readJsonFile(filePath, []);
});
ipcMain.handle('save-quiz-questions', (_, folderId, questions) => {
    const filePath = path.join(QUIZ_QUESTIONS_DIR, `${folderId}.json`);
    return writeJsonFile(filePath, questions);
});
// IPC handlers for quiz results (per folder)
ipcMain.handle('get-quiz-results', (_, folderId) => {
    const filePath = path.join(QUIZ_RESULTS_DIR, `${folderId}.json`);
    return readJsonFile(filePath, []);
});
ipcMain.handle('save-quiz-results', (_, folderId, results) => {
    const filePath = path.join(QUIZ_RESULTS_DIR, `${folderId}.json`);
    return writeJsonFile(filePath, results);
});
// IPC handlers for settings
ipcMain.handle('get-settings', () => {
    return readJsonFile(SETTINGS_FILE, {
        theme: 'system',
        autoSave: true,
        notifications: true,
        studyReminders: true,
        defaultQuizLength: 10,
        spacedRepetition: true
    });
});
ipcMain.handle('save-settings', (_, settings) => {
    return writeJsonFile(SETTINGS_FILE, settings);
});
// IPC handler for storage path
ipcMain.handle('get-storage-path', () => {
    return DOCUMENTS_PATH;
});
// IPC handler for export data
ipcMain.handle('export-data', async () => {
    try {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Export MemoQuiz Data',
            defaultPath: path.join(DOCUMENTS_PATH, `memoquiz-export-${new Date().toISOString().split('T')[0]}.json`),
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        if (!result.canceled && result.filePath) {
            const folders = readJsonFile(FOLDERS_FILE, []);
            const notes = readJsonFile(NOTES_FILE, []);
            // Collect all quiz questions and results
            const allQuizQuestions = {};
            const allQuizResults = {};
            if (fs.existsSync(QUIZ_QUESTIONS_DIR)) {
                const questionFiles = fs.readdirSync(QUIZ_QUESTIONS_DIR);
                for (const file of questionFiles) {
                    if (file.endsWith('.json')) {
                        const folderId = file.replace('.json', '');
                        allQuizQuestions[folderId] = readJsonFile(path.join(QUIZ_QUESTIONS_DIR, file), []);
                    }
                }
            }
            if (fs.existsSync(QUIZ_RESULTS_DIR)) {
                const resultFiles = fs.readdirSync(QUIZ_RESULTS_DIR);
                for (const file of resultFiles) {
                    if (file.endsWith('.json')) {
                        const folderId = file.replace('.json', '');
                        allQuizResults[folderId] = readJsonFile(path.join(QUIZ_RESULTS_DIR, file), []);
                    }
                }
            }
            const exportData = {
                folders,
                notes,
                quizQuestions: allQuizQuestions,
                quizResults: allQuizResults,
                settings: readJsonFile(SETTINGS_FILE, {}),
                exportDate: new Date().toISOString(),
                version: app.getVersion()
            };
            return writeJsonFile(result.filePath, exportData);
        }
        return false;
    }
    catch (error) {
        console.error('Export error:', error);
        return false;
    }
});
// IPC handler for import data
ipcMain.handle('import-data', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Import MemoQuiz Data',
            properties: ['openFile'],
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const importData = readJsonFile(result.filePaths[0], {});
            if (importData.folders) {
                writeJsonFile(FOLDERS_FILE, importData.folders);
            }
            if (importData.notes) {
                writeJsonFile(NOTES_FILE, importData.notes);
            }
            if (importData.quizQuestions) {
                for (const [folderId, questions] of Object.entries(importData.quizQuestions)) {
                    writeJsonFile(path.join(QUIZ_QUESTIONS_DIR, `${folderId}.json`), questions);
                }
            }
            if (importData.quizResults) {
                for (const [folderId, results] of Object.entries(importData.quizResults)) {
                    writeJsonFile(path.join(QUIZ_RESULTS_DIR, `${folderId}.json`), results);
                }
            }
            if (importData.settings) {
                writeJsonFile(SETTINGS_FILE, importData.settings);
            }
            return true;
        }
        return false;
    }
    catch (error) {
        console.error('Import error:', error);
        return false;
    }
});
// Create application menu
const createMenu = () => {
    const template = [
        {
            label: 'MemoQuiz Enhanced',
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Folder',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-new-folder');
                        }
                    }
                },
                {
                    label: 'New Note',
                    accelerator: 'CmdOrCtrl+Shift+N',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-new-note');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Export Data',
                    accelerator: 'CmdOrCtrl+E',
                    click: async () => {
                        if (mainWindow) {
                            const success = await ipcMain.handle('export-data', []);
                            if (success) {
                                mainWindow.webContents.send('menu-export-success');
                            }
                            else {
                                mainWindow.webContents.send('menu-export-error');
                            }
                        }
                    }
                },
                {
                    label: 'Import Data',
                    accelerator: 'CmdOrCtrl+I',
                    click: async () => {
                        if (mainWindow) {
                            const success = await ipcMain.handle('import-data', []);
                            if (success) {
                                mainWindow.webContents.send('menu-import-success');
                            }
                            else {
                                mainWindow.webContents.send('menu-import-error');
                            }
                        }
                    }
                },
                { type: 'separator' },
                { role: 'close' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectall' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Study',
            submenu: [
                {
                    label: 'Start Quiz',
                    accelerator: 'CmdOrCtrl+Shift+Q',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-start-quiz');
                        }
                    }
                },
                {
                    label: 'Generate Quiz',
                    accelerator: 'CmdOrCtrl+G',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-generate-quiz');
                        }
                    }
                }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                { role: 'front' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About MemoQuiz Enhanced',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-about');
                        }
                    }
                },
                {
                    label: 'Open Data Folder',
                    click: async () => {
                        const { shell } = require('electron');
                        await shell.openPath(DOCUMENTS_PATH);
                    }
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};
// App event handlers
app.whenReady().then(() => {
    createMenu();
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
// Add debugging for macOS
if (process.platform === 'darwin') {
    console.log('Running on macOS');
    console.log('App path:', app.getAppPath());
    console.log('Resource path:', process.resourcesPath);
    console.log('Current directory:', process.cwd());
    console.log('__dirname:', __dirname);
}
// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (isDev) {
        // In development, ignore certificate errors
        event.preventDefault();
        callback(true);
    }
    else {
        // In production, use default behavior
        callback(false);
    }
});
// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (navigationEvent, url) => {
        navigationEvent.preventDefault();
    });
});
// Add crash handler for debugging
app.on('render-process-gone', (event, webContents, details) => {
    console.error('Render process gone:', details);
});
app.on('child-process-gone', (event, details) => {
    console.error('Child process gone:', details);
});
module.exports = {};
