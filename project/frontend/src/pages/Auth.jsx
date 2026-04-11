import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/* ──────────────────────────────────────────────────────────
   THREE.JS 3D SCENE COMPONENTS
────────────────────────────────────────────────────────── */

function ParticleNetwork() {
  const pointsRef = useRef();
  const linesRef = useRef();
  const count = 120;
  
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = [];
    for(let i=0; i<count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 20;
      pos[i*3+1] = (Math.random() - 0.5) * 20;
      pos[i*3+2] = (Math.random() - 0.5) * 10;
      vel.push(new THREE.Vector3((Math.random()-0.5)*0.02, (Math.random()-0.5)*0.02, (Math.random()-0.5)*0.02));
    }
    return { positions: pos, velocities: vel };
  }, [count]);

  const pGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const lGeom = useMemo(() => new THREE.BufferGeometry(), []);

  useFrame(() => {
    if(!pointsRef.current || !linesRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array;
    const linePositions = [];
    
    for(let i=0; i<count; i++) {
      let x = pos[i*3], y = pos[i*3+1], z = pos[i*3+2];
      const v = velocities[i];
      
      x += v.x; y += v.y; z += v.z;
      // Bounce
      if (x > 10 || x < -10) v.x *= -1;
      if (y > 10 || y < -10) v.y *= -1;
      if (z > 5 || z < -5) v.z *= -1;
      
      pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
      
      for(let j=i+1; j<count; j++) {
        const dx = x - pos[j*3], dy = y - pos[j*3+1], dz = z - pos[j*3+2];
        if (dx*dx + dy*dy + dz*dz < 9) { // distance 3 squared
          linePositions.push(x, y, z, pos[j*3], pos[j*3+1], pos[j*3+2]);
        }
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  });

  return (
    <group>
      <points ref={pointsRef} geometry={pGeom}>
        <pointsMaterial color="#60a5fa" size={0.08} sizeAttenuation transparent opacity={0.6} />
      </points>
      <lineSegments ref={linesRef} geometry={lGeom}>
        <lineBasicMaterial color="#1d4ed8" transparent opacity={0.12} />
      </lineSegments>
    </group>
  );
}

function ScalesOfJustice() {
  const groupRef = useRef();
  const crossbarRef = useRef();
  const leftPanRef = useRef();
  const rightPanRef = useRef();

  const wireGeom = useMemo(() => {
    const lines = [];
    for(let i=0; i<3; i++) {
       const ang = (i * Math.PI * 2) / 3;
       lines.push(0, 1.5, 0); // top attach point
       lines.push(Math.cos(ang)*0.4, 0, Math.sin(ang)*0.4); // pan edge
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    return bg;
  }, []);

  const sharedMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#93c5fd', metalness: 0.7, roughness: 0.2 }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t) * 0.15;
    
    // balancing
    const tilt = Math.sin(t * 1.5) * 0.1;
    crossbarRef.current.rotation.z = tilt;
    
    const yOff = 1.25 * Math.sin(tilt);
    leftPanRef.current.position.y = -yOff - 1.5;
    rightPanRef.current.position.y = yOff - 1.5;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, -1.25, 0]} material={sharedMaterial}>
        <cylinderGeometry args={[0.04, 0.04, 2.5]} />
      </mesh>
      
      <mesh ref={crossbarRef} position={[0, 0, 0]} material={sharedMaterial}>
        <boxGeometry args={[2.5, 0.06, 0.06]} />
      </mesh>
      
      <group position={[-1.25, -1.5, 0]} ref={leftPanRef}>
         <lineSegments geometry={wireGeom}>
            <lineBasicMaterial color="#93c5fd" />
         </lineSegments>
         <mesh rotation={[Math.PI/2, 0, 0]} material={sharedMaterial}>
            <torusGeometry args={[0.4, 0.04, 8, 24]} />
         </mesh>
      </group>
      
      <group position={[1.25, -1.5, 0]} ref={rightPanRef}>
         <lineSegments geometry={wireGeom}>
            <lineBasicMaterial color="#93c5fd" />
         </lineSegments>
         <mesh rotation={[Math.PI/2, 0, 0]} material={sharedMaterial}>
            <torusGeometry args={[0.4, 0.04, 8, 24]} />
         </mesh>
      </group>
      
      <pointLight position={[0, 3, 2]} intensity={2} color="#ffffff" distance={10} />
      <ambientLight intensity={0.2} color="#93c5fd" />
    </group>
  );
}

function AnimatedScene() {
  const sceneGroup = useRef();
  const sphereRef = useRef();

  useFrame(() => {
    sceneGroup.current.rotation.y += 0.001;
    sphereRef.current.rotation.y += 0.002;
  });

  return (
    <group ref={sceneGroup}>
      <ParticleNetwork />
      <ScalesOfJustice />
      <mesh ref={sphereRef}>
        <sphereGeometry args={[5, 32, 32]} />
        <meshBasicMaterial color="#1e40af" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
      <gridHelper args={[30, 30, 0x1d4ed8, 0x1d4ed8]} position={[0, -4, 0]} material-opacity={0.08} material-transparent />
    </group>
  );
}

/* ──────────────────────────────────────────────────────────
   ICONS
────────────────────────────────────────────────────────── */
const EyeOpen  = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeClosed= () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const UserIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const MailIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const LockIcon = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const ScalesIconSmall = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 3v18M3 9l9-6 9 6"/><path d="M6 9l-3 6h6L6 9zM18 9l-3 6h6l-3-6z"/><path d="M8 21h8"/></svg>;

/* ──────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────── */

export default function Auth({ defaultTab = 'signup' }) {
  const [tab, setTab] = useState(defaultTab); // 'signup' | 'login'
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '', role: 'user' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (tab === 'signup' && !form.full_name.trim()) e.full_name = 'Required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Invalid email format';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    if (tab === 'signup' && form.password !== form.confirm_password) e.confirm_password = 'Passwords must match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    setErrors({}); setApiError(''); setLoading(true);

    try {
      const API_BASE = 'http://localhost:8000';
      const endpoint = tab === 'signup' ? `${API_BASE}/api/v1/auth/signup/` : `${API_BASE}/api/v1/auth/login/`;
      
      // Adapt payload for login (doesn't need full_name, confirm_password, role)
      const payload = tab === 'login' ? { email: form.email, password: form.password } : form;
      
      const res = await axios.post(endpoint, payload);
      
      // Store tokens and redirect
      if (tab === 'signup') {
         // Auto-login or redirect to login. Assuming successful signup allows login:
         setTab('login');
         setApiError('Registration successful. Please login.');
      } else {
         const { access, refresh, user } = res.data;
         localStorage.setItem('access_token', access);
         localStorage.setItem('refresh_token', refresh);
         
         const role = user?.role || res.data.role;
         if (role === 'admin') navigate('/admin');
         else if (role === 'advocate') navigate('/advocate');
         else navigate('/dashboard');
      }
    } catch (err) {
      const data = err.response?.data;
      setApiError(data?.detail || data?.email?.[0] || (tab === 'login' ? 'Invalid credentials' : 'Email already exists'));
      setErrors({ formKey: Date.now() }); // Trigger shake
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; height: 100%; font-family: 'Inter', sans-serif; }
        
        .page-bg { height: 100vh; display: flex; background: #0a0f2e; overflow: hidden; }
        
        /* Layout */
        .left-col { flex: 0 0 55%; position: relative; }
        .right-col { flex: 0 0 45%; display: flex; align-items: center; justify-content: center; position: relative; z-index: 10; padding: 40px; }

        @keyframes leftFade { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        .left-panel-content { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; justify-content: space-between; padding: 60px 48px; pointer-events: none; animation: leftFade 0.5s ease; }

        @keyframes formEntrance { from { opacity: 0; transform: translateX(40px) scale(0.96); } to { opacity: 1; transform: translateX(0) scale(1); } }
        .glass-panel { width: 100%; max-width: 440px; background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.10); border-radius: 24px; padding: 40px; animation: formEntrance 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both; }

        /* Left side content */
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand h1 { font-size: 24px; font-weight: 700; color: #fff; margin: 0; }
        .tagline { font-size: 16px; color: rgba(255,255,255,0.7); margin-top: 8px; font-weight: 300; }
        
        .pills { display: flex; gap: 12px; }
        .pill { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 50px; font-size: 13px; font-weight: 500; }
        
        @keyframes pillIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .pill:nth-child(1) { animation: pillIn 0.5s ease 0.4s both; }
        .pill:nth-child(2) { animation: pillIn 0.5s ease 0.55s both; }
        .pill:nth-child(3) { animation: pillIn 0.5s ease 0.7s both; }

        /* Tabs */
        .tabs { display: flex; gap: 16px; margin-bottom: 32px; border-bottom: 2px solid rgba(255,255,255,0.1); }
        .tab { background: none; border: none; padding: 0 0 12px; font-size: 16px; font-weight: 500; color: rgba(255,255,255,0.40); cursor: pointer; position: relative; transition: color 0.2s; font-family: inherit; }
        .tab.active { color: #fff; }
        .tab.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 2px; background: #fff; border-radius: 2px 2px 0 0; }
        
        .form-fade { animation: leftFade 0.4s ease; }

        /* Inputs */
        .label { display: block; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.6); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .input-wrap { position: relative; margin-bottom: 16px; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.35); display: flex; pointer-events: none; }
        .form-input { width: 100%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 12px 14px 12px 42px; color: #fff; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.18); background: rgba(59,130,246,0.06); }
        .eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.35); display: flex; }
        
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
        .form-input.error { border-color: #ef4444 !important; animation: shake 0.4s ease; box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
        .error-msg { display: block; color: #fca5a5; font-size: 11px; margin-top: 4px; padding-left: 2px; }

        /* Role Buttons */
        .role-row { display: flex; gap: 12px; margin-bottom: 24px; }
        .role-btn { flex: 1; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.5); border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; font-family: inherit; transition: background 0.25s, color 0.25s, border-color 0.25s, transform 0.1s; }
        .role-btn.active { background: #1d4ed8; color: #ffffff; border-color: #3b82f6; }
        .role-btn:hover:not(.active) { background: rgba(255,255,255,0.08); transform: translateY(-1px); }

        /* Submit Button */
        .submit-btn { width: 100%; padding: 14px; background: #1d4ed8; border: none; color: #fff; font-size: 15px; font-weight: 600; border-radius: 10px; cursor: pointer; transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s; transform-origin: center; display: flex; align-items: center; justify-content: center; font-family: inherit; margin-top: 8px;}
        .submit-btn:hover { opacity: 0.88; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(29,78,216,0.35); }
        .submit-btn:active { transform: scale(0.97); box-shadow: none; }
        .submit-btn:disabled { opacity: 0.7; pointer-events: none; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; margin-right: 8px; }

        .api-banner { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 10px; color: #fca5a5; font-size: 13px; margin-bottom: 16px; text-align: center; }
        .api-banner.success { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.3); color: #86efac; }

        .mobile-header { display: none; }

        @media(max-width: 1024px) {
           .left-col { flex: 0 0 45%; }
           .right-col { flex: 0 0 55%; }
        }
        @media(max-width: 768px) {
           .page-bg { flex-direction: column; overflow-y: auto; height: auto; min-height: 100vh; }
           .left-col { display: none; }
           .right-col { width: 100%; flex: none; padding: 24px; align-items: flex-start; }
           .glass-panel { max-width: 100%; padding: 32px 24px; }
           .mobile-header { display: block; margin-bottom: 32px; text-align: center; }
           .mobile-header .brand { justify-content: center; }
           .mobile-header .tagline { margin-top: 4px; }
           .form-input { min-height: 48px; }
        }
      `}</style>

      <div className="page-bg">
        {/* ── LEFT PANEL (THREE.JS) ── */}
        <div className="left-col">
          <Canvas camera={{ position: [0, 0, 8], fov: 60 }} style={{ position: 'absolute', inset: 0 }}>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={60} />
            <AnimatedScene />
          </Canvas>

          <div className="left-panel-content">
            <div>
              <div className="brand">
                <ScalesIconSmall />
                <h1>AI Legal Assistant</h1>
              </div>
              <p className="tagline">Justice made accessible with AI</p>
            </div>
            
            <div className="pills">
              <div className="pill">Constitution AI</div>
              <div className="pill">Document Generator</div>
              <div className="pill">24/7 Legal Help</div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (FORM) ── */}
        <div className="right-col">
          <div className="glass-panel">
            
            <div className="mobile-header">
              <div className="brand">
                <ScalesIconSmall />
                <h1>AI Legal Assistant</h1>
              </div>
              <p className="tagline">Justice made accessible with AI</p>
            </div>

            <div className="tabs">
              <button className={`tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setErrors({}); setApiError(''); }}>Sign Up</button>
              <button className={`tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setErrors({}); setApiError(''); }}>Login</button>
            </div>

            {apiError && (
              <div className={`api-banner ${apiError.includes('successful') ? 'success' : ''}`}>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-fade" key={tab}>
              
              {tab === 'signup' && (
                <>
                  <label className="label">Full Name</label>
                  <div className="input-wrap">
                    <span className="input-icon"><UserIcon/></span>
                    <input type="text" className={`form-input ${errors.full_name || errors.formKey ? 'error' : ''}`} placeholder="Rahul Jha"
                      value={form.full_name} onChange={e=>setF('full_name',e.target.value)} />
                    {errors.full_name && <span className="error-msg">{errors.full_name}</span>}
                  </div>
                </>
              )}

              <label className="label">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon"><MailIcon/></span>
                <input type="email" className={`form-input ${errors.email || errors.formKey ? 'error' : ''}`} placeholder="you@example.com"
                  value={form.email} onChange={e=>setF('email',e.target.value)} />
                {errors.email && <span className="error-msg">{errors.email}</span>}
              </div>

              <label className="label">Password</label>
              <div className="input-wrap">
                <span className="input-icon"><LockIcon/></span>
                <input type={showPass?'text':'password'} className={`form-input ${errors.password || errors.formKey ? 'error' : ''}`} placeholder="Min. 8 characters"
                  value={form.password} onChange={e=>setF('password',e.target.value)} />
                <button type="button" className="eye-btn" onClick={()=>setShowPass(v=>!v)}>
                  {showPass?<EyeOpen/>:<EyeClosed/>}
                </button>
                {errors.password && <span className="error-msg">{errors.password}</span>}
              </div>

              {tab === 'signup' && (
                <>
                  <label className="label">Confirm Password</label>
                  <div className="input-wrap">
                    <span className="input-icon"><LockIcon/></span>
                    <input type="password" className={`form-input ${errors.confirm_password || errors.formKey ? 'error' : ''}`} placeholder="••••••••"
                      value={form.confirm_password} onChange={e=>setF('confirm_password',e.target.value)} />
                    {errors.confirm_password && <span className="error-msg">{errors.confirm_password}</span>}
                  </div>

                  <label className="label" style={{ marginTop: 20 }}>I AM A</label>
                  <div className="role-row">
                    <button type="button" className={`role-btn ${form.role==='user'?'active':''}`} onClick={()=>setF('role','user')}>🧑 Citizen</button>
                    <button type="button" className={`role-btn ${form.role==='advocate'?'active':''}`} onClick={()=>setF('role','advocate')}>⚖️ Advocate</button>
                  </div>
                </>
              )}

              {tab === 'login' && (
                <div style={{ textAlign: 'right', marginBottom: 20 }}>
                  <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Forgot password?</a>
                </div>
              )}

              <button type="submit" disabled={loading} className="submit-btn" style={{ marginTop: tab==='signup'?8:0 }}>
                {loading ? <><span className="spinner"/> {tab === 'signup' ? 'Creating...' : 'Logging in...'}</> : (tab === 'signup' ? 'Create Account' : 'Login')}
              </button>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}
