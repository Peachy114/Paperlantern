import { useState } from 'react'
import { useAdminAnnouncements } from '@/features/admin/hooks/useAdminAnnouncements'
import { type Announcement, type AnnouncementPayload } from '@/api/announcement'
import { storageUrl } from '@/utils/storage'

const TAG_COLORS: Record<string, string> = {
  event:    'bg-[#85B7EB] text-[#1a1a1a]',
  update:   'bg-[#5DCAA5] text-[#1a1a1a]',
  reminder: 'bg-[#FAC775] text-[#1a1a1a]',
}

const AUDIENCE_COLORS: Record<string, string> = {
  public: 'bg-[#C9A7EB] text-[#1a1a1a]',
  studio: 'bg-[#F09595] text-[#1a1a1a]',
}

const EMPTY_FORM: AnnouncementPayload = {
  title:     '',
  content:   '',
  tag:       'update',
  audience:  'public',
  image:     null,
  is_pinned: false,
}

export default function AdminAnnouncements() {
  const { announcements, isLoading, error, setError, create, update, remove, creating, updating, deleting } = useAdminAnnouncements()

  const [showForm, setShowForm]           = useState(false)
  const [editing, setEditing]             = useState<Announcement | null>(null)
  const [form, setForm]                   = useState<AnnouncementPayload>(EMPTY_FORM)
  const [imagePreview, setImagePreview]   = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setImagePreview(null)
    setError(null)
    setShowForm(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm({
      title:     a.title,
      content:   a.content,
      tag:       a.tag,
      audience:  a.audience,
      image:     null,
      is_pinned: a.is_pinned,
    })
    setImagePreview(a.image ? storageUrl(a.image) : null)
    setError(null)
    setShowForm(true)
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setForm(f => ({ ...f, image: file }))
    setImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.')
      return
    }
    if (editing) {
      await update(editing.id, form)
    } else {
      await create(form)
    }
    setShowForm(false)
  }

  const handleDelete = async (id: number) => {
    await remove(id)
    setConfirmDelete(null)
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />

      <div className="p-6 max-w-5xl mx-auto" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[28px] tracking-[0.08em] text-foreground">◆ ANNOUNCEMENTS</h1>
            <p className="text-muted-foreground text-[11px] tracking-[0.15em] font-sans mt-0.5">
              Manage public & studio announcements
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-1.5 border-2 border-foreground bg-foreground text-background text-[13px] tracking-[0.12em] hover:opacity-80 transition-opacity"
            style={{ boxShadow: '3px 3px 0 #e8a838' }}
          >
            + NEW
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-2 border-2 border-[#F09595] bg-[#F09595]/10 text-[#F09595] text-[12px] tracking-wide font-sans">
            {error}
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <p className="text-muted-foreground text-[12px] tracking-widest">LOADING...</p>
        ) : announcements.length === 0 ? (
          <div className="border-2 border-dashed border-foreground/20 p-12 text-center text-muted-foreground text-[12px] tracking-[0.2em]">
            NO ANNOUNCEMENTS YET
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map(a => (
              <div
                key={a.id}
                className="border-[2.5px] border-foreground bg-background"
                style={{ boxShadow: '4px 4px 0 var(--foreground)' }}
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Image */}
                  {a.image && (
                    <img
                      src={storageUrl(a.image)!}
                      alt={a.title}
                      className="w-16 h-16 object-cover border-2 border-foreground flex-shrink-0"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {a.is_pinned && (
                        <span className="text-[10px] tracking-[0.15em] text-amber-500">📌 PINNED</span>
                      )}
                      <span className={`text-[10px] tracking-[0.12em] px-2 py-0.5 ${TAG_COLORS[a.tag]}`}>
                        {a.tag.toUpperCase()}
                      </span>
                      <span className={`text-[10px] tracking-[0.12em] px-2 py-0.5 ${AUDIENCE_COLORS[a.audience]}`}>
                        {a.audience.toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-[16px] tracking-[0.06em] text-foreground leading-tight">{a.title}</h2>
                    <p className="text-[12px] text-muted-foreground font-sans mt-1 line-clamp-2 leading-relaxed">{a.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(a)}
                      className="px-3 py-1 border-2 border-foreground text-foreground text-[11px] tracking-[0.1em] hover:bg-foreground hover:text-background transition-colors"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => setConfirmDelete(a.id)}
                      className="px-3 py-1 border-2 border-[#F09595] text-[#F09595] text-[11px] tracking-[0.1em] hover:bg-[#F09595] hover:text-white transition-colors"
                    >
                      DEL
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-lg border-[3px] border-foreground bg-[#fffdf5] dark:bg-[#1e1b14]"
            style={{ boxShadow: '7px 7px 0 var(--foreground)' }}
          >
            {/* Modal header */}
            <div className="border-b-[2.5px] border-foreground px-5 py-3 flex items-center justify-between bg-foreground">
              <span className="text-background text-[14px] tracking-[0.15em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {editing ? '◆ EDIT ANNOUNCEMENT' : '◆ NEW ANNOUNCEMENT'}
              </span>
              <button onClick={() => setShowForm(false)} className="text-background/60 hover:text-background text-lg leading-none">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-4 font-sans">

              {/* Title */}
              <div>
                <label className="text-[10px] tracking-[0.2em] text-muted-foreground block mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>TITLE *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border-2 border-foreground bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-amber-500"
                  placeholder="Announcement title"
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-[10px] tracking-[0.2em] text-muted-foreground block mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>CONTENT *</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={4}
                  className="w-full border-2 border-foreground bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-amber-500 resize-none"
                  placeholder="Announcement content..."
                />
              </div>

              {/* Tag + Audience */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] tracking-[0.2em] text-muted-foreground block mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>TAG</label>
                  <select
                    value={form.tag}
                    onChange={e => setForm(f => ({ ...f, tag: e.target.value as any }))}
                    className="w-full border-2 border-foreground bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-amber-500"
                  >
                    <option value="update">Update</option>
                    <option value="event">Event</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] text-muted-foreground block mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>AUDIENCE</label>
                  <select
                    value={form.audience}
                    onChange={e => setForm(f => ({ ...f, audience: e.target.value as any }))}
                    className="w-full border-2 border-foreground bg-transparent px-3 py-2 text-[13px] text-foreground outline-none focus:border-amber-500"
                  >
                    <option value="public">Public</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="text-[10px] tracking-[0.2em] text-muted-foreground block mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>IMAGE (optional)</label>
                {imagePreview && (
                  <img src={imagePreview} alt="preview" className="w-full h-32 object-cover border-2 border-foreground mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="w-full text-[12px] text-muted-foreground file:border-2 file:border-foreground file:bg-foreground file:text-background file:px-3 file:py-1 file:text-[11px] file:tracking-widest file:mr-3 file:cursor-pointer"
                />
              </div>

              {/* Pinned */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                  className="w-4 h-4 border-2 border-foreground"
                />
                <span className="text-[11px] tracking-[0.15em] text-foreground" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>PIN THIS ANNOUNCEMENT</span>
              </label>

              {error && (
                <p className="text-[#F09595] text-[12px]">{error}</p>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={creating || updating}
                  className="flex-1 py-2 border-2 border-foreground bg-foreground text-background text-[13px] tracking-[0.12em] hover:opacity-80 disabled:opacity-50 transition-opacity"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", boxShadow: '3px 3px 0 #e8a838' }}
                >
                  {creating || updating ? 'SAVING...' : editing ? 'SAVE CHANGES' : 'PUBLISH'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 border-2 border-foreground text-foreground text-[13px] tracking-[0.12em] hover:bg-foreground/5 transition-colors"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-sm border-[3px] border-foreground bg-[#fffdf5] dark:bg-[#1e1b14] p-6 text-center"
            style={{ boxShadow: '7px 7px 0 var(--foreground)' }}
          >
            <p className="text-[16px] tracking-[0.08em] text-foreground mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>DELETE ANNOUNCEMENT?</p>
            <p className="text-[12px] text-muted-foreground font-sans mb-5">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                className="px-5 py-1.5 border-2 border-[#F09595] bg-[#F09595] text-white text-[12px] tracking-[0.12em] hover:opacity-80 disabled:opacity-50"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                {deleting ? 'DELETING...' : 'DELETE'}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-1.5 border-2 border-foreground text-foreground text-[12px] tracking-[0.12em] hover:bg-foreground/5"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}