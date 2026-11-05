[English](/README.md) | [فارسی](/README.fa_IR.md)

<div align="center">

# <img src="./client/public/chakavak-logo.svg" alt="چکاوک"> چکاوک (Chakavak)

[![Version](https://img.shields.io/github/v/release/iranacc/Chakavak?label=version&color=blue)](https://github.com/iranacc/Chakavak/releases)
![Build](https://img.shields.io/github/actions/workflow/status/iranacc/Chakavak/build.yml)
[![Last commit](https://img.shields.io/github/last-commit/iranacc/Chakavak)](https://github.com/iranacc/Chakavak/commits/main/)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)

**پلتفرم پیام‌رسان امن، سبک و مستقل با پشتیبانی از تماس صوتی و تصویری**

</div>

## قابلیت‌های کلیدی

- 💬 **انواع چت**: پیام مستقیم، گروه و کانال
- 📁 **پشتیبانی از رسانه**: آپلود فایل، پیام صوتی، تبدیل و بهینه‌سازی ویدئو
- 🔔 **Push Notification**: اعلان وب با استاندارد VAPID
- 📞 **تماس صوتی و تصویری**: تماس‌های نظیر‌به‌نظیر امن با WebRTC و رله‌های پشتیبان UDP و TCP
- 📡 **کانال‌های ریموت**: آینه‌کردن خودکار کانال‌های تلگرام یا چکاوک
- 🛡️ **پنل مدیریت پیشرفته**: رابط مدیریتی کامل با نظارت بر منابع سیستم و گزارش‌های امنیتی
- 🔒 **امنیت بالا**: رمزنگاری در حالت ذخیره (At-rest)، هش bcrypt، محدودیت نرخ درخواست‌ها
- 📱 **PWA**: اپلیکیشن وب نصب‌شدنی روی موبایل و دسکتاپ
- ☁️ **استقرار آسان**: پشتیبانی از داکر، اسکریپت نصب خودکار و فضاهای ابری
- 🌍 **پشتیبانی بومی از فارسی**: راست‌چین کامل (RTL) و فونت وزیرمتن

## نصب سریع

ساده‌ترین روش نصب چکاوک، استفاده از اسکریپت نصب آسان است. روی یک سرور اوبونتو (نسخه 22.04+) با دسترسی `sudo` دستور زیر را اجرا کنید:

```bash
curl -fsSL https://raw.githubusercontent.com/iranacc/Chakavak/main/scripts/install.sh | bash
```

این اسکریپت پیش‌نیازها را نصب می‌کند، برنامه را بیلد می‌نماید، وب‌سرور Nginx و گواهی SSL را راه‌اندازی کرده و سرویس رله Coturn را برای تماس‌ها پیکربندی می‌کند. پس از نصب، از طریق دستور زیر می‌توانید مجدداً به ابزار مدیریت دسترسی داشته باشید:

```bash
chakavak-deploy
```

> [!TIP]
> برای عملکرد صحیح نوتیفیکیشن‌های وب و ارتباط صوتی/تصویری WebRTC، استفاده از دامنه با پروتکل HTTPS الزامی است.

## توسعه‌دهنده و نگهداری

- توسعه و مدیریت مخزن: [@iranacc](https://github.com/iranacc)

## مشارکت

- از پیشنهادات، گزارش خطاها و مشارکت در توسعه استقبال می‌شود.
- برای ارسال پیشنهادات یا گزارش باگ‌ها می‌توانید در بخش [Issues](https://github.com/iranacc/Chakavak/issues) اقدام نمایید.

## لایسنس

این پروژه تحت لایسنس MIT منتشر شده است. برای جزئیات بیشتر، فایل [LICENSE](LICENSE) را ببینید.
