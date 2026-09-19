import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PageTransition } from './components/PageTransition';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { DisasterDetailPage } from './pages/DisasterDetailPage';
import { PreparePage } from './pages/PreparePage';
import { QuizPage } from './pages/QuizPage';
import { GuidePage } from './pages/GuidePage';
import { CampusPage } from './pages/CampusPage';
import { DisasterArchives } from './pages/DisasterArchives';
import { ProfilePage } from './pages/ProfilePage';
import { StudentDashboard } from './pages/StudentDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';

import { AuthProvider } from './context/AuthContext';

function AppShell() {
  return (
    <div className="min-h-screen bg-[#000] text-white">
      <Navbar />
      <main className="pt-24">
        <PageTransition>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/:slug" element={<DisasterDetailPage />} />
            <Route path="/prepare" element={<PreparePage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/campus" element={<CampusPage />} />
            <Route path="/disasters" element={<DisasterArchives />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

