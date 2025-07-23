const { app, BrowserWindow, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');
let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development';
// Storage paths
const DOCUMENTS_PATH = path.join(os.homedir(), 'Documents', 'MemoQuiz');
const FOLDERS_FILE = path.join(DOCUMENTS_PATH, 'folders.json');
const NOTES_FILE = path.join(DOCUMENTS_PATH, 'notes.json');
// Ensure storage directory exists
if (!fs.existsSync(DOCUMENTS_PATH)) {
    fs.mkdirSync(DOCUMENTS_PATH, { recursive: true });
}
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
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js'),
            },
            titleBarStyle: 'default',
            show: false, // Don't show until ready
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
                loadUrl = `file://${path.join(__dirname, '../dist/index.html')}`;
                await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
            }
        }
        else {
            loadUrl = `file://${path.join(__dirname, '../dist/index.html')}`;
            await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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
    }
    catch (error) {
        console.error('Error creating window:', error);
        // Show error dialog
        if (mainWindow) {
            await mainWindow.loadURL(`data:text/html,
        <html>
          <head><title>Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Failed to Load Application</h1>
            <p>Error: ${error}</p>
            <p>Please restart the application.</p>
          </body>
        </html>
      `);
            mainWindow.show();
        }
    }
};
// File operation helpers
const readJsonFile = (filePath, defaultValue = []) => {
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
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    }
    catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
};
// IPC handlers
ipcMain.handle('get-folders', () => {
    return readJsonFile(FOLDERS_FILE, []);
});
ipcMain.handle('save-folders', (_, folders) => {
    return writeJsonFile(FOLDERS_FILE, folders);
});
ipcMain.handle('get-notes', () => {
    return readJsonFile(NOTES_FILE, []);
});
ipcMain.handle('save-notes', (_, notes) => {
    return writeJsonFile(NOTES_FILE, notes);
});
ipcMain.handle('get-storage-path', () => {
    return DOCUMENTS_PATH;
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
module.exports = {};
