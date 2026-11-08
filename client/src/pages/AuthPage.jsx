import { useState, useEffect } from "react";
import {
  Lock,
  PhoneCall,
  Radio,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Sun,
  Moon,
  Zap,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ChevronDown,
  ChevronUp,
} from "../icons/lucide.js";
import { GithubIcon } from "../icons/BrandIcons.jsx";
import chakavakLogo from "../assets/chakavak-logo.png";
import { fetchAppInfo } from "../api/appMetaApi.js";
import { APP_CONFIG } from "../settings/appConfig.js";

export default function AuthPage({
  mode = "login",
  isDark = true,
  onToggleTheme,
  onSubmit,
  onSwitchMode,
  status,
  loading = false,
  showSigningOverlay = false,
  allowSignup = true,
  title,
  subtitle,
  appVersion = "",
}) {
  const isLogin = mode === "login";
  const canSignup = Boolean(allowSignup);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMobileShowcase, setShowMobileShowcase] = useState(false);

  const [liveVersion, setLiveVersion] = useState(
    appVersion || APP_CONFIG.appVersion || "",
  );

  useEffect(() => {
    if (appVersion) {
      setLiveVersion(appVersion);
      return;
    }
    let isMounted = true;
    fetchAppInfo()
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.version) setLiveVersion(data.version);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [appVersion]);

  const rawVersion = appVersion || liveVersion || APP_CONFIG.appVersion || "";
  const displayVersion = rawVersion
    ? (rawVersion.startsWith("v") ? rawVersion : `v${rawVersion}`)
    : "";

  return (
    <div
      dir="rtl"
      lang="fa"
      className="w-full max-w-6xl my-auto font-fa relative select-none"
    >
      {/* ─── بدنه اصلی کارت اسپلیت (Split Showcase Container) ─── */}
      <div className="w-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl shadow-2xl shadow-emerald-500/5 flex flex-col lg:flex-row items-stretch overflow-hidden">
        
        {/* ─── ستون راست: ویترین قابلیت‌ها و معرفی دوستانه چکاوک ─── */}
        <div className="w-full lg:w-7/12 xl:w-3/5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-l border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-slate-50/95 via-emerald-50/40 to-teal-50/30 dark:from-slate-900/95 dark:via-emerald-950/25 dark:to-slate-950/95">
          <div>
            {/* برندینگ، لوگو و عنوان جذاب */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3.5">
                <img
                  src={chakavakLogo}
                  alt="چکاوک"
                  className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-[0_4px_20px_rgba(16,185,129,0.35)] shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-normal bg-gradient-to-l from-emerald-600 via-teal-600 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-400 bg-clip-text text-transparent">
                      چکاوک
                    </h1>
                    {displayVersion ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold font-mono">
                        {displayVersion}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                    پیام‌رسان امن، پرسرعت و همراه صمیمی شما
                  </p>
                </div>
              </div>

              {/* دکمه‌های گیت‌هاب و تم برای صفحات موبایل */}
              <div className="flex items-center gap-2 lg:hidden">
                <a
                  href="https://github.com/iranacc/Chakavak"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-emerald-500 transition shadow-xs inline-flex items-center justify-center"
                  aria-label="GitHub Repository"
                  title="مخزن گیت‌هاب چکاوک"
                >
                  <GithubIcon size={18} />
                </a>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-emerald-500 transition shadow-xs cursor-pointer"
                  aria-label="تغییر تم"
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>

            {/* نشان‌های مزایای کلیدی */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs">
                <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
                حریم شخصی کاملاً امن و محرمانه
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-teal-700 dark:text-teal-300 font-semibold shadow-xs">
                <Zap size={15} className="text-teal-500 shrink-0" />
                ارسال پرسرعت و لحظه‌ای پیام‌ها
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-cyan-700 dark:text-cyan-300 font-semibold shadow-xs">
                <CheckCircle2 size={15} className="text-cyan-500 shrink-0" />
                مستقل و بدون واسطه
              </span>
            </div>

            {/* دکمه تاگل مشاهده امکانات در موبایل */}
            <div className="lg:hidden mb-2">
              <button
                type="button"
                onClick={() => setShowMobileShowcase((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-500/15 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={16} />
                  {showMobileShowcase ? "بستن لیست امکانات چکاوک" : "مشاهده تمام امکانات و قابلیت‌های چکاوک"}
                </span>
                {showMobileShowcase ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* شبکه کارت‌های معرفی امکانات (Bento Grid) */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 transition-all duration-300 ${
                showMobileShowcase ? "block mt-4" : "hidden lg:grid"
              }`}
            >
              {/* کارت ۱: چت اختصاصی و محرمانه */}
              <div className="rounded-2xl p-4 sm:p-4.5 bg-white/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition duration-300 group">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2.5 group-hover:scale-105 transition">
                  <Lock size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-snug">
                  چت اختصاصی و محرمانه
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300/90 leading-relaxed font-normal">
                  پیام‌های شما به‌صورت اختصاصی قفل‌گذاری می‌شوند؛ به‌طوری‌که فقط شما و مخاطبتان می‌توانید آن‌ها را بخوانید و هیچ‌کس دیگری به محتوای آن دسترسی ندارد.
                </p>
              </div>

              {/* کارت ۲: تماس صوتی و تصویری */}
              <div className="rounded-2xl p-4 sm:p-4.5 bg-white/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5 transition duration-300 group">
                <div className="h-9 w-9 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-2.5 group-hover:scale-105 transition">
                  <PhoneCall size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-snug">
                  تماس صوتی و تصویری باکیفیت
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300/90 leading-relaxed font-normal">
                  مکالمه‌ای شفاف، بدون تاخیر و پرسرعت را تجربه کنید. همچنین در تماس ویدیویی می‌توانید پس‌زمینه تصویرتان را محو کنید تا خیالتان از محیط اطراف آسوده باشد.
                </p>
              </div>

              {/* کارت ۳: دورهمی و اتاق‌های صوتی */}
              <div className="rounded-2xl p-4 sm:p-4.5 bg-white/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition duration-300 group">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2.5 group-hover:scale-105 transition">
                  <Radio size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-snug">
                  دورهمی و گفتگوی صوتی زنده
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300/90 leading-relaxed font-normal">
                  در گروه‌ها و کانال‌ها مانند یک دورهمی صوتی زنده با دوستان یا اعضای تیم صحبت کنید، دست بلند کنید و با کیفیت بالا تبادل نظر داشته باشید.
                </p>
              </div>

              {/* کارت ۴: ابزارهای جذاب پیام‌رسانی */}
              <div className="rounded-2xl p-4 sm:p-4.5 bg-white/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition duration-300 group">
                <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2.5 group-hover:scale-105 transition">
                  <Sparkles size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-snug">
                  امکانات کاربردی و دلنشین
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300/90 leading-relaxed font-normal">
                  با استیکرها و تصاویر متحرک احساسات خود را ابراز کنید، نظرسنجی بسازید، گفتگوها را پوشه‌بندی کنید یا ارسال پیام را برای زمان دلخواه تنظیم فرمایید.
                </p>
              </div>
            </div>
          </div>

          {/* فوتر ویترین با لینک گیت‌هاب */}
          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/10 hidden sm:flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>چکاوک؛ تجربه‌ای امن، روان و دلنشین از ارتباطات روزمره</span>
            <a
              href="https://github.com/iranacc/Chakavak"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
              dir="ltr"
            >
              <GithubIcon size={16} />
              <span className="font-mono text-[11px] font-semibold">github.com/iranacc/Chakavak</span>
            </a>
          </div>
        </div>

        {/* ─── ستون چپ: فرم ورود و عضویت شیشه‌ای ─── */}
        <div className="w-full lg:w-5/12 xl:w-2/5 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white/95 dark:bg-slate-900/90 relative">
          
          {/* دکمه‌های تغییر تم و گیت‌هاب در دسکتاپ */}
          <div className="hidden lg:flex justify-end items-center gap-2 mb-2">
            <a
              href="https://github.com/iranacc/Chakavak"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500/30 transition shadow-xs cursor-pointer inline-flex items-center justify-center"
              title="مخزن گیت‌هاب چکاوک"
              aria-label="GitHub Repository"
            >
              <GithubIcon size={18} />
            </a>
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500/30 transition shadow-xs cursor-pointer"
              aria-label="تغییر تم"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* سربرگ فرم */}
          <div className="mb-6">
            <span className="text-[11px] font-bold tracking-wide text-emerald-600 dark:text-emerald-400 block mb-1">
              {isLogin ? "خوش آمدید • ورود به سامانه" : "به خانواده چکاوک بپیوندید • عضویت"}
            </span>
            <h2 className="text-2xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {title || (isLogin ? "ورود به حساب کاربری" : "ایجاد حساب جدید")}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-normal">
              {subtitle ||
                (isLogin
                  ? "برای دسترسی به پیام‌ها و گفتگوهای خود، اطلاعات ورود را وارد فرمایید."
                  : "در کمتر از یک دقیقه حساب خود را ایجاد کنید و گفتگو را آغاز نمایید.")}
            </p>
          </div>

          {/* پیام خطا یا وضعیت */}
          {status && (
            <div className="mb-4 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 shadow-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <span className="leading-relaxed font-medium">{status}</span>
            </div>
          )}

          {/* فرم ارسال اطلاعات */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* فیلد نام کاربری */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                نام کاربری
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  dir="ltr"
                  placeholder="مثال: ali_reza"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/15 px-4 py-2.5 pl-10 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition font-sans"
                />
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* فیلد نام نمایشی (فقط در حالت ثبت نام) */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="nickname"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  نام نمایشی (اختیاری)
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  autoComplete="name"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="نام و نام خانوادگی شما"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/15 px-4 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            )}

            {/* فیلد رمز عبور */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                رمز عبور
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  placeholder="رمز عبور خود را وارد کنید"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/15 px-4 py-2.5 pl-10 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "مخفی‌سازی رمز عبور" : "نمایش رمز عبور"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* فیلد تکرار رمز عبور (فقط در حالت ثبت نام) */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  تکرار رمز عبور
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    dir="ltr"
                    placeholder="رمز عبور را دوباره تکرار کنید"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/15 px-4 py-2.5 pl-10 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer p-1"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "مخفی‌سازی تکرار رمز" : "نمایش تکرار رمز"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* دکمه ارسال فرم */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] py-3 px-4 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin text-slate-950" />
                  <span>در حال بررسی اطلاعات...</span>
                </>
              ) : isLogin ? (
                <>
                  <span>ورود به چکاوک</span>
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <span>ثبت‌نام و شروع گفتگو</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* تعویض وضعیت بین ورود و ثبت نام */}
          {canSignup && (
            <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 text-center">
              {isLogin ? (
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  هنوز در چکاوک عضو نشده‌اید؟{" "}
                  <button
                    type="button"
                    onClick={onSwitchMode}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition cursor-pointer ml-1"
                  >
                    همین حالا ثبت‌نام کنید
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  قبلاً ثبت‌نام کرده‌اید؟{" "}
                  <button
                    type="button"
                    onClick={onSwitchMode}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition cursor-pointer ml-1"
                  >
                    وارد شوید
                  </button>
                </p>
              )}
            </div>
          )}

          {/* حالت ثبت‌نام غیرفعال در سرور */}
          {!canSignup && isLogin && (
            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 font-medium">
              ثبت‌نام کاربر جدید موقتاً غیرفعال است.
            </div>
          )}

          {/* اورلی ورود در حال انجام */}
          {showSigningOverlay && isLogin && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/85 dark:bg-slate-950/85 backdrop-blur-xs">
              <LoaderCircle className="h-10 w-10 animate-spin text-emerald-500" />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                در حال احراز هویت و ورود به چکاوک...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
