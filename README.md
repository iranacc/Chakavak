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

- 💬 **Chat Types**: Direct messages, groups, and channels
- 📁 **Media Support**: File uploads, voice messages, video transcoding and optimization
- 🔔 **Push Notifications**: Web push with VAPID
- 📞 **Voice & Video Calls**: Real-time peer-to-peer WebRTC calling with dual UDP & TCP relays
- 📡 **Remote Channels**: Mirror Telegram or Chakavak channels
- 🛡️ **Admin Panel**: Full management interface with resource telemetry and audit logs
- 🔒 **Security**: Encryption at rest, bcrypt hashing, rate limiting
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
