import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AITutor from './pages/AITutor';
import NotesLibrary from './pages/NotesLibrary';
import StudyGroups from './pages/StudyGroups';
import PastPapers from './pages/PastPapers';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Quick helper to read user role
  let isRoleAdmin = false;
  if (isAuthenticated) {
    try {
      const userString = localStorage.getItem('studybuddy_user');
      if (userString) {
        const user = JSON.parse(userString);
        isRoleAdmin = user.role === 'ADMIN';
      }
    } catch(e){}
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
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
