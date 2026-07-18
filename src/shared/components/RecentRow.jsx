export default function RecentRow({
  entry,
  title,
  countLabel,
  onLoad,
  onRemove,
  onOpenNewWindow,
  formatTimeAgo,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onLoad(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onLoad(entry);
        }
      }}
      className="w-full text-left rounded bg-gray-700/50 hover:bg-gray-700 px-2 py-1 transition-colors group cursor-pointer flex gap-2"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-amber-300 font-bold truncate">
            {title || entry.fileName}
          </span>
          <span className="text-[10px] text-gray-500 shrink-0 ml-2">
            {formatTimeAgo(entry.savedAt)}
          </span>
        </div>
        <div className="text-[10px] text-gray-400 truncate">
          {entry.author_name && `by ${entry.author_name}`}
          {entry.author_name && entry.revision_no && " · "}
          {entry.revision_no && entry.revision_no}
          {(entry.author_name || entry.revision_no) && " · "}
          {countLabel}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e, entry.id);
          }}
          className="w-4 h-4 flex items-center justify-center rounded text-gray-500 hover:text-red-400 hover:bg-gray-600 transition-colors text-xs"
          aria-label={`Remove ${entry.fileName} from recents`}
          title="Remove"
        >
          ×
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenNewWindow(entry);
          }}
          className="w-4 h-4 flex items-center justify-center rounded text-gray-500 hover:text-amber-400 hover:bg-gray-600 transition-colors cursor-pointer"
          aria-label={`Open ${entry.fileName} in new tab`}
          title="Open in new tab"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-2.5 h-2.5"
          >
            <path d="M8.75 3.5a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V5.56l-4.22 4.22a.75.75 0 1 1-1.06-1.06l4.22-4.22H9.5a.75.75 0 0 1-.75-.75Z" />
            <path d="M3.5 4a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V9.25a.75.75 0 0 1 1.5 0v3.25A2 2 0 0 1 11.5 14.5h-8A2 2 0 0 1 1.5 12.5v-8A2 2 0 0 1 3.5 2.5h3.25a.75.75 0 0 1 0 1.5H3.5Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
