# Desktop and phone validation — no development tools required

Use the [Gate C follow-up ZIP](https://github.com/jaychtw/the-last-lantern/raw/refs/heads/main/playtest/the-last-lantern-gate-c.zip). This is a private review package, not production acceptance. The owner has already reported smooth, visually satisfactory desktop play at `b763562`; the procedure below adds measurements to that observation.

## Start the optional diagnostic

1. Extract the entire ZIP. Run `python3 serve-playtest.py` in that folder; Windows can use `py serve-playtest.py`. Python 3 is the same portable helper used previously. No npm, SDK, browser extensions or DevTools are needed.
2. Save your game before changing/reloading its URL. Open **`http://127.0.0.1:8090/?diagnostics=1`**. Continue your existing journey or start normally. The query parameter does not change saves, rules or progression. Saves remain browser-local and do not transfer between devices/origins.
3. For a phone, run **`python3 serve-playtest.py --lan`**, connect it to the same trusted Wi-Fi, and open **`http://COMPUTER-LAN-IP:8090/?diagnostics=1`**. Use the computer's actual LAN address. Stop the helper with Ctrl+C afterwards. No public hosting or tunnel is required.
4. Tap **Diagnostics / 診斷** at the bottom of exploration, or the diagnostic button inside an open game dialog. Select the physical device you are actually using. Leave unknown measurements as **Unknown / unavailable**.
5. On desktop Chrome/Edge, enable the browser's normal graphics-acceleration setting and restart if requested. Open `chrome://gpu` / `edge://gpu` in another tab and inspect **Canvas** under Graphics Feature Status. Select “Hardware accelerated” only if that status actually says so. A setting being enabled, a GPU model, or the optional WebGL probe alone does not prove Canvas2D acceleration. On phones/Safari, leave this unknown when it cannot be checked. Return to the game before recording.

The panel and instructions support English and Traditional Chinese, following the live game language. **Diagnostics are disabled on the normal URL.** No diagnostic module, stylesheet, timer or observer loads without `diagnostics=1`.

## Quick playtest (about five minutes, plus travel)

Warm up for about 15 seconds. Select **Record 60 seconds / 記錄 60 秒**; the panel closes so you can play. A small badge shows remaining time and rolling browser rAF FPS. Capture stops automatically. Tap the badge or a dialog's diagnostic button to stop early and review.

| Sample | What to do |
| --- | --- |
| Town | Walk around the square, buildings, trees and bridge for a minute. Avoid simply standing still. |
| Overworld | Traverse an unlocked region using your normal keyboard/touch controls. |
| Dungeon | Explore an unlocked dungeon, including its lighting and foreground scenery. |
| Combat | Record before/during actual Attack, Guard and magic; include reactions and phase changes. |
| Interfaces | Open dialogue, equipment and settings, switch language, then return to play. These paused states are tagged separately. |

Use scenes your save has unlocked. A fresh phone can test town, Meadow Path and its first battle, then add later regions as they become available. **An unavailable scene is untested, not passed.** The diagnostic does not unlock areas or alter progress. For firmer results, repeat important samples three times under the same browser/window size, motion/audio preferences and power conditions. Note the device model, power-saving mode, hot/cold state and perceived responsiveness in the optional observations field.

Download JSON after each sample or a small group. The export includes distributions, p95/p99/max intervals, 1% low, >50.5 ms / >100 ms intervals, available long tasks, scene/mode/viewport/DPR, logical texture estimates, available JS-heap samples and browser information. No automatic pass/fail is assigned. Overall browser rAF FPS includes menus; **use the exploration/battle state buckets when assessing gameplay**. State-boundary gaps remain in the overall sample and separate boundary records. Resize/orientation changes get separate buckets. Hiding the tab or locking the phone ends capture explicitly; start again after returning.

## Memory and sustained-play check

Choose **Record 3 minutes / 記錄 3 分鐘**. Travel repeatedly between available regions using Explore/exits; note the route and approximate number of transitions. Repeat for a longer session, exporting each run. Watch for increasing loading delays, jerky input, disappearing artwork, tab reloads or crashes. Do not clear browser caches or manually force reclamation between ordinary runs.

JavaScript heap, when exposed by the browser, **does not include native images/canvas caches or total process RAM**. Logical texture bytes are pixel estimates, not measured RAM. Safari/Firefox or insecure LAN pages may expose fewer indicators; JSON `null` means unavailable, not zero. Approximate device RAM is a hardware class hint, not free memory. The portable page cannot certify native-memory safety on a phone.

Optional desktop corroboration: the browser's own Task Manager (Chrome: Shift+Esc or More tools → Task Manager) can show the game tab's memory footprint at the start, after repeated regions, and after idle. Record what column/process was observed. Those figures are not equivalent to the cloud investigation's whole-browser Linux PSS and must not be mixed into that table. No developer-tool installation is required for the basic playtest.

## Export, interpretation and stopping

- **Download JSON / 下載 JSON** saves `last-lantern-diagnostics.json`. Rename it with device/scene/run so later downloads are not confused.
- **Copy JSON / 複製 JSON** uses the clipboard when available. On ordinary LAN HTTP it may be unavailable; the full JSON remains selectable in the results field, and Download still works. iOS may offer a file/Share sheet.
- Send the exported files with your playtest observations for analysis. Exports stay local until you choose to share them; there is no upload, telemetry or account. Hero names, inventory and save data are not collected. Optional notes contain exactly what you enter.
- FPS is animation-callback pacing, **not measured display presentation**. Estimated missed 60 Hz slots are not a hardware dropped-frame counter. Stable 30 FPS can feel smooth while still falling below the desktop target; subjective smoothness and measured FPS are separate evidence.
- The sampler adds some work while enabled; the report quantifies a cloud overhead control. It neither lowers resolution nor changes fidelity. Only the latest 12 completed samples are kept; discard counts and the 72,000-interval limit are explicit in the export. Download regularly.
- Save, then remove `?diagnostics=1` to return to ordinary play. This reloads the page. Do not treat any sample or owner report as final production acceptance or public-deployment authorization.

繁體中文快速步驟：先存檔 → 以 Python 啟動本機服務 → 開啟含 `?diagnostics=1` 的網址 → 點「診斷」並填寫實際裝置／已查核的畫布加速狀態 → 記錄 60 秒遊玩，或記錄 3 分鐘反覆切換地區 → 下載 JSON。手機與電腦需在同一個可信任 Wi-Fi，服務加上 `--lan`。瀏覽器未提供的記憶體資料會保留為不可用；桌面遊玩流暢的主觀回饋不會被換算成實測 FPS。未完成的實體手機、音效與輔助科技測試仍須另外確認。
