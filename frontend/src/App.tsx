import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AITutor from './pages/AITutor';
import NotesLibrary from './pages/NotesLibrary';
import StudyGroups from './pages/StudyGroups';
import PastPapers from './pages/PastPapers';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  // Initialize from localStorage so refresh doesn't log the user out
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('studybuddy_token');
  });

  // Quick helper to read user role
  let isRoleAdmin = false;
  if (isAuthenticated) {
    try {
      const userString = localStorage.getItem('studybuddy_user');
      if (userString) {
        const user = JSON.parse(userString);
        isRoleAdmin = user.username === 'Aqua_Slovic' && user.phone === '+265992393452';
      }
    } catch { /* ignore */ }
  }

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={isRoleAdmin ? <AdminDashboard /> : <Dashboard />} />
          <Route path="tutor" element={<AITutor />} />
          <Route path="notes" element={<NotesLibrary />} />
          <Route path="papers" element={<PastPapers />} />
          <Route path="groups" element={<StudyGroups />} />
        </Route>
        {/* Redirect /login to root — auth is handled by App state */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
