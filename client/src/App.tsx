import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Public Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import CourseDetail from './pages/student/CourseDetail';
import LessonPlayer from './pages/student/LessonPlayer';
import SocialHub from './pages/student/SocialHub';
import Leaderboard from './pages/student/Leaderboard';
import HeroShop from './pages/student/HeroShop';
import StudentProfile from './pages/student/StudentProfile';
import BattleHub from './pages/student/BattleHub'; 
import BattleArena from './pages/student/BattleArena'; 

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import CreateCourse from './pages/instructor/CreateCourse';
import ManageCourse from './pages/instructor/ManageCourse';
import CreateProblem from './pages/instructor/CreateProblem'; 
import ManageProblems from './pages/instructor/ManageProblems';
// ✅ IMPORT EDIT PROBLEM HERE:
import EditProblem from './pages/instructor/EditProblem';

// Components
import GameInterface from './components/GameInterface';

// Admin Page
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* 🔓 PUBLIC ACCESS */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 🛡️ STUDENT PROTECTED SECTOR */}
          <Route element={<PrivateRoute allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/social" element={<SocialHub />} />
            <Route path="/student/rankings" element={<Leaderboard />} />
            <Route path="/student/shop" element={<HeroShop />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/course/:id" element={<CourseDetail />} />
            <Route path="/student/course/:courseId/play/:sectionIndex" element={<LessonPlayer />} />
            <Route path="/student/game" element={<GameInterface />} />
            <Route path="/student/battle-hub" element={<BattleHub />} />
            <Route path="/student/battle/:roomId" element={<BattleArena />} />
          </Route>

          {/* 🛡️ INSTRUCTOR PROTECTED SECTOR */}
          <Route element={<PrivateRoute allowedRoles={['instructor']} />}>
            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
            <Route path="/instructor/create-course" element={<CreateCourse />} />
            <Route path="/instructor/course/:id" element={<ManageCourse />} />
            <Route path="/instructor/manage-problems" element={<ManageProblems />} />
            <Route path="/instructor/create-problem" element={<CreateProblem />} />
            {/* ✅ ADD THE EDIT PROBLEM ROUTE HERE: */}
            <Route path="/instructor/edit-problem/:id" element={<EditProblem />} />
          </Route>

          {/* 🚀 ADMIN COMMAND CENTER */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* 🔄 AUTOMATIC REDIRECT */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;