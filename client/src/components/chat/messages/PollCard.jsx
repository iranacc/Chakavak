import { memo, useMemo } from "react";
import { Check, CheckCircle2, Lock, Vote } from "../../../icons/lucide.js";

export const PollCard = memo(function PollCard({
  poll,
  isOwn,
  currentUserId,
  onVote,
  onClosePoll,
  canClose,
}) {
  if (!poll) return null;

  const totalVoters = Number(poll.totalVoters || 0);
  const options = Array.isArray(poll.options) ? poll.options : [];
  const optionVotes = Array.isArray(poll.optionVotes) ? poll.optionVotes : options.map(() => 0);
  const isClosed = Boolean(poll.isClosed);
  const isQuiz = Boolean(poll.isQuiz);
  const multipleChoice = Boolean(poll.multipleChoice);
  const correctOptionIndex = poll.correctOptionIndex !== null && poll.correctOptionIndex !== undefined
    ? Number(poll.correctOptionIndex)
    : null;

  // Determine user votes
  const userVotedIndices = useMemo(() => {
    if (!poll.votes || !currentUserId) return [];
    return poll.votes
      .filter((v) => v.userId === currentUserId)
      .map((v) => Number(v.optionIndex));
  }, [poll.votes, currentUserId]);

  const hasVoted = userVotedIndices.length > 0;

  const handleOptionClick = (index) => {
    if (isClosed) return;
    let nextIndices = [];
    if (multipleChoice) {
      if (userVotedIndices.includes(index)) {
        nextIndices = userVotedIndices.filter((i) => i !== index);
      } else {
        nextIndices = [...userVotedIndices, index];
      }
    } else {
      nextIndices = [index];
    }
    onVote?.(poll.id, nextIndices);
  };

  return (
    <div
      dir="rtl"
      className={`my-2 w-full max-w-sm rounded-2xl border p-3.5 select-none transition font-fa ${
        isOwn
          ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-950/40 dark:text-emerald-100"
          : "border-slate-200/80 bg-slate-50/90 text-slate-900 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Vote size={15} />
          <span>{isQuiz ? "کوئیز" : "نظرسنجی"}</span>
          {isClosed ? (
            <span className="flex items-center gap-1 text-[11px] text-rose-500 font-medium">
              <Lock size={12} />
              (پایان یافته)
            </span>
          ) : null}
        </div>

        {canClose && !isClosed ? (
          <button
            type="button"
            onClick={() => onClosePoll?.(poll.id)}
            className="text-[11px] font-semibold text-slate-500 hover:text-rose-500 transition cursor-pointer"
          >
            بستن نظرسنجی
          </button>
        ) : null}
      </div>

      <div className="mt-1.5 text-sm font-bold leading-snug text-slate-900 dark:text-white">
        {poll.question}
      </div>

      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        {poll.isAnonymous ? "رأی‌گیری ناشناس" : "رأی‌گیری عمومی"} •{" "}
        {multipleChoice ? "امکان انتخاب چند گزینه" : "تک گزینه‌ای"}
      </div>

      {/* Options List */}
      <div className="mt-3 space-y-2">
        {options.map((opt, idx) => {
          const votesCount = Number(optionVotes[idx] || 0);
          const percent = totalVoters > 0 ? Math.round((votesCount / totalVoters) * 100) : 0;
          const isSelected = userVotedIndices.includes(idx);
          const isCorrect = isQuiz && correctOptionIndex === idx;

          return (
            <button
              key={idx}
              type="button"
              disabled={isClosed}
              onClick={() => handleOptionClick(idx)}
              className={`group relative flex w-full items-center justify-between overflow-hidden rounded-xl border p-2.5 text-start text-xs font-medium transition active:scale-[0.99] cursor-pointer ${
                isSelected
                  ? "border-emerald-500/60 bg-emerald-500/15 dark:border-emerald-400/40 dark:bg-emerald-500/20"
                  : "border-slate-200/80 bg-white hover:bg-slate-50 dark:border-white/5 dark:bg-slate-800/80 dark:hover:bg-slate-800"
              }`}
            >
              {/* Progress bar background */}
              {hasVoted || isClosed ? (
                <div
                  className={`absolute inset-y-0 start-0 opacity-20 transition-all duration-300 pointer-events-none ${
                    isQuiz && isCorrect
                      ? "bg-emerald-500 opacity-40"
                      : isSelected
                        ? "bg-emerald-600 dark:bg-emerald-400"
                        : "bg-slate-400 dark:bg-slate-500"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              ) : null}

              <div className="relative flex items-center gap-2.5 z-10 min-w-0 flex-1">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] transition ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950"
                      : "border-slate-300 dark:border-slate-600"
                  }`}
                >
                  {isSelected ? <Check size={11} strokeWidth={3} /> : null}
                </span>

                <span className="truncate">{opt}</span>

                {isQuiz && isClosed && isCorrect ? (
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                ) : null}
              </div>

              {hasVoted || isClosed ? (
                <span className="relative z-10 ms-2 text-[11px] font-bold opacity-80 shrink-0">
                  {percent}%
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Footer / Stats */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>
          {totalVoters} رأی ثبت‌شده
        </span>
        {hasVoted && !isClosed ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            رأی شما ثبت شد
          </span>
        ) : null}
      </div>
    </div>
  );
});
