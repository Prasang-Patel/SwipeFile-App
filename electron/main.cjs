const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Swipefile local paths
const USER_HOME = os.homedir();
const BASE_DATA_DIR = path.join(USER_HOME, 'SwipefileData');
const MEDIA_DIR = path.join(BASE_DATA_DIR, 'media');
const DB_PATH = path.join(BASE_DATA_DIR, 'swipefile.db');

// Ensure local directories exist
if (!fs.existsSync(BASE_DATA_DIR)) {
  fs.mkdirSync(BASE_DATA_DIR, { recursive: true });
}
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0a0a0a',
    title: 'Swipefile',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    const devServerUrl = process.env.DEV_SERVER_URL || 'http://localhost:3000';
    mainWindow.loadURL(devServerUrl);
    // Optional: mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('dialog:openMediaFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Ad Media (Image or Video)',
    properties: ['openFile'],
    filters: [
      { name: 'All Supported Media', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'webm'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
      { name: 'Videos', extensions: ['mp4', 'mov', 'webm'] }
    ]
  });

  if (result.canceled || !result.filePaths.length) {
    return null;
  }

  const sourcePath = result.filePaths[0];
  const filename = path.basename(sourcePath);
  const ext = path.extname(filename);
  const cleanBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const targetFilename = `${Date.now()}_${cleanBase}${ext}`;
  const targetPath = path.join(MEDIA_DIR, targetFilename);

  // Copy selected media to SwipefileData/media
  fs.copyFileSync(sourcePath, targetPath);

  return {
    originalPath: sourcePath,
    storedPath: targetPath,
    filename: targetFilename
  };
});

ipcMain.handle('storage:getPaths', async () => {
  return {
    baseDir: BASE_DATA_DIR,
    mediaDir: MEDIA_DIR,
    dbPath: DB_PATH
  };
});

ipcMain.handle('storage:openMediaFolder', async () => {
  if (fs.existsSync(MEDIA_DIR)) {
    await shell.openPath(MEDIA_DIR);
    return true;
  }
  return false;
});

app.whenReady().then(() => {
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
