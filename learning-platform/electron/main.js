const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let backendProcess;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const BACKEND_PORT = 5000;
const FRONTEND_URL = isDev ? 'http://localhost:3000' : `http://localhost:${BACKEND_PORT}`;

function startBackend() {
  const backendPath = isDev
    ? path.join(__dirname, '../backend/src/index.js')
    : path.join(process.resourcesPath, 'backend/src/index.js');

  backendProcess = spawn('node', [backendPath], {
    env: { ...process.env, PORT: BACKEND_PORT },
    stdio: 'pipe',
  });

  backendProcess.stdout.on('data', (data) => console.log('[Backend]', data.toString()));
  backendProcess.stderr.on('data', (data) => console.error('[Backend Error]', data.toString()));
  backendProcess.on('close', (code) => console.log('[Backend] exited with code', code));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d0d1a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'assets/icon.png'),
  });

  // Wait for backend to start
  setTimeout(() => {
    mainWindow.loadURL(FRONTEND_URL);
  }, isDev ? 0 : 2000);

  if (isDev) mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  if (!isDev) startBackend();
  createWindow();
  app.on('activate', () => { if (!mainWindow) createWindow(); });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

// IPC: Open folder dialog
ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Course Folder',
  });
  return result.canceled ? null : result.filePaths[0];
});

// IPC: Open file
ipcMain.handle('open-file', async (event, filePath) => {
  await shell.openPath(filePath);
});

// IPC: Store get/set
ipcMain.handle('store-get', (event, key) => store.get(key));
ipcMain.handle('store-set', (event, key, value) => store.set(key, value));
