import { contextBridge, ipcRenderer } from "electron";

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld("electron", {
  app: {
    version: () => ipcRenderer.invoke("app:version"),
    name: () => ipcRenderer.invoke("app:name"),
    platform: () => ipcRenderer.invoke("app:platform"),
  },
});

// Type definition for TypeScript
declare global {
  interface Window {
    electron: {
      app: {
        version: () => Promise<string>;
        name: () => Promise<string>;
        platform: () => Promise<string>;
      };
    };
  }
}
