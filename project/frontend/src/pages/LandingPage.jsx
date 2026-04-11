import { Link } from 'react-router-dom';
import { ScalesIcon } from '../components/Sidebar';

function CheckIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--surface)' }}>
      {/* NAVBAR */}
      <nav className="navbar">
        <Link to="/" className="navbar-logo">
          <ScalesIcon size={24} />
          AI Legal Assistant
        </Link>
        <div className="navbar-links">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#who">For Who</a>
          <a href="#testimonials">Testimonials</a>
        </div>
        <div className="navbar-actions">
          <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <section className="hero">
          <div className="hero-content">
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--light-blue)', borderRadius:'var(--radius-badge)', padding:'4px 12px', marginBottom:20 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--primary)' }}>🇮🇳 Powered by Indian Constitution Data</span>
            </div>
            <h1>Smart AI Legal Support for <span>Every Indian Citizen</span></h1>
            <p>Get instant legal guidance powered by Indian Constitution and Gemini AI. Understand your rights. Generate documents. Talk to an AI advocate — free.</p>
            <div className="hero-ctas">
              <Link to="/signup" className="btn btn-primary btn-lg">Get Started Free</Link>
              <a href="#how" className="btn btn-ghost btn-lg">Watch Demo →</a>
            </div>
            <div className="trust-bar">
              <span className="trust-item"><CheckIcon /> 10,000+ users</span>
              <span className="trust-item"><CheckIcon /> Indian Constitution data</span>
              <span className="trust-item"><CheckIcon /> Available 24/7</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-mockup" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
              <img
                src="/images/hero_ai_legal.png"
                alt="AI Legal Assistant dashboard"
                style={{ width: '100%', borderRadius: 16, display: 'block' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, transparent 100%)',
                borderRadius: '0 0 16px 16px',
                padding: '24px 20px 20px',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>⚖️ AI-powered Indian Legal Guidance</span>
                <span className="badge badge-active" style={{ marginLeft: 'auto', fontSize: 11 }}>● Live</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FEATURES */}
      <section id="features" style={{ background:'#fff', padding:'80px 0' }}>
        <div className="section">
          <div className="section-header">
            <h2>Everything you need for legal clarity</h2>
            <p>From instant advice to professional documents — powered by AI and the Indian Constitution.</p>
          </div>
          <div className="features-grid">
            {[
              { icon:'🔍', color:'#EFF6FF', title:'AI Legal Research', desc:'Search case laws, IPC sections, and constitutional articles instantly with Gemini AI.' },
              { icon:'📄', color:'#F0FDF4', title:'Document Generator', desc:'Generate legal notices, affidavits, and complaint letters in seconds.' },
              { icon:'💼', color:'#F5F3FF', title:'Case Management', desc:'For advocates: track clients, hearings, and case status in one place.' },
              { icon:'💬', color:'#FFFBEB', title:'24/7 AI Chatbot', desc:'Ask legal questions any time. Get structured answers with legal references.' },
            ].map((f) => (
              <div key={f.title} className="feature-card">
                <div className="f-icon" style={{ background: f.color, fontSize: 24 }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="section">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Get started in three simple steps.</p>
        </div>
        <div className="steps-row">
          {[
            { num:1, icon:'👤', title:'Create your account', desc:'Sign up as a citizen or advocate — it\'s free to get started.' },
            null,
            { num:2, icon:'💬', title:'Describe your issue', desc:'Enter your legal question in plain language. No legal jargon needed.' },
            null,
            { num:3, icon:'✅', title:'Get AI-powered guidance', desc:'Receive structured advice with constitutional references and action steps.' },
          ].map((s, i) => s === null ? (
            <div key={i} className="step-connector" style={{ flexGrow:1, borderTop:'2px dashed var(--border)', marginTop:28 }} />
          ) : (
            <div key={s.num} className="step">
              <div className="step-circle">{s.num}</div>
              <div style={{ fontSize:24, marginBottom:12 }}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOR WHO */}
      <section id="who" style={{ background:'#fff', padding:'80px 0' }}>
        <div className="section">
          <div className="section-header">
            <h2>Built for Citizens &amp; Advocates</h2>
          </div>
          <div className="audience-grid">
            <div className="audience-card" style={{ overflow:'hidden', padding:0 }}>
              <div style={{ position:'relative', height:180 }}>
                <img src="/images/supreme_court.png" alt="Supreme Court of India"
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(15,23,42,0.8) 0%, transparent 60%)' }} />
                <div style={{ position:'absolute', bottom:16, left:20 }}>
                  <h3 style={{ color:'#fff', margin:0 }}>⚖️ For Advocates</h3>
                </div>
              </div>
              <div style={{ padding:'20px 24px' }}>
                <ul>
                  {['AI-powered legal research', 'Case & client management', 'Document drafting tools', 'Hearing calendar'].map(i => (
                    <li key={i}><CheckIcon /> {i}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="audience-card" style={{ overflow:'hidden', padding:0 }}>
              <div style={{ position:'relative', height:180 }}>
                <img src="/images/india_law_scales.png" alt="Indian law scales"
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(15,23,42,0.8) 0%, transparent 60%)' }} />
                <div style={{ position:'absolute', bottom:16, left:20 }}>
                  <h3 style={{ color:'#fff', margin:0 }}>🧑 For Citizens</h3>
                </div>
              </div>
              <div style={{ padding:'20px 24px' }}>
                <ul>
                  {['Understand your legal rights', 'Know your Constitution rights', 'File complaints with guidance', 'Get AI advice — free'].map(i => (
                    <li key={i}><CheckIcon /> {i}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUPREME COURT BANNER */}
      <div style={{ position:'relative', height:280, overflow:'hidden' }}>
        <img src="/images/supreme_court.png" alt="Supreme Court of India"
          style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 30%' }} />
        <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.7)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ color:'#94A3B8', fontSize:13, fontWeight:600, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Trusted Platform</div>
          <h2 style={{ color:'#fff', margin:0, marginBottom:12 }}>Upholding the Spirit of the Indian Constitution</h2>
          <p style={{ color:'#CBD5E1', fontSize:15, maxWidth:560, textAlign:'center' }}>Built with the Indian citizen in mind — providing accessible, accurate legal guidance powered by AI.</p>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="section">
        <div className="section-header"><h2>Trusted by thousands</h2></div>
        <div className="testimonials-grid">
          {[
            { name:'Rahul Mehta', role:'Citizen', text:'"I got clear guidance on my landlord dispute within minutes. The constitutional references were very helpful."' },
            { name:'Adv. Priya Sharma', role:'Advocate', text:'"As an advocate, the document generator and case tracking features save me hours every week."' },
            { name:'Sunita Patel', role:'Citizen', text:'"Finally a platform that explains legal process in simple language. Very empowering for common people."' },
          ].map((t) => (
            <div key={t.name} className="testimonial-card">
              <div className="testimonial-header">
                <div className="avatar avatar-sm">{t.name[0]}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{t.name}</div>
                  <div className="text-sm">{t.role}</div>
                </div>
              </div>
              <blockquote>{t.text}</blockquote>
              <div className="stars">★★★★★</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <div style={{ position:'relative', overflow:'hidden' }}>
        <img src="/images/india_law_scales.png" alt="Indian law scales"
          style={{ width:'100%', height:320, objectFit:'cover', objectPosition:'center', display:'block' }} />
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(135deg, rgba(29,78,216,0.92) 0%, rgba(15,23,42,0.88) 100%)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'48px'
        }}>
          <h2 style={{ color:'#fff', fontSize:32, marginBottom:16 }}>Start your free legal consultation today</h2>
          <p style={{ color:'#bfdbfe', fontSize:16, marginBottom:32 }}>Join 10,000+ Indians who use AI Legal Assistant for legal guidance.</p>
          <Link to="/signup" className="btn btn-white btn-lg">Sign Up Free →</Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo"><ScalesIcon size={20} /> AI Legal Assistant</div>
          <div className="footer-links">
            <a href="#">About</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-copy">© 2025 AI Legal Assistant</div>
        </div>
      </footer>
    </div>
  );
}
