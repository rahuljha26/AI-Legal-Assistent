/**
 * GitHubCallback.tsx
 *
 * This page is loaded inside the GitHub OAuth popup after the user authorizes.
 * GitHub redirects to: /oauth/github/callback?code=xxx&state=yyy
 *
 * This page reads the `code` query param and posts it back to the opener
 * window via postMessage, then closes itself.
 */
import { useEffect } from "react";

export default function GitHubCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code  = params.get("code");
    const error = params.get("error");

    if (error || !code) {
      // Signal failure back to the opener
      window.opener?.postMessage(
        { type: "GITHUB_OAUTH_ERROR", error: error || "No code received" },
        window.location.origin
      );
      window.close();
      return;
    }

    // Send the code to the parent window (Login / SignUp page)
    window.opener?.postMessage(
      { type: "GITHUB_OAUTH_CODE", code },
      window.location.origin
    );

    window.close();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0F172A",
        color: "#fff",
        fontFamily: "'DM Sans', sans-serif",
        gap: 16,
      }}
    >
      {/* Simple spinner */}
      <svg
        width="40" height="40" viewBox="0 0 24 24"
        fill="none" stroke="#818CF8" strokeWidth="2.5"
        style={{ animation: "spin 0.9s linear infinite" }}
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </svg>
      <p style={{ fontSize: 15, color: "#94A3B8" }}>
        Completing GitHub sign-in…
      </p>
    </div>
  );
}
