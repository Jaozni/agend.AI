import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import NotesPage from './pages/NotesPage';
import ErrorBoundary from './components/ErrorBoundary';

import { useReminder } from './hooks/useReminder';

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }) => {
  const userName = useStore((state) => state.userName);
  return userName ? children : <Navigate to="/login" replace />;
};

function App() {
  const theme = useStore((state) => state.settings?.theme || 'light');

  // Ativar sistema de lembretes
  useReminder();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <CalendarPage />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/settings" element={
            <PrivateRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/notes" element={
            <PrivateRoute>
              <Layout>
                <NotesPage />
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
