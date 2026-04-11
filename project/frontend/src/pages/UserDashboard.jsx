import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import EmailModal from '../components/EmailModal';

const CHIPS = ['Property Issue','Consumer Rights','FIR / Police','Family Law','Cyber Crime'];

const RECENT_QUERIES = [
  { query: "My landlord won't return security deposit", time: "Today" },
  { query: "How to file a consumer complaint online", time: "Yesterday" },
  { query: "What is Section 498A IPC?", time: "2 days ago" },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailAdviceData] = useState({
    constitution_reference: 'Latest AI legal advice',
    applicable_law: 'Indian Law',
    steps_to_take: ['Please ask a legal question first to get advice'],
    documents_required: [],
    where_to_file: 'N/A',
    possible_outcomes: [],
    disclaimer: 'This is for informational purposes only. Consult a licensed advocate.'
  });

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'RJ';
  const firstName = user?.full_name?.split(' ')[0] || 'Rahul';

  const handleAsk = () => {
    if (!query.trim()) return;
    // In a real app we might pass the query via context or state manager to ChatPage
    navigate('/dashboard/chat', { state: { prefilledQuery: query } });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <h2>Welcome back, {firstName}</h2>
          <div className="topbar-right">
            <svg width="22" height="22" fill="none" stroke="#64748B" strokeWidth="2" viewBox="0 0 24 24" style={{ cursor:'pointer' }}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <div className="avatar avatar-md" style={{ background: '#1D4ED8', color: '#fff', borderRadius: '50%', fontWeight: 600, fontSize: '15px' }}>{initials}</div>
          </div>
        </header>

        <div className="page-body" style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          
          {/* Query Box */}
          <div className="dashboard-query-box">
            <div style={{ fontSize: '14px', color: '#64748B', marginBottom: '16px' }}>Describe your legal issue</div>
            <textarea
              className="form-control" rows={3}
              placeholder="e.g. My landlord is not returning my security deposit..."
              value={query} onChange={e => setQuery(e.target.value)}
              style={{ resize:'none', marginBottom:16, border: '1px solid #E2E8F0', padding: '16px', borderRadius: '8px', fontSize: '16px', color: '#1E293B', outline: 'none', background: '#fff' }}
            />
            <div style={{ display:'flex', gap: '8px', flexWrap:'wrap', marginBottom: '24px' }}>
              {CHIPS.map(c => (
                <span key={c} className="chip" style={{ border: '1px solid #E2E8F0', background: '#fff', padding: '8px 16px', borderRadius: '50px', cursor: 'pointer', color: '#64748B', fontSize: '14px' }} onClick={() => setQuery(c)}>
                  {c}
                </span>
              ))}
            </div>
            <button className="btn btn-full" onClick={handleAsk} disabled={!query.trim()}
              style={{ background: query.trim() ? '#1D4ED8' : '#FAFAFA', color: query.trim() ? '#fff' : '#E2E8F0', border: '1.5px solid', borderColor: query.trim() ? '#1D4ED8' : '#F1F5F9', padding: '14px', fontSize: '16px', fontWeight: 600, transition: 'all 0.2s', borderRadius: '10px' }}>
              Ask AI Legal Advisor
            </button>
          </div>

          {/* Action Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <Link to="/dashboard/documents" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '24px', cursor: 'pointer', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ background: '#EFF6FF', color: '#1D4ED8', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Generate Document</h3>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>Legal notice, affidavit</p>
              </div>
            </Link>

            <Link to="/dashboard/constitution" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '24px', cursor: 'pointer', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ background: '#F0FDF4', color: '#16A34A', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Know Your Rights</h3>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>Constitution articles</p>
              </div>
            </Link>

            <Link to="/dashboard/constitution" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '24px', cursor: 'pointer', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ background: '#F5F3FF', color: '#7C3AED', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Constitution Search</h3>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>IPC + legal acts</p>
              </div>
            </Link>

            <div className="card" onClick={() => setEmailModalOpen(true)} style={{ padding: '24px', cursor: 'pointer', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#fff', display: 'flex', flexDirection: 'column', height: '100%', transition: 'box-shadow 0.2s', boxShadow: '0 0 0 0 transparent' }} onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'} onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
              <div style={{ background: '#FFFBEB', color: '#D97706', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Email My Advice</h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>Send to your inbox</p>
            </div>
          </div>

          {/* Recent Queries */}
          <div className="card" style={{ border: '1px solid #E2E8F0', borderRadius: '12px', background: '#fff', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 20px 0' }}>Recent queries</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {RECENT_QUERIES.map((q, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i !== RECENT_QUERIES.length - 1 ? '16px' : 0, borderBottom: i !== RECENT_QUERIES.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ fontSize: '15px', color: '#334155' }}>{q.query}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>{q.time}</span>
                    <span style={{ fontSize: '14px', color: '#3B82F6', cursor: 'pointer', fontWeight: 500 }}>View</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        adviceData={emailAdviceData}
        emailType="advice"
      />
    </div>
  );
}
