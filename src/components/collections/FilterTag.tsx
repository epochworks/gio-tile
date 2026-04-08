export default function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gio-grey rounded-full text-gio-black/50 text-small tracking-[-0.02em]">
      {label}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="text-gio-black/30 hover:text-gio-black/60 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1l6 6M7 1l-6 6" />
        </svg>
      </button>
    </span>
  )
}
