import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Toast,
  useToast,
  GoogleSignInButton,
  Input,
  Divider,
  EyeIcon,
  SpinnerIcon,
  ScalesIcon,
} from "../components/AuthComponents";

export default function LoginPage() {
  const { toasts, toast, remove } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const redirectByRole = (role) => {
    const routes = { admin: "/admin", advocate: "/advocate", user: "/dashboard" };
    navigate(routes[role] || "/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await login({ email: form.email.trim().toLowerCase(), password: form.password });
    setLoading(false);
    if (result.success) {
      toast(`Welcome back, ${result.user.full_name}!`, 'success');
      setTimeout(() => redirectByRole(result.user.role), 1000);
    } else {
      toast(result.message || 'Incorrect email or password.', 'error');
      setErrors({ password: result.message || 'Incorrect email or password.' });
    }
  };


  const handleGoogleSuccess = (data) => {
    toast(`Welcome back, ${data.user.full_name}!`, "success");
    setTimeout(() => redirectByRole(data.user.role), 1000);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
      <Toast toasts={toasts} remove={remove} />

      {/* Left panel */}
      <div style={{
        width: "42%", background: "linear-gradient(160deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 52px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }} />
        <div style={{ position: "absolute", bottom: 60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.12)" }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 80 }}>
            <div style={{ color: "#818CF8" }}><ScalesIcon /></div>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>AI Legal Assistant</span>
          </div>
          <div style={{ color: "#818CF8", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>
            Welcome back
          </div>
          <h2 style={{ color: "#fff", fontSize: 36, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-1px", margin: "0 0 20px" }}>
            Your legal assistant is ready
          </h2>
          <p style={{ color: "#94A3B8", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            Continue where you left off. Your advice history, documents, and cases are waiting.
          </p>
        </div>

        {/* Testimonial */}
        <div style={{ position: "relative", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px" }}>
          <p style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 1.7, margin: "0 0 16px", fontStyle: "italic" }}>
            "Finally understood my rights as a tenant. The AI explained it so clearly, I filed the complaint myself!"
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>RS</div>
            <div>
              <div style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 600 }}>Ritu Sharma</div>
              <div style={{ color: "#64748B", fontSize: 12 }}>Citizen, Mumbai</div>
            </div>
            <div style={{ marginLeft: "auto", color: "#FBBF24", fontSize: 13 }}>★★★★★</div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", margin: "0 0 6px" }}>Sign in</h1>
            <p style={{ color: "#6B7280", fontSize: 15, margin: 0 }}>Login to your AI Legal Assistant account</p>
          </div>

          {/* Google sign-in */}
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={(msg) => toast(msg, "error")}
            label="Continue with Google"
          />

          <Divider text="or sign in with email" />

          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="Email address" type="email" value={form.email} onChange={set("email")}
              placeholder="you@example.com" error={errors.email} required
            />

            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Password <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <button type="button" onClick={() => navigate('/forgot-password')} style={{ background: "none", border: "none", fontSize: 13, color: "#6366F1", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} value={form.password}
                  onChange={set("password")} placeholder="Your password"
                  style={{
                    width: "100%", padding: "11px 44px 11px 14px",
                    border: `1.5px solid ${errors.password ? "#FCA5A5" : "#E5E7EB"}`,
                    borderRadius: 10, fontSize: 14, color: "#111827",
                    background: errors.password ? "#FFF5F5" : "#FAFAFA",
                    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#6366F1"; e.target.style.background = "#fff"; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.password ? "#FCA5A5" : "#E5E7EB"; }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: 0 }}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
              {errors.password && <p style={{ margin: "4px 0 10px", fontSize: 12, color: "#EF4444" }}>{errors.password}</p>}
            </div>

            {/* Remember me */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, marginTop: 8 }}>
              <div
                onClick={() => setRememberMe(!rememberMe)}
                style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${rememberMe ? "#6366F1" : "#D1D5DB"}`,
                  background: rememberMe ? "#6366F1" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", cursor: "pointer",
                }}
              >
                {rememberMe && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: "#6B7280", cursor: "pointer" }} onClick={() => setRememberMe(!rememberMe)}>
                Remember me for 7 days
              </span>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "13px 24px", background: loading ? "#A5B4FC" : "#4F46E5",
                color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
                fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit", transition: "all 0.2s", letterSpacing: "-0.2px",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#4338CA"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#4F46E5"; }}
            >
              {loading ? <><SpinnerIcon /> Signing in…</> : "Sign in →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "#6B7280" }}>
            Don't have an account?{" "}
            <button onClick={() => navigate("/signup")} style={{ background: "none", border: "none", color: "#4F46E5", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
              Sign up free
            </button>
          </p>

          {/* Role hint */}
          <div style={{ marginTop: 32, padding: "14px 16px", background: "#EEF2FF", borderRadius: 10, border: "1px solid #C7D2FE" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#4338CA", fontWeight: 600, marginBottom: 6 }}>After sign-in, you'll be redirected to:</p>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6366F1" }}>
              <span>👤 User → /dashboard</span>
              <span>⚖️ Advocate → /advocate</span>
              <span>🛡️ Admin → /admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
