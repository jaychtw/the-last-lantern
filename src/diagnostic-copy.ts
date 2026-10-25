// Optional diagnostic UI resources, kept out of the normal gameplay bundle.
const en={
  title:'Playtest diagnostics',open:'Diagnostics',ready:'Diagnostics · ready',recording:'Recording',close:'Close',start:'Record 60 seconds',long:'Record 3 minutes',stop:'Stop and review',download:'Download JSON',copy:'Copy JSON',output:'Diagnostic results',
  intro:'Close this panel to play. Record while walking or battling. Menus and loading are tagged separately. No saves or hero names are exported; nothing is sent online.',
  limits:'FPS measures browser animation callbacks, not physical display presentation. JavaScript heap excludes native image/canvas memory. Missing measurements stay unavailable.',
  hardware:'Device (owner reported)',unknown:'Unknown / unavailable',desktop:'Physical desktop',android:'Physical Android phone',ios:'Physical iPhone / iPad',emulated:'Emulated / virtual device',
  acceleration:'Canvas acceleration (owner checked)',accelerated:'Hardware accelerated in browser status',software:'Software rendering in browser status',gpuHint:'On Chrome/Edge, open chrome://gpu or edge://gpu and check Canvas. A WebGL renderer string alone does not verify Canvas2D acceleration.',
  probe:'Read WebGL environment',probeDone:'WebGL information recorded. Canvas2D acceleration remains owner reported.',notes:'Optional playtest observations',clear:'Clear captured results',empty:'No completed samples yet.',done:'Sample completed. Download or copy the JSON.',copied:'JSON copied.',fallback:'Clipboard unavailable. Select the results below or download JSON.',downloaded:'JSON download requested.',disabled:'Disable diagnostics',disabledHint:'Return to the normal game URL without diagnostics=1. This reloads the page; save your progress first.',
  summary:'Captured samples',sampling:'Browser rAF timing; paused and reduced-motion states are not newly drawn FPS.',memory:'Heap / texture estimates are not total device memory.',
  context:'Scene / viewport',jsHeap:'JavaScript heap',textures:'Logical texture pixels',nativeMemory:'Native/process memory',
  fps:'FPS',
};
type Copy=Record<keyof typeof en,string>;
const zh:Copy={
  title:'遊玩診斷',open:'診斷',ready:'診斷 · 待命',recording:'記錄中',close:'關閉',start:'記錄 60 秒',long:'記錄 3 分鐘',stop:'停止並查看',download:'下載 JSON',copy:'複製 JSON',output:'診斷結果',
  intro:'關閉此視窗即可遊玩。請在移動或戰鬥時記錄。選單與載入會分別標記。不會匯出存檔或主角姓名，也不會上傳資料。',
  limits:'FPS 測量瀏覽器動畫回呼，並非螢幕實際顯示幀數。JavaScript 堆積不含原生圖片與畫布記憶體。無法取得的數值會標示為不可用。',
  hardware:'裝置（由測試者填寫）',unknown:'未知／無法取得',desktop:'實體桌上型電腦',android:'實體 Android 手機',ios:'實體 iPhone／iPad',emulated:'模擬／虛擬裝置',
  acceleration:'畫布加速（由測試者查核）',accelerated:'瀏覽器狀態顯示硬體加速',software:'瀏覽器狀態顯示軟體繪製',gpuHint:'Chrome／Edge 可開啟 chrome://gpu 或 edge://gpu 查閱 Canvas。WebGL 繪圖器名稱無法單獨證明 Canvas2D 使用硬體加速。',
  probe:'讀取 WebGL 環境',probeDone:'已記錄 WebGL 資訊。Canvas2D 加速狀態仍由測試者填寫。',notes:'遊玩觀察（選填）',clear:'清除診斷記錄',empty:'尚無完成的樣本。',done:'樣本已完成。請下載或複製 JSON。',copied:'已複製 JSON。',fallback:'剪貼簿無法使用。請選取下方結果或下載 JSON。',downloaded:'已要求下載 JSON。',disabled:'停用診斷',disabledHint:'請先存檔，再回到不含 diagnostics=1 的一般遊戲網址。這會重新載入頁面。',
  summary:'已記錄樣本',sampling:'測量瀏覽器 rAF 時序；暫停與減少動態狀態並非新繪製的 FPS。',memory:'堆積與材質估算不是裝置總記憶體。',
  context:'場景／顯示區域',jsHeap:'JavaScript 堆積',textures:'材質像素估算',nativeMemory:'原生／處理程序記憶體',
  fps:'FPS',
};
export const diagnosticCopy={en,'zh-TW':zh};
