import { useState } from "react";
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
import chakavakLogo from "../assets/chakavak-logo.png";

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

  return (
    <div
      dir="rtl"
      className="w-full max-w-6xl my-auto font-sans relative"
    >
      {/* ─── بدنه اصلی کارت اسپلیت (Split Showcase Container) ─── */}
      <div className="w-full rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-emerald-500/5 flex flex-col lg:flex-row items-stretch overflow-hidden">
        
        {/* ─── ستون راست: ویترین قابلیت‌ها و ارزش‌های چکاوک (Desktop Showcase) ─── */}
        <div className="w-full lg:w-7/12 xl:w-3/5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-l border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-slate-50/90 via-emerald-50/30 to-slate-100/80 dark:from-slate-900/90 dark:via-emerald-950/20 dark:to-slate-950/90">
          <div>
            {/* برندینگ و نسخه */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img
                  src={chakavakLogo}
                  alt="چکاوک"
                  className="h-11 w-11 sm:h-12 sm:w-12 object-contain drop-shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      چکاوک
                    </h1>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                      v0.24.0
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                    پلتفرم ارتباطی و پیام‌رسان بلادرنگ سلف‌هاستد
                  </p>
                </div>
              </div>

              {/* دکمه تم برای صفحات کوچک */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:text-emerald-500 transition"
                aria-label="تغییر تم"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            {/* بج‌های ارزش‌های کلیدی */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-emerald-700 dark:text-emerald-300 font-medium shadow-xs">
                <ShieldCheck size={14} className="text-emerald-500" />
                حفظ کامل حریم خصوصی
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-teal-700 dark:text-teal-300 font-medium shadow-xs">
                <Zap size={14} className="text-teal-500" />
                سرعت فوق‌العاده بلادرنگ
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-cyan-700 dark:text-cyan-300 font-medium shadow-xs">
                <CheckCircle2 size={14} className="text-cyan-500" />
                مستقل و سلف‌هاستد
              </span>
            </div>

            {/* دکمه تاگل مشاهده امکانات در موبایل */}
            <div className="lg:hidden mb-2">
              <button
                type="button"
                onClick={() => setShowMobileShowcase((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition hover:bg-emerald-500/15"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={15} />
                  {showMobileShowcase ? "بستن لیست امکانات چکاوک" : "مشاهده تمام امکانات و قابلیت‌های چکاوک"}
                </span>
                {showMobileShowcase ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* شبکه معرفی امکانات (Bento Grid) - در دسکتاپ همیشه باز، در موبایل تاشو */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 transition-all duration-300 ${
                showMobileShowcase ? "block mt-4" : "hidden lg:grid"
              }`}
            >
              {/* کارت ۱: گفتگوی محرمانه E2EE */}
              <div className="rounded-2xl p-4 bg-white/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition duration-300 group">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-105 transition">
                  <Lock size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  گفتگوی محرمانه سرتاسری (E2EE)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300/80 leading-relaxed">
                  رمزنگاری در مبدأ با الگوریتم ECDH P-256 و کلیدهای ۲۵۶ بیتی؛ غیرقابل شنود و ردیابی حتی در سرور.
                </p>
              </div>

              {/* کارت ۲: تماس صوتی و تصویری */}
              <div className="rounded-2xl p-4 bg-white/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5 transition duration-300 group">
                <div className="h-9 w-9 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3 group-hover:scale-105 transition">
                  <PhoneCall size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  تماس صوتی و تصویری HD
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300/80 leading-relaxed">
                  ارتباط بلادرنگ WebRTC با رله STUN/TURN اختصاصی، تفکیک استریم صوتی و مات‌سازی پس‌زمینه (AI Blur).
                </p>
              </div>

              {/* کارت ۳: اتاق‌های گفتگوی صوتی */}
              <div className="rounded-2xl p-4 bg-white/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition duration-300 group">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-105 transition">
                  <Radio size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  اتاق‌های صوتی زنده (Voice Stages)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300/80 leading-relaxed">
                  نشست‌های صوتی پیوسته در گروه‌ها و کانال‌ها با تفکیک سخنرانان، شنوندگان و بالا بردن دست.
                </p>
              </div>

              {/* کارت ۴: ابزارهای مدرن پیام‌رسانی */}
              <div className="rounded-2xl p-4 bg-white/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition duration-300 group">
                <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 group-hover:scale-105 transition">
                  <Sparkles size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  نظرسنجی، استیکر و پیام زمان‌بندی
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300/80 leading-relaxed">
                  پوشه‌بندی گفتگوها، کوئیزهای تعاملی، استیکرهای رسمی، جستجوی گیف، ارسال بی‌صدا و زمان‌بندی پیام.
                </p>
              </div>
            </div>
          </div>

          {/* فوتر ویترین */}
          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/10 hidden sm:flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>چکاوک؛ آزادی و آرامش در ارتباطات مدرن</span>
            <span>بدون وابستگی به سرویس‌های ابری بیگانه</span>
          </div>
        </div>

        {/* ─── ستون چپ: فرم ورود و عضویت شیشه‌ای (Auth Form) ─── */}
        <div className="w-full lg:w-5/12 xl:w-2/5 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white/90 dark:bg-slate-900/90 relative">
          
          {/* دکمه تغییر تم در دسکتاپ */}
          <div className="hidden lg:flex justify-end mb-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500/30 transition shadow-xs"
              aria-label="تغییر تم"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* سربرگ فرم */}
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              {isLogin ? "ورود به سامانه • SIGN IN" : "عضویت کاربر جدید • SIGN UP"}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {title || (isLogin ? "ورود به چکاوک" : "ایجاد حساب کاربری")}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {subtitle ||
                (isLogin
                  ? "جهت ورود به حساب کاربری، نام کاربری و رمز خود را وارد کنید."
                  : "برای ساخت حساب جدید در چکاوک اطلاعات زیر را تکمیل فرمایید.")}
            </p>
          </div>

          {/* اعلان خطا یا وضعیت */}
          {status && (
            <div className="mb-4 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 shadow-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <span className="leading-relaxed">{status}</span>
            </div>
          )}

          {/* فرم ارسال */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* فیلد نام کاربری */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
                  placeholder="username"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/15 px-4 py-2.5 pl-10 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
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
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/15 px-4 py-2.5 pl-10 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
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
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
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
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-white/15 px-4 py-2.5 pl-10 text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
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
                  <span>در حال پردازش...</span>
                </>
              ) : isLogin ? (
                <>
                  <span>ورود به حساب</span>
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <span>ایجاد حساب کاربری</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* تعویض وضعیت بین ورود و ثبت نام */}
          {canSignup && (
            <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 text-center">
              {isLogin ? (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  حساب کاربری ندارید؟{" "}
                  <button
                    type="button"
                    onClick={onSwitchMode}
                    className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition cursor-pointer ml-1"
                  >
                    ایجاد حساب جدید
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  قبلاً در چکاوک ثبت‌نام کرده‌اید؟{" "}
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
            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500">
              ثبت‌نام کاربر جدید توسط مدیر سیستم غیرفعال شده است.
            </div>
          )}

          {/* اورلی ورود در حال انجام */}
          {showSigningOverlay && isLogin && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/85 dark:bg-slate-950/85 backdrop-blur-xs">
              <LoaderCircle className="h-10 w-10 animate-spin text-emerald-500" />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                در حال احراز هویت و ورود...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
