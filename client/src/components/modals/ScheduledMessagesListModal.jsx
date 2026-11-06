import { useEffect, useState } from "react";
import { Close, Clock, Send, Trash2, BellOff, LoaderCircle } from "../../icons/lucide.js";
import { fetchScheduledMessages, sendScheduledMessageNow, deleteScheduledMessage } from "../../api/chatApi.js";

function formatScheduledTime(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleString("fa-IR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export default function ScheduledMessagesListModal({
  isOpen,
  open,
  onClose,
  chatId,
}) {
  const isModalOpen = Boolean(isOpen ?? open);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionBusyId, setActionBusyId] = useState(null);

  const loadMessages = () => {
    if (!chatId) return;
    setLoading(true);
    fetchScheduledMessages(chatId)
      .then((res) => {
        if (Array.isArray(res?.scheduledMessages)) {
          setMessages(res.scheduledMessages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isModalOpen) {
      loadMessages();
    }
  }, [isModalOpen, chatId]);

  const handleSendNow = async (id) => {
    setActionBusyId(id);
    try {
      await sendScheduledMessageNow({ chatId, scheduledMessageId: id });
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // ignore
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    setActionBusyId(id);
    try {
      await deleteScheduledMessage({ chatId, scheduledMessageId: id });
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // ignore
    } finally {
      setActionBusyId(null);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scheduled-list-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <Clock size={18} />
            </div>
            <div>
              <h2 id="scheduled-list-title" className="text-sm font-bold text-slate-800 dark:text-slate-100">
                پیام‌های زمان‌بندی‌شده
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {messages.length} پیام در صف ارسال خودکار
              </span>
            </div>
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

        {/* Content list */}
        <div className="chat-scroll flex-1 overflow-y-auto py-3 space-y-2">
          {loading ? (
            <div className="flex h-40 flex-col items-center justify-center text-slate-400">
              <LoaderCircle className="animate-spin text-emerald-600" size={24} />
              <span className="mt-2 text-xs">در حال بارگذاری پیام‌ها...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
              <Clock size={28} className="mb-2 opacity-50" />
              <span className="text-xs">هیچ پیام زمان‌بندی‌شده‌ای برای این گفتگو وجود ندارد.</span>
            </div>
          ) : (
            messages.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-800 dark:text-slate-100 wrap-break-word font-normal" dir="auto">
                    {item.body}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <Clock size={12} />
                      {formatScheduledTime(item.scheduled_at)}
                    </span>
                    {item.is_silent ? (
                      <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                        <BellOff size={11} />
                        بی‌صدا
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={actionBusyId === item.id}
                    onClick={() => handleSendNow(item.id)}
                    title="ارسال فوری همین حالا"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:scale-95 transition dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30"
                  >
                    <Send size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={actionBusyId === item.id}
                    onClick={() => handleDelete(item.id)}
                    title="حذف پیام زمان‌بندی‌شده"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 active:scale-95 transition dark:text-rose-400 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 flex justify-end dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
