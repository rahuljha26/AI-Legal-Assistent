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
  CheckIcon,
  SpinnerIcon,
  ScalesIcon,
  getPasswordStrength,
} from "../components/AuthComponents";

export default function SignUpPage() {
  const { toasts, toast, remove } = useToast();
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm_password: "", role: "user" });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const pwStrength = getPasswordStrength(form.password);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    else if (form.full_name.trim().length < 2) e.full_name = "Name must be at least 2 characters";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (!form.confirm_password) e.confirm_password = "Please confirm your password";
    else if (form.password !== form.confirm_password) e.confirm_password = "Passwords do not match";
    if (!agreed) e.agreed = "You must accept the terms to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const focusFirstError = (errorsObj) => {
    if (errorsObj.full_name) document.getElementById('signup-fullname')?.focus();
    else if (errorsObj.email) document.getElementById('signup-email')?.focus();
    else if (errorsObj.password) document.getElementById('signup-password')?.focus();
    else if (errorsObj.confirm_password) document.getElementById('signup-confirm-password')?.focus();
    else if (errorsObj.agreed) document.getElementById('signup-terms-btn')?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setTimeout(() => {
        const eCopy = {};
        if (!form.full_name.trim()) eCopy.full_name = true;
        else if (form.full_name.trim().length < 2) eCopy.full_name = true;
        if (!form.email.trim()) eCopy.email = true;
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) eCopy.email = true;
        if (!form.password) eCopy.password = true;
        else if (form.password.length < 8) eCopy.password = true;
        if (!form.confirm_password) eCopy.confirm_password = true;
        else if (form.password !== form.confirm_password) eCopy.confirm_password = true;
        if (!agreed) eCopy.agreed = true;
        focusFirstError(eCopy);
      }, 0);
      return;
    }
    setLoading(true);
    try {
      const res = await signup({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirm_password: form.confirm_password,
        role: form.role,
      });
      if (res.success) {
        setSuccess(true);
        toast("Account created! Redirecting to login…", "success");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        if (res.errors && typeof res.errors === "object" && Object.keys(res.errors).length > 0) {
          const fieldErrors = {};
          Object.entries(res.errors).forEach(([k, v]) => {
            fieldErrors[k] = Array.isArray(v) ? v[0] : String(v);
          });
          setErrors(fieldErrors);
        } else {
          toast(res.message || "Sign up failed. Please try again.", "error");
        }
      }
    } catch (error) {
      console.error("Signup Submission Error:", error);
      toast("Connection error. Please check your internet and backend server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = (role) => {
    const routes = { admin: "/admin", advocate: "/advocate", user: "/dashboard" };
    navigate(routes[role] || "/dashboard");
  };

  const handleGoogleSuccess = (data) => {
    toast(`Welcome, ${data.user.full_name}!`, "success");
    setTimeout(() => redirectByRole(data.user.role), 1000);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
      <Toast toasts={toasts} remove={remove} />

      {/* Left panel */}
      <div style={{
        width: "42%", background: "var(--bg-page)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 52px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.15)" }} />
        <div style={{ position: "absolute", bottom: 60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.12)" }} />
        <div style={{ position: "absolute", top: "50%", left: "60%", width: 120, height: 120, borderRadius: "50%", background: "rgba(234,88,12,0.05)", border: "1px solid rgba(234,88,12,0.1)" }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 64 }}>
            <div style={{ color: "var(--primary)" }}><ScalesIcon /></div>
            <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>AI Legal Assistant</span>
          </div>
          <div style={{ color: "var(--primary)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 16 }}>
            Get started free
          </div>
          <h2 style={{ color: "#ffffff", fontSize: 36, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-1px", margin: "0 0 20px" }}>
            Justice made accessible with AI
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            Get instant legal guidance powered by the Indian Constitution and Gemini AI. Free for every citizen.
          </p>
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { icon: "⚖️", title: "AI legal guidance", desc: "Instant answers backed by Indian Constitution" },
            { icon: "📄", title: "Document generator", desc: "Create legal notices and affidavits in seconds" },
            { icon: "🔒", title: "Secure & private", desc: "Your data is encrypted and never shared" },
          ].map((item) => (
            <div key={item.title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(234,88,12,0.15)", border: "1px solid rgba(234,88,12,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ color: "#E2E8F0", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                <div style={{ color: "#64748B", fontSize: 12 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px", overflowY: "auto", position: "relative" }}>
        
        {/* Background glow effects for right panel */}
        <div style={{ position: "absolute", top: "10%", right: "10%", width: 300, height: 300, background: "radial-gradient(circle, rgba(234,88,12,0.2) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)" }}></div>
        <div style={{ position: "absolute", bottom: "10%", left: "10%", width: 250, height: 250, background: "radial-gradient(circle, rgba(234,88,12,0.15) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)" }}></div>

        <div style={{ 
          width: "100%", maxWidth: 440, background: "var(--bg-card)", backdropFilter: "blur(12px)", 
          padding: "40px", borderRadius: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid var(--border)",
          marginTop: "40px", marginBottom: "40px"
        }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ECFDF5", border: "2px solid #6EE7B7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32 }}>✓</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-heading)", marginBottom: 8 }}>You're all set!</h2>
              <p style={{ color: "var(--text-muted)", fontSize: 15 }}>Account created. Redirecting you to login…</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-heading)", letterSpacing: "-0.5px", margin: "0 0 6px" }}>Create your account</h1>
                <p style={{ color: "var(--text-muted)", fontSize: 15, margin: 0 }}>Start your free legal journey today</p>
              </div>

              {/* Google sign-up */}
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                onError={(msg) => toast(msg, "error")}
                label="Sign up with Google"
              />

              <Divider text="or sign up with email" />

              <form onSubmit={handleSubmit} noValidate>
                <Input
                  id="signup-fullname"
                  label="Full name" value={form.full_name} onChange={set("full_name")}
                  placeholder="Rahul Jha" error={errors.full_name} required
                />
                <Input
                  id="signup-email"
                  label="Email address" type="email" value={form.email} onChange={set("email")}
                  placeholder="you@example.com" error={errors.email} required
                />

                {/* Password with strength meter */}
                <div style={{ marginBottom: 6 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
                    Password <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="signup-password"
                      type={showPw ? "text" : "password"} value={form.password}
                      onChange={set("password")} placeholder="Min. 8 characters"
                      style={{
                        width: "100%", padding: "11px 44px 11px 14px",
                        border: `1.5px solid ${errors.password ? "var(--danger)" : "var(--border)"}`,
                        borderRadius: 10, fontSize: 14, color: "var(--text-heading)",
                        background: errors.password ? "var(--danger-bg)" : "transparent",
                        outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; e.target.style.background = "var(--bg-page)"; }}
                      onBlur={(e) => { e.target.style.borderColor = errors.password ? "var(--danger)" : "var(--border)"; e.target.style.background = errors.password ? "var(--danger-bg)" : "transparent"; }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                  {errors.password && <p style={{ margin: "4px 0 6px", fontSize: 12, color: "var(--danger)" }}>{errors.password}</p>}
                  {form.password && (
                    <div style={{ marginTop: 8, marginBottom: 10 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pwStrength.score ? pwStrength.color : "var(--border)", transition: "background 0.3s" }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: pwStrength.color }}>{pwStrength.label}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
                    Confirm password <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="signup-confirm-password"
                      type={showConfirm ? "text" : "password"} value={form.confirm_password}
                      onChange={set("confirm_password")} placeholder="Repeat password"
                      style={{
                        width: "100%", padding: "11px 44px 11px 14px",
                        border: `1.5px solid ${errors.confirm_password ? "var(--danger)" : form.confirm_password && form.confirm_password === form.password ? "#6EE7B7" : "var(--border)"}`,
                        borderRadius: 10, fontSize: 14, color: "var(--text-heading)",
                        background: errors.confirm_password ? "var(--danger-bg)" : "transparent",
                        outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; e.target.style.background = "var(--bg-page)"; }}
                      onBlur={(e) => { e.target.style.borderColor = errors.confirm_password ? "var(--danger)" : "var(--border)"; }}
                    />
                    <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
                      {form.confirm_password && form.confirm_password === form.password && (
                        <span style={{ color: "#10B981" }}><CheckIcon /></span>
                      )}
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}>
                        <EyeIcon open={showConfirm} />
                      </button>
                    </div>
                  </div>
                  {errors.confirm_password && <p style={{ margin: "4px 0 10px", fontSize: 12, color: "var(--danger)" }}>{errors.confirm_password}</p>}
                </div>

                {/* Role selector */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>
                    I am a <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      { value: "user", label: "Citizen / User", icon: "👤" },
                      { value: "advocate", label: "Advocate", icon: "⚖️" },
                    ].map((r) => (
                      <button
                        key={r.value} type="button"
                        role="radio"
                        aria-checked={form.role === r.value}
                        onClick={() => setForm({ ...form, role: r.value })}
                        style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                          fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                          border: `2px solid ${form.role === r.value ? "var(--primary)" : "var(--border)"}`,
                          background: form.role === r.value ? "rgba(234, 88, 12, 0.1)" : "#fff",
                          color: form.role === r.value ? "#c2410c" : "var(--text-muted)",
                          outline: "none",
                        }}
                        onFocus={(e) => e.target.style.boxShadow = "0 0 0 3px rgba(234,88,12,0.2)"}
                        onBlur={(e) => e.target.style.boxShadow = "none"}
                      >
                        <span>{r.icon}</span>{r.label}
                      </button>
                    ))}
                  </div>
                  {form.role === "advocate" && (
                    <p style={{ margin: "8px 0 0", fontSize: 12, color: "#D97706", background: "#FFFBEB", padding: "8px 12px", borderRadius: 8, border: "1px solid #FDE68A" }}>
                      ⚠️ Advocate accounts require admin verification before activation.
                    </p>
                  )}
                </div>

                {/* Terms checkbox */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", userSelect: "none" }}>
                    <button
                      id="signup-terms-btn"
                      type="button"
                      role="checkbox"
                      aria-checked={agreed}
                      onClick={(e) => { e.preventDefault(); setAgreed(!agreed); setErrors({ ...errors, agreed: "" }); }}
                      style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1, padding: 0,
                        border: `2px solid ${errors.agreed ? "var(--danger)" : agreed ? "var(--primary)" : "#D1D5DB"}`,
                        background: agreed ? "var(--primary)" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s", cursor: "pointer", outline: "none",
                      }}
                      onFocus={(e) => e.target.style.boxShadow = "0 0 0 3px rgba(234,88,12,0.2)"}
                      onBlur={(e) => e.target.style.boxShadow = "none"}
                    >
                      {agreed && <span style={{ color: "#ffffff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                    </button>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                      I agree to the{" "}
                      <a href="#" style={{ color: "var(--primary)", fontWeight: 600 }}>Terms of Service</a>
                      {" "}and{" "}
                      <a href="#" style={{ color: "var(--primary)", fontWeight: 600 }}>Privacy Policy</a>
                    </span>
                  </label>
                  {errors.agreed && <p style={{ margin: "4px 0 0 28px", fontSize: 12, color: "var(--danger)" }}>{errors.agreed}</p>}
                </div>

                <button
                  type="submit" disabled={loading}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "13px 24px", background: loading ? "rgba(234,88,12,0.5)" : "var(--primary)",
                    color: "#ffffff", border: "none", borderRadius: 10, fontSize: 15,
                    fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit", transition: "all 0.2s", letterSpacing: "-0.2px",
                  }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#c2410c"; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "var(--primary)"; }}
                >
                  {loading ? <><SpinnerIcon /> Creating account…</> : "Create account →"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-muted)" }}>
                Already have an account?{" "}
                <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
