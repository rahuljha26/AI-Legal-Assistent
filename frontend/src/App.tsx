import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login    from "./pages/Login";
import SignUp   from "./pages/SignUp";
import UserDashboard     from "./pages/UserDashboard";
import AdvocateDashboard from "./pages/AdvocateDashboard";
import AdminDashboard    from "./pages/AdminDashboard";

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isLoggedIn, isLoading, user } = useAuth();
  if (isLoading) return <div style={{color:"#fff",textAlign:"center",marginTop:80}}>Loading...</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    if (user.role === "admin")    return <Navigate to="/admin/dashboard"    replace />;
    if (user.role === "advocate") return <Navigate to="/advocate/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function SmartRedirect() {
  const { isLoggedIn, user, isLoading } = useAuth();
  if (isLoading)   return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.role === "admin")    return <Navigate to="/admin/dashboard"    replace />;
  if (user?.role === "advocate") return <Navigate to="/advocate/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"       element={<SmartRedirect />} />
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected: citizen */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={["user"]}>
              <UserDashboard />
            </ProtectedRoute>
          } />

          {/* Protected: advocate */}
          <Route path="/advocate/dashboard" element={
            <ProtectedRoute roles={["advocate"]}>
              <AdvocateDashboard />
            </ProtectedRoute>
          } />

          {/* Protected: admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
