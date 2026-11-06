[English](/README.md) | [فارسی](/README.fa_IR.md)

<div align="center">

# <img src="./client/public/chakavak-logo.svg" alt="Chakavak"> Chakavak

[![Version](https://img.shields.io/github/v/release/iranacc/Chakavak?label=version&color=blue)](https://github.com/iranacc/Chakavak/releases)
![Build](https://img.shields.io/github/actions/workflow/status/iranacc/Chakavak/build.yml)
[![Last commit](https://img.shields.io/github/last-commit/iranacc/Chakavak)](https://github.com/iranacc/Chakavak/commits/main/)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)

**Secure, lightweight and self-hosted communication platform with voice & video calling**

</div>

## Key Features

- 💬 **Rich Messaging & Chat Types**: Direct messages, groups, channels, and **E2EE Secret Chats**
- 🔐 **End-to-End Encryption (E2EE)**: Zero-knowledge ECDH P-256 and AES-GCM 256-bit encryption with 16-digit safety verification numbers and visual emoji fingerprints
- 🎙️ **Voice Stages & Audio Rooms**: Persistent live group voice stages (Discord/Telegram style) with moderation, hand-raising, and speaking indicators
- 🎭 **Emoji Reactions, Stickers & GIFs**: Quick emoji reactions on messages, 4 official sticker packs, and built-in Tenor/Giphy GIF engine
- 📊 **Polls & Quizzes**: Multi-choice surveys, anonymous polls, and quizzes with correct answer tracking
- ⏱️ **Scheduled & Silent Messages**: Schedule messages for future delivery or send noiseless notifications
- 🔗 **Rich Link Previews (OpenGraph)**: Secure metadata scraper with SSRF protection, private IP filtering, and client-side caching
- 🗂️ **Chat Folders & Tabs**: Categorized tabs (All, Personal, Groups, Channels) with independent unread badges
- 📁 **Voice & Media Processing**: Waveform peak generation, playback speed control (1x/1.5x/2x), live recording visualizer, circular video notes, and automatic video transcoding
- 📞 **Voice & Video Calls**: Real-time peer-to-peer WebRTC calling with background blur/virtual effects and dual UDP/TCP relays
- 🔔 **Push Notifications**: Web push with VAPID connected to Service Workers
- 📡 **Remote Channels**: Mirror Telegram or Chakavak channels across servers
- 🛡️ **Dual Database & Admin Panel**: In-memory SQLite with debounced disk persistence or scalable PostgreSQL with Knex, plus full admin telemetry and audit logs
- 🔒 **Security**: Encryption at rest (AES-256), bcrypt hashing, rate limiting, and private IP safeguards
- 📱 **PWA**: Installable progressive web app on mobile and desktop
- ☁️ **Deployment**: Automated deployment script, Docker, and cloud-ready
- 🌍 **i18n & RTL**: Native Persian and English support with Vazirmatn typography

## Quick Start

The easiest way to install Chakavak is via the automated installer. On an Ubuntu server (22.04+) with sudo access, run:

```bash
curl -fsSL https://raw.githubusercontent.com/iranacc/Chakavak/main/scripts/install.sh | bash
```

The script configures dependencies, builds the application, sets up Nginx with SSL, and configures Coturn TURN relay for calls. After installation, management can be accessed anytime with:

```bash
chakavak-deploy
```

> [!TIP]
> A domain name pointing to your server's public IP is recommended. HTTPS is required for WebRTC and push notifications.

## Maintainer

- Maintainer: [@iranacc](https://github.com/iranacc)

## Contributing

- Contributions and feedback are welcome.
- Open an issue at [GitHub Issues](https://github.com/iranacc/Chakavak/issues).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
