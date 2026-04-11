import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

import LandingPage      from './pages/LandingPage';
import LoginPage      from './pages/LoginPage';
import SignupPage     from './pages/SignupPage';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';
import UserDashboard    from './pages/UserDashboard';
import AdvocateDashboard from './pages/AdvocateDashboard';
import AdminDashboard   from './pages/AdminDashboard';
import ChatPage         from './pages/ChatPage';
import DocumentPage     from './pages/DocumentPage';
import ConstitutionPage from './pages/ConstitutionPage';
import SettingsPage     from './pages/SettingsPage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/"        element={<LandingPage />} />
      <Route path="/login"   element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'advocate' ? '/advocate' : '/dashboard'} /> : <LoginPage />} />
      <Route path="/signup"  element={user ? <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'advocate' ? '/advocate' : '/dashboard'} /> : <SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      <Route path="/dashboard" element={
        <ProtectedRoute roles={['user']}><UserDashboard /></ProtectedRoute>
      } />
      <Route path="/dashboard/chat" element={
        <ProtectedRoute roles={['user']}><ChatPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/documents" element={
        <ProtectedRoute roles={['user']}><DocumentPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/constitution" element={
        <ProtectedRoute roles={['user']}><ConstitutionPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/settings" element={
        <ProtectedRoute roles={['user']}><SettingsPage /></ProtectedRoute>
      } />

      <Route path="/advocate" element={
        <ProtectedRoute roles={['advocate']}><AdvocateDashboard /></ProtectedRoute>
      } />
      <Route path="/advocate/chat" element={
        <ProtectedRoute roles={['advocate']}><ChatPage /></ProtectedRoute>
      } />
      <Route path="/advocate/documents" element={
        <ProtectedRoute roles={['advocate']}><DocumentPage /></ProtectedRoute>
      } />
      <Route path="/advocate/constitution" element={
        <ProtectedRoute roles={['advocate']}><ConstitutionPage /></ProtectedRoute>
      } />
      <Route path="/advocate/settings" element={
        <ProtectedRoute roles={['advocate']}><SettingsPage /></ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
