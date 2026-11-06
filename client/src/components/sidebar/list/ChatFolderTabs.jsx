import { memo } from "react";

export const ChatFolderTabs = memo(function ChatFolderTabs({
  currentFolder,
  onSelectFolder,
  counts = {},
}) {
  const folders = [
    { id: "all", label: "All", labelFa: "همه", count: counts.all },
    { id: "personal", label: "Direct", labelFa: "شخصی", count: counts.personal },
    { id: "groups", label: "Groups", labelFa: "گروه‌ها", count: counts.groups },
    { id: "channels", label: "Channels", labelFa: "کانال‌ها", count: counts.channels },
  ];

  return (
    <div
      role="tablist"
      aria-label="Chat folders"
      className="scrollbar-none flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/60 bg-white/50 px-3 py-2 text-xs backdrop-blur-xs select-none dark:border-white/5 dark:bg-slate-900/50"
    >
      {folders.map((folder) => {
        const isActive = currentFolder === folder.id;
        const unreadCount = Number(folder.count || 0);

        return (
          <button
            key={folder.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectFolder?.(folder.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition active:scale-95 ${
              isActive
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30 dark:bg-emerald-500 dark:text-slate-950"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-white"
            }`}
          >
            <span>{folder.label}</span>
            {unreadCount > 0 ? (
              <span
                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  isActive
                    ? "bg-white text-emerald-700 dark:bg-slate-950 dark:text-emerald-300"
                    : "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950"
                }`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
});
