import { useState, useMemo } from "react";
import { Close, Clock, BellOff, Calendar } from "../../icons/lucide.js";

export default function ScheduleMessageModal({
  isOpen,
  onClose,
  onConfirmSchedule,
  messagePreview = "",
}) {
  const [selectedPreset, setSelectedPreset] = useState("10m");
  const [customDateTime, setCustomDateTime] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - (d.getMinutes() % 5));
    // Format YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const [isSilent, setIsSilent] = useState(false);
  const [error, setError] = useState("");

  const presets = useMemo(() => {
    const now = new Date();

    // 10 minutes
    const in10m = new Date(now.getTime() + 10 * 60 * 1000);

    // Tonight at 20:00 (or 2 hours later if already past 20:00)
    const tonight = new Date(now);
    if (tonight.getHours() >= 20) {
      tonight.setHours(tonight.getHours() + 2, 0, 0, 0);
    } else {
      tonight.setHours(20, 0, 0, 0);
    }

    // Tomorrow 9:00 AM
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    return [
      { id: "10m", label: "۱۰ دقیقه دیگر", date: in10m },
      { id: "tonight", label: "امشب ساعت ۲۰:۰۰", date: tonight },
      { id: "tomorrow", label: "فردا صبح ساعت ۰۹:۰۰", date: tomorrow },
      { id: "custom", label: "زمان دلخواه", date: null },
    ];
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    let targetDate;
    if (selectedPreset === "custom") {
      targetDate = new Date(customDateTime);
    } else {
      const preset = presets.find((p) => p.id === selectedPreset);
      targetDate = preset?.date;
    }

    if (!targetDate || Number.isNaN(targetDate.getTime())) {
      setError("لطفاً یک تاریخ و زمان معتبر انتخاب کنید.");
      return;
    }

    if (targetDate.getTime() <= Date.now() + 5000) {
      setError("زمان ارسال باید حداقل چند ثانیه در آینده باشد.");
      return;
    }

    onConfirmSchedule({
      scheduledAt: targetDate.toISOString(),
      isSilent,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <Clock size={18} />
            </div>
            <h2 id="schedule-modal-title" className="text-sm font-bold text-slate-800 dark:text-slate-100">
              زمان‌بندی ارسال پیام
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="بستن"
          >
            <Close size={16} />
          </button>
        </div>

        {/* Message preview snippet */}
        {messagePreview ? (
          <div className="mt-3 rounded-xl border border-slate-200/60 bg-slate-50/70 p-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">پیش‌نمایش متن: </span>
            <span className="truncate block mt-1" dir="auto">{messagePreview}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Preset Buttons */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              زمان ارسال پیشنهادی:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                    selectedPreset === preset.id
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-200"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Input */}
          {selectedPreset === "custom" ? (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <label
                htmlFor="custom-schedule-datetime"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                انتخاب تاریخ و ساعت دقیق:
              </label>
              <input
                id="custom-schedule-datetime"
                type="datetime-local"
                value={customDateTime}
                onChange={(e) => setCustomDateTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          ) : null}

          {/* Silent Option */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-xl border border-slate-200/70 p-2.5 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
            <input
              type="checkbox"
              checked={isSilent}
              onChange={(e) => setIsSilent(e.target.checked)}
              className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <BellOff size={15} className="text-amber-500" />
              <span>ارسال بدون صدا و لرزش (Silent Delivery)</span>
            </div>
          </label>

          {error ? (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium" role="alert">
              {error}
            </p>
          ) : null}

          {/* Action Buttons */}
          <div className="mt-5 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
            >
              زمان‌بندی و تأیید
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
