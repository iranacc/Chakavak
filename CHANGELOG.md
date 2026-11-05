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