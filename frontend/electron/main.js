import { app, BrowserWindow, globalShortcut, ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        title: "Visager",
        titleBarStyle: 'hiddenInset',
        vibrancy: 'under-window',
        visualEffectState: 'active',
        backgroundColor: '#00000000',
    });

    // Handle Native File Dialog via IPC
    ipcMain.handle('select-files-dialog', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
            ]
        });

        if (result.canceled) return [];
        return result.filePaths;
    });

    const startUrl = process.env.ELECTRON_START_URL || `file://${path.resolve(__dirname, '../dist/index.html')}`;
    console.log('Loading URL:', startUrl);
    mainWindow.loadURL(startUrl);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // Register Ctrl+Q and Cmd+Q
    globalShortcut.register('CommandOrControl+Q', () => {
        app.quit();
    });
}

function startBackend() {
    const isDev = !!process.env.ELECTRON_START_URL;
    let enginePath;
    let args = [];
    let cwd;

    if (isDev) {
        // Development mode: spawn using venv python and main.py
        console.log('Dev Mode: Starting Backend via venv python');
        const projectRoot = path.join(__dirname, '../..');
        enginePath = path.join(projectRoot, 'venv312/bin/python3');
        args = [path.join(projectRoot, 'backend/main.py')];
        cwd = path.join(projectRoot, 'backend');
    } else {
        // Production mode: spawn the standalone binary from Resources
        const productionBinary = path.join(process.resourcesPath, 'VisagerEngine');
        console.log('Production Mode: Starting Bundled Engine at', productionBinary);

        // Fallback check if it's not in Resources (e.g., local packaged build)
        if (fs.existsSync(productionBinary)) {
            enginePath = productionBinary;
        } else {
            // Local fallback for testing locally packaged builds
            enginePath = path.join(__dirname, '../../backend/dist/VisagerEngine');
        }
        cwd = path.dirname(enginePath);
    }

    console.log('Spawning Backend:', enginePath, args.join(' '));

    backendProcess = spawn(enginePath, args, {
        cwd: cwd,
        stdio: 'ignore', // CRITICAL: Silences all logs and prevents terminal popups
        detached: false, // Keep it attached so it dies with Electron
        env: {
            ...process.env,
            PYTHON_SILENT: "1", // Tells our Python code to use 'critical' log level
            PYTHONPATH: cwd
        }
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend engine:', err);
    });

    backendProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
            console.error(`Backend engine exited unexpectedly with code ${code}`);
        }
    });
}

app.on('ready', () => {
    startBackend();
    createWindow();
});

app.on('will-quit', () => {
    if (backendProcess) {
        console.log('Ensuring backend engine is terminated...');
        backendProcess.kill();
    }
});

app.on('window-all-closed', function () {
    app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    if (backendProcess) {
        backendProcess.kill();
    }
});
