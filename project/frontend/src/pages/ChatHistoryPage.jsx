import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import EmailModal from '../components/EmailModal';
import { useAuth } from '../context/AuthContext';
import { adviceAPI } from '../api';

export default function ChatHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [currentAdviceData, setCurrentAdviceData] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      // Assuming adviceAPI.history accepts params like { page } if implemented,
      // or we can just fetch without page if the backend is hardcoded to 1.
      // Let's pass params just in case, though current api.js doesn't take params.
      // Since it's a simple list, we'll fetch what we can.
      const res = await adviceAPI.history();
      if (res.data.success) {
        setHistory(res.data.data.results);
        setTotalPages(res.data.data.pages);
      } else {
        setError(res.data.message || 'Failed to load history.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this advice?')) return;
    try {
      await adviceAPI.delete(id);
      // Remove from state
      setHistory(prev => prev.filter(item => item.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete advice.');
    }
  };

  const handleDownloadPdf = async (advice) => {
    try {
      const res = await adviceAPI.pdf(advice.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Legal_Advice_${advice.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate PDF.');
    }
  };

  const handleEmail = (advice) => {
    setCurrentAdviceData(advice);
    setIsEmailModalOpen(true);
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Chat History</h1>
            <p className="subtitle">Review your past legal consultations</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/dashboard/chat')}>
            New Chat
          </button>
        </header>

        <div className="content-wrapper" style={{ padding: '24px' }}>
          {error && <div style={{ color: '#EF4444', marginBottom: 16 }}>{error}</div>}
          
          {loading && history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 16, opacity: 0.5 }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <h3>No History Found</h3>
              <p>You haven't asked any legal questions yet.</p>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard/chat')} style={{ marginTop: 16 }}>
                Ask a Question
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.map(item => (
                <div key={item.id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  {/* Card Header (Clickable to expand) */}
                  <div 
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    style={{ 
                      padding: '20px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: expandedId === item.id ? 'rgba(255,255,255,0.02)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--text)' }}>
                        {item.query.length > 80 ? item.query.substring(0, 80) + '...' : item.query}
                      </h3>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>📅 {new Date(item.created_at).toLocaleDateString()}</span>
                        {item.constitution_reference && (
                          <span style={{ color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: '12px' }}>
                            {item.constitution_reference}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        className="btn btn-ghost" 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        title="Delete"
                        style={{ color: '#EF4444', padding: '8px' }}
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: expandedId === item.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {/* Card Body (Expanded) */}
                  {expandedId === item.id && (
                    <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                          <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Full Query</h4>
                          <p style={{ margin: 0, lineHeight: 1.5 }}>{item.query}</p>
                        </div>

                        {item.ai_response && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {item.ai_response.applicable_law && (
                              <div>
                                <h4 style={{ color: 'var(--primary)', marginBottom: 8 }}>Applicable Law</h4>
                                <p style={{ margin: 0 }}>{item.ai_response.applicable_law}</p>
                              </div>
                            )}

                            {item.ai_response.steps_to_take && item.ai_response.steps_to_take.length > 0 && (
                              <div>
                                <h4 style={{ color: 'var(--primary)', marginBottom: 8 }}>Steps to Take</h4>
                                <ol style={{ margin: 0, paddingLeft: 20 }}>
                                  {item.ai_response.steps_to_take.map((step, i) => <li key={i} style={{ marginBottom: 4 }}>{step}</li>)}
                                </ol>
                              </div>
                            )}

                            {item.ai_response.documents_required && item.ai_response.documents_required.length > 0 && (
                              <div>
                                <h4 style={{ color: 'var(--primary)', marginBottom: 8 }}>Documents Required</h4>
                                <ul style={{ margin: 0, paddingLeft: 20 }}>
                                  {item.ai_response.documents_required.map((doc, i) => <li key={i}>{doc}</li>)}
                                </ul>
                              </div>
                            )}

                            {item.ai_response.where_to_file && (
                              <div>
                                <h4 style={{ color: 'var(--primary)', marginBottom: 8 }}>Where to File</h4>
                                <p style={{ margin: 0 }}>{item.ai_response.where_to_file}</p>
                              </div>
                            )}

                            {item.ai_response.possible_outcomes && item.ai_response.possible_outcomes.length > 0 && (
                              <div>
                                <h4 style={{ color: 'var(--primary)', marginBottom: 8 }}>Possible Outcomes</h4>
                                <ul style={{ margin: 0, paddingLeft: 20 }}>
                                  {item.ai_response.possible_outcomes.map((out, i) => <li key={i}>{out}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                          <button className="btn btn-outline" onClick={() => handleDownloadPdf(item)}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                            Download PDF
                          </button>
                          <button className="btn btn-outline" onClick={() => handleEmail(item)}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            Email Advice
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <EmailModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        adviceData={currentAdviceData} 
      />
    </div>
  );
}
