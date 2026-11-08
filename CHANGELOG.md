## 0.27.1 - 2026-11-08

### Changed
- **Photorealistic Virtual Background Scenes for Video Calls (صحنه‌های پس‌زمینه مجازی واقع‌گرایانه تماس تصویری)**:
  - Replaced primitive cartoon vector placeholders with high-resolution 1080p photorealistic scenes featuring realistic depth, cinematic lighting, and natural optical bokeh:
    - **Office (دفتر کار)**: Executive modern workspace with panoramic skyline, wood accents, and soft atmospheric bokeh.
    - **Library (کتابخانه)**: Warm mahogany bookshelf study with ambient golden reading lamps and warm wood textures.
    - **Living Room (اتاق نشیمن)**: Clean Scandinavian interior with indoor houseplants, soft daylight, and neutral tones.
    - **Nature (طبیعت)**: Serene alpine terrace overlook with pine forests, majestic peaks, and sunny mountain horizon.
  - Retained backward-compatible SVG wrappers for cached assets and updated asset loaders in `client/src/utils/videoBackground.js`.

### Fixed
- **Automated Deploy Menu Update & Version Banner Fix (بهینه‌سازی کامل بروزرسانی منو و رفع باگ نسخه در بنر سرور)**:
  - Streamlined option 2 in `scripts/install.sh` to prompt solely for update mode (`Online` vs `Offline`).
  - Completely automated the Online update workflow: fetches git repository, safely resets to `origin/main` (eliminating detached HEAD or divergent branch errors), installs dependencies, builds Vite client, synchronizes migrations, updates service units, restarts Chakavak/Worker services, and reloads Nginx without redundant confirmation prompts.
  - Resolved malformed script version banner string (`Script Version: 0.22.0/usr/...`) by sanitizing extracted semantic version numbers and prioritizing the authoritative root `VERSION` file.
  - Fixed `sed` range in `install_global_command_from_path` to ensure line 2 version stamping in `/usr/local/bin/chakavak` is applied reliably on every update.
- **Duplicate Chat Tabs Removal & Creation Menu Clipping Fix (حذف سطر تب تکراری و رفع بریدگی منوی ساخت گفتگو)**:
  - Eliminated the redundant internal category tab bar in `ChatsListPanel.jsx` that was conflicting with `ChatFolderTabs.jsx` and causing duplicate rows and confusing empty states.
  - Unified chat folder filtering with support for archived chats in `ChatFolderTabs.jsx` and `useActiveChatState.js`.
  - Fixed z-index layering on `SidebarHeader.jsx` wrapper in `ChatSidebar.jsx` (`z-30`) and creation dropdown menu (`z-50`), ensuring "New channel" and all menu options float smoothly above the chat list and never get clipped.
- **Dynamic Version Badge on Landing / Auth Page (نمایش پویا و خودکار نسخه برنامه در صفحه ورود)**:
  - Replaced the hardcoded `v0.24.0` badge on `AuthPage.jsx` with dynamic runtime resolution.
  - Injected `__APP_VERSION__` at build time in `client/vite.config.js` and `client/src/settings/appConfig.js`.
  - Wired live version synchronization from `/api/app/info` through `App.jsx` and `AuthPage.jsx`, ensuring the version badge immediately reflects the running release across updates.

## 0.27.0 - 2026-11-08

### Added
- **Virtual Background Scenes for Video Calls (پس‌زمینه‌های مجازی تماس تصویری)**:
  - Added 4 bundled SVG background scenes: Office (دفتر کار), Living Room (اتاق نشیمن), Library (کتابخانه), and Nature (طبیعت) in `client/public/backgrounds/`.
  - Integrated into the existing MediaPipe Selfie Segmentation image pipeline in `client/src/utils/videoBackground.js`.
  - Graceful fallback: keeps existing effect and surfaces clear error feedback if image loading fails.

### Fixed
- **Background Effect Menu & Error Visibility in Video Calls**:
  - Prevented premature closing of background effect menu before segmentation model loads, ensuring load errors are surfaced cleanly to the user.
  - Resolved controls row overflow and layout clipping in `CallScreen.jsx`.

## 0.26.0 - 2026-11-07

### Added
- **Telegram-Grade In-Flight Video Editing Suite (ویرایش پیشرفته ویدیو در زمان ارسال)**:
  - **Video Trimming with Dual-Handle Timeline Scrubber**:
    - Added an interactive dual-handle scrubber timeline under video preview in `MediaSendModal.jsx`.
    - Real-time frame seeking during handle dragging allows users to accurately pin `trimStart` and `trimEnd`.
    - Live time badges (`00:03 ➔ 00:18 • زمان برگزیده: ۱۵ ثانیه`) and active range loop preview.
    - Zero-cost hardware encoding pipeline in `client/src/utils/mediaCompressor.js`: seeks directly to `trimStart`, encodes hardware presentation frames, and finalizes cleanly at `trimEnd`.
  - **90° Video Rotation Tool (چرخش ویدیو)**:
    - Added quick rotation button cycling through 0°, 90°, 180°, and 270°.
    - Live CSS transform preview on the video element and hardware Canvas `translate/rotate` rendering pipeline that swaps canvas dimensions and outputs upright video.
  - **Send as GIF Mode (تبدیل به گیف متحرک)**:
    - Added one-click GIF mode toggle for looping silent video notes.
- **Intelligent Pre-Compression Media Size Validation**:
  - Raw media files (photos/videos) are now permitted up to 500 MB at selection time so users can compress, trim, and optimize large mobile recordings that would otherwise exceed default server limits.
  - Strict server upload limits (`fileUploadMaxSizeMb` and `fileUploadMaxTotalSizeMb`) are now evaluated post-optimization upon confirmation in `ChatPage.jsx`, displaying friendly guidance if a file still exceeds limits.

## 0.25.3 - 2026-11-07

### Fixed
- **Root-Cause Resolution for Client-Side Video Compression Choppiness & Frame Drops**:
  - **Eliminated Chromium Offscreen Throttling**: Fixed video element positioning to stay within active viewport bounds (`top: 0, left: 0, 160x120px, z-index: 99999`) or user-provided container instead of `-9999px`. Completely bypasses Chromium compositor occlusion tracking and power-saving heuristics that throttled video decoding and `requestVideoFrameCallback` down to 1–5 fps.
  - **Restored GPU Hardware Acceleration on Canvas**: Removed `{ willReadFrequently: true }` (which previously forced software CPU rasterization and PCI bus memory transfers on every frame) and enabled `{ alpha: false, desynchronized: true }` for direct, high-speed GPU rendering pipeline.
  - **Synchronized Presentation Clocks & MediaRecorder Start**: Ensured initial video frame is pre-painted to canvas and video presentation is actively playing before starting `recorder.start(1000)` (recording in 1-second chunks instead of interrupting main thread every 100ms), eliminating audio/video synchronization drift and initial frozen frames.
  - **Autoplay Policy & Mute Resilience**: Programmatically handles browser autoplay policies by attempting unmuted playback with Web Audio routing to avoid device speaker output, falling back gracefully to muted mode if transient activation was expired.
  - **Live Progress & Interactive Overlay**: Updated `MediaSendModal.jsx` to pass real-time progress callbacks to `compressVideoFile` and render a modern glassmorphic progress bar overlay with percentage completion.

## 0.25.2 - 2026-11-07

### Fixed
- **Optimized Client-Side Video Compression Pipeline & Eliminated Choppy Frame Drops**:
  - Attached video decoding element to DOM with active GPU rendering properties, eliminating Chromium headless power-saving throttling (which previously reduced decoding framerate to 5-10 fps).
  - Replaced `requestAnimationFrame` with `video.requestVideoFrameCallback` to synchronize canvas frame drawing directly with GPU hardware decoder frame delivery, ensuring zero dropped or juddered frames.
  - Implemented silent Web Audio API routing (`createMediaElementSource` to `createMediaStreamDestination`) to capture crisp, unmuted audio into the video recording stream without blasting playback through speakers.
  - Tuned video bitrates: upgraded 720p preset to 3.2 Mbps for smooth motion encoding and lower CPU compression stress, and 480p to 1.8 Mbps.
  - Added hardware-accelerated H.264 `video/mp4` preferred codec selection with VP8 fallback via `selectOptimalVideoMimeType()`.

## 0.25.1 - 2026-11-07

### Fixed
- **Resolved App Entry Runtime Crash in ChatPage (`isEditingMessage` ReferenceError & Draft State Hoisting)**:
  - Fixed an unhandled `ReferenceError: isEditingMessage is not defined` in `handleConfirmMediaSend` dependency array and body by scoping edit check to `const isEditing = Boolean(editTarget?.id)` and tracking `editTarget`.
  - Hoisted `chatDrafts` and `pinnedByChat` state declarations to top of component, strictly adhering to hook ordering rules and preventing Temporal Dead Zone (TDZ).
  - Added null-safe fallback for `chatDrafts` parsing and indexing in `MediaSendModal` props (`(chatDrafts && activeChatId && chatDrafts[activeChatId]) || ""`).

## 0.25.0 - 2026-11-07

### Added
- **Client-Side Image and Video Compression with Live Preview (فشرده‌سازی و تغییر سایز عکس و ویدیو در زمان ارسال)**:
  - Implemented 100% client-side in-flight media compression engine in `client/src/utils/mediaCompressor.js`:
    - Canvas & OffscreenCanvas hardware-accelerated downscaling and conversion to WebP with aspect ratio preservation.
    - Image presets: `balanced` (Full HD 1080p WebP, 82% quality, ~85-92% size reduction), `eco` (HD 720p WebP, 72% quality, ~93-97% size reduction), and `original` (uncompressed pass-through).
    - Video downscaling engine via Canvas + MediaRecorder with bitrate optimization for `720p` and `480p`.
    - Video audio stripping toggle (`muteAudio`) for silent video uploads.
    - Intelligent animated GIF and SVG preservation (prevents losing GIF animations or vector sharpness).
    - File size safety check: automatically retains original file if compression unexpectedly yields a larger size.
  - Interactive Glassmorphic Media Modal (`client/src/components/modals/MediaSendModal.jsx`):
    - Multi-media carousel and preview with per-item quality preset selector.
    - Real-time estimated size display and savings percentage badge (e.g. `4.2 MB ➔ ~340 KB (-92%)`).
    - Integrated caption input with Enter-to-send support.
    - Dual confirmation actions: `ارسال` (compress and send immediately) and `افزودن به پیام` (compress and attach to composer draft for further editing).
  - Integrated into `ChatPage.jsx` and `MessageComposer.jsx` with file size and savings badges on pending media thumbnails.
  - Comprehensive unit test suite in `client/test/utils/mediaCompressor.test.js` (405 client unit tests passing).

## 0.24.9 - 2026-11-07

### Fixed
- **Google Meet-Grade WebRTC Virtual Background & Optical Bokeh Architecture**:
  - Re-architected video background blur to emulate Google Meet & LiveKit production standards: eliminated fragile single-canvas CSS `ctx.filter` which failed on mobile Android GPU compositors.
  - Implemented dual-canvas optical bokeh downscale/upscale blur: downscales background to an offscreen buffer with bilinear high-quality interpolation, guaranteeing smooth, hardware-accelerated lens blur across all mobile and desktop devices without CPU degradation.
  - Added dedicated offscreen person stencil canvas with feathered alpha blending, cleanly stamping the sharp person over the blurred room.
  - Implemented frame synchronization via `requestVideoFrameCallback` with `requestAnimationFrame` fallback, synchronizing frame processing directly with camera hardware presentation.
  - Prevented Android WebView background occluding/throttling by switching camera feeder element to positive z-index and safe dimensioning.
  - Removed strict `peerConnection` guard in `setVirtualBackground` so virtual background preview can be initialized seamlessly at any point in call setup.

## 0.24.8 - 2026-11-07

### Fixed
- **MediaPipe Video Background Blur Root Cause Resolution**:
  - Identified and resolved native WebAssembly C++ abort crash in MediaPipe SelfieSegmentation: `selfie_segmentation.binarypb` calculator graph hardcodes the general model path `third_party/mediapipe/modules/selfie_segmentation/selfie_segmentation.tflite` in Emscripten MEMFS. Setting `modelSelection: 1` caused MediaPipe to only download the landscape file, triggering a fatal C++ `Calculator::Open() failed` and `abort()` on the first inference pass.
  - Aligned model configuration to `modelSelection: 0` in `client/src/utils/videoBackground.js`, ensuring the general model binary is preloaded into virtual filesystem and cleanly initialized with WebGL acceleration without aborting.
  - Fixed Chromium video frame decoder throttling by adjusting offscreen camera source video element from `opacity: 0` to `opacity: 0.01` and awaiting stream metadata resolution before starting canvas segmentation pipeline.

## 0.24.7 - 2026-11-07

### Added
- **WebRTC Call Draggable Floating Thumbnail (Corner PiP)**:
  - Enabled full pointer and touch dragging for the corner picture-in-picture video thumbnail in `CallScreen.jsx`: users can freely drag and reposition the floating camera window across the stage on both desktop and mobile devices.
  - Implemented automatic 4-corner magnetic snap (`top-left`, `top-right`, `bottom-left`, `bottom-right`) with smooth CSS easing on pointer release.
  - Added responsive auto-reclamping on viewport resize / device orientation changes.
  - Added a dedicated swap button directly on the floating thumbnail and in the secondary bottom control bar next to layout mode, cleanly replacing the fixed bottom-right button and preventing tap/drag conflicts.

## 0.24.6 - 2026-11-07

### Fixed
- **WebRTC Call Picture-in-Picture (PiP) Swap & Video Stream Persistence**:
  - Resolved video feed duplication and collision when swapping local and remote camera views in `CallScreen.jsx`: replaced conditional multi-node mounting with a persistent two-node architecture that toggles container coordinates and classes rather than unmounting/re-mounting DOM `<video>` elements.
  - Exported `localStreamRef` and `remoteStreamRef` from `useWebRTCCall.js` to `ChatPage.jsx` and `<CallScreen />` so video elements directly reference the persistent WebRTC media streams and eliminate ref callback race conditions.
  - Added stream sync broadcast listeners for video element attachment upon device media acquisition and remote track delivery.

## 0.24.5 - 2026-11-07

### Fixed
- **WebRTC Call Ringing Timers & Stale Call Auto-Recovery**:
  - Added 45-second automatic timeout for ringing calls in `callManager.js`: unanswered calls gracefully auto-terminate and record a failed/missed call log instead of remaining in memory indefinitely.
  - Resolved 409 Conflict deadlock in `callManager.js`: if a call attempt encounters a stale ringing call (older than 45 seconds or abandoned), it automatically clears the previous call rather than rejecting new calls.
  - Decoupled Node.js `Timeout` objects from serializable `call` objects into isolated Maps (`ringingTimers`, `durationTimers`) to prevent circular JSON serialization crashes on `/api/calls/start` and `/api/calls/accept`.
  - Added proactive incoming call discovery in `ChatPage.jsx`: the client automatically probes `/api/calls/incoming` on mount, SSE connection, and tab focus so incoming calls immediately pop up the answer screen even across reconnects or background tab restorations.

## 0.24.4 - 2026-11-07

### Fixed
- **WebRTC Call Signaling, Incoming Ringing & Session Desynchronization**:
  - Resolved premature auto-rejection of incoming calls in `useWebRTCCall.js`: removed immediate auto-reject on `call:incoming` when media devices are uninitialized, moving capability enforcement to `acceptCall` so users always see caller identity and incoming call screens.
  - Added browser Autoplay Policy resilience in `CallScreen.jsx`: attached one-time pointer and keyboard interaction listeners to immediately start playback if the browser blocks initial background ringtone autoplay.
  - Added physical device vibration using the Vibration API (`navigator.vibrate`) during incoming calls on supported mobile devices.
  - Added desktop browser notifications (`Notification`) and blinking document title alerts (`📞 تماس ورودی...`) for background tabs when an incoming call arrives.
  - Resolved session cookie desynchronization in `useChatEvents.js`: added proactive session probing on connection failures to detect HTTP 401/403 session user mismatches (preventing deadlocks when multiple user accounts are switched or tested across browser tabs).

## 0.24.3 - 2026-11-07

### Fixed
- **Video Background Processing & AI Blur in Calls**:
  - Corrected the Canvas 2D compositing pipeline in `videoBackground.js` to draw the MediaPipe `segmentationMask` first as a clipping stencil, composite the person using `source-in`, and paint the blurred camera video behind the subject using `destination-over` (fixing the issue where background blur appeared inactive due to inverted compositing).
  - Ensured HTML5 `<video>` elements in `useWebRTCCall.js` and `CallScreen.jsx` re-bind and re-render the processed video track immediately by generating a fresh `MediaStream` instance when toggling virtual backgrounds.
  - Added auto-resume check in `processFrame` to guarantee video playback continues even if background tabs or streams temporarily pause.

## 0.24.2 - 2026-11-07

### Fixed
- **Polls & Quizzes Voting & Real-time Synchronization**:
  - Resolved an issue where clicking poll options did not register or reflect user votes in the UI by introducing immediate optimistic state updates on button click in `ChatPage.jsx`.
  - Added user-specific `myVotes` tracking on poll payloads in `server/db.js` (`formatPollRow`) and `server/api/messages.js`, ensuring anonymous polls properly remember the current user's selection without leaking identities to other participants.
  - Fixed SSE real-time event filtering in `useChatEvents.js` where `poll_updated`, `message_reaction`, `e2ee_key_exchange`, and `voice_stage_*` events were unintentionally blocked before reaching their handlers.
  - Added `poll_updated` real-time message state synchronization in `useChatEvents.js`.
  - Updated `MessageItem.jsx` memoization signature (`getMessageRenderSignature`) to observe `myVotes` and user vote state, preventing React from skipping bubble re-renders.
  - Added `e.preventDefault()` and `e.stopPropagation()` on poll option buttons to avoid any event capture or interference from parent surfaces.

## 0.24.1 - 2026-11-07

### Fixed
- **Polls Display & Interactivity**:
  - Fixed an issue where polls only rendered as plain text markdown messages when sent by the user, in DMs, or in channels by properly including `<PollCard>` in the primary message bubble branch in `MessageItem.jsx`.
  - Suppressed duplicate raw markdown question text when a poll card is rendered.
  - Connected `onVotePoll` and `onClosePoll` handlers from `ChatPage.jsx` down to `ChatWindowPanel` and `MessageItem`.
  - Added optimistic instant state update upon poll creation for instantaneous feedback.
  - Fully translated poll components and modal dialogs to Persian.

### Enhanced
- **Landing Page Polish**:
  - Removed outdated mechanical copy from the showcase footer.
  - Added direct official GitHub repository link and icon to both desktop and mobile header/footer navigation.

## 0.24.0 - 2026-11-07

### Added & Enhanced
- **Modern Split Showcase Landing Page (AuthPage)**:
  - **Interactive Feature Showcase**: Redesigned the authentication and welcome experience with an asymmetric split layout. The right side features a rich Bento-grid showcase presenting Chakavak's key capabilities: End-to-End Encrypted Secret Chats (E2EE), HD WebRTC Audio/Video Calls with AI background blur, Persistent Voice Stages, and modern interactive messaging tools (Polls, Stickers, GIFs, Scheduled & Silent messages).
  - **Sleek Glassmorphic Form**: Redesigned the login and registration forms with frosted glass aesthetics, clear typography, password visibility toggles, seamless mode switching, responsive layout adaptations, and dark/light mode toggles.
  - **Adaptive Mobile Ergonomics**: Added collapsible mobile showcase controls ("مشاهده تمام امکانات چکاوک") to ensure clean, clutter-free mobile experience with instant access to feature highlights.
  - **Layout & Routing Clean-up**: Integrated cleanly with `App.jsx` native authentication handlers and removed duplicate header containers on authentication routes.

## 0.23.2 - 2026-11-07

### Fixed
- **Group Conference Parameter Fix**: Fixed ReferenceError: onStartGroupConference is not defined in ChatWindowPanel.jsx by properly importing Users icon and destructuring onStartGroupConference from component props when entering group chats.

## 0.23.1 - 2026-11-06

### Fixed
- **CallScreen Ref Null Pointer Fix**: Fixed critical `TypeError: Cannot set properties of null (setting 'srcObject')` error in `CallScreen.jsx` by properly guarding all React DOM ref assignment callbacks when elements unmount or switch layouts.

## 0.23.0 - 2026-11-06

### Fixed & Enhanced
- **WebRTC Audio & Video Relay Transmission**:
  - **Coturn TURN Server Authentication**: Fixed coturn database credential authorization by adding automatic user registration in Coturn's SQLite database (`turnadmin -a`) in `install.sh`.
  - **Resilient ICE / STUN Resolution**: Added robust dynamic ICE resolution with multi-pool STUN fallbacks (`chat.mbb724.ir:3478`, `stun.l.google.com`, `stun1.l.google.com`) ensuring NAT traversal succeeds across restricted cellular networks.
  - **Track Accumulation (`ontrack`)**: Hardened incoming WebRTC track processing to safely assemble audio and video tracks into a unified `MediaStream` even when browser delivers tracks without pre-associated stream objects.
  - **Dedicated Remote Audio Engine**: Separated audio output into an unconditional, dedicated `<audio>` element with muted video elements to bypass browser autoplay policies and eliminate sound clipping and echo during PiP, swap, or split-screen toggles.
  - **Crystal-Clear Audio Constraints**: Configured hardware echo cancellation, noise suppression, and automatic gain control on local media streams.

## 0.22.0 - 2026-11-06

### Fixed & Hardened
- **Complete Purge of Legacy Names**: Replaced all remaining hardcoded `songbird` unit names, service files, and paths across installer scripts (`install.sh`, `run-data-command.sh`, and `docker-entrypoint.sh`) with standardized `chakavak` and `/opt/chakavak`.
- **ChatPage Temporal Dead Zone (TDZ) Fix**: Fixed runtime `ReferenceError` during post-login initial render in `ChatPage.jsx` by properly moving state declarations ahead of all action handlers and callback dependencies.
- **Client Error Boundary**: Added universal [`ErrorBoundary.jsx`](client/src/components/common/ErrorBoundary.jsx) wrapping core chat interfaces in `App.jsx` with graceful error handling and instant retry controls.
- **SSL / Domain Auto-Renewal Manager**: Added full domain migration and configurable auto-renewal management tools directly in `chakavak` CLI menu.
- **Service Worker Cache Invalidation**: Bumped service worker cache to `0.22.0` ensuring instant client bundle updates across client browsers.

## 0.21.0 - 2026-11-06

### Added
- **E2EE Secret Chats**: End-to-end encrypted direct messaging using Web Crypto API (ECDH P-256 key exchange + AES-GCM 256-bit encryption), verification safety numbers, and emoji fingerprints.
- **Persistent Voice Stages**: Clubhouse / Telegram-style audio stage rooms for groups and channels with raise-hand, mic controls, speaker moderation, and floating bar.
- **Stickers & GIFs Engine**: Official Chakavak sticker packs, Tenor/Giphy animated GIF search integration, and lightweight tabbed picker.
- **Polls & Quizzes**: Real-time anonymous and public polls with multi-choice options, quiz mode with instant answer reveal, and SSE synchronization.
- **Scheduled & Silent Messages**: Message delivery scheduling with background worker and silent notification options.
- **Chat Folders**: Categorized navigation tabs (All, Personal, Groups, Channels) with separate unread badges.

## 0.20.1 - 2026-11-05

### Bug Fixes
- **Mobile Video Call Controls Layout**: Redesigned bottom call controls into a clean, ergonomic two-tier layout separating primary call actions (Mic, Camera, Speaker, End Call) from secondary video tools (Flip Camera, AI Background Blur, Screen Share, Layout Mode) preventing single-row overflow and overlapping on mobile screens.

## 0.20.0 - 2026-11-05

### Added
- **AI Virtual Background & Blur Engine**: Real-time client-side selfie segmentation via MediaPipe on WebGL/Canvas with zero server GPU overhead.
- **Background Effects Menu**: Floating selector during video calls offering Natural/Original, Slight Blur (14px Gaussian blur for natural privacy), and Deep Blur (28px for full isolation).
- **Smooth Track Replacement**: Dynamic WebRTC video track hot-swapping allowing users to toggle blur on and off in active video calls without renegotiation stalls.

## 0.19.0 - 2026-11-05

### Refactor & Branding
- **Complete Branding Rebrand to Chakavak**: Purged legacy names across all client components, service workers, cache namespaces, brand icons, and comprehensive bilingual documentation (Farsi/English) ensuring pure **Chakavak / چکاوک** identity.

## 0.18.1 - 2026-11-05

### Bug Fixes
- **Video Call Swap View**: Fixed PiP thumbnail swap click handler by separating primary and thumbnail video containers with dedicated z-index layering (`z-50`), click hints, and decoupled state so tapping either the thumbnail or swap button immediately exchanges video feeds without relying on conditional dual-binding.
- **Screen Sharing Negotiation**: Added fallback SDP renegotiation (`pc.addTrack` + new offer/signal) for calls that started as audio-only or lacked an existing video sender, and fixed `localStream` initialization when sharing screen.

## 0.18.0 - 2026-11-05

### Added
- **Multi-Party Group Video Conference (SFU)**: Ultra-low latency group video & audio conferencing powered by Selective Forwarding Unit (LiveKit SFU) architecture.
- **Dynamic Conference Grid**: Responsive multi-tile grid layout automatically organizing 1 to 20+ simultaneous participants.
- **Speaking Indicator & Active Audio**: Real-time visual audio pulse highlighting the active speaker across tiles.
- **Conference Screen Sharing & In-Room Controls**: Complete control over camera, microphone, screen sharing, and full-screen view inside group calls.
- **Header Action Button**: Integrated Group Video Conference shortcut button in group chat headers.

## 0.17.0 - 2026-11-05

### Added
- **Call Screen Layout Switcher (Split-Screen & PiP)**: Switch between classic Picture-in-Picture and 50/50 dual grid (side-by-side on desktop, stacked on mobile).
- **Interactive Camera / Video Swapping**: Click or tap the PiP thumbnail or swap button to smoothly swap caller and recipient video feeds between main stage and thumbnail.
- **Camera Flip (Front/Back)**: Seamless switching between front selfie and rear environment cameras on mobile and multi-camera devices during active calls.
- **Screen Sharing**: One-click screen and application window sharing via `getDisplayMedia` with automatic track replacement and camera fallback upon stop.
- **Auto-Hiding Controls & Fullscreen**: Smart 3.8s inactivity fade-out for call controls during active calls with cursor movement detection and native fullscreen toggle.

## 0.16.1 - 2026-11-05

### Bug Fixes
- **Chat Theme Switcher**: Fixed state memoization dependency in `ChatWindowPanel` ensuring dynamic theme switching triggers immediate visual background updates, applied presets to timeline wrapper, and added floating feedback toast with active theme name.

## 0.16.0 - 2026-11-05

### Added
- **Message Drafts & Sidebar Indicator**: Automatic persistence of typed messages across conversation switching, with a red `پیش‌نویس:` draft label in the chat list and automatic composer restoration.
- **In-Chat Message Search**: Dedicated search button in the chat header, interactive search floating bar with match counter (e.g. `1 of 5`), previous/next navigation buttons, and smooth scroll focus.
- **Voice Message Playback Speed (1.5x / 2x)**: Audio speed multiplier button (`1x` -> `1.5x` -> `2x`) on voice message bubbles for efficient listening.
- **Archive Chats & Dedicated Tab**: Clean conversation management allowing users to archive/unarchive chats via the context menu with a dedicated "Archived" category folder.
- **Starred Messages**: Option to star/unstar important messages from the context menu with a golden star badge on message bubbles.
- **Custom Chat Wallpapers**: Ambient theme background switcher directly in the chat header with Default, Emerald Glow, Night Sky, and Doodles pattern presets.

## 0.15.0 - 2026-11-05

### Added
- **Chat Folders & Category Tabs**: Filter sidebar chats into organized tabs ("All", "Direct", "Groups", "Channels") with realtime dynamic unread message count badges per category.
- **Pinned Messages**: Pin critical messages in any conversation via the context menu with a floating pinned header bar, quick author preview, and smooth-scroll jump to message.
- **Rich Link Preview Cards**: Automatic URL detection that renders sleek, interactive domain preview cards under messages with hostname, path badge, and external navigation.
- **Stickers & Expressive Reactions Tab**: Integrated Stickers tab in the emoji popover offering instant Persian quick phrases ("سلام", "خیلی ممنون", "عالی و پرقدرت", "تبریک", etc.) and high-vibrancy reaction badges.
- **Media Lightbox & Gallery Viewer**: Fullscreen modal viewer with keyboard Escape dismiss, desktop quick zoom, smooth image/video rendering, and one-click direct save.
- **Realtime Recording & Uploading Indicator**: Visual live status updates in the active chat header showing audio recording animation and file upload progress.

## 0.14.0 - 2026-11-04

### Added
- **Emoji Picker Popover**: Full-featured bilingual (Persian/English) categorized emoji library with instant fuzzy search and recent emojis storage.
- **Emoji Shortcodes Autocomplete**: Automatic live conversion of emoticon shortcodes (`:)`, `:D`, `<3`, `:fire:`, `:heart:`, etc.) into Unicode emojis.
- **Floating Markdown Formatting Toolbar**: Contextual popup when selecting text in the composer for Bold (`**`), Italic (`*`), Inline Code (`` ` ``), Strikethrough (`~~`), and Spoiler (`||`).
- **Telegram-Style Spoilers**: Interactive blurred spoiler text (`||text||`) that reveals smoothly upon tap or click.
- **Waveform Recording Visualizer**: Animated dynamic sound waves for voice recording with instant cancel and duration indicators.
- **Quick Message Reactions**: Expressive emoji reaction bar (`❤️`, `👍`, `😂`, `🔥`, `👏`, `😢`) integrated into the message context menu.

## 0.13.3

### Bug Fixes

- 📞 Generate missing Coturn credential before writing environment file in deployment script
- 📜 Synchronize generated Coturn password with .env and initialize log file permissions

### Improvements

- 🕊️ Evolve project to standalone Chakavak (چکاوک) platform with independent repository
- 🌐 Add TCP relay transport fallback for WebRTC calls in restricted network environments

## 0.13.2

### New Features

- 🌐 Optional coturn TURN server setup in the deployment script

### Bug Fixes

- 🎬 Preserve chronological ordering for video messages on chat reopen
- 🛠️ Resolve relative paths for database restore command and polished restore database system
- 🖼️ Prevent false avatar deletion from storage buckets
- 🗃️ Enable database health check in SQLite mode
- 🏅 Conditionally render verified badge in desktop user menu
- 🔗 Display channel type in invite modal

## 0.13.1

### Bug Fixes

- 📞 Await async session resolution in call routes for PostgreSQL
- 🛠️ Check and auto-upgrade lego binary when newer release is available
- 📜 Update lego CLI invocation syntax for lego v5 compatibility
- 🪣 Ignore directory marker keys during orphan avatar pruning in object storage

## 0.13.0

### New Features

- 📞 WebRTC voice and video calls with real-time signaling over WebSocket
- 📜 Calls history page with detailed call logs and deletion support
- ➕ New call modal to initiate voice and video calls with direct message contacts
- ⚙️ Call configuration settings in admin panel and environment variables
- 🌐 TURN server health check card in the Services tab

### Improvements

- 🎨 Desktop sidebar redesign with integrated user button and settings view
- 🔔 Clickable permission prompt bars with dismiss icon button

## 0.12.4

### New Features

- 📡 On-demand remote channel polling with tick endpoint for sleep-friendly deployments
- 🔑 Owner-only secrets section in the admin panel settings tab
- 🛠️ Remote channel management directly in the admin panel channel modal
- ⏱️ Remote channel tick mode option in settings

### Improvements

- 🔒 Reworked `REMOTE_CHANNEL_UI` flag to restrict UI and API to admins when disabled
- 🎨 Moved insecure connection warning banner to the chats list
- 🧹 Removed unused dependencies and updated package versions

### Bug Fixes

- 🔴 Forward Redis auth to BullMQ connections

## 0.12.3

### New Features

- 🗃️ Postgres database ping card in the Services tab
- ⚙️ New configuration options in admin settings
- 🗄️ Admin audit logs persisted in the database instead of the log file

### Improvements

- 🔁 Retry mirror dispatch logic for remote workers
- 📋 New log actions for remote channel events and nginx reload
- 🔗 Docker and Railway social links in settings

### Bug Fixes

- 🧹 Delete remote bucket objects and local video thumbnails on message file retention expiry
- 🖼️ Prevent avatar URL clearing when remote storage is configured
- 🔕 Prune stale push subscriptions on 401/403 auth errors without warning logs for expired entries
- 📨 Fix public channel messages endpoint hanging on un-awaited messages promise

## 0.12.2

### New Features

- 🖼️ Object storage avatar uploads
- 🪣 Unified object-storage layout
- 📡 Guided Telegram remote channel setup in the admin panel with Services tab status and remote media mirroring via worker
- 📋 Worker log tab in the admin panel
- 🔗 Object storage proxy support

### Bug Fixes

- 🔒 Presign rate limiting on upload endpoints
- 👤 Postgres banned-user handling on login
- 📅 Postgres timestamp defaults causing Invalid Date on new messages
- 🛡️ Fail fast on secret mismatch instead of overwriting the database

## 0.12.1

### Bug Fixes

- 🧹 Clean up orphaned rows during migration
- ⚙️ Prefer env values over database secrets and avoid unnecessary file writes
- 🛠️ Refactored installer version comparison logic

## 0.12.0

### New Features

- 🐘 PostgreSQL database support
- 🪣 S3-compatible object storage for file uploads
- 🎬 Standalone media worker for video transcoding
- 📴 Offline-first chat with pending message queue, auto-resend on reconnect, and cached history access
- 🔌 Bidirectional WebSocket realtime gateway
- 🛡️ Emergency admin claim endpoint and UI for recovering admin access
- 👥 Auto-add new users to public chats from the admin panel
- 🔎 Unified filter popover for admin users and chats lists
- 🔴 Redis support for background queues, caching, and sessions
- 📦 Installer update menu with downgrade support, secret generation, and worker service logs
- 📥️ One-click Railway and Render deployment blueprints

### Improvements

- 🆔 UUID primary keys for users, chats, and messages
- 🔒 Auto-generated secrets stored in the database instead of secondary env files
- 🎨 Chat list redesign with borderless rows, larger typography, and permission prompts moved to the header
- 📅 Smarter message date labels with dynamic day grouping
- 🐋 Docker images with PostgreSQL client v18, improved health checks, and dedicated worker image
- 💾 More reliable Docker database backups with proper error reporting
- 🔧 Encrypted thumbnails and improved file encryption handling
- 📖 Cloud deployment, PostgreSQL SSL, and media worker documentation

### Bug Fixes

- 🚪 Stay signed in with a clear offline state instead of redirecting to login when the server is unreachable
- 📨 Keep pending messages in sending state on network errors instead of failing them

## 0.11.4

### New Features

- 👥 Add all eligible members to groups directly from the admin panel
- 🛠️ Toggle verified status for users and chats via new database commands

### Improvements

- 💾 Preserve admin data, logs, service availability, and sidebar state when navigating away from the admin panel
- ⚙️ Show environment variable names for settings locked by `.env`
- 🎨 Add quick color refresh controls and randomized default colors for new users and chats
- 🔎 Add clear buttons to admin search inputs
- 💬 Replace browser hover hints with consistent, accessible in-app tooltips
- 🏅 Show verification and owner badges consistently in invite pages and admin chat editing

### Bug Fixes

- 🧮 Allow disabled message/file retention settings to remain disabled when set to `0`
- ✍️ Preserve unsaved admin settings edits during background data refreshes
- ♻️ Disable default settings restore button when there are no non-default settings to restore
- 📱 Preserve mobile pagination scroll clearance in the admin panel

## 0.11.3

### Security
- 🔧 Fixed a message at-rest encryption bypass caused by untrusted ciphertext-marker handling.


## 0.11.2

### New Features

- 🏅 Verified and role badge system for users and chats

### Improvements

- 🐋 Production-ready Docker and cloud platform deployment with container health checks
- 🔌 Configurable server bind address and graceful shutdown handling
- ⚡ Faster admin panel with server-side pagination for users, chats, and logs
- 🔢 Adjustable page-size selector on admin pagination controls
- 📊 Smoother dashboard stats with cached system metrics
- 💨 Snappier chat experience with reduced SSE-driven refetching and debounced chat list reloads
- 🎨 Refreshed upload menu styling to match the new dropdown design

### Bug Fixes

- 💬 Keep the connection alive when navigating in and out of the admin panel
- 🔄 Sidebar now updates instantly when members are added, removed, or have their role changed
- 🎨 Include reply author color in message replies
- 🚪 Sign out all clients correctly after a database reset or restore
- 🛠️ Service control now works on Docker deployments

## 0.11.1

### New Features

- 🧠 Smart caching with proper silent background updates for admin panel

### Improvements

- 📊 Increased admin data limits to 1000 rows per tab
- 🚀 Raised API rate limit to 1000 req/15min and excluded SSE endpoint
- 📜 Auto-scroll system logs to bottom on load for better visibility
- 📱 Responsive log windows on mobile screens (40vh on mobile, 60vh on desktop)
- 🌐 Enhanced bidirectional text handling in log descriptions

### Bug Fixes

- 🔒 Resolved permission issues for logs and service control on dedicated-user deployments
- 👥 Fixed presence status computed server-side on initial load (eliminates ghost green dot)

## 0.11.0

### New Features

- 🛡️ Admin Panel with full user and chat management
- 👑 Owner role with elevated permissions
- ⚙️ Runtime settings configurable from the admin panel (moved from `.env` to database)
- 📋 File-based audit logs with multi-source logs page
- 🔒 `ADMIN_PANEL` env flag to disable the admin panel entirely
- 🧑‍💼 Unified create/edit user modal with avatar and inline password reset
- 💬 Danger zone — clear all messages and reset the database
- 🔁 App version check and service restart/stop from Actions tab
- 🖥️ Admin presence pings with idle auto-exit
- 💡 Prompt to create an owner user after a fresh install
- 📖 Songbird Wiki website at `docs.songbird.website`
- 🎨 Settings page design improvements to be more touch-friendly for mobile screens
- 🕑 Show "last seen" timestamp status for non-invisible users
- 🔧 Bug fixes

## 0.10.3

### New Features

- 📡 Songbird as a second Remote Channel source provider
- 💬 Message preview toggle in notification settings

### Improvements

- 📱 Tap chats button on mobile to scroll back to top
- ⌨️ Deselect chat with Escape key
- 🔢 Compact unread count format (e.g. 1K+)
- 🔕 Skip push notifications for users with an active SSE connection
- 🔒 Centralized and stricter username validation
- 💨 Performance optimizations on hot paths
- 🔧 Bug fixes

## 0.10.2

- 🎨 UI design update for the about page and queue status section
- 🖱️ Infinite scroll on chat members list
- 🦻 Accessibility improvements
- 💨 Performance optimization
- 🔧 Bug fixes

## 0.10.1

### Improvements

- 📄 Remote channel queue status report on channel profile.
- 🎛️ Remote channel queue action buttons to pause, skip or test connection.
- 📡 Force remote channel client reset on connection erros to prevent reconnection deadlock.
- 📨 Parallelize remote channel source polling.
- 🔗 Proxy configuration to reach push notification endpoints.
- 💨 Remote channel optimization and loading speed improvements.
- ⚙️ env vars to disable remote channel option or stream media option in UI.
- ➕ Remote channel configuration support in "Create Chat" and "Edit Chat" database commands.
- 🔧 Bug fixes

## 0.10.0

### New Features

- 📡 Remote Channel

### Improvements

- 🔗 Invite Link System simplification
- 🎨 Create/Edit Chat modal UI overhaul
- 🔧 Bug fixes

## 0.9.2

- ✨ Chat window build animations
- 🔔 Push Notification system improvements
- 🎨 UI/UX improvements
- 📥 Installer script UI improvements
- 🐋 TLS support using self-signed SSL certs in Docker
- 🔧 Bug fixes

## 0.9.1

- 🔧 UI bug fixes
- 💨 Client-side loading optimization

## 0.9.0

### New Features

- 📥 Offline Update via script
- 🔒 Client-Server Encryption
- ↪️ Forward Message
- 🗑️ Delete Message
- ✏️ Edit Message
- 📃 Built-in Context Menu
- ℹ️ About Page
- 💬 Text message auto-deletion option
- 📜 6-Days certificate option for IPs via script
- ♻️ Database backup restoration
- 🚫 "Ban user" database command

### Improvements

- 🔍 Zooming improvements for media
- ⌨️ Typing Indicator
- ✨ UI/UX Improvements
- 📜 Certificate Installation with SSL key files
- ➕ "Create chat" database command
- ✏️ "Edit chat" database command
- 👤 "Edit user" database command
- ⚙️ Custom port setting option for nginx during script installation domain mode.
- 💨 Increased loading speed and server-side resource usage improvements
- 🔧 Along with a lot of bug fixes!