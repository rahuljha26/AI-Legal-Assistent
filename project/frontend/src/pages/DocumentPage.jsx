import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { documentAPI } from '../api';
import EmailModal from '../components/EmailModal';

const DOC_TYPES = ['Legal Notice','Affidavit','Complaint Letter','Rent Agreement'];

export default function DocumentPage() {
  const [selected, setSelected] = useState(0);
  const [form, setForm] = useState({ to:'', subject:'', description:'', amount:'', deadline:'', your_name:'', your_address:'' });
  const [preview, setPreview] = useState('');
  const [docId, setDocId]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await documentAPI.generate({
        document_type: DOC_TYPES[selected],
        details: form,
      });
      setPreview(res.data.data.generated_text);
      setDocId(res.data.data.id);
    } catch (err) {
      setPreview('Error generating document. Please check your API key and try again.');
    } finally { setLoading(false); }
  };

  const handleDownload = async () => {
    if (!docId) return;
    const res = await documentAPI.pdf(docId);
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = `${DOC_TYPES[selected]}.pdf`; a.click();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <h3>Document Generator</h3>
        </header>

        <div className="page-body">
          <p className="text-muted mb-24">Generate professional legal documents in seconds using AI</p>

          {/* Doc Type Selector */}
          <div className="doc-type-grid">
            {DOC_TYPES.map((d, i) => (
              <div key={d} className={`doc-type-card${selected === i ? ' selected' : ''}`} onClick={() => setSelected(i)}>
                <div style={{ fontSize:24, marginBottom:8 }}>
                  {['📋','📝','✉️','🏠'][i]}
                </div>
                <div style={{ fontSize:14, fontWeight:600 }}>{d}</div>
              </div>
            ))}
          </div>

          <div className="doc-layout">
            {/* Form */}
            <div className="card">
              <h3 className="mb-16">{DOC_TYPES[selected]} Details</h3>
              <div className="form-group mb-16">
                <label className="form-label">To (Name of Recipient)</label>
                <input className="form-control" placeholder="Full name of recipient" value={form.to} onChange={e=>setForm({...form,to:e.target.value})} />
              </div>
              <div className="form-group mb-16">
                <label className="form-label">Subject</label>
                <input className="form-control" placeholder="Subject of the document" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} />
              </div>
              <div className="form-group mb-16">
                <label className="form-label">Issue Description</label>
                <textarea className="form-control" rows={4} placeholder="Describe the issue in detail..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div className="form-group">
                  <label className="form-label">Amount / Demand (₹)</label>
                  <input className="form-control" type="number" placeholder="e.g. 50000" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Response Deadline</label>
                  <input className="form-control" type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} />
                </div>
              </div>
              <div className="form-group mb-16">
                <label className="form-label">Your Name</label>
                <input className="form-control" placeholder="Your full name" value={form.your_name} onChange={e=>setForm({...form,your_name:e.target.value})} />
              </div>
              <div className="form-group mb-24">
                <label className="form-label">Your Address</label>
                <textarea className="form-control" rows={2} placeholder="Your complete address" value={form.your_address} onChange={e=>setForm({...form,your_address:e.target.value})} />
              </div>
              <button className="btn btn-primary btn-full" onClick={handleGenerate} disabled={loading}>
                {loading ? 'Generating…' : '⚡ Generate Document'}
              </button>
              <p style={{ fontSize:12, color:'var(--muted)', textAlign:'center', marginTop:8 }}>Powered by Gemini AI</p>
            </div>

            {/* Preview */}
            <div className="doc-preview card" style={{ padding:0 }}>
              <div className="doc-preview-header">
                <span style={{ fontSize:14, fontWeight:600 }}>Document Preview</span>
                <span className="badge badge-closed">A4</span>
              </div>
              {preview ? (
                <>
                  <div className="doc-preview-body" style={{ whiteSpace:'pre-wrap', fontFamily:'serif' }}>
                    {preview}
                  </div>
                  <div style={{ padding:16, borderTop:'1px solid var(--border)', display:'flex', gap:10, flexWrap:'wrap' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleDownload}>Download PDF</button>
                    <button className="btn btn-outline btn-sm">Save to Dashboard</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setIsEmailModalOpen(true)}>✉ Email Document</button>
                  </div>
                </>
              ) : (
                <div className="doc-preview-empty">
                  <div style={{ fontSize:48 }}>📄</div>
                  <p>Your document will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <EmailModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        adviceData={{ document_type: DOC_TYPES[selected], document_text: preview }} 
        emailType="document" 
      />
    </div>
  );
}
