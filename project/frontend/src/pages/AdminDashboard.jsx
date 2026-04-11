import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const STATS = [
  { value: '1,248', label: 'Total Users', color: '#1D4ED8' },
  { value: '86', label: 'Advocates', color: '#7C3AED' },
  { value: '12', label: 'Pending Approvals', color: '#D97706' },
  { value: '342', label: 'AI Queries Today', color: '#16A34A' },
];

const GROWTH_DATA = [
  { month: 'Oct', height: 40, opacity: 0.3 },
  { month: 'Nov', height: 60, opacity: 0.5 },
  { month: 'Dec', height: 50, opacity: 0.6 },
  { month: 'Jan', height: 80, opacity: 0.75 },
  { month: 'Feb', height: 95, opacity: 0.9 },
  { month: 'Mar', height: 110, opacity: 1 },
];

const CASES_TYPE = [
  { type: 'Property', pct: '35%', color: '#1D4ED8' },
  { type: 'Family', pct: '28%', color: '#7C3AED' },
  { type: 'Consumer', pct: '18%', color: '#0CA5A5' },
  { type: 'Cyber', pct: '12%', color: '#DC2626' },
  { type: 'Criminal', pct: '7%', color: '#ea580c' },
];

const USERS = [
  { name: 'Rahul Jha', email: 'rahul@email.com', role: 'User', status: 'Active', action: 'Delete' },
  { name: 'Adv. Priya Sharma', email: 'priya@email.com', role: 'Advocate', status: 'Verified', action: 'Delete' },
  { name: 'Amit Gupta', email: 'amit@email.com', role: 'Advocate', status: 'Pending', action: 'ApproveReject' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const getRoleStyle = (role) => {
    return role === 'User' 
      ? { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' }
      : { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' };
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active': return { color: '#16A34A', bg: '#F0FDF4' };
      case 'Verified': return { color: '#16A34A', bg: '#F0FDF4' };
      case 'Pending': return { color: '#D97706', bg: '#FFFBEB' };
      default: return { color: '#64748B', bg: '#F1F5F9' };
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <h2>Admin Dashboard</h2>
          <div className="topbar-right">
            <span style={{ fontSize: '14px', color: '#64748B' }}>Last login: Today 9:42 AM</span>
          </div>
        </header>

        <div className="page-body" style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
          
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {STATS.map(s => (
              <div key={s.label} className="card" style={{ padding: '24px', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#fff' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '8px' }}>{s.value}</div>
                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            
            {/* User growth graph */}
            <div className="card" style={{ padding: '24px', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#fff' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 32px 0' }}>User growth — last 6 months</h3>
              
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '0 10px', marginBottom: '16px' }}>
                {GROWTH_DATA.map((bar, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%' }}>
                    <div style={{ width: '100%', height: `${bar.height}px`, background: '#1D4ED8', opacity: bar.opacity, borderRadius: '4px 4px 0 0' }}></div>
                    <span style={{ fontSize: '12px', color: '#94A3B8', marginTop: '12px' }}>{bar.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cases by type horizontal bars */}
            <div className="card" style={{ padding: '24px', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#fff' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 24px 0' }}>Cases by type</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {CASES_TYPE.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1, height: '10px', background: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: c.pct, background: c.color, borderRadius: '5px' }}></div>
                    </div>
                    <div style={{ width: '120px', fontSize: '13px', color: '#64748B', display: 'flex', justifyContent: 'flex-end' }}>
                      {c.type} ({c.pct})
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Users Table */}
          <div className="card" style={{ padding: '24px', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#fff' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: '0 0 20px 0' }}>All users</h3>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {['All', 'Users', 'Advocates', 'Admin'].map((tab, i) => (
                <button key={tab} style={{ 
                  background: i === 0 ? '#EFF6FF' : '#fff', 
                  color: i === 0 ? '#1D4ED8' : '#64748B', 
                  border: i === 0 ? '1px solid #BFDBFE' : '1px solid #E2E8F0', 
                  padding: '6px 16px', borderRadius: '20px', fontSize: '14px', cursor: 'pointer' 
                }}>
                  {tab}
                </button>
              ))}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '1px' }}>NAME</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '1px' }}>EMAIL</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '1px' }}>ROLE</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '1px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748B', letterSpacing: '1px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {USERS.map((u, i) => {
                  const roleStyle = getRoleStyle(u.role);
                  const statusStyle = getStatusStyle(u.status);
                  
                  return (
                    <tr key={i} style={{ borderBottom: i !== USERS.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#334155' }}>{u.name}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748B' }}>{u.email}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: roleStyle.bg, color: roleStyle.color }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: statusStyle.bg, color: statusStyle.color }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        {u.action === 'Delete' ? (
                          <span style={{ color: '#DC2626', cursor: 'pointer' }}>Delete</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#16A34A', cursor: 'pointer' }}>Approve</span>
                            <span style={{ color: '#DC2626', cursor: 'pointer' }}>Reject</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
