import { useState, useEffect } from 'react';
import { useEmailSender } from '../hooks/useEmailSender';
import { useAuth } from '../context/AuthContext';

const MailIcon = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const CheckIcon= () => <svg width="48" height="48" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;
const XIcon    = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;

export default function EmailModal({ isOpen, onClose, adviceData, emailType }) {
  const { user } = useAuth();
  const { sendEmail, isLoading, isSuccess, isError, errorMessage, reset } = useEmailSender();
  
  const [toEmail, setToEmail] = useState('');
  const [attachPdf, setAttachPdf] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setToEmail(user?.email || '');
      reset();
      setShowPreview(false);
    }
  }, [isOpen, user, reset]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!toEmail) return;
    
    sendEmail({
      to_email: toEmail,
      email_type: emailType,
      content: adviceData,
      attach_pdf: attachPdf
    });
  };

  const getPreviewText = () => {
    try {
      if (emailType === 'advice') return `Constitution Ref: ${adviceData.constitution_reference}\\nLaw: ${adviceData.applicable_law}\\n...`;
      if (emailType === 'document') return `Document Type: ${adviceData.document_type}\\nPreview: ${adviceData.document_text?.substring(0, 100)}...`;
      if (emailType === 'case_summary') return `Case: ${adviceData.case_type}\\nStatus: ${adviceData.status}\\n...`;
      return JSON.stringify(adviceData, null, 2);
    } catch (e) { return "" }
  };

  const badgeColors = {
    advice: { bg: '#dbeafe', color: '#1d4ed8', text: 'Legal Advice' },
    document: { bg: '#dcfce7', color: '#16a34a', text: 'Document' },
    case_summary: { bg: '#f3e8ff', color: '#7c3aed', text: 'Case Summary' }
  };
  const badge = badgeColors[emailType] || badgeColors.advice;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      
      {/* Modal Card */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 460, background: '#ffffff', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MailIcon/></div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>Email this {badge.text}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}><XIcon/></button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckIcon />
              <h3 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', margin: '16px 0 8px' }}>Email sent successfully!</h3>
              <p style={{ color: '#64748b', fontSize: 14 }}>Please check the inbox at <b>{toEmail}</b>.</p>
              
              <button onClick={onClose} style={{ marginTop: 32, width: '100%', padding: '12px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              
              {isError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '12px', borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
                  {errorMessage || 'Failed to send email. Please check the address and try again.'}
                </div>
              )}

              {/* Readonly Badge */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color }}>
                  {badge.text} Payload
                </span>
              </div>

              {/* To Email */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Recipient Email</label>
                <input 
                  type="email" required value={toEmail} onChange={e => setToEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none' }}
                />
              </div>

              {/* Attach PDF Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>Attach as PDF</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{attachPdf ? 'A PDF copy will be attached' : 'No attachment will be sent'}</div>
                </div>
                {/* Custom toggle switch */}
                <div 
                  onClick={() => setAttachPdf(!attachPdf)}
                  style={{ width: 44, height: 24, background: attachPdf ? '#1d4ed8' : '#cbd5e1', borderRadius: 9999, position: 'relative', cursor: 'pointer', transition: '0.2s' }}
                >
                  <div style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: attachPdf ? 22 : 2, transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                </div>
              </div>

              {/* Preview Toggle */}
              <div style={{ marginBottom: 24 }}>
                <button type="button" onClick={() => setShowPreview(!showPreview)} style={{ background: 'none', border: 'none', color: '#1d4ed8', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
                  {showPreview ? 'Hide preview' : 'Preview content'}
                </button>
                {showPreview && (
                  <div style={{ marginTop: 8, padding: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#475569', height: 100, overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {getPreviewText()}
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={onClose} disabled={isLoading} style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} style={{ flex: 1, padding: '10px', background: '#1d4ed8', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? 'Sending...' : 'Send Email'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
