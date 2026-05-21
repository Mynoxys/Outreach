import type { DB } from '../types'
import { formatDate } from '../dateUtils'

export default function JournalTab({ db }: { db: DB }) {
  const entries = [...db.journal].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : a.created_at < b.created_at ? 1 : -1,
  )

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Journal</h2>
        <span className="count-pill">{entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <div className="empty">No entries yet. Click “End day” to write your first.</div>
      ) : (
        <div className="journal-list">
          {entries.map((e) => (
            <article key={e.id} className="journal-entry">
              <div className="journal-date">{formatDate(e.date, true)}</div>
              <div className="journal-body">
                {e.learned && (
                  <div className="jrow"><span className="jlabel">Learned</span><span>{e.learned}</span></div>
                )}
                {e.quote && (
                  <div className="jrow"><span className="jlabel">Quote</span><span className="quote">“{e.quote}”</span></div>
                )}
                {e.changes && (
                  <div className="jrow"><span className="jlabel">Change</span><span>{e.changes}</span></div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
