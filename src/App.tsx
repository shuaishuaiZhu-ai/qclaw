import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Conversations from './pages/Conversations';
import Skills from './pages/Skills';
import Channels from './pages/Channels';
import Settings from './pages/Settings';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const refresh = useAppStore((state) => state.refresh);

  useEffect(() => {
    void refresh();
    let timer: ReturnType<typeof window.setInterval> | null = window.setInterval(() => void refresh(), 8000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timer !== null) {
          window.clearInterval(timer);
          timer = null;
        }
      } else {
        void refresh();
        timer = window.setInterval(() => void refresh(), 8000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timer !== null) window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="skills" element={<Skills />} />
          <Route path="channels" element={<Channels />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
