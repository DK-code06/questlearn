import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, BookOpen, Users, BarChart3, Edit, 
  Trash2, Star, AlertCircle 
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import ReportIssueModal from '../../components/ReportIssueModal'; // ✅ Import Modal

const InstructorDashboard = () => {
  const { user, logout } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isIssueOpen, setIsIssueOpen] = useState(false); // ✅ Issue Modal state

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const res = await api.get('/courses/my-courses'); 
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
        try {
            await api.delete(`/courses/${courseId}`);
            setCourses(courses.filter(course => course._id !== courseId));
        } catch (err) {
            alert("Failed to delete course. Please try again.");
        }
    }
  };

  // ✅ NEW: Dynamic Stats Calculation
  const totalStudents = courses.reduce((acc, curr) => acc + (curr.enrolledStudents?.length || 0), 0);
  
  const calculateAvgRating = () => {
    const ratedCourses = courses.filter(c => c.averageRating > 0);
    if (ratedCourses.length === 0) return "0.0";
    const sum = ratedCourses.reduce((acc, curr) => acc + curr.averageRating, 0);
    return (sum / ratedCourses.length).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans p-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-12 border-b border-gray-800 pb-6">
        <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                CREATOR STUDIO
            </h1>
            <p className="text-gray-400 mt-2 italic">Welcome back, <span className="text-white font-bold">{user?.name}</span></p>
        </div>
        <div className="flex items-center gap-6">
            {/* 🛠️ Report Button */}
            <button 
                onClick={() => setIsIssueOpen(true)}
                className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-xs font-bold transition-all uppercase tracking-widest"
            >
                <AlertCircle size={14} /> Report Issue
            </button>

            <button onClick={logout} className="text-gray-500 hover:text-white font-bold px-4">Logout</button>
            <button 
                onClick={() => navigate('/instructor/create-course')}
                className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
                <Plus size={20} /> New Course
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 flex items-center gap-4 hover:border-purple-500/50 transition-colors">
            <div className="bg-purple-900/50 p-3 rounded-lg text-purple-400"><BookOpen size={24} /></div>
            <div>
                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total Courses</h3>
                <p className="text-3xl font-black text-white">{courses.length}</p>
            </div>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 flex items-center gap-4 hover:border-green-500/50 transition-colors">
            <div className="bg-green-900/50 p-3 rounded-lg text-green-400"><Users size={24} /></div>
            <div>
                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total Students</h3>
                <p className="text-3xl font-black text-white">{totalStudents}</p>
            </div>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 flex items-center gap-4 hover:border-yellow-500/50 transition-colors">
            <div className="bg-yellow-900/30 p-3 rounded-lg text-yellow-400"><Star size={24} fill="currentColor" /></div>
            <div>
                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Global Rating</h3>
                <p className="text-3xl font-black text-white">{calculateAvgRating()}</p>
            </div>
        </div>
      </div>

      {/* Course List */}
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <Edit className="text-purple-500" /> Your Content
      </h2>
      
      {loading ? (
        <div className="flex items-center gap-3 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-purple-500"></div>
            <span>Syncing Creator Studio...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
            <h3 className="text-xl font-bold text-gray-300 mb-2">The Studio is Empty</h3>
            <p className="text-gray-500 mb-6 uppercase text-xs font-bold tracking-widest">Your teaching legacy hasn't started yet.</p>
            <button onClick={() => navigate('/instructor/create-course')} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-black transition-all">Create First Course</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
                <div key={course._id} className="bg-gray-900/50 rounded-3xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all group shadow-2xl">
                    
                    <div className="h-44 bg-gray-800 relative">
                        {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-700 font-black text-5xl">
                                {course.title.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black text-white border border-gray-700 uppercase tracking-tighter">
                            {course.category || 'General'}
                        </div>
                        <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-yellow-500 text-black px-2 py-1 rounded text-[10px] font-black">
                            <Star size={10} fill="black" /> {course.averageRating?.toFixed(1) || "0.0"}
                        </div>
                    </div>

                    <div className="p-6">
                        <h3 className="font-black text-xl text-white mb-2 truncate group-hover:text-purple-400 transition-colors">{course.title}</h3>
                        <p className="text-gray-500 text-xs mb-6 line-clamp-2 h-8 italic">{course.description || "No mission brief provided."}</p>
                        
                        <div className="flex gap-3 mt-4">
                            <button 
                                onClick={() => navigate(`/instructor/course/${course._id}`)} 
                                className="flex-1 bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-black text-xs text-white transition-all shadow-lg shadow-purple-900/20"
                            >
                                MANAGE QUEST
                            </button>
                            
                            <button 
                                onClick={() => handleDelete(course._id)}
                                className="px-4 bg-red-900/20 hover:bg-red-500 hover:text-white text-red-500 rounded-xl border border-red-900/30 transition-all"
                                title="Delete Course"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Issue Modal Integration */}
      {isIssueOpen && (
          <ReportIssueModal 
              user={user} 
              onClose={() => setIsIssueOpen(false)} 
          />
      )}
    </div>
  );
};

export default InstructorDashboard;