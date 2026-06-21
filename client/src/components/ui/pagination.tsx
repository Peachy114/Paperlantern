interface PaginationProps {
  page: number
  totalPages: number
  setPage: (p: number) => void
}

export default function Pagination({ page, totalPages, setPage }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        className="px-4 py-1.5 rounded text-sm bg-foreground text-background disabled:opacity-30 hover:opacity-80 transition-opacity cursor-pointer"
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
      >
        ← PREV
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`w-8 h-8 rounded text-sm transition-all cursor-pointer
            ${p === page
              ? 'bg-foreground text-background'
              : 'bg-secondary text-foreground hover:bg-muted border border-border'
            }`}
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        className="px-4 py-1.5 rounded text-sm bg-foreground text-background disabled:opacity-30 hover:opacity-80 transition-opacity cursor-pointer"
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.12em' }}
      >
        NEXT →
      </button>
    </div>
  )
}