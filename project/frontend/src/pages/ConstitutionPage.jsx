import { useState } from 'react';
import Sidebar from '../components/Sidebar';

const CONSTITUTION_DATA = [
  { num:'Article 14', title:'Right to Equality', desc:'The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.', tags:['Fundamental Rights','Part III'], full:'Article 14 guarantees equality before law and equal protection of laws to all persons. It prohibits class legislation but permits reasonable classification. The State cannot discriminate between equals.' },
  { num:'Article 19', title:'Right to Freedom', desc:'All citizens shall have the right to freedom of speech and expression, to assemble peaceably, to form associations, to move freely…', tags:['Fundamental Rights','Part III'], full:'Article 19 guarantees six freedoms to citizens: speech & expression, peaceful assembly, association, movement, residence, and profession. These rights can be reasonably restricted by the State.' },
  { num:'Article 21', title:'Right to Life and Personal Liberty', desc:'No person shall be deprived of his life or personal liberty except according to procedure established by law.', tags:['Fundamental Rights','Part III'], full:'Article 21 is the most expansive fundamental right. It includes right to live with dignity, right to livelihood, right to privacy, right to health, right to education (via Article 21A), and protection against arbitrary state action.' },
  { num:'Article 32', title:'Right to Constitutional Remedies', desc:'The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part.', tags:['Fundamental Rights','Part III'], full:'Article 32 is the "heart and soul" of the Constitution (Dr. B.R. Ambedkar). It gives citizens the right to approach the Supreme Court directly for enforcement of fundamental rights via writs.' },
  { num:'IPC 420', title:'Cheating and Dishonestly Inducing', desc:'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property shall be punished.', tags:['IPC Sections','Criminal Law'], full:'IPC Section 420 deals with cheating. Punishment: imprisonment up to 7 years and fine. It requires deceit, dishonest inducement, and delivery of property or alteration of documents.' },
];

const FILTERS = ['All','Fundamental Rights','IPC Sections','Consumer Law','IT Act','Family Law'];

export default function ConstitutionPage() {
  const [query, setQuery]     = useState('');
  const [filter, setFilter]   = useState('All');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!query.trim() && filter === 'All') { setResults([]); setSearched(false); return; }
    const q = query.toLowerCase();
    const res = CONSTITUTION_DATA.filter(d => {
      const matchFilter = filter === 'All' || d.tags.includes(filter);
      const matchQuery  = !q || d.num.toLowerCase().includes(q) || d.title.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
    setResults(res);
    setSearched(true);
    setSelected(res[0] || null);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <h3>Indian Constitution & Law Search</h3>
        </header>

        <div className="page-body">
          <p className="text-muted mb-16">Search articles, IPC sections, and legal acts instantly</p>

          {/* Search Bar */}
          <div className="search-bar-wrap">
            <input className="form-control" placeholder="Search by article number, keyword, or IPC section..." value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} style={{ borderRadius:'8px 0 0 8px', borderRight:'none' }} />
            <button className="btn btn-primary" onClick={handleSearch}>🔍 Search</button>
          </div>
          <div className="filter-pills mt-12">
            {FILTERS.map(f => (
              <span key={f} className={`chip${filter===f?' active':''}`} onClick={()=>{setFilter(f);}}>{f}</span>
            ))}
          </div>

          {!searched ? (
            <div style={{ textAlign:'center', marginTop:80, color:'var(--muted)' }}>
              <div style={{ fontSize:64, marginBottom:16 }}>📚</div>
              <h3 style={{ marginBottom:8 }}>Search the Indian Constitution, IPC sections, and legal acts</h3>
              <p style={{ marginBottom:24 }}>Enter a keyword, article number, or topic above to find relevant laws.</p>
              <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                {['Article 21','IPC 420','Consumer Rights'].map(s => (
                  <span key={s} className="chip" onClick={()=>{setQuery(s);setFilter('All');}}>🔍 {s}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="search-layout">
              {/* Results */}
              <div>
                <p className="text-sm mb-16">{results.length} result{results.length !== 1 ? 's' : ''} found{query ? ` for "${query}"` : ''}</p>
                {results.length === 0 ? (
                  <div className="card" style={{ textAlign:'center', color:'var(--muted)', padding:40 }}>
                    No results found. Try a different search.
                  </div>
                ) : results.map((r, i) => (
                  <div key={i} className="result-card" onClick={() => setSelected(r)}
                    style={{ background: selected?.num === r.num ? 'var(--light-blue)' : '#fff', borderColor: selected?.num === r.num ? 'var(--primary)' : 'var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                      <span className="badge badge-verified" style={{ flexShrink:0 }}>{r.num}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{r.title}</div>
                        <p className="text-sm" style={{ marginBottom:10 }}>{r.desc.slice(0,120)}…</p>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {r.tags.map(t => <span key={t} className="chip" style={{ fontSize:11, padding:'2px 8px' }}>{t}</span>)}
                        </div>
                      </div>
                      <span className="text-primary" style={{ fontSize:12, flexShrink:0 }}>View →</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail Panel */}
              {selected && (
                <div className="card" style={{ position:'sticky', top:24, height:'fit-content' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <span className="badge badge-verified">{selected.num}</span>
                    <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
                      <button className="btn btn-ghost btn-sm">🔗</button>
                      <button className="btn btn-ghost btn-sm">🔖</button>
                    </div>
                  </div>
                  <h3 className="mb-12">{selected.title}</h3>
                  <p style={{ fontSize:14, lineHeight:1.8, marginBottom:16, color:'var(--body-text)' }}>{selected.full}</p>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
                    {selected.tags.map(t => <span key={t} className="chip" style={{ fontSize:11 }}>{t}</span>)}
                  </div>
                  <button className="btn btn-primary btn-full">Use in AI Advice</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
