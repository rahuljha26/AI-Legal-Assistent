import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { adviceAPI } from '../api';
import EmailModal from '../components/EmailModal';

const CHIPS = ['Property Issue','Consumer Rights','FIR / Police','Family Law','Cyber Crime'];

function TypingDots() {
  return (
    <div style={{ display:'flex', gap:6, padding:'14px 16px', background:'#F8FAFC', border: '1px solid #E2E8F0', borderRadius:12, width:'fit-content', alignItems: 'center' }}>
      <span style={{ fontSize: '14px', color: '#64748B', marginRight: '8px' }}>AI Legal Advisor is typing</span>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width:6, height:6, borderRadius:'50%', background:'#60A5FA',
          animation:'bounce 1.2s infinite', animationDelay:`${i*0.2}s`
        }} />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [currentAdviceData, setCurrentAdviceData] = useState(null);

  const firstName = user?.full_name?.split(' ')[0] || 'Rahul';

  useEffect(() => {
    // If arriving from the Dashboard with a prefilled query, send it automatically
    if (location.state?.prefilledQuery) {
      sendMessage(location.state.prefilledQuery);
      // Clear state so it doesn't resend on refresh
      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);

  const sendMessage = async (text) => {
    const q = text || input.trim();
    if (!q) return;
    setInput('');
    setMessages(prev => [...prev, { role:'user', content:q, time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) }]);
    setLoading(true);
    try {
      const res = await adviceAPI.ask({ query: q });
      const rawAdvice = res.data?.data?.ai_response ?? res.data?.data ?? res.data;
      const advice = typeof rawAdvice === 'string' ? JSON.parse(rawAdvice) : rawAdvice;
      setMessages(prev => [...prev, { role:'ai', advice, time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) }]);
    } catch (err) {
      setMessages(prev => [...prev, { role:'ai', advice:{ steps: ['Sorry, something went wrong. Please check your connection and try again.'] }, time:'' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" style={{ height:'100vh', display:'flex', flexDirection:'column', background: '#fff' }}>
        
        {/* Top Header */}
        <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px 0' }}>AI Legal Advisor</h2>
              <div style={{ fontSize: '13px', color: '#64748B' }}>Powered by Indian Constitution data + Gemini AI</div>
            </div>
            <button style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '8px', color: '#E2E8F0', fontSize: '14px', cursor: 'pointer' }} onClick={() => setMessages([])}>
              Clear chat
            </button>
          </div>
          
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {CHIPS.map(c => (
              <span key={c} style={{ border: '1px solid #E2E8F0', color: '#64748B', padding: '6px 16px', borderRadius: '50px', fontSize: '13px', cursor: 'pointer' }} onClick={() => sendMessage(c)}>
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#fff' }}>
          
          {messages.length === 0 && !loading && (
             <div style={{ margin: 'auto', color: '#94A3B8', fontSize: '15px' }}>Start a conversation to get legal advice.</div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: msg.role === 'user' ? '60%' : '80%' }}>
              
              {msg.role === 'user' ? (
                <div style={{ background: '#fff', border: '1.5px solid #1D4ED8', borderRadius: '12px', padding: '16px', borderTopRightRadius: '4px' }}>
                  <div style={{ fontSize: '15px', color: '#334155', lineHeight: 1.5, marginBottom: '8px' }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{msg.time} · {firstName}</div>
                </div>
              ) : (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '24px', borderTopLeftRadius: '4px' }}>
                  
                  {/* AI Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #fff' }}></div>
                    </div>
                    <strong style={{ fontSize: '15px', color: '#1D4ED8' }}>AI Legal Advisor</strong>
                  </div>

                  {msg.advice?.constitution_reference && (
                    <div style={{ display: 'inline-block', background: '#DBEAFE', color: '#1D4ED8', padding: '4px 12px', borderRadius: '50px', fontSize: '13px', marginBottom: '20px' }}>
                      {msg.advice.constitution_reference}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {msg.advice?.applicable_law && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', letterSpacing: '0.5px' }}>APPLICABLE LAW</div>
                        <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>{msg.advice.applicable_law}</div>
                      </div>
                    )}

                    {msg.advice?.steps?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', letterSpacing: '0.5px' }}>STEPS TO TAKE</div>
                        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                          {msg.advice.steps.map((s, idx) => <li key={idx} style={{ paddingBottom: '4px' }}>{s}</li>)}
                        </ol>
                      </div>
                    )}

                    {msg.advice?.documents_required?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', letterSpacing: '0.5px' }}>DOCUMENTS NEEDED</div>
                        <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                          {msg.advice.documents_required.join(' · ')}
                        </div>
                      </div>
                    )}

                    {msg.advice?.where_to_file && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', letterSpacing: '0.5px' }}>WHERE TO FILE</div>
                        <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>{msg.advice.where_to_file}</div>
                      </div>
                    )}

                    {msg.advice?.disclaimer && (
                      <div style={{ borderTop: '1px solid #BFDBFE', paddingTop: '16px', fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.5 }}>
                        {msg.advice.disclaimer}
                      </div>
                    )}

                  </div>

                  {/* AI Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button style={{ background: 'transparent', border: '1px solid #E2E8F0', padding: '10px 20px', borderRadius: '8px', color: '#F8FAFC', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                      <span style={{ color: '#E2E8F0' }}>Download PDF</span>
                    </button>
                    <button onClick={() => { setCurrentAdviceData(msg.advice); setIsEmailModalOpen(true); }} style={{ background: 'transparent', border: '1px solid #1D4ED8', padding: '10px 20px', borderRadius: '8px', color: '#1D4ED8', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                      Email this advice
                    </button>
                  </div>

                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start' }}>
              <TypingDots />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Footer */}
        <div style={{ padding: '24px 32px', borderTop: '1px solid #E2E8F0', background: '#fff', display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          <svg style={{ cursor: 'pointer' }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
          
          <div style={{ flex: 1, background: '#333333', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '12px 16px' }}>
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Describe your legal issue..." 
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          <svg style={{ cursor: 'pointer' }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>

          <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{ width: '45px', height: '45px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default' }}>
            {/* Blank placeholder icon matching mockup, or a subtle arrow */}
          </button>
        </div>

      </div>
      <EmailModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        adviceData={currentAdviceData} 
        emailType="advice" 
      />
    </div>
  );
}
