import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar, Toast, useToast } from '../components/index';
import { adviceAPI } from '../services/api';

interface HistoryItem {
  id: number;
  query: string;
  ai_response: any;           // field name from serializer
  constitution_reference: string | null;
  created_at: string;
}

export default function ChatHistory() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast, showToast, clearToast } = useToast();

  const [history, setHistory]     = useState<HistoryItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch]       = useState('');

  const sidebar = [
    { label: 'Dashboard',    path: '/dashboard',    icon: '🏠' },
    { label: 'AI Chat',      path: '/chat',         icon: '💬' },
    { label: 'Chat History', path: '/chat-history', icon: '🕘' },
    { label: 'Documents',    path: '/documents',    icon: '📄' },
    { label: 'Settings',     path: '/settings',     icon: '⚙️' },
  ];

  const fetchHistory = (p: number) => {
    setLoading(true);
    setExpanded(null);
    adviceAPI.history(p)
      .then(r => {
        // Backend: { success, data: { results, total, page, pages } }
        const data = r.data?.data;
        setHistory(data?.results || []);
        setTotal(data?.total || 0);
        setTotalPages(data?.pages || 1);
      })
      .catch(() => showToast('Failed to load history', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHistory(page); }, [page]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await adviceAPI.delete(id);
      showToast('Conversation deleted', 'success');
      setHistory(prev => prev.filter(h => h.id !== id));
      setTotal(prev => prev - 1);
      if (expanded === id) setExpanded(null);
    } catch {
      showToast('Failed to delete', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleReAsk = (query: string) => {
    navigate('/chat', { state: { prefill: query } });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
  };

  /* Pull the readable text out of ai_response regardless of its shape */
  const getResponseText = (ai_response: any): string => {
    if (!ai_response) return 'No response recorded.';
    if (typeof ai_response === 'string') return ai_response;
    // Gemini returns a structured object; try common keys
    return (
      ai_response.summary ||
      ai_response.advice ||
      ai_response.answer ||
      ai_response.text ||
      JSON.stringify(ai_response, null, 2)
    );
  };

  const filtered = search.trim()
    ? history.filter(h => h.query.toLowerCase().includes(search.toLowerCase()))
    : history;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#090f1f' }}>
      <Sidebar
        items={sidebar}
        userName={user?.full_name || 'User'}
        userRole={user?.role || 'user'}
        onLogout={logout}
        currentPath={location.pathname}
      />

      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Chat History</h1>
            <p style={{ color: 'rgba(148,163,184,.7)', fontSize: 13, marginTop: 4 }}>
              {total > 0 ? `${total} conversation${total !== 1 ? 's' : ''} total` : 'Your past legal consultations'}
            </p>
          </div>
          {/* Search */}
          <div style={{ position: 'relative', width: 260 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'rgba(148,163,184,.5)' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations…"
              style={{
                width: '100%', padding: '9px 12px 9px 34px',
                background: 'rgba(255,255,255,.05)', border: '1px solid rgba(79,110,247,.2)',
                borderRadius: 12, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(79,110,247,.08)',
                borderRadius: 16, padding: 20,
              }}>
                <div style={{ height: 14, width: '60%', background: 'rgba(255,255,255,.08)', borderRadius: 8, marginBottom: 10 }} />
                <div style={{ height: 12, width: '35%', background: 'rgba(255,255,255,.05)', borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(79,110,247,.2)', borderRadius: 20,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{search ? '🔍' : '🕘'}</div>
            <p style={{ color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>
              {search ? `No conversations match "${search}"` : 'No chat history yet'}
            </p>
            <p style={{ color: 'rgba(148,163,184,.5)', fontSize: 13, marginTop: 6 }}>
              {search ? 'Try a different search term' : 'Start a conversation to see it here'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/chat')}
                style={{
                  marginTop: 20, padding: '10px 24px',
                  background: 'linear-gradient(135deg,#4f6ef7,#7c3aed)',
                  border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Start Chatting →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(item => {
              const isOpen = expanded === item.id;
              const responseText = getResponseText(item.ai_response);
              return (
                <div key={item.id} style={{
                  background: isOpen ? 'rgba(79,110,247,.08)' : 'rgba(255,255,255,.04)',
                  border: `1px solid ${isOpen ? 'rgba(79,110,247,.35)' : 'rgba(79,110,247,.1)'}`,
                  borderRadius: 16, overflow: 'hidden', transition: 'all .2s ease',
                  boxShadow: isOpen ? '0 4px 24px rgba(79,110,247,.12)' : 'none',
                }}>
                  {/* Row header */}
                  <div
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: isOpen ? 'linear-gradient(135deg,#4f6ef7,#7c3aed)' : 'rgba(79,110,247,.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, transition: 'background .2s',
                    }}>⚖️</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        color: isOpen ? '#e2e8f0' : '#cbd5e1', fontWeight: 500, fontSize: 14,
                        margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.query}
                      </p>
                      <p style={{ color: 'rgba(148,163,184,.55)', fontSize: 12, margin: '3px 0 0' }}>
                        {formatDate(item.created_at)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={e => { e.stopPropagation(); handleReAsk(item.query); }}
                        title="Ask again in AI Chat"
                        style={{
                          padding: '5px 10px', background: 'rgba(79,110,247,.15)',
                          border: '1px solid rgba(79,110,247,.3)', borderRadius: 8,
                          color: '#818cf8', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        }}
                      >
                        ↩ Re-ask
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                        disabled={deletingId === item.id}
                        title="Delete conversation"
                        style={{
                          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
                          borderRadius: 8, color: '#f87171', fontSize: 14, cursor: 'pointer',
                          opacity: deletingId === item.id ? 0.5 : 1,
                        }}
                      >
                        {deletingId === item.id ? '…' : '🗑️'}
                      </button>
                      <span style={{
                        color: isOpen ? '#818cf8' : 'rgba(148,163,184,.4)', fontSize: 12,
                        display: 'inline-block', transition: 'transform .2s',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                      }}>▼</span>
                    </div>
                  </div>

                  {/* Expanded response */}
                  {isOpen && (
                    <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(79,110,247,.15)' }}>
                      {item.constitution_reference && (
                        <div style={{
                          marginTop: 14, padding: '8px 12px',
                          background: 'rgba(79,110,247,.08)', border: '1px solid rgba(79,110,247,.2)',
                          borderRadius: 8, color: '#818cf8', fontSize: 12,
                        }}>
                          📜 <strong>Constitution Reference:</strong> {item.constitution_reference}
                        </div>
                      )}
                      <p style={{ color: 'rgba(148,163,184,.6)', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', margin: '14px 0 8px' }}>
                        AI Response
                      </p>
                      <div style={{
                        background: 'rgba(0,0,0,.25)', borderRadius: 12, padding: '14px 16px',
                        color: '#cbd5e1', fontSize: 13.5, lineHeight: 1.75, whiteSpace: 'pre-wrap',
                        border: '1px solid rgba(255,255,255,.06)', maxHeight: 340, overflowY: 'auto',
                      }}>
                        {responseText}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && !search && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 28 }}>
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={!hasPrev}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: hasPrev ? 'rgba(79,110,247,.15)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${hasPrev ? 'rgba(79,110,247,.3)' : 'rgba(255,255,255,.08)'}`,
                color: hasPrev ? '#818cf8' : 'rgba(148,163,184,.3)', cursor: hasPrev ? 'pointer' : 'not-allowed',
              }}
            >← Previous</button>
            <span style={{ color: 'rgba(148,163,184,.5)', fontSize: 13 }}>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNext}
              style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: hasNext ? 'rgba(79,110,247,.15)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${hasNext ? 'rgba(79,110,247,.3)' : 'rgba(255,255,255,.08)'}`,
                color: hasNext ? '#818cf8' : 'rgba(148,163,184,.3)', cursor: hasNext ? 'pointer' : 'not-allowed',
              }}
            >Next →</button>
          </div>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
    </div>
  );
}
