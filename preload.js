const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  get: () => ipcRenderer.invoke('get'),
  act: (type, p) => ipcRenderer.invoke('act', type, p),
  city: name => ipcRenderer.invoke('city', name),
  chat: text => ipcRenderer.invoke('chat', text), // hỏi Pet: Claude (nếu có khóa) hoặc trả lời ngoại tuyến // đổi vị trí thời tiết theo tên thành phố
  profile: (type, p) => ipcRenderer.invoke('profile', type, p), // hồ sơ người dùng: switchTo, setProfile
  ui: (cmd, arg) => ipcRenderer.send('ui', cmd, arg),
  on: (ch, fn) => ipcRenderer.on(ch, (_, d) => fn(d)),
  // File kéo thả → đường dẫn thật trên đĩa → main chuyển vào Thùng rác.
  eat: files => ipcRenderer.invoke('eat', [...files].map(f => webUtils.getPathForFile(f)).filter(Boolean)),
});
