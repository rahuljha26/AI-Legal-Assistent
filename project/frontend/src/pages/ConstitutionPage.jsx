import { useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

// ─── Filter categories matching the DB tags ──────────────────────────────────
const FILTERS = [
  'All',
  'Fundamental Rights',
  'Directive Principles',
  'Fundamental Duties',
  'Right to Equality',
  'Right to Freedom',
  'Right to Life',
  'Emergency Provisions',
  'Union',
  'States',
  'Parliament',
  'Judiciary',
  'Supreme Court',
  'High Court',
  'Elections',
  'Citizenship',
  'Preamble',
];

const QUICK_SEARCHES = [
  'Article 21', 'Article 14', 'Article 32', 'Right to Life',
  'Emergency', 'Fundamental Duties', 'Right to Education',
];

export default function ConstitutionPage() {
  const [query, setQuery]       = useState('');
  const [filter, setFilter]     = useState('All');
  const [results, setResults]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [meta, setMeta]         = useState({ total: 0, page: 1, pages: 1 });

  const handleSearch = useCallback(async (overrideQuery = null, overrideFilter = null, page = 1) => {
    const q = (overrideQuery !== null ? overrideQuery : query).trim();
    const f = overrideFilter !== null ? overrideFilter : filter;

    if (!q && f === 'All') {
      setResults([]); setSearched(false); return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (q)             params.append('q', q);
      if (f !== 'All')   params.append('filter', f);

      const res = await api.get(`/constitution/search/?${params.toString()}`);
      const data = res.data?.data || {};

      setResults(data.results || []);
      setMeta({ total: data.total || 0, page: data.page || 1, pages: data.pages || 1 });
      setSearched(true);
      setSelected((data.results || [])[0] || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch results. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, filter]);

  const handleFilterClick = (f) => {
    setFilter(f);
    handleSearch(null, f, 1);
  };

  const handleQuickSearch = (s) => {
    setQuery(s);
    setFilter('All');
    handleSearch(s, 'All', 1);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <h3>⚖️ Indian Constitution &amp; Law Search</h3>
        </header>

        <div className="page-body">
          <p className="text-muted mb-16">
            Search articles from the Constitution of India database — powered by AI context
          </p>

          {/* ── Search Bar ─────────────────────────────────────────────────── */}
          <div className="search-bar-wrap">
            <input
              className="form-control"
              placeholder="Search by article number, keyword, or Part (e.g. 'Article 21', 'equality'…)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{ borderRadius: '8px 0 0 8px', borderRight: 'none' }}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSearch()}
              disabled={loading}
            >
              {loading ? '⏳' : '🔍'} Search
            </button>
          </div>

          {/* ── Filter Chips ────────────────────────────────────────────────── */}
          <div className="filter-pills mt-12" style={{ flexWrap: 'wrap', gap: 6 }}>
            {FILTERS.map(f => (
              <span
                key={f}
                className={`chip${filter === f ? ' active' : ''}`}
                onClick={() => handleFilterClick(f)}
                style={{ cursor: 'pointer' }}
              >
                {f}
              </span>
            ))}
          </div>

          {/* ── Error ───────────────────────────────────────────────────────── */}
          {error && (
            <div className="card" style={{ background: '#fff1f0', borderColor: '#ff4d4f', marginTop: 16, padding: '12px 16px', color: '#cf1322' }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Empty State ─────────────────────────────────────────────────── */}
          {!searched && !loading && (
            <div style={{ textAlign: 'center', marginTop: 80, color: 'var(--muted)' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
              <h3 style={{ marginBottom: 8 }}>Search the Indian Constitution</h3>
              <p style={{ marginBottom: 24 }}>
                All articles are stored in the database and used as AI context.
                Enter an article number, keyword, or Part name to begin.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {QUICK_SEARCHES.map(s => (
                  <span
                    key={s}
                    className="chip"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleQuickSearch(s)}
                  >
                    🔍 {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Loading ─────────────────────────────────────────────────────── */}
          {loading && (
            <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚖️</div>
              <p>Searching the Constitution database…</p>
            </div>
          )}

          {/* ── Results ─────────────────────────────────────────────────────── */}
          {searched && !loading && (
            <div className="search-layout" style={{ marginTop: 24 }}>
              {/* Left: Result List */}
              <div>
                <p className="text-sm mb-16" style={{ color: 'var(--muted)' }}>
                  {meta.total} article{meta.total !== 1 ? 's' : ''} found
                  {query ? ` for "${query}"` : ''}
                  {filter !== 'All' ? ` in "${filter}"` : ''}
                  {meta.pages > 1 && ` — Page ${meta.page} of ${meta.pages}`}
                </p>

                {results.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔎</div>
                    <p>No articles found. Try different keywords or remove the filter.</p>
                  </div>
                ) : (
                  results.map((r, i) => (
                    <div
                      key={r.id || i}
                      className="result-card"
                      onClick={() => setSelected(r)}
                      style={{
                        background: selected?.id === r.id ? 'var(--light-blue)' : '#fff',
                        borderColor: selected?.id === r.id ? 'var(--primary)' : 'var(--border)',
                        cursor: 'pointer',
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span className="badge badge-verified" style={{ flexShrink: 0, fontSize: 11 }}>
                          {r.article_number}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{r.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{r.part}</div>
                          <p className="text-sm" style={{ marginBottom: 8, lineHeight: 1.5 }}>
                            {r.short_description.slice(0, 120)}…
                          </p>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {(r.tags || []).slice(0, 3).map(t => (
                              <span key={t} className="chip" style={{ fontSize: 10, padding: '2px 6px' }}>{t}</span>
                            ))}
                          </div>
                        </div>
                        <span className="text-primary" style={{ fontSize: 12, flexShrink: 0 }}>View →</span>
                      </div>
                    </div>
                  ))
                )}

                {/* Pagination */}
                {meta.pages > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={meta.page <= 1}
                      onClick={() => handleSearch(null, null, meta.page - 1)}
                    >
                      ← Prev
                    </button>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {meta.page} / {meta.pages}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={meta.page >= meta.pages}
                      onClick={() => handleSearch(null, null, meta.page + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Detail Panel */}
              {selected && (
                <div className="card" style={{ position: 'sticky', top: 24, height: 'fit-content', maxHeight: '80vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span className="badge badge-verified" style={{ fontSize: 11 }}>
                      {selected.article_number}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', flex: 1 }}>{selected.part}</span>
                  </div>

                  <h3 style={{ marginBottom: 8, fontSize: 16 }}>{selected.title}</h3>

                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                    {(selected.tags || []).map(t => (
                      <span key={t} className="chip" style={{ fontSize: 10, padding: '2px 6px' }}>{t}</span>
                    ))}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.85,
                      color: 'var(--body-text)',
                      background: '#f8faff',
                      padding: '14px 16px',
                      borderRadius: 8,
                      borderLeft: '3px solid var(--primary)',
                      marginBottom: 16,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selected.full_text}
                  </div>

                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => {
                      const q = `${selected.article_number}: ${selected.title}`;
                      window.location.href = `/dashboard?prefill=${encodeURIComponent(q)}`;
                    }}
                  >
                    🤖 Use in AI Advice
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
