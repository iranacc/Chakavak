# Repository Guidelines: چکاوک (Chakavak)

چکاوک (سابقاً Songbird) یک پلتفرم پیام‌رسان و ارتباطی بلادرنگ سلف‌هاستد (Self-Hosted Real-Time Communication Platform) است که به صورت مونو‌ریپو با Node.js و React توسعه یافته است.

> [!IMPORTANT]
> **قانون تغییرات و پایش مستندات (Mandatory Architecture & Rule Sync):**
> هرگونه تغییر در ساختار، پیاده‌سازی قابلیت جدید، تغییر در معماری دیتابیس، ابزارهای مدیا، یا رفع باگ‌های حیاتی **باید بلافاصله و الزامی در این فایل (`AGENTS.md`) ثبت و به‌روزرسانی شود**. هیچ عاملی نباید بدون ثبت وضعیت جاری در این سند، توسعه را ادامه دهد تا نیازی به اسکن و حدس مکرر ساختار نباشد.

---

## ۱. ساختار مونو‌ریپو (Workspace Architecture)

- **`client/`**: اپلیکیشن تک‌صفحه‌ای (SPA) با React 19، Vite، Tailwind CSS 4، و Vitest + Playwright.
- **`server/`**: بک‌اند Express 5 بر پایه Node.js (پشتیبانی از SSE، Knex با SQLite/PostgreSQL، ورکر پردازش مدیا و صف صفوف صوتی/تصویری).
- **`docs/`**: مستندات دوزبانه انگلیسی و فارسی بر پایه VitePress.

---

## ۲. قابلیت‌های محوری پیاده‌سازی‌شده (Implemented Feature Stack)

برای پیشگیری از اشتباه در تخمین امکانات، موارد زیر **به طور کامل پیاده‌سازی و در کد موجود هستند**:

1. **واکنش به پیام‌ها با ایموجی (Message Reactions)**:
   - **پایگاه‌داده**: مایگریشن شماره ۴۲ (`server/migrations/042-message-reactions.js`) و توابع `addMessageReaction`, `removeMessageReaction`, `toggleMessageReaction`, `getMessageReactions` در [`server/db.js`](server/db.js).
   - **اندپوینت و بلادرنگ**: روت `POST /api/messages/react` در [`server/api/messages.js`](server/api/messages.js) و انتشار بلادرنگ رویداد `message_reaction` از طریق SSE.
   - **رابط کاربری کلاینت**: نوار ایموجی‌های سریع در منوی راست‌کلیک/نگه‌داشتن لمسی پیام، دکمه‌های کپسولی واکنش زیر حباب پیام در [`MessageItem.jsx`](client/src/components/chat/messages/MessageItem.jsx)، شمارشگر واکنش‌ها و نمایش کاربرانی که واکنش داده‌اند، و مدیریت خوش‌بینانه وضعیت در [`ChatPage.jsx`](client/src/pages/ChatPage.jsx).

2. **پیش‌نمایش غنی لینک‌ها (Rich Link Preview / OpenGraph)**:
   - **بک‌اند خزشگر**: ماژول ایمن با فیلتر SSRF و محافظت از IPهای خصوصی در [`server/lib/linkPreview.js`](server/lib/linkPreview.js) همراه با کش درون‌حافظه‌ای یک‌ساعته و استخراج تگ‌های `og:title`, `og:description`, `og:image`, `og:site_name` یا تگ‌های پایه HTML.
   - **اندپوینت**: روت `GET /api/messages/link-preview` در [`server/api/messages.js`](server/api/messages.js) و تابع `fetchLinkPreview` در [`client/src/api/chatApi.js`](client/src/api/chatApi.js).
   - **رابط کاربری کلاینت**: کامپوننت [`LinkPreviewCard.jsx`](client/src/components/chat/messages/LinkPreviewCard.jsx) متصل به حباب‌های پیام در [`MessageItem.jsx`](client/src/components/chat/messages/MessageItem.jsx) با کش کلاینت، تصویر شاخص بهینه، عنوان، خلاصه و نام سایت مبدأ.

3. **پوشه‌بندی و تب‌بندی گفتگوها (Chat Folders)**:
   - **رابط کاربری**: نوار تب‌های فیلتر پوشه‌ها در [`ChatFolderTabs.jsx`](client/src/components/sidebar/list/ChatFolderTabs.jsx) با دسته‌های: همه (`all`)، گفتگوهای شخصی (`personal`)، گروه‌ها (`groups`) و کانال‌ها (`channels`) و پوشه آرشیو (`archived`).
   - **شمارشگر پیام‌های خوانده‌نشده**: بج (Badge) هوشمند تعداد پیام‌های ناخوانده مجزا به ازای هر پوشه.
   - **پایداری وضعیت (Persistence)**: ذخیره‌سازی پوشه انتخاب‌شده کاربر در `localStorage` و ادغام روان با نوار فیلتر و جستجوی پیشرفته در [`ChatSidebar.jsx`](client/src/components/sidebar/layout/ChatSidebar.jsx) و [`useActiveChatState.js`](client/src/hooks/chat/useActiveChatState.js).

4. **نظرسنجی و کوئیز (Polls & Quizzes)**:
   - **پایگاه‌داده**: مایگریشن شماره ۴۳ (`server/migrations/043-polls.js`) شامل جداول `polls` و `poll_votes` و توابع `createPoll`, `getPollByMessageId`, `getPollsByMessageIds`, `votePoll`, `closePoll` در [`server/db.js`](server/db.js) با ردیابی ایمن آرا کاربر جاری (`myVotes`) جهت حفظ حریم خصوصی در نظرسنجی‌های ناشناس.
   - **اندپوینت و بلادرنگ**: روت‌های `POST /api/messages/polls/create`، `POST /api/messages/polls/vote` و `POST /api/messages/polls/close` در [`server/api/messages.js`](server/api/messages.js) با انتشار لحظه‌ای رویدادهای `chat_message` و `poll_updated` از طریق SSE و تفکیک دیتای عمومی از وضعیت رای کاربر.
   - **رابط کاربری کلاینت**: مدال ایجاد نظرسنجی/کوئیز در [`CreatePollModal.jsx`](client/src/components/modals/CreatePollModal.jsx) در منوی پیوست پیام‌ساز، کارت تعاملی نظرسنجی با نوار درصد پیشرفت و نمایش گزینه درست در کوئیز در [`PollCard.jsx`](client/src/components/chat/messages/PollCard.jsx) متصل به [`MessageItem.jsx`](client/src/components/chat/messages/MessageItem.jsx)، به‌روزرسانی خوش‌بینانه و لحظه‌ای کلیک گزینه‌ها (Optimistic UI) در [`ChatPage.jsx`](client/src/pages/ChatPage.jsx) و همگام‌سازی بلادرنگ رویدادهای `poll_updated` در [`useChatEvents.js`](client/src/hooks/chat/useChatEvents.js).

5. **مدیا و پیام‌های صوتی (Voice & Media Processing)**:
   - **موج‌نگار صوتی و شتاب‌دهنده پخش**: [`MessageFiles.jsx`](client/src/components/chat/media/MessageFiles.jsx) شامل تبدیل فرکانس صوت با `AudioContext` به میله‌های فرکانسی (Waveform Peaks)، کش در `IndexedDB`، اسکراب صوتی و دکمه سرعت پخش (`1x / 1.5x / 2x`).
   - **ویژوالایزر زنده هنگام ضبط**: کامپوننت [`WaveformVisualizer.jsx`](client/src/components/chat/messages/WaveformVisualizer.jsx) با انیمیشن موج‌های زنده هنگام ضبط ویس.
   - **ویدیو مسیج دایره‌ای (Video Notes)**: کامپوننت اختصاصی پخش پیام‌های ویدیویی دایره‌ای با قابلیت پخش خودکار.
   - **ترنسکد خودکار ویدیو (Video Transcoder)**: بک‌اند در [`server/lib/videoTranscode.js`](server/lib/videoTranscode.js) و [`server/lib/mediaWorker.js`](server/lib/mediaWorker.js) با ابزار `fluent-ffmpeg` ویدیوها را به استاندارد H.264 MP4 تبدیل و کش می‌کند.
   - **رمزنگاری در وضعیت سکون (Encryption at Rest)**: با استفاده از کلید مشتق‌شده AES-256 در [`server/lib/storageEncryption.js`](server/lib/storageEncryption.js).

6. **تماس‌های صوتی، تصویری و کنفرانس (Calls & Video Conferencing)**:
   - **تماس نقطه به نقطه WebRTC (P2P Call)**: کنترل‌های دو سطحی و کامپکت بهینه‌شده برای موبایل و دسکتاپ در [`CallScreen.jsx`](client/src/components/call/CallScreen.jsx) و هوک [`useWebRTCCall.js`](client/src/hooks/chat/useWebRTCCall.js)، معماری نودهای پایدار ویدیو (Persistent Video Nodes) در حالت تصویر در تصویر (PiP)، پنجره تصویر بندانگشتی کاملاً شناور و قابل کشیدن (Draggable Corner Thumbnail) با اسنپ مغناطیسی به ۴ گوشه صفحه در لمس و ماوس.
   - **سیگنالینگ تماس، زنگ خوردن پایدار و ویبره (Call Signaling & Ringing)**: زنگ خوردن مقاوم به Autoplay Policy مرورگرها با فال‌بک تعاملی و چرخه ویبره موبایل (`navigator.vibrate`) در [`CallScreen.jsx`](client/src/components/call/CallScreen.jsx)، اعلان‌های دسکتاپ و چشمک زدن عنوان پنجره در [`ChatPage.jsx`](client/src/pages/ChatPage.jsx)، اعتبارسنجی منعطف در هوک کلاینت جهت جلوگیری از رد شدن خودکار تماس‌های ورودی، استعلام خودکار تماس‌های در حال زنگ هنگام اتصال یا بازگشت به تب (`/api/calls/incoming`)، تایم‌اوت ۴۵ ثانیه‌ای سرور برای تماس‌های بدون پاسخ، و پاکسازی و بازیابی خودکار تماس‌های معلق قدیمی در [`callManager.js`](server/lib/callManager.js).
   - **مسیریابی و رله صوتی/تصویری (TURN/STUN Relay)**: پیکربندی Coturn با استخر STUN چندگانه، ایجاد اتوماتیک اکانت کاربر در دیتابیس Coturn (`turnadmin`)، بازیابی امن و منعطف کاندیداهای ICE و پردازش امن `ontrack` چندترکه.
   - **پخش مستقل و پایدار صدا**: تفکیک کامل تگ پخش صدا (`<audio>`) از عناصر نمایش تصویر برای عبور تضمینی از Autoplay Policy مرورگرها و حذف قطعی صدا هنگام سوئیچ وضعیت (PiP / Swap).
   - **تار کردن و صحنه‌های پس‌زمینه ویدیو (MediaPipe Background Blur & Virtual Scenes)**: پیاده‌سازی شده در [`client/src/utils/videoBackground.js`](client/src/utils/videoBackground.js) با الگوبرداری از معماری Google Meet و LiveKit؛ بوکه اپتیکال سخت‌افزاری دوکانواسه (Downscale/Upscale Optical Bokeh) مقاوم به عدم پشتیبانی فیلترهای CSS مرورگرهای موبایل، بوم استنسیل تفکیک سوژه انسان با لبه‌های نرم آلفا، همگام‌سازی فریم با `requestVideoFrameCallback` و رفع ریشه‌ای تراتلینگ دکودر اندروید در [`useWebRTCCall.js`](client/src/hooks/chat/useWebRTCCall.js)؛ همراه با صحنه‌های پس‌زمینه مجازی واقع‌گرایانه ۱۰۸۰p با بوکه سینمایی (دفتر کار، اتاق نشیمن، کتابخانه، طبیعت) در `client/public/backgrounds/` (`office.jpg`, `library.jpg`, `living-room.jpg`, `nature.jpg`) و نمایش خطاهای لودینگ مدل در [`CallScreen.jsx`](client/src/components/call/CallScreen.jsx).
   - **کنفرانس ویدیویی گروهی (SFU)**: ماژول لایوکیت در [`GroupConferenceModal.jsx`](client/src/components/call/GroupConferenceModal.jsx).

7. **ارتباط بلادرنگ و اعلان‌ها (Real-Time & Notifications)**:
   - **Server-Sent Events (SSE)**: انتشار بلادرنگ رویدادها از طریق [`server/lib/sse.js`](server/lib/sse.js).
   - **اعلان‌های پوش وب (Web Push via VAPID)**: ماژول اختصاصی در [`server/api/push.js`](server/api/push.js) و [`server/lib/vapid.js`](server/lib/vapid.js) متصل به Service Worker.
   - **کانال‌های از راه دور (Remote Mirror Channels)**: پروتکل سینک و میرور کانال‌ها بین سرورها در [`server/lib/remoteChannels.js`](server/lib/remoteChannels.js).

8. **پایگاه داده دوگانه (Database Architecture)**:
   - **SQLite درون‌حافظه‌ای (`sql.js`)**: ذخیره‌سازی پیش‌فرض با قابلیت Debounce در ذخیره روی دیسک.
   - **پشتیبانی از PostgreSQL**: قابلیت سوئیچ و اتصال مقیاس‌پذیر به دیتابیس Postgres با Knex در [`server/db/knex.js`](server/db/knex.js) و اسکریپت نگهداری [`postgresMaintenance.js`](server/lib/postgresMaintenance.js).

9. **بسته‌های استیکر و موتور جستجوی گیف (Stickers & GIFs)**:
   - **بک‌اند**: ماژول موتور جستجو با کش یک‌ساعته در [`server/lib/gifService.js`](server/lib/gifService.js)، اندپوینت‌های `GET /api/messages/gifs` و `GET /api/messages/stickers/packs` در [`server/api/messages.js`](server/api/messages.js)، شامل ۴ بسته استیکر رسمی چکاوک (Mascot, Kitties, Persian Calligraphy, Hype).
   - **رابط کاربری کلاینت**: پاپ‌اوور سه‌حالته استیکر/گیف/ایموجی در [`EmojiPickerPopover.jsx`](client/src/components/chat/emoji/EmojiPickerPopover.jsx)، استیکرهای بدون حباب با ترنزیشن هاور [`StickerCard.jsx`](client/src/components/chat/messages/StickerCard.jsx)، کارت گیف با کنترل پخش [`GifCard.jsx`](client/src/components/chat/messages/GifCard.jsx).

10. **پیام‌های زمان‌بندی‌شده و ارسال بی‌صدا (Scheduled & Silent Messages)**:
   - **پایگاه داده**: مایگریشن شماره ۴۴ (`server/migrations/044-scheduled-and-silent-messages.js`)، ستون `is_silent` و جدول `scheduled_messages` در [`server/db.js`](server/db.js).
   - **ورکر پس‌زمینه**: [`server/lib/scheduledMessagesWorker.js`](server/lib/scheduledMessagesWorker.js) با چرخه پایش زمان‌بندی و انتشار از طریق `messagePubService`.
   - **رابط کاربری کلاینت**: مدال‌های [`ScheduleMessageModal.jsx`](client/src/components/modals/ScheduleMessageModal.jsx) و [`ScheduledMessagesListModal.jsx`](client/src/components/modals/ScheduledMessagesListModal.jsx)، کلیک راست و منوی ارسال در [`MessageComposer.jsx`](client/src/components/chat/messages/MessageComposer.jsx) و آیکون `BellOff` در [`MessageItem.jsx`](client/src/components/chat/messages/MessageItem.jsx).

11. **رمزنگاری سرتاسری و گفتگوی محرمانه (E2EE Secret Chats)**:
   - **پروتکل رمزنگاری**: پیاده‌سازی کامل Web Crypto API بر پایه ECDH P-256 (secp256r1) برای تبادل کلید و AES-GCM 256-bit با IV تصادفی در [`client/src/utils/e2ee.js`](client/src/utils/e2ee.js) و [`client/src/utils/e2eeManager.js`](client/src/utils/e2eeManager.js).
   - **پایگاه داده و بک‌اند**: مایگریشن شماره ۴۵ (`server/migrations/045-e2ee-keys.js`) برای جدول `chat_e2ee_keys`، توابع دیتابیس در [`server/db.js`](server/db.js)، مسیرهای اختصاصی `POST /api/e2ee/keys` و `GET /api/e2ee/keys/:chatId` در [`server/api/e2ee.js`](server/api/e2ee.js)، و پشتیبانی از ایجاد چت `type: "secret"` در [`server/api/chats.js`](server/api/chats.js).
   - **کلاینت و رابط کاربری**: تاگل «گفتگوی محرمانه» در [`NewChatModal.jsx`](client/src/components/modals/NewChatModal.jsx)، مدال شماره‌های تأیید امنیت ۱۶ رقمی و اثر انگشت ایموجی در [`E2EESafetyNumberModal.jsx`](client/src/components/modals/E2EESafetyNumberModal.jsx), آیکون‌های قفل سبز در هدر چت [`ChatWindowPanel.jsx`](client/src/components/chat/ChatWindowPanel.jsx) و لیست گفتگوها [`ChatsListPanel.jsx`](client/src/components/sidebar/list/ChatsListPanel.jsx)، و رمزگشایی خودکار پیام‌ها در [`MessageItem.jsx`](client/src/components/chat/messages/MessageItem.jsx).

12. **صفحه فرود و ویترین امکانات (Modern Split Showcase Landing Page)**:
   - **رابط کاربری و ساختار اسپلیت**: کامپوننت [`AuthPage.jsx`](client/src/pages/AuthPage.jsx) با ساختار دو ستونه مدرن و گلس‌مورفیک؛ ستون ویترین بنتو (Bento Grid) جهت معرفی امکانات کلیدی (گفتگوی محرمانه E2EE، تماس‌های تصویری و صوتی HD با AI Blur، اتاق‌های صوتی پیوسته Voice Stages، نظرسنجی و کوئیز، بسته‌های استیکر و پیام‌های زمان‌بندی‌شده)، نمایش خودکار و پویای بج نسخه برنامه از طریق `/api/app/info` و `__APP_VERSION__` زمان بیلد، کنترل تاشوی واکنش‌گرا در موبایل ("مشاهده تمام امکانات چکاوک")، فرم شیشه‌ای مدرن احراز هویت با تاگل نمایش رمز، سوییچ نرم بین ورود و عضویت و سازگاری کامل با تم تاریک و روشن.


14. **اتاق‌های گفتگوی صوتی پیوسته و دورهمی زنده (Voice Stages / Audio Rooms)**:
   - **بک‌اند و مدیریت لحظه‌ای**: ماژول اختصاصی `server/lib/voiceStageManager.js` و اندپوینت‌های `/api/calls/stage/*` جهت ایجاد، پیوستن، درخواست صحبت با دست بلند کردن (`raise-hand`)، ارتقا به سخنران و رویدادهای بلادرنگ SSE (`voice_stage_started`, `voice_stage_updated`, `voice_stage_ended`).
   - **رابط کاربری و تعامل در گفتگوها**: دکمه اختصاصی رادیو (`Radio`) در هدر گروه‌ها و کانال‌ها، بنر زنده بالای پیام‌ها جهت پیوستن با یک کلیک با نمایش شمارشگر زنده حاضرین، مدال فول‌اسکرین `VoiceStageModal.jsx` با تفکیک سخنرانان، شنوندگان و صف درخواست صحبت، و نوار شناور فشرده پایین صفحه `FloatingVoiceStageBar.jsx` هنگام مینیمایز کردن.

13. **فشرده‌سازی، برش و ویرایش ویدیو و عکس در زمان ارسال (Media Editing & Compression)**:
   - **موتور فشرده‌سازی و ویرایش کلاینت**: ماژول کامل در [`client/src/utils/mediaCompressor.js`](client/src/utils/mediaCompressor.js) مبتنی بر Canvas و OffscreenCanvas سخت‌افزاری جهت تبدیل عکس به WebP با نسبت ابعاد بهینه؛ پریست‌های عکس `balanced` (1080p با کاهش حجم ۸۵ تا ۹۲ درصد)، `eco` (720p با کاهش حجم تا ۹۷ درصد) و `original`؛ موتور پردازش و کاهش ابعاد ویدیو با شتاب‌دهنده سخت‌افزاری GPU (کانواس بدون آلفا و desynchronized)، حفظ نود دیکدر در محدوده قابل مشاهده مرورگر جهت خنثی‌سازی کامل تراتلینگ کرومیوم، همگام‌سازی فریم‌ها با `requestVideoFrameCallback`، استخراج صدای شفاف و بی‌صدا برای بلندگو از طریق Web Audio API برای رزولوشن‌های `720p` و `480p`؛ برش زمانی ابتدا و انتها (`trimStart` و `trimEnd`) بدون سربار، چرخش ۹۰ درجه ساعت‌گرد (`rotation`) با Canvas transform، تاگل ارسال به صورت گیف لوپ متحرک (`isGif`)، و تاگل بی‌صدا کردن ویدیو (`muteAudio`)؛ حفظ کامل انیمیشن گیف‌های متحرک و فایل‌های وکتور SVG؛ و سیستم محافظ خودکار در صورت بزرگتر شدن خروجی.
   - **مدال تعاملی ارسال و ویرایش رسانه**: کامپوننت گلس‌مورفیک [`MediaSendModal.jsx`](client/src/components/modals/MediaSendModal.jsx) با قابلیت پیش‌نمایش بلادرنگ رسانه‌ها، اسلایدر دوطرفه تایم‌لاین جهت برش زمانی دقیق ویدیو با پرش فریم بلادرنگ، ابزارهای چرخش ۹۰ درجه و تبدیل به گیف، نوار پیشرفت زنده درصد پردازش، مقایسه زنده حجم قبل و بعد و درصد صرفه‌جویی ترافیک (به‌عنوان مثال `4.2 MB ➔ ~340 KB (-92%)`)، فیلد کپشن با ارسال سریع با Enter، و دو حالت تایید: ارسال مستقیم یا افزودن به پیام‌ساز جهت تکمیل متن.
   - **پالایش هوشمند سقف حجم رسانه‌ها قبل از ارسال**: در [`ChatPage.jsx`](client/src/pages/ChatPage.jsx) فایل‌های ویدیویی و تصویری خام تا سقف ۵۰۰ مگابایت مجاز به انتخاب و ورود به مدال هستند تا کاربر بتواند فایل‌های حجیم ضبط‌شده موبایل را قبل از ارسال برش داده یا فشرده کند، و اعتبارسنجی سقف سرور منحصراً پس از انجام بهینه‌سازی اعمال می‌گردد.
   - **یکپارچه‌سازی رابط کاربری**: ادغام مستقیم در [`ChatPage.jsx`](client/src/pages/ChatPage.jsx) و [`MessageComposer.jsx`](client/src/components/chat/messages/MessageComposer.jsx) همراه با بج‌های حجم و درصد صرفه‌جویی در تامبنیل‌های پیش‌نویس.

---

## ۳. کمبودها و نقشه راه توسعه (Backlog & Genuine Missing Gaps)

موارد زیر هنوز در چکاوک پیاده‌سازی **نشده‌اند** و می‌توانند در نسخه‌های بعدی پیاده‌سازی شوند:

- [x] ~~**واکنش به پیام‌ها با ایموجی (Message Reactions)**~~ *(پیاده‌سازی شد)*
- [x] ~~**پیش‌نمایش غنی لینک‌ها (Rich Link Preview / OpenGraph)**~~ *(پیاده‌سازی شد)*
- [x] ~~**پوشه‌بندی و تب‌بندی گفتگوها (Chat Folders)**~~ *(پیاده‌سازی شد)*
- [x] ~~**نظرسنجی و کوئیز (Polls & Quizzes)**~~ *(پیاده‌سازی شد)*
- [x] ~~**بسته‌های استیکر و جستجوی گیف (Stickers & Tenor/Giphy)**~~ *(پیاده‌سازی شد)*
- [x] ~~**پیام‌های زمان‌بندی‌شده و ارسال بی‌صدا (Scheduled & Silent Messages)**~~ *(پیاده‌سازی شد)*
- [x] ~~**رمزنگاری سرتاسری (E2EE Secret Chats)**~~ *(پیاده‌سازی شد)*
- [x] ~~**اتاق‌های گفتگوی صوتی پیوسته (Voice Stages / Rooms)**~~ *(پیاده‌سازی شد)*
- [x] ~~**فشرده‌سازی و پیش‌پردازش عکس و ویدیو قبل از ارسال (In-flight Media Compression)**~~ *(پیاده‌سازی شد)*

---

## ۴. دستورات ضروری (Essential Commands)

```bash
# توسعه و اجرا
npm run dev                  # اجرای همزمان سرور و کلاینت
npm --prefix client run dev  # اجرای سرور کلاینت (Vite)
npm --prefix server run dev  # اجرای سرور بک‌اند (Node --watch)
npm run build                # بیلد کلاینت برای پروداکشن

# تست‌ها
npm test                     # اجرای تمام تست‌های کلاینت و سرور
npm --prefix client run test:unit    # تست‌های واحد سریع کلاینت
npm --prefix client run test:browser # تست‌های کامپوننت با پلی‌رایت
npm --prefix server run test # تست‌های یکپارچگی API سرور

# مستندات
npm run docs:dev             # اجرای سرور مستندات VitePress
npm run docs:build           # بیلد مستندات
```

---

## ۵. نکات کلیدی معماری و محدودیت‌ها (Architecture Quirks & Pitfalls)

- **طراحی و استایل (`DESIGN.md`)**: پیروی دقیق از تمام قوانین رنگ‌بندی، تایپوگرافی، پترن‌های UI و دسترس‌پذیری تعریف‌شده در [`DESIGN.md`](./DESIGN.md).
- **نیازمندی محیط**: Node `>=24.18.0` و npm `>=11.18.0`.
- **عملیات دیتابیس (`server/db.js`)**: تمام کوئری‌های SQL باید داخل متدهای [`server/db.js`](server/db.js) کپسوله شوند. هرگز کوئری مستقیم SQL در فایل‌های دیگر نوشته نشود.
- **ایزوله‌سازی تست‌های سرور**: فایل‌های `server/db.js` و `server/index.js` در لود اولیه ماژول وضعیت WASM و دیسک را بارگذاری می‌کنند و نباید مستقیم در تست‌ها ایمپورت شوند؛ برای تست‌های ادغام سرور همواره از کمکی `makeApp` در `server/test/helpers/makeApp.js` استفاده شود.
- **رویدادهای بلادرنگ**: هرگونه تغییر داده (Mutation) باید از طریق توابع انتشار در `server/lib/sse.js` ارسال شود.
- **مسیریابی کلاینت**: از React Router استفاده نمی‌شود. کنترل تاریخچه و صفحات در [`client/src/App.jsx`](client/src/App.jsx) از طریق `window.history` مدیریت می‌شود. همچنین تمامی کامپوننت‌های روت تحت پوشش [`ErrorBoundary.jsx`](client/src/components/common/ErrorBoundary.jsx) قرار دارند تا خطاهای رندر کلاینت مانع نمایش صفحه نشوند.
- **ترتیب هوک‌ها و متغیرها در کامپوننت‌ها**: تمام استیت‌ها (`useState`) و رفرنس‌ها (`useRef`) باید اکیداً قبل از هوک‌های وابسته (`useCallback` و `useMemo` و `useEffect`) تعریف شوند تا خطای دسترسی به متغیر قبل از مقداردهی (Temporal Dead Zone) رخ ندهد.
- **فراخوانی API در کلاینت**: تمام درخواست‌های HTTP کلاینت به سرور باید حتماً از طریق تابع `apiFetch` در [`client/src/api/chatApi.js`](client/src/api/chatApi.js) صورت گیرد تا `credentials: "include"` حفظ شود.
- **به‌روزرسانی مستندات**: هر تغییری در مسیر `docs/` باید در هر دو نسخه انگلیسی (`docs/*.md`) و فارسی (`docs/fa/*.md`) اعمال شود.

---

## ۶. گردش‌کار گیت و توسعه (Development & Git Workflow)

- **همگام‌سازی تگ‌ها در سرور**: در اسکریپت به‌روزرسانی (`scripts/install.sh`)، دستور `git fetch --all --prune --tags --force` با فلگ `--force` اجرا می‌شود تا در صورت تغییر یا بازنویسی تگ‌ها در گیت‌هاب با خطای `clobber existing tag` مواجه نشود.
- **اجرای گیت**: به دستور و تایید کاربر، دستورات گیت (مانند add، commit، tag و push) اجرا می‌شوند و پیام کامیت استاندارد باید همیشه به فرمت `type(scope): description` باشد.
- **رفع باگ‌ها**: هرگز بدون سناریو و آزمون شروع به حدس زدن نکنید؛ ابتدا تستی بنویسید که باگ را بازتولید کند، سپس فیکس را پیاده و پاس شدن تست را تأیید کنید.
- **سبک پاسخ‌دهی**: پاسخ‌ها کوتاه، فنی، دقیق و به زبان فارسی باشد.
- **گراف دانش (Graphify)**: پس از اعمال تغییرات کد، از دستور `graphify update .` استفاده شود تا گراف دانش پروژه بدون هزینه به‌روز بماند.
