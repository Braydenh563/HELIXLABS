const { app, BrowserWindow } = require('electron/main');
const path = require('path');

// ── GPU / performance flags — MUST be set before app 'ready' ──────────────────
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-oop-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-software-rasterizer');
// app.commandLine.appendSwitch('disable-frame-rate-limit');
// app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('use-angle', 'd3d11');
app.commandLine.appendSwitch('enable-hardware-overlays', 'single-fullscreen,single-on-top');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
// app.commandLine.appendSwitch('in-process-gpu');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: 'HELIXLABS',
    backgroundColor: '#1C1D1C',
    icon: path.join(__dirname, 'metadata/HELIXLABS_Thumbnail.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  win.loadFile('index.html');

  // Comment out for your final build / exhibition:
  // win.webContents.openDevTools();

  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});