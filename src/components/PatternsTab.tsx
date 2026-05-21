import type { DB } from '../types'
import { channelPerformance, failureTagCounts, quoteBank } from '../stats'

export default function PatternsTab({ db }: { db: DB }) {
  const tags = failureTagCounts(db)
  const quotes = quoteBank(db)
  const channels = channelPerformance(db)

  return (
    <div className="patterns">
      <section className="panel">
        <div className="panel-head"><h2>Failure moments</h2><span className="count-pill">{tags.length}</span></div>
        {tags.length === 0 ? (
          <div className="empty">Tag parents’ failure moments to see which pain shows up most.</div>
        ) : (
          <ol className="rank-list">
            {tags.map((t, i) => (
              <li key={t.tag}>
                <span className="rank-no">{i + 1}</span>
                <span className="rank-tag">{t.tag}</span>
                <span className="rank-count">{t.count}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Channel performance</h2></div>
        {channels.length === 0 ? (
          <div className="empty">Add sources to your parents to compare channels.</div>
        ) : (
          <table className="channels">
            <thead>
              <tr><th>Source</th><th>Leads</th><th>Trials</th><th>Conv.</th></tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.source}>
                  <td>{c.source}</td>
                  <td>{c.leads}</td>
                  <td>{c.trials}</td>
                  <td className={c.trials > 0 ? 'hit' : 'muted'}>{Math.round(c.rate * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel quote-bank">
        <div className="panel-head"><h2>Quote bank</h2><span className="count-pill">{quotes.length}</span></div>
        {quotes.length === 0 ? (
          <div className="empty">Save key quotes on parents and they’ll collect here.</div>
        ) : (
          <ul className="quotes">
            {quotes.map((q, i) => (
              <li key={i} className="quote-card">
                <p>“{q.quote}”</p>
                <div className="quote-meta">— {q.name}{q.tag && <span className="tag">{q.tag}</span>}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
