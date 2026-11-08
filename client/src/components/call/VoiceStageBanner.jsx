import { memo } from "react";
import { Radio, Users } from "../../icons/lucide.js";
import Avatar from "../common/Avatar.jsx";

export const VoiceStageBanner = memo(function VoiceStageBanner({
  stage,
  isConnectedToThisStage = false,
  onJoin,
  onOpenStage,
}) {
  if (!stage) return null;

  const participants = Array.isArray(stage.participants) ? stage.participants : [];
  const previewParticipants = participants.slice(0, 3);
  const count = Number(stage.participantCount || participants.length || 0);

  return (
    <div className="relative mx-3 my-2 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-emerald-500/30 bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 px-4 py-3 shadow-md backdrop-blur-md dark:border-emerald-500/20 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900/40 transition-all duration-300">
      <div className="flex items-center gap-3 min-w-0">
        {/* Animated sound waves */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
          <span className="absolute -inset-1 rounded-2xl bg-emerald-400 opacity-30 animate-pulse" />
          <Radio size={20} className="relative z-10 animate-spin-slow" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
              {stage.title || "اتاق گفتگوی صوتی"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>زنده</span>
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex -space-x-1.5 overflow-hidden">
              {previewParticipants.map((p, idx) => (
                <Avatar
                  key={p.id || idx}
                  src={p.avatarUrl}
                  name={p.nickname || p.username}
                  className="h-5 w-5 ring-2 ring-white dark:ring-slate-950 text-[9px]"
                />
              ))}
            </div>
            <span>
              {count > 0 ? `${count.toLocaleString("fa-IR")} نفر حاضر` : "بدون شرکت‌کننده"}
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {isConnectedToThisStage ? (
          <button
            type="button"
            onClick={onOpenStage}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition"
          >
            <Users size={14} />
            <span>مشاهده اتاق</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onJoin?.(stage.chatId)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-95"
          >
            <Radio size={14} />
            <span>پیوستن</span>
          </button>
        )}
      </div>
    </div>
  );
});
