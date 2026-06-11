import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar, Toast, useToast, Modal } from '../components/index';
import { documentAPI, emailAPI } from '../services/api';

type DocType = 'legal_notice' | 'affidavit' | 'complaint_letter' | 'rent_agreement';

const DOC_TYPES = [
  {
    id: 'legal_notice',
    label: 'Legal Notice',
    icon: '📜',
    desc: 'Send formal notice to individuals or entities',
    color: '#4f6ef7',
    gradient: 'linear-gradient(135deg,#4f6ef750,#7c3aed30)',
    glow: 'rgba(79,110,247,0.45)',
  },
  {
    id: 'affidavit',
    label: 'Affidavit',
    icon: '✍️',
    desc: 'Sworn statement of facts for legal proceedings',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg,#06b6d450,#0891b230)',
    glow: 'rgba(6,182,212,0.45)',
  },
  {
    id: 'complaint_letter',
    label: 'Complaint Letter',
    icon: '📬',
    desc: 'File complaints with authorities',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg,#f59e0b50,#d9770630)',
    glow: 'rgba(245,158,11,0.45)',
  },
  {
    id: 'rent_agreement',
    label: 'Rent Agreement',
    icon: '🏠',
    desc: 'Legally binding tenancy document',
    color: '#10b981',
    gradient: 'linear-gradient(135deg,#10b98150,#05966930)',
    glow: 'rgba(16,185,129,0.45)',
  },
] as const;

const FIELDS: Record<DocType, { key: string; label: string; multiline?: boolean; date?: boolean; placeholder?: string }[]> = {
  legal_notice: [
    { key: 'recipient_name', label: 'Recipient Name', placeholder: 'Full name of the recipient' },
    { key: 'subject', label: 'Subject', placeholder: 'Subject of the legal notice' },
    { key: 'issue_description', label: 'Issue Description', multiline: true, placeholder: 'Describe the issue in detail…' },
    { key: 'amount', label: 'Amount / Demand (₹)', placeholder: 'e.g. 50000' },
    { key: 'deadline', label: 'Response Deadline (days)', placeholder: 'e.g. 15' },
    { key: 'sender_name', label: 'Sender Name', placeholder: 'Your full name' },
    { key: 'sender_address', label: 'Sender Address', placeholder: 'Your complete address' },
  ],
  affidavit: [
    { key: 'deponent_name', label: 'Deponent Name', placeholder: 'Full name of the deponent' },
    { key: 'deponent_address', label: 'Deponent Address', placeholder: 'Complete residential address' },
    { key: 'statement', label: 'Statement of Facts', multiline: true, placeholder: 'State all relevant facts clearly…' },
    { key: 'place', label: 'Place', placeholder: 'City / Location' },
  ],
  complaint_letter: [
    { key: 'authority', label: 'Authority / Recipient', placeholder: 'Name of the authority or office' },
    { key: 'subject', label: 'Subject', placeholder: 'Subject of the complaint' },
    { key: 'complaint_details', label: 'Complaint Details', multiline: true, placeholder: 'Detailed description of the complaint…' },
    { key: 'relief_sought', label: 'Relief Sought', placeholder: 'What outcome do you expect?' },
    { key: 'complainant_name', label: 'Complainant Name', placeholder: 'Your full name' },
    { key: 'complainant_address', label: 'Address', placeholder: 'Your complete address' },
  ],
  rent_agreement: [
    { key: 'landlord_name', label: 'Landlord Name', placeholder: 'Full name of the landlord' },
    { key: 'tenant_name', label: 'Tenant Name', placeholder: 'Full name of the tenant' },
    { key: 'property_address', label: 'Property Address', placeholder: 'Complete address of the property' },
    { key: 'rent_amount', label: 'Monthly Rent (₹)', placeholder: 'e.g. 12000' },
    { key: 'deposit_amount', label: 'Security Deposit (₹)', placeholder: 'e.g. 36000' },
    { key: 'lease_start', label: 'Lease Start Date', date: true },
    { key: 'lease_duration', label: 'Duration (months)', placeholder: 'e.g. 11' },
  ],
};

export default function DocumentGenerator() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { toast, showToast, clearToast } = useToast();
  const [docType, setDocType] = useState<DocType>('legal_notice');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [emailModal, setEmailModal] = useState(false);
  const [emailAddr, setEmailAddr] = useState('');
  const [attachAsPDF, setAttachAsPDF] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const sidebar = [
    { label: 'Dashboard', path: user?.role === 'advocate' ? '/advocate/dashboard' : '/dashboard', icon: '🏠' },
    { label: 'AI Chat', path: '/chat', icon: '💬' },
    { label: 'Documents', path: '/documents', icon: '📄' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const activeDoc = DOC_TYPES.find(t => t.id === docType)!;

  useEffect(() => {
    documentAPI.list().then(r => setSaved(r.data?.data || [])).catch(() => {}).finally(() => setSavedLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await documentAPI.generate(docType, formData);
      setGenerated(r.data?.data);
      setSaved(p => [r.data?.data, ...p]);
      setStep(3);
      showToast('Document generated & saved!', 'success');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const r = await documentAPI.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'legal-document.pdf'; a.click();
      window.URL.revokeObjectURL(url);
    } catch { showToast('Download failed', 'error'); }
  };

  const handleDelete = async (id: number) => {
    try {
      await documentAPI.delete(id);
      setSaved(p => p.filter(d => d.id !== id));
      if (generated?.id === id) setGenerated(null);
      showToast('Document deleted', 'success');
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleEmail = async () => {
    setEmailError('');
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddr)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setSending(true);
    try {
      await emailAPI.send({
        to_email: emailAddr,
        email_type: 'document',
        content: { document_text: generated?.generated_text },
        attach_pdf: attachAsPDF,
        document_id: generated?.id,
        attachment
      });
      setEmailModal(false);
      setEmailAddr('');
      setAttachment(null);
      showToast('Email sent successfully!', 'success');
    } catch {
      showToast('Email failed to send. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  const steps = [
    { num: 1, label: 'Select Type' },
    { num: 2, label: 'Fill Details' },
    { num: 3, label: 'Preview & Export' },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: '#060b18' }}>
      {/* Global ambient orbs */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 70% 50% at 15% 10%, rgba(79,110,247,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 85% 80%, rgba(124,58,237,0.10) 0%, transparent 60%),
          radial-gradient(ellipse 40% 35% at 60% 20%, rgba(6,182,212,0.06) 0%, transparent 55%)
        `
      }} />

      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      <Sidebar items={sidebar} userName={user?.full_name || ''} userRole={user?.role || ''} onLogout={logout} currentPath={location.pathname} />

      <main className="flex-1 overflow-y-auto" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Enhanced Header ── */}
        <div className="sticky top-0 z-20 px-8 py-4" style={{
          background: 'rgba(6,11,24,0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(79,110,247,0.13)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
        }}>
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span style={{
                  fontSize: 22,
                  filter: `drop-shadow(0 0 8px ${activeDoc.color})`,
                  transition: 'filter 0.4s ease',
                }}>⚖️</span>
                <h1 className="text-xl font-bold text-white tracking-tight">Document Generator</h1>
              </div>
              <p style={{ color: '#64748b', fontSize: 12 }}>
                AI-generated, legally formatted Indian documents in seconds
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1">
              {steps.map((s, i) => (
                <div key={s.num} className="flex items-center gap-1">
                  <div
                    onClick={() => setStep(s.num as 1 | 2 | 3)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                      borderRadius: 999, cursor: 'pointer', transition: 'all 0.3s ease',
                      fontSize: 11, fontWeight: 600,
                      background: step === s.num
                        ? `linear-gradient(135deg,${activeDoc.color}40,${activeDoc.color}20)`
                        : step > s.num ? 'rgba(16,185,129,0.15)' : 'rgba(15,29,58,0.6)',
                      border: step === s.num
                        ? `1.5px solid ${activeDoc.color}80`
                        : step > s.num ? '1.5px solid rgba(16,185,129,0.4)' : '1px solid rgba(79,110,247,0.15)',
                      color: step === s.num ? activeDoc.color : step > s.num ? '#10b981' : '#475569',
                    }}
                  >
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                      background: step === s.num ? activeDoc.color : step > s.num ? '#10b981' : 'rgba(71,85,105,0.4)',
                      color: '#fff',
                    }}>{step > s.num ? '✓' : s.num}</span>
                    {s.label}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{
                      width: 20, height: 1.5, borderRadius: 2,
                      background: step > s.num ? 'rgba(16,185,129,0.5)' : 'rgba(79,110,247,0.15)',
                      transition: 'all 0.4s',
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 max-w-6xl mx-auto space-y-8">

          {/* ── Document Type Cards ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div style={{ width: 3, height: 18, borderRadius: 2, background: activeDoc.color, transition: 'background 0.3s' }} />
              <p style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Step 1 — Choose Document Type
              </p>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {DOC_TYPES.map(t => {
                const active = docType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setDocType(t.id); setFormData({}); setGenerated(null); setStep(2); }}
                    style={{
                      position: 'relative', overflow: 'hidden', textAlign: 'left',
                      padding: '20px 18px', borderRadius: 20, cursor: 'pointer',
                      background: active ? t.gradient : 'rgba(15,29,58,0.55)',
                      border: active ? `2px solid ${t.color}60` : '1.5px solid rgba(79,110,247,0.12)',
                      boxShadow: active ? `0 0 32px ${t.glow}, 0 8px 24px rgba(0,0,0,0.3)` : '0 2px 12px rgba(0,0,0,0.2)',
                      transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: active ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.01)';
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${t.glow}60, 0 8px 24px rgba(0,0,0,0.25)`;
                        (e.currentTarget as HTMLElement).style.borderColor = `${t.color}40`;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(79,110,247,0.12)';
                      }
                    }}
                  >
                    {/* Glow blob */}
                    {active && (
                      <div style={{
                        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                        borderRadius: '50%', background: t.color, opacity: 0.12,
                        filter: 'blur(20px)', pointerEvents: 'none',
                      }} />
                    )}

                    {/* Check badge */}
                    {active && (
                      <div style={{
                        position: 'absolute', top: 10, right: 10, width: 20, height: 20,
                        borderRadius: '50%', background: t.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: '#fff', fontWeight: 700,
                        boxShadow: `0 0 10px ${t.glow}`,
                      }}>✓</div>
                    )}

                    <div style={{
                      fontSize: 28, marginBottom: 10,
                      filter: active ? `drop-shadow(0 0 8px ${t.color})` : 'none',
                      transition: 'filter 0.3s',
                    }}>{t.icon}</div>
                    <p style={{
                      fontSize: 13, fontWeight: 700, marginBottom: 4,
                      color: active ? t.color : '#e2e8f0',
                      transition: 'color 0.3s',
                    }}>{t.label}</p>
                    <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Main two-col layout ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* ── Form Panel ── */}
            <div style={{
              background: 'rgba(15,29,58,0.6)',
              border: `1.5px solid ${activeDoc.color}25`,
              borderRadius: 24,
              padding: 28,
              backdropFilter: 'blur(20px)',
              boxShadow: `0 0 40px ${activeDoc.glow}15, 0 12px 40px rgba(0,0,0,0.25)`,
              transition: 'border-color 0.4s, box-shadow 0.4s',
            }}>
              {/* Panel header */}
              <div className="flex items-center gap-3 mb-6">
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${activeDoc.color}20`,
                  border: `1.5px solid ${activeDoc.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>{activeDoc.icon}</div>
                <div>
                  <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>
                    {activeDoc.label} Details
                  </p>
                  <p style={{ color: '#475569', fontSize: 11 }}>Step 2 — Fill in the required information</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {FIELDS[docType].map((f, idx) => (
                  <div key={f.key} style={{ animation: `docFadeIn 0.3s ease ${idx * 0.04}s both` }}>
                    <label style={{
                      display: 'block', fontSize: 11, fontWeight: 600,
                      marginBottom: 6, color: '#94a3b8', letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                    }}>{f.label}</label>
                    {f.multiline ? (
                      <textarea
                        value={formData[f.key] || ''}
                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        rows={3}
                        style={{
                          width: '100%', resize: 'none', borderRadius: 12,
                          padding: '10px 14px', fontSize: 13, fontFamily: 'inherit',
                          background: 'rgba(6,11,24,0.7)',
                          border: `1.5px solid ${formData[f.key] ? activeDoc.color + '50' : 'rgba(79,110,247,0.18)'}`,
                          color: '#f1f5f9', outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                          boxShadow: formData[f.key] ? `0 0 0 3px ${activeDoc.color}15` : 'none',
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = `${activeDoc.color}70`;
                          e.target.style.boxShadow = `0 0 0 3px ${activeDoc.color}18`;
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = formData[f.key] ? `${activeDoc.color}50` : 'rgba(79,110,247,0.18)';
                          e.target.style.boxShadow = formData[f.key] ? `0 0 0 3px ${activeDoc.color}12` : 'none';
                        }}
                      />
                    ) : (
                      <input
                        type={f.date ? 'date' : 'text'}
                        value={formData[f.key] || ''}
                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        style={{
                          width: '100%', borderRadius: 12,
                          padding: '10px 14px', fontSize: 13, fontFamily: 'inherit',
                          background: 'rgba(6,11,24,0.7)',
                          border: `1.5px solid ${formData[f.key] ? activeDoc.color + '50' : 'rgba(79,110,247,0.18)'}`,
                          color: '#f1f5f9', outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                          boxShadow: formData[f.key] ? `0 0 0 3px ${activeDoc.color}15` : 'none',
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = `${activeDoc.color}70`;
                          e.target.style.boxShadow = `0 0 0 3px ${activeDoc.color}18`;
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = formData[f.key] ? `${activeDoc.color}50` : 'rgba(79,110,247,0.18)';
                          e.target.style.boxShadow = formData[f.key] ? `0 0 0 3px ${activeDoc.color}12` : 'none';
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  marginTop: 22, width: '100%', padding: '13px 0',
                  borderRadius: 14, fontWeight: 700, fontSize: 14, border: 'none', cursor: generating ? 'not-allowed' : 'pointer',
                  background: generating
                    ? 'rgba(79,110,247,0.3)'
                    : `linear-gradient(135deg, ${activeDoc.color}, ${activeDoc.color}cc)`,
                  color: '#fff',
                  boxShadow: generating ? 'none' : `0 0 24px ${activeDoc.glow}, 0 4px 16px rgba(0,0,0,0.3)`,
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={e => {
                  if (!generating) {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${activeDoc.glow}, 0 8px 24px rgba(0,0,0,0.4)`;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!generating) {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px ${activeDoc.glow}, 0 4px 16px rgba(0,0,0,0.3)`;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }
                }}
              >
                {generating ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{
                      width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)',
                      borderTop: '2.5px solid #fff', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite', display: 'inline-block',
                    }} />
                    Generating with AI…
                  </span>
                ) : (
                  <span>✨ Generate Document</span>
                )}
              </button>
            </div>

            {/* ── Preview Panel ── */}
            <div style={{
              background: 'rgba(15,29,58,0.6)',
              border: generated ? `1.5px solid ${activeDoc.color}30` : '1.5px solid rgba(79,110,247,0.12)',
              borderRadius: 24, backdropFilter: 'blur(20px)',
              overflow: 'hidden',
              boxShadow: generated ? `0 0 40px ${activeDoc.glow}20, 0 12px 40px rgba(0,0,0,0.3)` : '0 4px 24px rgba(0,0,0,0.2)',
              transition: 'all 0.4s ease',
            }}>
              {/* Preview header */}
              <div style={{
                padding: '18px 24px',
                borderBottom: generated ? `1px solid ${activeDoc.color}20` : '1px solid rgba(79,110,247,0.10)',
                background: generated ? `${activeDoc.color}08` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.4s',
              }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 14 }}>📄</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>Document Preview</span>
                  {generated && (
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 600,
                      background: 'rgba(16,185,129,0.15)', color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.3)', marginLeft: 4,
                    }}>Ready</span>
                  )}
                </div>

                {generated && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleDownload(generated.id)}
                      style={{
                        padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: `${activeDoc.color}18`, color: activeDoc.color,
                        border: `1.5px solid ${activeDoc.color}40`, transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = `${activeDoc.color}30`;
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${activeDoc.glow}`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = `${activeDoc.color}18`;
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >⬇ Download PDF</button>
                    <button
                      onClick={() => setEmailModal(true)}
                      style={{
                        padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: 'rgba(6,182,212,0.12)', color: '#06b6d4',
                        border: '1.5px solid rgba(6,182,212,0.35)', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.22)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(6,182,212,0.4)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(6,182,212,0.12)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >📧 Send Email</button>
                  </div>
                )}
              </div>

              {/* Preview body */}
              <div style={{ padding: 24 }}>
                {generated ? (
                  <div style={{
                    borderRadius: 14, padding: 20, maxHeight: 420, overflowY: 'auto',
                    background: 'rgba(6,11,24,0.85)',
                    border: '1px solid rgba(79,110,247,0.12)',
                    position: 'relative',
                  }}>
                    {/* Document paper lines decoration */}
                    <div style={{
                      position: 'absolute', left: 18, top: 0, bottom: 0, width: 1,
                      background: 'rgba(79,110,247,0.12)', pointerEvents: 'none',
                    }} />
                    <pre style={{
                      color: '#cbd5e1', fontSize: 11.5, lineHeight: 1.75,
                      whiteSpace: 'pre-wrap', fontFamily: "'Courier New', monospace",
                      paddingLeft: 14,
                    }}>{generated.generated_text}</pre>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', height: 300, gap: 12,
                  }}>
                    {/* Animated icon */}
                    <div style={{
                      width: 72, height: 72, borderRadius: 20,
                      background: 'rgba(79,110,247,0.08)',
                      border: '1.5px solid rgba(79,110,247,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 32, animation: 'float 3s ease-in-out infinite',
                    }}>📄</div>
                    <p style={{ color: '#334155', fontSize: 13, fontWeight: 600 }}>No Preview Yet</p>
                    <p style={{ color: '#1e293b', fontSize: 11, textAlign: 'center', maxWidth: 200, lineHeight: 1.5 }}>
                      Fill in the form details and click Generate to see your document here
                    </p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'rgba(79,110,247,0.3)',
                          animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Saved Documents ── */}
          <div style={{
            background: 'rgba(15,29,58,0.55)',
            border: '1.5px solid rgba(79,110,247,0.13)',
            borderRadius: 24, overflow: 'hidden',
            backdropFilter: 'blur(16px)',
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(79,110,247,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(79,110,247,0.04)',
            }}>
              <div className="flex items-center gap-3">
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'rgba(79,110,247,0.12)',
                  border: '1.5px solid rgba(79,110,247,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>📁</div>
                <div>
                  <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>Saved Documents</p>
                  <p style={{ color: '#475569', fontSize: 11 }}>Stored securely in MongoDB</p>
                </div>
              </div>
              <span style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 999, fontWeight: 600,
                background: 'rgba(79,110,247,0.12)', color: '#818cf8',
                border: '1px solid rgba(79,110,247,0.25)',
              }}>{saved.length} document{saved.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Body */}
            {savedLoading ? (
              <div style={{ padding: '48px 0', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'rgba(79,110,247,0.5)',
                      animation: `pulse-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }} />
                  ))}
                </div>
                <p style={{ color: '#334155', fontSize: 12, marginTop: 12 }}>Loading from MongoDB…</p>
              </div>
            ) : saved.length === 0 ? (
              <div style={{ padding: '52px 0', textAlign: 'center' }}>
                <div style={{
                  fontSize: 40, marginBottom: 12, opacity: 0.3,
                  animation: 'float 3s ease-in-out infinite',
                  display: 'inline-block',
                }}>📂</div>
                <p style={{ color: '#334155', fontSize: 13, fontWeight: 600 }}>No documents yet</p>
                <p style={{ color: '#1e293b', fontSize: 11, marginTop: 4 }}>Generate your first document above</p>
              </div>
            ) : (
              <div>
                {saved.map((d: any, idx: number) => {
                  const dt = DOC_TYPES.find(t => t.id === d.document_type) || DOC_TYPES[0];
                  return (
                    <div
                      key={d.id}
                      style={{
                        padding: '14px 24px',
                        borderBottom: idx < saved.length - 1 ? '1px solid rgba(79,110,247,0.07)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        transition: 'background 0.15s',
                        cursor: 'default',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(79,110,247,0.05)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                          background: `${dt.color}15`,
                          border: `1.5px solid ${dt.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                        }}>{dt.icon}</div>
                        <div>
                          <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>
                            {d.document_type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </p>
                          <p style={{ color: '#475569', fontSize: 11 }}>
                            {d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleDownload(d.id)}
                          style={{
                            padding: '5px 14px', borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            background: `${dt.color}12`, color: dt.color,
                            border: `1.5px solid ${dt.color}35`, transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = `${dt.color}25`;
                            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 10px ${dt.glow}`;
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = `${dt.color}12`;
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                          }}
                        >⬇ PDF</button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          style={{
                            padding: '5px 14px', borderRadius: 9, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            background: 'rgba(239,68,68,0.08)', color: '#f87171',
                            border: '1.5px solid rgba(239,68,68,0.25)', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)';
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 10px rgba(239,68,68,0.3)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                          }}
                        >🗑 Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Email Modal ── */}
      {emailModal && (
        <Modal title="📧 Send Document via Email" onClose={() => setEmailModal(false)}>
          <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16, marginTop: -8 }}>
            The generated document will be sent as plain text to the specified email address.
          </p>
          <label style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            Recipient Email
          </label>
          <input
            value={emailAddr}
            onChange={e => {
              setEmailAddr(e.target.value);
              if (emailError) setEmailError('');
            }}
            type="email"
            placeholder="recipient@example.com"
            className="input-field"
            style={{ 
              marginBottom: emailError ? 4 : 20,
              borderColor: emailError ? '#ef4444' : 'rgba(79,110,247,0.3)' 
            }}
          />
          {emailError && (
            <p style={{ color: '#ef4444', fontSize: 10, marginBottom: 16, marginLeft: 4 }}>
              {emailError}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, marginBottom: 16, background: 'rgba(79,110,247,0.04)', border: '1px solid rgba(79,110,247,0.1)' }}>
            <div>
              <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>Attach as PDF</p>
              <p style={{ color: '#64748b', fontSize: 11 }}>A professional PDF version will be included</p>
            </div>
            <button
              onClick={() => setAttachAsPDF(!attachAsPDF)}
              style={{
                position: 'relative', width: 44, height: 22, borderRadius: 99, transition: 'all 0.3s', cursor: 'pointer',
                background: attachAsPDF ? activeDoc.color : 'rgba(71,85,105,0.3)',
                border: 'none',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: attachAsPDF ? 25 : 3, width: 16, height: 16, borderRadius: '50%',
                background: '#fff', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Local Attachment Section */}
          <div style={{ padding: 14, borderRadius: 12, marginBottom: 20, background: 'rgba(79,110,247,0.04)', border: '1px solid rgba(79,110,247,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>Local Attachment</p>
                <p style={{ color: '#64748b', fontSize: 11 }}>Choose a file from your folder</p>
              </div>
              <input 
                type="file" 
                id="doc-file-upload" 
                className="hidden" 
                onChange={e => setAttachment(e.target.files?.[0] || null)} 
              />
              <label 
                htmlFor="doc-file-upload"
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(79,110,247,0.1)', color: activeDoc.color,
                  border: `1px solid ${activeDoc.color}30`, transition: 'all 0.2s',
                }}
              >
                {attachment ? 'Change' : 'Select'}
              </label>
            </div>
            {attachment && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,23,42,0.4)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(79,110,247,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ color: '#cbd5e1', fontSize: 10, fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{attachment.name}</p>
                    <p style={{ color: '#64748b', fontSize: 9, margin: 0 }}>{(attachment.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                  ✕
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setEmailModal(false)}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(15,29,58,0.7)', color: '#94a3b8',
                border: '1.5px solid rgba(79,110,247,0.2)', transition: 'all 0.2s',
              }}
            >Cancel</button>
            <button
              onClick={handleEmail}
              disabled={sending || !emailAddr}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: sending || !emailAddr ? 'not-allowed' : 'pointer',
                background: sending || !emailAddr ? 'rgba(79,110,247,0.3)' : 'linear-gradient(135deg,#4f6ef7,#7c3aed)',
                color: '#fff', border: 'none',
                boxShadow: sending || !emailAddr ? 'none' : '0 0 20px rgba(79,110,247,0.4)',
                transition: 'all 0.2s',
              }}
            >{sending ? 'Sending…' : '✉ Send Now'}</button>
          </div>
        </Modal>
      )}

      {/* Extra keyframes injected once */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes docFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.5);opacity:1} }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5) sepia(1) saturate(2) hue-rotate(200deg); }
        textarea::placeholder, input::placeholder { color: #334155 !important; }
      `}</style>
    </div>
  );
}
