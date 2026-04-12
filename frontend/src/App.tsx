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

  return (
    <BrowserRouter>
      <Routes>
        {/* If visiting /login directly but already authenticated, go to dashboard */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Auth onLogin={() => setIsAuthenticated(true)} />} />
        
        {/* Entry point of the site */}
        <Route path="/" element={isAuthenticated ? <Layout /> : <Auth onLogin={() => setIsAuthenticated(true)} />}>
          {isAuthenticated && (
            <>
              <Route index element={isRoleAdmin ? <AdminDashboard /> : <Dashboard />} />
              <Route path="tutor" element={<AITutor />} />
              <Route path="notes" element={<NotesLibrary />} />
              <Route path="papers" element={<PastPapers />} />
              <Route path="groups" element={<StudyGroups />} />
            </>
          )}
        </Route>
        
        {/* Catch-all: redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
