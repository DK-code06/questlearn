import { useState, useEffect } from 'react';
import { 
  Users, BookOpen, AlertTriangle, BarChart3, Trash2, 
  ShieldCheck, Clock, Zap, Target, RefreshCcw,
  CheckCircle, XCircle, FileText 
} from 'lucide-react';
import api from '../../utils/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [detailedData, setDetailedData] = useState<{students: any[], instructors: any[]}>({ students: [], instructors: [] });
    const [engagementData, setEngagementData] = useState<any[]>([]); 
    const [issues, setIssues] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAdminData = async () => {
        try {
            // 1. High-level counts
            const statRes = await api.get('/admin/stats');
            setStats(statRes.data);

            // 2. Student progress & Instructor lists
            const detailRes = await api.get('/admin/users/details');
            setDetailedData(detailRes.data);

            // 3. System-wide issue reports
            const issueRes = await api.get('/admin/issues');
            setIssues(issueRes.data);

            // 4. Per-user engagement timing logic
            const engagementRes = await api.get('/admin/engagement/details');
            setEngagementData(engagementRes.data);

            // 5. Pending Instructor Requests
            const appRes = await api.get('/admin/instructor-requests');
            setApplications(appRes.data);

            setLoading(false);
        } catch (err) {
            console.error("Failed to load command centre data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const deleteUser = async (id: string, role: string) => {
        if(window.confirm(`Banish this ${role} forever? All data will be wiped.`)) {
            try {
                await api.delete(`/admin/user/${id}`);
                if (role === 'student') {
                    setDetailedData(prev => ({ ...prev, students: prev.students.filter(u => u._id !== id) }));
                } else {
                    setDetailedData(prev => ({ ...prev, instructors: prev.instructors.filter(u => u._id !== id) }));
                }
            } catch (err) { alert("Action failed."); }
        }
    };

    // --- APPLICATION HANDLERS ---
    const handleApprove = async (id: string) => {
        try {
            const res = await api.post(`/admin/instructor-requests/${id}/approve`);
            alert(res.data.msg); // This shows the default password!
            setApplications(prev => prev.filter(app => app._id !== id));
            fetchAdminData(); // Refresh instructor list
        } catch (err: any) {
            alert(err.response?.data?.msg || "Failed to approve.");
        }
    };

    const handleReject = async (id: string) => {
        if(window.confirm("Are you sure you want to reject this applicant?")) {
            try {
                await api.post(`/admin/instructor-requests/${id}/reject`);
                setApplications(prev => prev.filter(app => app._id !== id));
            } catch (err) {
                alert("Failed to reject.");
            }
        }
    };

    const viewCredential = (base64Data: string) => {
        const w = window.open('about:blank');
        if(w) {
            w.document.write(`<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
            alert("Popup blocked! Please allow popups to view credentials.");
        }
    };

    if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-neon-blue font-black animate-pulse text-2xl uppercase tracking-widest">Initializing Command Centre...</div>;

    return (
        <div className="min-h-screen bg-[#020617] text-white p-8 font-sans selection:bg-neon-blue selection:text-black">
            
            {/* --- HEADER --- */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-purple-500 uppercase tracking-tighter">QUEST COMMAND CENTRE</h1>
                <button 
                    onClick={fetchAdminData} 
                    className="flex items-center gap-2 bg-[#0f172a] hover:bg-gray-800 border border-gray-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                >
                    <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Refresh Data
                </button>
            </div>

            {/* --- 1. TOP STATS GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-[#0f172a] border border-blue-500/30 p-6 rounded-2xl shadow-lg">
                    <Users className="text-blue-400 mb-2" size={20} />
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Heroes (Students)</p>
                    <h2 className="text-3xl font-black">{stats?.totalStudents || 0}</h2>
                </div>
                <div className="bg-[#0f172a] border border-purple-500/30 p-6 rounded-2xl shadow-lg">
                    <ShieldCheck className="text-purple-400 mb-2" size={20} />
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Instructors</p>
                    <h2 className="text-3xl font-black">{stats?.totalInstructors || 0}</h2>
                </div>
                <div className="bg-[#0f172a] border border-green-500/30 p-6 rounded-2xl shadow-lg">
                    <Zap className="text-green-400 mb-2" size={20} />
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Active Quests</p>
                    <h2 className="text-3xl font-black">{stats?.totalCourses || 0}</h2>
                </div>
                <div className="bg-[#0f172a] border border-red-500/30 p-6 rounded-2xl shadow-lg animate-pulse">
                    <AlertTriangle className="text-red-400 mb-2" size={20} />
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Issue Reports</p>
                    <h2 className="text-3xl font-black text-red-500">{issues.length}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* --- 2. STUDENT PROGRESS LOG --- */}
                <div className="lg:col-span-2 bg-[#0f172a] border border-gray-800 p-8 rounded-3xl shadow-2xl">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-blue-400 uppercase tracking-tighter"><Target /> Hero Progress Log</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-gray-500 text-[10px] uppercase border-b border-gray-800">
                                <tr><th className="pb-4">Hero</th><th className="pb-4 text-center">Ongoing</th><th className="pb-4 text-center">Cleared</th><th className="pb-4">Current Objectives</th><th className="pb-4 text-right">Actions</th></tr>
                            </thead>
                            <tbody className="text-sm">
                                {detailedData.students.map(s => (
                                    <tr key={s._id} className="border-b border-gray-800/40 hover:bg-white/5 transition-colors">
                                        <td className="py-4 font-bold">{s.name}</td>
                                        <td className="py-4 text-center text-yellow-500 font-black">{s.ongoingCourses}</td>
                                        <td className="py-4 text-center text-green-500 font-black">{s.completedCourses}</td>
                                        <td className="py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {s.details?.map((d: any) => (
                                                    <span key={`${s._id}-${d.title}`} className="text-[9px] bg-black/50 border border-gray-800 px-2 py-0.5 rounded text-gray-300">
                                                        {d.title} ({d.percent}%)
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <button onClick={() => deleteUser(s._id, 'student')} className="text-red-500 hover:scale-125 transition-transform"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- 3. ISSUE BOX (Sidebar) --- */}
                <div className="bg-[#0f172a] border border-gray-800 p-6 rounded-3xl h-full max-h-[600px] flex flex-col shadow-2xl">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-red-400 uppercase tracking-tighter"><AlertTriangle /> Issue Box</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                        {issues.length === 0 ? <p className="text-gray-600 italic text-sm text-center mt-10 uppercase font-black">Realm is at peace.</p> : 
                            issues.map(issue => (
                                <div key={issue._id} className="p-4 bg-red-900/10 border border-red-500/20 rounded-2xl relative group">
                                    <span className={`absolute top-2 right-2 text-[8px] font-black px-2 py-0.5 rounded uppercase ${issue.role === 'student' ? 'bg-blue-900 text-blue-400' : 'bg-purple-900 text-purple-400'}`}>{issue.role}</span>
                                    <p className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">{issue.subject}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{issue.description}</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* --- NEW: PENDING INSTRUCTOR APPLICATIONS --- */}
            {applications.length > 0 && (
                <div className="mt-8 bg-purple-900/10 border border-purple-500/30 p-8 rounded-3xl shadow-2xl mb-8">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-purple-400 uppercase tracking-tighter">
                        <ShieldCheck /> Pending Instructor Applications ({applications.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {applications.map(app => (
                            <div key={app._id} className="bg-[#0f172a] border border-gray-800 p-6 rounded-2xl flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-black text-white uppercase">{app.name}</h4>
                                            <p className="text-xs text-gray-500 font-bold">{app.email}</p>
                                        </div>
                                        <span className="bg-yellow-500/20 text-yellow-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Pending Review</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                                        <div>
                                            <p className="text-gray-500 uppercase font-black text-[9px] tracking-widest">Domain</p>
                                            <p className="text-white font-bold">{app.domain}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 uppercase font-black text-[9px] tracking-widest">Experience</p>
                                            <p className="text-white font-bold">{app.experience} Years</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 uppercase font-black text-[9px] tracking-widest">Institution</p>
                                            <p className="text-white font-bold">{app.institution}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 uppercase font-black text-[9px] tracking-widest">Location</p>
                                            <p className="text-white font-bold">{app.city}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-auto pt-4 border-t border-gray-800">
                                    <button 
                                        onClick={() => viewCredential(app.credentialFile)}
                                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <FileText size={14}/> View File
                                    </button>
                                    <button 
                                        onClick={() => handleApprove(app._id)}
                                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                                    >
                                        <CheckCircle size={14}/> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleReject(app._id)}
                                        className="bg-red-900/30 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-xl transition-colors"
                                        title="Reject"
                                    >
                                        <XCircle size={14}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- 4. INSTRUCTOR IMPACT ANALYTICS --- */}
            <div className="mt-8 bg-[#0f172a] border border-gray-800 p-8 rounded-3xl shadow-2xl mb-8">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-purple-400 uppercase tracking-tighter">
                    <ShieldCheck /> Instructor Impact Log
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-gray-500 text-[10px] uppercase border-b border-gray-800">
                            <tr>
                                <th className="pb-4">Grand Instructor</th>
                                <th className="pb-4 text-center">Quests Created</th>
                                <th className="pb-4 text-center">Total Students</th>
                                <th className="pb-4">Active Quest List</th>
                                <th className="pb-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {detailedData.instructors.map(ins => (
                                <tr key={ins._id} className="border-b border-gray-800/40 hover:bg-white/5 transition-colors">
                                    <td className="py-4 font-bold text-white">
                                        {ins.name}
                                        <br />
                                        <span className="text-[10px] text-gray-500 font-normal uppercase tracking-tighter">{ins.email}</span>
                                    </td>
                                    <td className="py-4 text-center text-purple-400 font-black">{ins.courseCount}</td>
                                    <td className="py-4 text-center text-neon-blue font-black">{ins.impact}</td>
                                    <td className="py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {ins.courseList?.map((course: any) => (
                                                <span key={`${ins._id}-${course.title}`} className="text-[9px] bg-black/50 border border-gray-800 px-2 py-0.5 rounded text-gray-300">
                                                    {course.title} ({course.students} Joined)
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <button 
                                            onClick={() => deleteUser(ins._id, 'instructor')} 
                                            className="text-red-500 hover:scale-125 transition-transform p-2"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- 5. GLOBAL ENGAGEMENT SUMMARY --- */}
            <div className="mt-8 bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-neon-blue/20 p-8 rounded-3xl shadow-2xl mb-8">
                 <h3 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter"><BarChart3 className="text-neon-blue" /> Global Engagement</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/40 p-6 rounded-2xl border border-gray-800 flex items-center gap-4">
                        <Clock className="text-gray-500" />
                        <div><p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Avg. Session Time</p><p className="text-2xl font-black">48m</p></div>
                    </div>
                    <div className="bg-black/40 p-6 rounded-2xl border border-gray-800 flex items-center gap-4">
                        <BarChart3 className="text-neon-blue" />
                        <div><p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Daily Performance</p><p className="text-2xl font-black text-green-500">+14%</p></div>
                    </div>
                 </div>
            </div>

            {/* --- 6. INDIVIDUAL ENGAGEMENT TRACKER (Activity Log) --- */}
            <div className="mt-10 bg-[#0f172a] border border-gray-800 p-8 rounded-3xl shadow-2xl">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
                    <Clock className="text-neon-blue" /> Realm Activity Log (Engagement Timing)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {engagementData.length === 0 ? (
                        <p className="text-gray-600 text-xs italic py-10 text-center col-span-full uppercase font-black">Scanning for session data...</p>
                    ) : (
                        engagementData.map((u: any) => (
                            <div key={u._id} className="p-5 bg-black/40 border border-gray-800 rounded-2xl flex justify-between items-center group hover:border-neon-blue/50 transition-all duration-300 shadow-inner">
                                <div>
                                    <p className="font-black text-white text-xs uppercase tracking-tight group-hover:text-neon-blue transition-colors">{u.name}</p>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${u.role === 'student' ? 'bg-blue-900/40 text-blue-400' : 'bg-purple-900/40 text-purple-400'}`}>
                                        {u.role}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-neon-blue font-black text-xl">{u.totalMinutes}m</p>
                                    <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">Active Time</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;