import { useState, useCallback } from 'react';
import { ikAPI } from '../api';
import { Scale, Search, Calendar, ArrowLeft, ExternalLink, BookOpen, X, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: '',            label: 'Relevance' },
  { value: 'mostrecent',  label: 'Most Recent' },
  { value: 'leastrecent', label: 'Least Recent' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return dateStr;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SearchBar({ query, onQueryChange, fromDate, onFromDateChange, toDate, onToDateChange, sortBy, onSortByChange, loading, onSearch }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="ik-searchbar">
      <div className="ik-searchbar__main">
        <Search className="ik-searchbar__icon" size={18} />
        <input
          id="ik-search-input"
          type="text"
          className="ik-searchbar__input"
          placeholder="Search case law, statutes, judgments… (e.g. IPC section 498A, property dispute)"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button id="ik-search-btn" className="ik-searchbar__btn" onClick={onSearch} disabled={loading || !query.trim()}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      <div className="ik-searchbar__filters">
        <div className="ik-filter">
          <Calendar size={14} />
          <label htmlFor="ik-from-date">From</label>
          <input id="ik-from-date" type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} />
        </div>
        <div className="ik-filter">
          <Calendar size={14} />
          <label htmlFor="ik-to-date">To</label>
          <input id="ik-to-date" type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} />
        </div>
        <div className="ik-filter">
          <label htmlFor="ik-sortby">Sort</label>
          <select id="ik-sortby" value={sortBy} onChange={(e) => onSortByChange(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ doc, onClick }) {
  return (
    <div className="ik-result-card" onClick={() => onClick(doc)} id={`ik-doc-${doc.tid}`}>
      <div className="ik-result-card__header">
        <h3 className="ik-result-card__title">{doc.title || `Document #${doc.tid}`}</h3>
        <ChevronRight size={16} className="ik-result-card__arrow" />
      </div>
      <div className="ik-result-card__meta">
        {doc.docsource && <span className="ik-badge">{doc.docsource}</span>}
        {doc.publishdate && <span className="ik-meta-text">📅 {formatDate(doc.publishdate)}</span>}
        {doc.numcitedby != null && <span className="ik-meta-text">🔗 Cited by {doc.numcitedby}</span>}
        {doc.numcites != null && <span className="ik-meta-text">📎 Cites {doc.numcites}</span>}
      </div>
      {doc.headline && (
        <p className="ik-result-card__snippet">{doc.headline}</p>
      )}
    </div>
  );
}

function CaseTabPanel({ tab, setTab, docDetail, loadingDetail, citationsData, citedByData, loadingCitations, loadingCitedBy, onDocSelect }) {
  if (!docDetail) return null;

  const renderDocList = (data, loading, label) => {
    if (loading) return <div className="ik-panel__loading"><Loader2 size={20} className="animate-spin" /> Loading {label}…</div>;
    const docs = data?.docs || [];
    if (!docs.length) return <div className="ik-panel__empty">No {label} found.</div>;
    return docs.map((d) => (
      <div key={d.tid} className="ik-cite-item" onClick={() => onDocSelect(d)} id={`ik-cite-${d.tid}`}>
        <span className="ik-cite-item__title">{d.title || `Doc #${d.tid}`}</span>
        <div className="ik-cite-item__meta">
          {d.docsource && <span className="ik-badge ik-badge--sm">{d.docsource}</span>}
          {d.publishdate && <span>{d.publishdate}</span>}
        </div>
      </div>
    ));
  };

  return (
    <div className="ik-case-detail">
      {/* Tabs */}
      <div className="ik-tabs">
        {['judgment', 'citations', 'citedby'].map((t) => (
          <button
            key={t}
            id={`ik-tab-${t}`}
            className={`ik-tab ${tab === t ? 'ik-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'judgment' ? '📄 Judgment' : t === 'citations' ? '📎 Cases Cited' : '🔗 Cited By'}
            {t === 'citations' && citationsData?.found != null && (
              <span className="ik-tab__badge">{citationsData.found}</span>
            )}
            {t === 'citedby' && citedByData?.found != null && (
              <span className="ik-tab__badge">{citedByData.found}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'judgment' && (
        <div className="ik-judgment">
          {loadingDetail ? (
            <div className="ik-panel__loading"><Loader2 size={20} className="animate-spin" /> Loading judgment…</div>
          ) : docDetail.doc_text ? (
            <pre className="ik-judgment__text">{docDetail.doc_text}</pre>
          ) : (
            <div className="ik-panel__empty">Judgment text not available.</div>
          )}
        </div>
      )}
      {tab === 'citations' && (
        <div className="ik-cite-list">
          {renderDocList(citationsData, loadingCitations, 'citations')}
        </div>
      )}
      {tab === 'citedby' && (
        <div className="ik-cite-list">
          {renderDocList(citedByData, loadingCitedBy, 'cited-by cases')}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CaseLawPage() {
  // Search state
  const [query, setQuery]       = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [sortBy, setSortBy]     = useState('');
  const [results, setResults]   = useState(null); // null = not searched yet
  const [found, setFound]       = useState(0);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError]     = useState('');

  // Detail panel state
  const [selectedDoc, setSelectedDoc]         = useState(null);
  const [docDetail, setDocDetail]             = useState(null);
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [tab, setTab]                         = useState('judgment');
  const [citationsData, setCitationsData]     = useState(null);
  const [citedByData, setCitedByData]         = useState(null);
  const [loadingCitations, setLoadingCitations] = useState(false);
  const [loadingCitedBy, setLoadingCitedBy]   = useState(false);

  // ── Search ─────────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoadingSearch(true);
    setSearchError('');
    setResults(null);
    setSelectedDoc(null);
    setDocDetail(null);

    // Convert HTML date inputs (YYYY-MM-DD) → IK format (DD-MM-YYYY)
    const toIKDate = (d) => {
      if (!d) return '';
      const [y, m, day] = d.split('-');
      return `${day}-${m}-${y}`;
    };

    const params = {
      q:        query.trim(),
      fromdate: toIKDate(fromDate),
      todate:   toIKDate(toDate),
      sortby:   sortBy,
    };

    try {
      const res = await ikAPI.search(params);
      const data = res.data?.data || res.data;
      setResults(data?.docs || []);
      setFound(data?.found || 0);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Search failed. Please try again.';
      setSearchError(msg);
    } finally {
      setLoadingSearch(false);
    }
  }, [query, fromDate, toDate, sortBy]);

  // ── Open document ──────────────────────────────────────────────────────────

  const handleDocSelect = useCallback(async (doc) => {
    setSelectedDoc(doc);
    setTab('judgment');
    setDocDetail(null);
    setCitationsData(null);
    setCitedByData(null);
    setLoadingDetail(true);
    setLoadingCitations(true);
    setLoadingCitedBy(true);

    // Load all three in parallel
    const [docRes, citeRes, citedByRes] = await Promise.allSettled([
      ikAPI.getDoc(doc.tid, { maxcites: 5, maxcitedby: 5 }),
      ikAPI.citations(doc.tid),
      ikAPI.citedBy(doc.tid),
    ]);

    if (docRes.status === 'fulfilled') setDocDetail(docRes.value?.data?.data || null);
    setLoadingDetail(false);

    if (citeRes.status === 'fulfilled') setCitationsData(citeRes.value?.data?.data || null);
    setLoadingCitations(false);

    if (citedByRes.status === 'fulfilled') setCitedByData(citedByRes.value?.data?.data || null);
    setLoadingCitedBy(false);
  }, []);

  const handleBack = () => {
    setSelectedDoc(null);
    setDocDetail(null);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="ik-page">
      {/* Header */}
      <div className="ik-page__header">
        <div className="ik-page__header-icon">
          <Scale size={22} />
        </div>
        <div>
          <h1 className="ik-page__title">Indian Kanoon Case Law</h1>
          <p className="ik-page__subtitle">Search millions of court judgments, statutes, and legal documents</p>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar
        query={query}
        onQueryChange={setQuery}
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        loading={loadingSearch}
        onSearch={handleSearch}
      />

      {/* Error */}
      {searchError && (
        <div className="ik-error" id="ik-search-error">
          <AlertCircle size={16} />
          <span>{searchError}</span>
        </div>
      )}

      {/* Main content area */}
      {!selectedDoc ? (
        // Results list
        <div className="ik-results">
          {results === null && !loadingSearch && (
            <div className="ik-empty-state">
              <Scale size={48} className="ik-empty-state__icon" />
              <h3>Search Indian Kanoon</h3>
              <p>Enter keywords above to search Supreme Court, High Court, and Tribunal judgments.</p>
              <div className="ik-suggestions">
                <span>Try:</span>
                {['IPC section 498A', 'property dispute High Court', 'bail application murder', 'RTI appeal CIC'].map((s) => (
                  <button key={s} className="ik-suggestion-chip" onClick={() => { setQuery(s); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results !== null && results.length === 0 && !loadingSearch && (
            <div className="ik-empty-state">
              <Search size={40} className="ik-empty-state__icon" />
              <h3>No results found</h3>
              <p>Try different keywords or adjust the date range.</p>
            </div>
          )}

          {results !== null && results.length > 0 && (
            <>
              <div className="ik-results__header">
                <span className="ik-results__count">
                  Found <strong>{found.toLocaleString()}</strong> results
                </span>
              </div>
              <div className="ik-results__list">
                {results.map((doc) => (
                  <ResultCard key={doc.tid} doc={doc} onClick={handleDocSelect} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        // Case detail view
        <div className="ik-detail-view">
          <div className="ik-detail-view__toolbar">
            <button id="ik-back-btn" className="ik-back-btn" onClick={handleBack}>
              <ArrowLeft size={16} /> Back to Results
            </button>
            <a
              href={`https://indiankanoon.org/doc/${selectedDoc.tid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ik-external-link"
              id="ik-open-ik-link"
            >
              <ExternalLink size={14} /> Open on Indian Kanoon
            </a>
          </div>

          {/* Case header */}
          <div className="ik-detail-header">
            <h2 className="ik-detail-header__title">{selectedDoc.title}</h2>
            <div className="ik-detail-header__meta">
              {selectedDoc.docsource && <span className="ik-badge ik-badge--lg">{selectedDoc.docsource}</span>}
              {selectedDoc.publishdate && <span>📅 {formatDate(selectedDoc.publishdate)}</span>}
              {selectedDoc.numcitedby != null && <span>🔗 Cited by {selectedDoc.numcitedby} cases</span>}
            </div>
          </div>

          {/* Tabs + content */}
          <CaseTabPanel
            tab={tab}
            setTab={setTab}
            docDetail={docDetail}
            loadingDetail={loadingDetail}
            citationsData={citationsData}
            citedByData={citedByData}
            loadingCitations={loadingCitations}
            loadingCitedBy={loadingCitedBy}
            onDocSelect={handleDocSelect}
          />
        </div>
      )}
    </div>
  );
}
