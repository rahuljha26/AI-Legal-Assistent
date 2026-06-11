import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OAuthButtons, { OAuthDivider, type OAuthUser } from "../components/OAuthButtons";

export default function Login() {
  const navigate        = useNavigate();
  const { login, refreshUser } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Role → route mapping
  const getDashboardRoute = (role: string): string => {
    switch (role) {
      case "admin":    return "/admin/dashboard";
      case "advocate": return "/advocate/dashboard";
      case "user":
      default:         return "/dashboard";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Email is required");    return; }
    if (!password)      { setError("Password is required"); return; }

    setLoading(true);
    try {
      await login(email, password);

      const savedUser = localStorage.getItem("user");
      if (!savedUser) throw new Error("User data not saved");

      const userData = JSON.parse(savedUser);
      navigate(getDashboardRoute(userData.role), { replace: true });

    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string }; status?: number }
        message?: string
      };

      if (axiosErr.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (axiosErr.response?.status === 403) {
        setError("Your account has been deactivated. Contact support.");
      } else if (axiosErr.response?.data?.message) {
        setError(axiosErr.response.data.message);
      } else if (axiosErr.message) {
        setError(axiosErr.message);
      } else {
        setError("Login failed. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Called after successful Google or GitHub OAuth
  const handleOAuthSuccess = (user: OAuthUser) => {
    refreshUser();
    navigate(getDashboardRoute(user.role), { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
                  justifyContent: "center", background: "#0F172A" }}>
      <div style={{ background: "#1E293B", borderRadius: 16, padding: "40px 36px",
                    width: "100%", maxWidth: 420, border: "1px solid #334155" }}>

        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Login
        </h1>
        <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 28 }}>
          Sign in to your AI Legal Assistant account
        </p>

        {/* ── OAuth Buttons ─────────────────────────────────────── */}
        <OAuthButtons
          onSuccess={handleOAuthSuccess}
          onError={(msg) => setError(msg)}
          googleLabel="Continue with Google"
          githubLabel="Continue with GitHub"
        />

        <OAuthDivider text="or sign in with email" />

        {/* ── Error banner ──────────────────────────────────────── */}
        {error && (
          <div style={{ background: "#7F1D1D", border: "1px solid #EF4444",
                        color: "#FCA5A5", padding: "12px 16px", borderRadius: 8,
                        fontSize: 14, marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: 12,
                            fontWeight: 600, textTransform: "uppercase",
                            letterSpacing: "0.5px", marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              style={{ width: "100%", padding: "11px 14px", background: "#0F172A",
                       border: "1px solid #334155", borderRadius: 8, color: "#fff",
                       fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: "#94A3B8", fontSize: 12,
                            fontWeight: 600, textTransform: "uppercase",
                            letterSpacing: "0.5px", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              style={{ width: "100%", padding: "11px 14px", background: "#0F172A",
                       border: "1px solid #334155", borderRadius: 8, color: "#fff",
                       fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "13px", background: loading ? "#3B4ECC" : "#4F46E5",
                     color: "#fff", border: "none", borderRadius: 8, fontSize: 15,
                     fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#64748B" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#818CF8", fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
