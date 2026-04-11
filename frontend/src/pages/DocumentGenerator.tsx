import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar, Toast, useToast, Modal } from '../components/index';
import { documentAPI, emailAPI } from '../services/api';

type DocType='legal_notice'|'affidavit'|'complaint_letter'|'rent_agreement';

const DOC_TYPES = [
  { id:'legal_notice',     label:'Legal Notice',    icon:'📜', desc:'Send formal notice to individuals or entities' },
  { id:'affidavit',        label:'Affidavit',       icon:'✍️', desc:'Sworn statement of facts for legal proceedings' },
  { id:'complaint_letter', label:'Complaint Letter',icon:'📬', desc:'File complaints with authorities' },
  { id:'rent_agreement',   label:'Rent Agreement',  icon:'🏠', desc:'Legally binding tenancy document' },
] as const;

const FIELDS: Record<DocType, { key:string; label:string; multiline?:boolean; date?:boolean }[]> = {
  legal_notice:[
    { key:'recipient_name', label:'Recipient Name' }, { key:'subject', label:'Subject' },
    { key:'issue_description', label:'Issue Description', multiline:true },
    { key:'amount', label:'Amount (₹)' }, { key:'deadline', label:'Deadline (days)' },
    { key:'sender_name', label:'Sender Name' }, { key:'sender_address', label:'Sender Address' },
  ],
  affidavit:[
    { key:'deponent_name', label:'Deponent Name' }, { key:'deponent_address', label:'Deponent Address' },
    { key:'statement', label:'Statement of Facts', multiline:true }, { key:'place', label:'Place' },
  ],
  complaint_letter:[
    { key:'authority', label:'Authority / Recipient' }, { key:'subject', label:'Subject' },
    { key:'complaint_details', label:'Complaint Details', multiline:true },
    { key:'relief_sought', label:'Relief Sought' },
    { key:'complainant_name', label:'Complainant Name' }, { key:'complainant_address', label:'Address' },
  ],
  rent_agreement:[
    { key:'landlord_name', label:'Landlord Name' }, { key:'tenant_name', label:'Tenant Name' },
    { key:'property_address', label:'Property Address' }, { key:'rent_amount', label:'Monthly Rent (₹)' },
    { key:'deposit_amount', label:'Deposit (₹)' },
    { key:'lease_start', label:'Lease Start Date', date:true }, { key:'lease_duration', label:'Duration (months)' },
  ],
};

export default function DocumentGenerator() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { toast, showToast, clearToast } = useToast();
  const [docType, setDocType] = useState<DocType>('legal_notice');
  const [formData, setFormData] = useState<Record<string,string>>({});
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [emailModal, setEmailModal] = useState(false);
  const [emailAddr, setEmailAddr] = useState('');
  const [sending, setSending] = useState(false);

  const sidebar = [
    { label:'Dashboard', path:user?.role==='advocate'?'/advocate/dashboard':'/dashboard', icon:'🏠' },
    { label:'AI Chat', path:'/chat', icon:'💬' },
    { label:'Documents', path:'/documents', icon:'📄' },
    { label:'Settings', path:'/settings', icon:'⚙️' },
  ];

  useEffect(()=>{
    documentAPI.list().then(r=>setSaved(r.data?.data||[])).catch(()=>{}).finally(()=>setSavedLoading(false));
  },[]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await documentAPI.generate(docType, formData);
      setGenerated(r.data?.data); setSaved(p=>[r.data?.data,...p]);
      showToast('Document saved to MongoDB','success');
    } catch(e:any) { showToast(e.response?.data?.message||'Generation failed','error'); }
    finally { setGenerating(false); }
  };

  const handleDownload = async (id:number) => {
    try {
      const r = await documentAPI.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href=url; a.download='legal-document.pdf'; a.click();
      window.URL.revokeObjectURL(url);
    } catch { showToast('Download failed','error'); }
  };

  const handleDelete = async (id:number) => {
    try {
      await documentAPI.delete(id); setSaved(p=>p.filter(d=>d.id!==id));
      if (generated?.id===id) setGenerated(null);
      showToast('Deleted from MongoDB','success');
    } catch { showToast('Delete failed','error'); }
  };

  const handleEmail = async () => {
    setSending(true);
    try {
      await emailAPI.send({ to_email:emailAddr, email_type:'document', content:{ document_text:generated?.generated_text } });
      setEmailModal(false); showToast('Email sent & logged','success');
    } catch { showToast('Email failed','error'); } finally { setSending(false); }
  };

  return (
    <div className="flex min-h-screen" style={{ background:'#060b18' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast}/>}
      <Sidebar items={sidebar} userName={user?.full_name||''} userRole={user?.role||''} onLogout={logout} currentPath={location.pathname}/>

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 px-8 py-4" style={{ background:'rgba(6,11,24,.85)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(79,110,247,.1)' }}>
          <h1 className="text-lg font-bold text-white">Document Generator</h1>
          <p className="text-slate-400 text-xs">AI-generated legally formatted Indian documents</p>
        </div>

        <div className="p-8 max-w-6xl mx-auto">
          {/* Type selector */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {DOC_TYPES.map(t=>(
              <button key={t.id} onClick={()=>{ setDocType(t.id); setFormData({}); setGenerated(null); }}
                className="p-5 rounded-2xl text-left transition-all card-hover"
                style={docType===t.id ? {
                  background:'linear-gradient(135deg,rgba(79,110,247,.2),rgba(124,58,237,.1))',
                  border:'2px solid rgba(79,110,247,.5)', boxShadow:'0 0 20px rgba(79,110,247,.15)'
                } : {
                  background:'rgba(15,29,58,.5)', border:'1px solid rgba(79,110,247,.12)'
                }}>
                <div className="text-2xl mb-3">{t.icon}</div>
                <p className={`text-sm font-semibold mb-1 ${docType===t.id?'text-indigo-300':'text-slate-200'}`}>{t.label}</p>
                <p className="text-xs text-slate-500 leading-snug">{t.desc}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            {/* Form */}
            <div className="glass rounded-3xl p-6">
              <p className="text-white font-semibold mb-5">{DOC_TYPES.find(t=>t.id===docType)?.label} Details</p>
              <div className="space-y-4">
                {FIELDS[docType].map(f=>(
                  <div key={f.key}>
                    <label className="block text-slate-400 text-xs font-medium mb-1.5">{f.label}</label>
                    {f.multiline ? (
                      <textarea value={formData[f.key]||''} onChange={e=>setFormData({...formData,[f.key]:e.target.value})}
                        className="input-field resize-none" rows={3} />
                    ) : (
                      <input type={f.date?'date':'text'} value={formData[f.key]||''} onChange={e=>setFormData({...formData,[f.key]:e.target.value})}
                        className="input-field" />
                    )}
                  </div>
                ))}
              </div>
              <button onClick={handleGenerate} disabled={generating}
                className="btn-glow text-white w-full py-3 rounded-xl font-semibold text-sm mt-5">
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating with AI…
                  </span>
                ) : '✨ Generate Document'}
              </button>
            </div>

            {/* Preview */}
            <div className="glass rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold">Document Preview</p>
                {generated && (
                  <div className="flex gap-2">
                    <button onClick={()=>handleDownload(generated.id)} className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{ background:'rgba(79,110,247,.12)', color:'#818cf8', border:'1px solid rgba(79,110,247,.25)' }}>⬇ PDF</button>
                    <button onClick={()=>setEmailModal(true)} className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{ background:'rgba(5,205,153,.1)', color:'#34d399', border:'1px solid rgba(5,205,153,.25)' }}>📧 Email</button>
                  </div>
                )}
              </div>
              {generated ? (
                <div className="rounded-xl p-4 max-h-96 overflow-y-auto" style={{ background:'rgba(6,11,24,.8)', border:'1px solid rgba(79,110,247,.1)' }}>
                  <pre className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-mono">{generated.generated_text}</pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <span className="text-4xl block mb-3 opacity-30">📄</span>
                  <p className="text-slate-600 text-sm">Fill the form and generate to see preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Saved docs */}
          <div className="glass rounded-3xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom:'1px solid rgba(79,110,247,.1)' }}>
              <p className="text-white font-semibold">Saved Documents</p>
              <span className="text-slate-500 text-xs">{saved.length} documents in MongoDB</span>
            </div>
            {savedLoading ? <div className="p-8 text-center text-slate-600 text-sm">Loading from MongoDB…</div> : saved.length===0 ? (
              <div className="py-12 text-center">
                <span className="text-4xl block mb-3">📂</span>
                <p className="text-slate-500 text-sm">No documents yet. Generate your first above.</p>
              </div>
            ) : (
              <div>
                {saved.map((d:any)=>(
                  <div key={d.id} className="table-row px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                        style={{ background:'rgba(79,110,247,.1)' }}>📄</div>
                      <div>
                        <p className="text-slate-200 text-sm font-medium">{d.document_type?.replace(/_/g,' ').replace(/\b\w/g,(c:string)=>c.toUpperCase())}</p>
                        <p className="text-slate-600 text-xs">{d.created_at?new Date(d.created_at).toLocaleDateString():''}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>handleDownload(d.id)} className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ color:'#818cf8', background:'rgba(79,110,247,.08)', border:'1px solid rgba(79,110,247,.2)' }}>PDF</button>
                      <button onClick={()=>handleDelete(d.id)} className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ color:'#f87171', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {emailModal && (
        <Modal title="Email Document" onClose={()=>setEmailModal(false)}>
          <input value={emailAddr} onChange={e=>setEmailAddr(e.target.value)} type="email"
            className="input-field mb-4" placeholder="recipient@example.com" />
          <div className="flex gap-3">
            <button onClick={()=>setEmailModal(false)} className="flex-1 py-2.5 rounded-xl text-sm text-slate-300"
              style={{ border:'1px solid rgba(79,110,247,.2)', background:'rgba(15,29,58,.5)' }}>Cancel</button>
            <button onClick={handleEmail} disabled={sending||!emailAddr}
              className="flex-1 btn-glow text-white py-2.5 rounded-xl text-sm font-medium">{sending?'Sending…':'Send'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
