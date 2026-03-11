import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Edit2, Video, BookOpen, Code, X, 
  Radio, Calendar, Clock, Link as LinkIcon, Save, 
  MessageCircle, Send, User, Globe, MapPin, Award, BarChart3, CheckCircle, 
  Eye, Activity, Loader2
} from 'lucide-react';
import io from 'socket.io-client'; 
import api from '../../utils/api';

const socket = io('http://localhost:5000'); 

const ManageCourse = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'curriculum' | 'chat' | 'intelligence'>('curriculum');
  const [marksData, setMarksData] = useState<any[]>([]);
  const [geoData, setGeoData] = useState<any>(null);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [sectionType, setSectionType] = useState('video'); 
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  
  // ✅ ADDED: testCases array inside codeChallenge
  const [formData, setFormData] = useState({
    title: '', videoUrl: '', content: '',
    codeChallenge: { 
        problemStatement: '', 
        starterCode: '',
        testCases: [{ input: '', output: '', hidden: false }] 
    },
    quiz: [] as any[]
  });

  const [liveConfig, setLiveConfig] = useState({ meetingLink: '', scheduledDate: '', scheduledTime: '' });
  const [isLive, setIsLive] = useState(false);
  const [isSavingLive, setIsSavingLive] = useState(false);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [quizQ, setQuizQ] = useState({ question: '', options: ['', '', '', ''], correctIndex: 0 });

  useEffect(() => {
    fetchCourse();
    fetchChatHistory();
    if (activeTab === 'intelligence') fetchIntelligence();
    socket.emit('join_room', id);
    socket.on('receive_message', (data) => {
      setChatMessages((prev) => [...prev, data]);
      scrollToBottom();
    });
    return () => { socket.off('receive_message'); };
  }, [id, activeTab]);

  const scrollToBottom = () => {
    setTimeout(() => { chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data);
      setIsLive(res.data.liveSession?.isActive || false);
      if (res.data.liveSession?.scheduledDate) {
        const dateObj = new Date(res.data.liveSession.scheduledDate);
        setLiveConfig({
          meetingLink: res.data.liveSession.meetingLink || '',
          scheduledDate: dateObj.toISOString().split('T')[0], 
          scheduledTime: dateObj.toTimeString().slice(0, 5) 
        });
      }
      setLoading(false);
    } catch (err) { alert("Failed to load course"); }
  };

  const fetchIntelligence = async () => {
    try {
      const [marksRes, geoRes] = await Promise.all([
        api.get(`/instructor/reports/${id}`),
        api.get(`/instructor/geo-analytics/${id}`)
      ]);
      setMarksData(marksRes.data);
      setGeoData(geoRes.data);
    } catch (err) { console.error("Intel failure"); }
  };

  const viewStudentDetail = async (studentId: string) => {
    setDetailLoading(true);
    try {
        const res = await api.get(`/instructor/student-detail/${id}/${studentId}`);
        setSelectedStudent(res.data);
    } catch (err) {
        alert("Hero intel currently encrypted or unavailable.");
    } finally {
        setDetailLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await api.get(`/courses/${id}/chat`);
      setChatMessages(res.data);
    } catch (err) { console.error("Failed to load chat"); }
  };

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;
    const messageData = { courseId: id, userId: course.instructor, userName: "Instructor", role: "instructor", message: newMessage, createdAt: new Date() };
    await socket.emit('send_message', messageData);
    setNewMessage("");
  };

  const handleInputChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleCodeChange = (field: string, val: string) => setFormData({ ...formData, codeChallenge: { ...formData.codeChallenge, [field]: val } });
  
  // ✅ NEW: Handlers for Code Section Test Cases
  const addCodeTestcase = () => {
      setFormData(prev => ({
          ...prev,
          codeChallenge: {
              ...prev.codeChallenge,
              testCases: [...prev.codeChallenge.testCases, { input: '', output: '', hidden: false }]
          }
      }));
  };

  const updateCodeTestcase = (index: number, field: 'input' | 'output' | 'hidden', value: string | boolean) => {
      setFormData(prev => {
          const newTestCases = [...prev.codeChallenge.testCases];
          newTestCases[index] = { ...newTestCases[index], [field]: value };
          return {
              ...prev,
              codeChallenge: { ...prev.codeChallenge, testCases: newTestCases }
          };
      });
  };

  const removeCodeTestcase = (indexToRemove: number) => {
      setFormData(prev => ({
          ...prev,
          codeChallenge: {
              ...prev.codeChallenge,
              testCases: prev.codeChallenge.testCases.filter((_, idx) => idx !== indexToRemove)
          }
      }));
  };
  
  const addQuestion = () => {
    if(!quizQ.question) return alert("Enter mission question");
    if(quizQ.options.some(opt => opt === '')) return alert("All intel options must be filled");
    setFormData({ ...formData, quiz: [...formData.quiz, quizQ] });
    setQuizQ({ question: '', options: ['', '', '', ''], correctIndex: 0 }); 
  };

  const handleSubmitSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, type: sectionType };
      const res = editingSectionId 
        ? await api.put(`/courses/${id}/sections/${editingSectionId}`, payload)
        : await api.post(`/courses/${id}/sections`, payload);
      setCourse({ ...course, sections: res.data }); 
      resetForm();
      alert("Quest Level Updated! ⚔️");
    } catch (err: any) { alert("Error saving level"); }
  };

  const handleSaveLiveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLive(true);
    try {
      let combinedDateISO = null;
      if (liveConfig.scheduledDate && liveConfig.scheduledTime) {
        combinedDateISO = new Date(`${liveConfig.scheduledDate}T${liveConfig.scheduledTime}:00`).toISOString();
      }
      const payload = { meetingLink: liveConfig.meetingLink, scheduledDate: combinedDateISO, isActive: isLive };
      const res = await api.put(`/courses/${id}/live`, payload);
      setCourse({ ...course, liveSession: res.data });
      alert("Coordinates Synchronized! 🚀");
    } catch (err) { console.error(err); } finally { setIsSavingLive(false); }
  };

  const handleToggleLive = async () => {
    if (!liveConfig.meetingLink) return alert("Save meeting link coordinates first!");
    const newStatus = !isLive;
    try {
        await api.post(`/courses/${id}/live-status`, { isActive: newStatus });
        setIsLive(newStatus);
    } catch (err) { alert("Live transition failed"); }
  };

  const handleEditClick = (section: any) => {
    setEditingSectionId(section._id);
    setSectionType(section.type);
    // ✅ Load existing testcases if they exist
    setFormData({ 
        title: section.title, 
        videoUrl: section.videoUrl || '', 
        content: section.content || '', 
        codeChallenge: { 
            problemStatement: section.codeChallenge?.problemStatement || '', 
            starterCode: section.codeChallenge?.starterCode || '',
            testCases: section.codeChallenge?.testCases?.length > 0 ? section.codeChallenge.testCases : [{ input: '', output: '', hidden: false }]
        }, 
        quiz: section.quiz || [] 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (sectionId: string) => {
    if(!window.confirm("Banish this level?")) return;
    try {
        const res = await api.delete(`/courses/${id}/sections/${sectionId}`);
        setCourse({ ...course, sections: res.data });
    } catch (err) { alert("Error deleting level"); }
  };

  const resetForm = () => {
    setEditingSectionId(null);
    setFormData({ 
        title: '', videoUrl: '', content: '', 
        codeChallenge: { problemStatement: '', starterCode: '', testCases: [{ input: '', output: '', hidden: false }] }, 
        quiz: [] 
    });
    setQuizQ({ question: '', options: ['', '', '', ''], correctIndex: 0 });
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-neon-blue font-black animate-pulse uppercase tracking-[0.2em]">Synchronizing Realm...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 md:p-8 relative">
      
      {/* 🟢 CRITICAL CSS FIX: Forces Browser Pickers to Show Icons and handle hit areas */}
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
            filter: invert(1); /* Makes icons white */
            cursor: pointer;
            padding: 5px;
        }
        input[type="date"], input[type="time"] {
            color-scheme: dark; /* Ensures the popup calendar is dark themed */
        }
      `}</style>

      {/* 🏆 MISSION INTEL MODAL */}
      {selectedStudent && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
              <div className="bg-gray-900 border-2 border-neon-blue/30 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,243,255,0.15)]">
                  <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-black/40">
                      <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-neon-blue/10 rounded-2xl flex items-center justify-center text-neon-blue border border-neon-blue/20"><User size={28}/></div>
                          <div>
                              <h2 className="text-2xl font-black uppercase tracking-tighter">{selectedStudent.student.name}</h2>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{selectedStudent.student.location?.city || "Unknown Realm"}</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedStudent(null)} className="p-3 bg-gray-800 rounded-full hover:bg-red-500 transition-all"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                      <h3 className="text-[10px] font-black text-neon-blue uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Activity size={12}/> Mission performance Breakdown</h3>
                      {selectedStudent.results.length === 0 ? (
                        <div className="p-10 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                            <p className="text-gray-600 italic uppercase text-xs font-black tracking-widest">No mission telemetry synced.</p>
                        </div>
                      ) : (
                        selectedStudent.results.map((res: any, i: number) => {
                            const scorePct = (res.score / res.totalPossible) * 100;
                            return (
                                <div key={i} className="bg-black/40 border border-gray-800 p-5 rounded-2xl flex items-center justify-between group hover:border-neon-blue/40 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center font-black text-xs text-gray-500">{i + 1}</div>
                                        <div>
                                            <p className="font-bold text-white text-sm group-hover:text-neon-blue transition-colors">{res.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[8px] bg-gray-950 px-2 py-0.5 rounded-full text-gray-500 uppercase font-black border border-gray-800">{res.type}</span>
                                                <span className="text-[9px] text-gray-600 font-bold italic">{new Date(res.completedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-white">{res.score}<span className="text-gray-600 text-xs">/{res.totalPossible}</span></div>
                                        <div className={`text-[10px] font-black uppercase ${scorePct >= 80 ? 'text-green-500' : scorePct >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{scorePct === 100 ? 'Perfect' : 'Cleared'}</div>
                                    </div>
                                </div>
                            );
                        })
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-800">
        <div>
            <button onClick={() => navigate('/instructor/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-2 transition-colors font-bold uppercase text-[10px] tracking-widest"><ArrowLeft size={16} /> Back to Hub</button>
            <h1 className="text-3xl font-black text-neon-blue uppercase tracking-tighter">{course.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            {/* TABS */}
            <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800">
                {(['curriculum', 'intelligence', 'chat'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-neon-blue text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                    {tab === 'curriculum' && <BookOpen size={14}/>}
                    {tab === 'intelligence' && <BarChart3 size={14}/>}
                    {tab === 'chat' && <MessageCircle size={14}/>}
                    {tab}
                </button>
                ))}
            </div>

            {/* CURRICULUM VIEW */}
            {activeTab === 'curriculum' && (
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tighter">{editingSectionId ? <Edit2 className="text-yellow-500"/> : <Plus className="text-neon-blue"/>} {editingSectionId ? "Modify Level" : "Construct New Level"}</h2>
                        {editingSectionId && <button onClick={resetForm} className="text-xs bg-red-900/30 text-red-400 px-3 py-1 rounded-full font-black uppercase">Abort</button>}
                    </div>

                    <div className="flex gap-2 bg-gray-950 p-1.5 rounded-xl mb-6 border border-gray-800 overflow-x-auto">
                        {['video', 'text', 'code'].map((t) => (
                            <button type="button" key={t} onClick={() => setSectionType(t)} className={`flex-1 min-w-[100px] py-3 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all ${sectionType === t ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{t}</button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmitSection} className="space-y-4">
                        <input name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 text-white focus:border-neon-blue outline-none transition-all placeholder:text-gray-700" placeholder="Level Identification..." required />
                        
                        {sectionType === 'video' && <input name="videoUrl" value={formData.videoUrl} onChange={handleInputChange} className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 text-white focus:border-neon-blue outline-none" placeholder="YouTube URL..." />}
                        
                        {sectionType === 'text' && <textarea name="content" value={formData.content} onChange={handleInputChange} rows={6} className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 text-white focus:border-neon-blue outline-none custom-scrollbar" placeholder="Intel Content..." />}
                        
                        {/* ✅ REPLACED: Enhanced Code Challenge Section */}
                        {sectionType === 'code' && (
                            <div className="space-y-4">
                                <textarea value={formData.codeChallenge.problemStatement} onChange={(e) => handleCodeChange('problemStatement', e.target.value)} rows={3} className="w-full bg-black/50 border border-gray-800 rounded-xl p-4 text-white focus:border-neon-blue outline-none" placeholder="Mission Objective..." />
                                
                                {/* Test Cases Area */}
                                <div className="pt-4 border-t border-gray-800">
                                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">Compiler Test Cases</h3>
                                    {formData.codeChallenge.testCases.map((tc, idx) => (
                                        <div key={idx} className="flex flex-col gap-3 mb-4 bg-black/50 p-5 rounded-xl border border-gray-800">
                                            <div>
                                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Standard Input</label>
                                                <textarea rows={2} placeholder="e.g. 5\n1 2 3 4 5" value={tc.input} onChange={e => updateCodeTestcase(idx, 'input', e.target.value)} className="w-full bg-black border border-gray-700 p-3 rounded-lg text-sm font-mono outline-none focus:border-neon-blue custom-scrollbar" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Expected Output</label>
                                                <textarea rows={2} placeholder="Expected Result" value={tc.output} onChange={e => updateCodeTestcase(idx, 'output', e.target.value)} className="w-full bg-black border border-gray-700 p-3 rounded-lg text-sm font-mono outline-none focus:border-neon-blue custom-scrollbar" />
                                            </div>
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800">
                                                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 cursor-pointer hover:text-white transition-colors">
                                                    <input type="checkbox" checked={tc.hidden} onChange={e => updateCodeTestcase(idx, 'hidden', e.target.checked)} className="w-4 h-4 accent-neon-blue cursor-pointer" /> 
                                                    Hidden Testcase
                                                </label>
                                                {formData.codeChallenge.testCases.length > 1 && (
                                                    <button type="button" onClick={() => removeCodeTestcase(idx)} className="text-red-500 text-xs font-bold uppercase hover:text-red-400 transition-colors">Remove</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addCodeTestcase} className="bg-gray-900 border border-gray-700 text-neon-blue px-4 py-3 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 w-full transition-colors mt-2 hover:bg-gray-800">
                                        <Plus size={16} /> Add Testcase
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 pt-8 border-t border-gray-800">
                            <h3 className="font-black text-gray-500 uppercase text-[10px] mb-4 tracking-widest">Knowledge Extraction (Quiz)</h3>
                            <div className="bg-black/40 p-6 rounded-2xl border border-gray-800 space-y-4">
                                <input value={quizQ.question} onChange={(e) => setQuizQ({...quizQ, question: e.target.value})} placeholder="Enter Question..." className="w-full bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm focus:border-neon-blue outline-none transition-all" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {quizQ.options.map((opt, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input value={opt} onChange={(e) => { const newO = [...quizQ.options]; newO[i] = e.target.value; setQuizQ({...quizQ, options: newO}) }} placeholder={`Option ${i+1}`} className={`flex-1 bg-gray-950 border ${quizQ.correctIndex === i ? 'border-green-500' : 'border-gray-800'} rounded-lg p-3 text-xs outline-none transition-all`} />
                                            <button type="button" onClick={() => setQuizQ({...quizQ, correctIndex: i})} className={`px-3 rounded-lg transition-all ${quizQ.correctIndex === i ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500'}`}><CheckCircle size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addQuestion} className="w-full bg-gray-800 hover:bg-gray-700 text-neon-blue font-black py-3 rounded-xl text-[10px] uppercase border border-neon-blue/20 transition-all">+ Add Question to Level</button>
                            </div>

                            {formData.quiz.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {formData.quiz.map((q, i) => (
                                        <div key={i} className="bg-gray-800 border border-gray-700 p-2 pl-3 rounded-lg text-[10px] flex items-center gap-3">
                                            <span className="text-gray-500 font-black">{i+1}</span> <span className="text-gray-300 font-bold">{q.question}</span>
                                            <button type="button" onClick={() => setFormData({...formData, quiz: formData.quiz.filter((_, idx) => idx !== i)})} className="text-red-500 hover:bg-red-500/20 p-1 rounded-md transition-colors"><X size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button type="submit" className="w-full bg-neon-blue text-black font-black py-4 rounded-2xl shadow-lg hover:scale-[1.01] transition-all uppercase tracking-widest text-xs mt-6">Deploy Level</button>
                    </form>

                    <div className="mt-12 space-y-3">
                        <p className="text-gray-500 text-[10px] font-black uppercase mb-2 tracking-widest">Active sequence</p>
                        {course.sections.map((sec: any) => (
                            <div key={sec._id} className="p-4 bg-black/40 border border-gray-800 rounded-xl flex justify-between items-center group hover:border-gray-700 transition-all">
                                <div className="flex items-center gap-3">
                                    {sec.type === 'video' ? <Video size={16} className="text-blue-400"/> : sec.type === 'code' ? <Code size={16} className="text-yellow-400"/> : <BookOpen size={16} className="text-green-400"/>}
                                    <span className="font-bold text-sm tracking-tight">{sec.title}</span>
                                    {sec.quiz?.length > 0 && <span className="text-[8px] bg-neon-blue/10 text-neon-blue px-2 py-0.5 rounded-full border border-neon-blue/20 font-black">+{sec.quiz.length} QUIZ</span>}
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => handleEditClick(sec)} className="p-2 text-gray-500 hover:text-white transition-colors"><Edit2 size={14}/></button>
                                    <button type="button" onClick={() => handleDeleteClick(sec._id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'intelligence' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl relative overflow-hidden flex flex-col justify-center">
                            <Globe className="absolute -right-6 -top-6 text-neon-blue opacity-10" size={160} />
                            <p className="text-gray-500 text-[10px] font-black uppercase mb-1 tracking-widest">Density Leader</p>
                            <h3 className="text-4xl font-black text-white tracking-tighter">{geoData?.highestRegion || "Analyzing..."}</h3>
                            <p className="text-neon-blue text-[10px] font-black mt-4 flex items-center gap-1 uppercase"><MapPin size={12}/> {geoData?.totalUniqueLocations} Sectors</p>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl">
                            <p className="text-gray-500 text-[10px] font-black uppercase mb-4 tracking-widest">Regional Deployment</p>
                            <div className="max-h-36 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                {Object.entries(geoData?.fullBreakdown || {}).map(([city, count]: any) => (
                                    <div key={city} className="flex justify-between items-center text-xs border-b border-gray-800 pb-2">
                                        <span className="text-gray-400 font-bold uppercase">{city}</span> <span className="font-black text-neon-blue">{count} Heroes</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-[2rem] overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-gray-800 bg-black/40 flex justify-between items-center">
                            <h3 className="font-black text-white flex items-center gap-2 uppercase tracking-tighter text-lg"><Award className="text-yellow-500"/> Performance Intel</h3>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{marksData.length} Heroes Logged</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="text-[10px] text-gray-500 uppercase bg-black/60 tracking-widest">
                                    <tr>
                                        <th className="p-6 border-b border-gray-800">Hero Ident</th>
                                        <th className="p-6 border-b border-gray-800">Clearance Map</th>
                                        <th className="p-6 border-b border-gray-800 text-center">Efficiency</th>
                                        <th className="p-6 border-b border-gray-800 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {marksData.length === 0 ? <tr><td colSpan={4} className="p-16 text-center text-gray-600 font-black uppercase text-xs tracking-widest">No mission telemetry synced.</td></tr> : marksData.map((report) => {
                                        const total = report.completedSections.reduce((a:number, s:any) => a + (s.score || 0), 0);
                                        const possible = report.completedSections.reduce((a:number, s:any) => a + (s.totalPossible || 10), 0);
                                        const pct = possible > 0 ? (total/possible * 100).toFixed(0) : 0;
                                        return (
                                            <tr key={report._id} className="border-b border-gray-800 hover:bg-neon-blue/5 transition-all">
                                                <td className="p-6">
                                                    <p className="font-black text-white tracking-tight">{report.student?.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{report.student?.location?.city || "Unknown Realm"}</p>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex gap-1.5 flex-wrap max-w-xs">
                                                        {report.completedSections.map((s:any, i:number) => (
                                                            <div key={i} className="bg-gray-950 text-[9px] font-black px-2.5 py-1.5 rounded-lg border border-gray-800 min-w-[38px] flex flex-col items-center">
                                                                <span className="text-gray-600 text-[6px] uppercase">Lvl {i+1}</span>
                                                                <span className="text-neon-blue">{s.score}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className={`text-2xl font-black ${Number(pct) >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>{pct}%</span>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <button onClick={() => viewStudentDetail(report.student?._id)} className="bg-gray-800 hover:bg-neon-blue hover:text-black p-3 rounded-2xl border border-gray-700 active:scale-90 transition-all">
                                                        {detailLoading ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18}/>}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="bg-gray-900 border border-gray-800 rounded-[2rem] h-[650px] flex flex-col overflow-hidden shadow-2xl">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/20">
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'instructor' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${msg.role === 'instructor' ? 'bg-neon-blue text-black font-bold shadow-[0_0_15px_rgba(0,243,255,0.1)]' : 'bg-gray-800 text-white rounded-tl-none border border-gray-700'}`}>
                                    {msg.message}
                                </div>
                                <span className="text-[9px] text-gray-500 mt-2 uppercase font-black">{msg.userName} • {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                        ))}
                        <div ref={chatScrollRef} />
                    </div>
                    <form onSubmit={sendMessage} className="p-6 bg-black/60 border-t border-gray-800 flex gap-3">
                        <input value={newMessage} onChange={(e)=>setNewMessage(e.target.value)} className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 text-sm outline-none focus:border-neon-blue transition-all" placeholder="Broadcast command..."/>
                        <button className="bg-neon-blue text-black p-4 rounded-2xl hover:scale-105 transition-all"><Send size={20}/></button>
                    </form>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: BROADCAST & TIMELINE */}
        <div className="space-y-6">
            {/* BROADCAST PANEL */}
            <div className={`p-8 rounded-[2rem] border-2 shadow-2xl transition-all duration-500 ${isLive ? 'bg-red-950/20 border-red-500 shadow-red-900/10' : 'bg-gray-900 border-gray-800'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`font-black text-[10px] uppercase tracking-[0.3em] ${isLive ? 'text-red-500' : 'text-gray-500'}`}>Broadcast</h3>
                    <div className={`p-1 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-800'}`}>
                      <Radio size={16} className={isLive ? "text-white" : "text-gray-600"} />
                    </div>
                </div>
                <button onClick={handleToggleLive} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all ${isLive ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                    {isLive ? "Terminate Signal" : "Initialize broadcast"}
                </button>
            </div>

            {/* 📅 BATTLE TIMELINE (CALENDAR & CLOCK PICKERS) */}
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem] shadow-2xl">
                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Calendar size={12} className="text-neon-blue"/> Battle Timeline
                </h3>
                <form onSubmit={handleSaveLiveConfig} className="space-y-5">
                    {/* SIGNAL LINK */}
                    <div className="relative">
                        <label className="text-[8px] text-gray-600 font-black uppercase ml-2 mb-1 block">Meeting Link</label>
                        <div className="relative">
                            <LinkIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                            <input 
                                value={liveConfig.meetingLink} 
                                onChange={(e)=>setLiveConfig({...liveConfig, meetingLink:e.target.value})} 
                                className="w-full bg-black border border-gray-800 pl-10 pr-4 py-3 rounded-xl text-xs font-mono text-neon-blue outline-none focus:border-neon-blue/50" 
                                placeholder="https://signal.link" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* 📅 NATIVE CALENDAR PICKER */}
                        <div className="relative">
                            <label className="text-[8px] text-gray-600 font-black uppercase ml-2 mb-1 block">Mission Date</label>
                            <input 
                                type="date" 
                                value={liveConfig.scheduledDate} 
                                onChange={(e)=>setLiveConfig({...liveConfig, scheduledDate:e.target.value})} 
                                onClick={(e) => (e.target as any).showPicker?.()} 
                                className="w-full bg-black border border-gray-800 p-3 rounded-xl text-xs text-white outline-none focus:border-neon-blue/50 cursor-pointer transition-all"
                            />
                        </div>

                        {/* 🕒 NATIVE CLOCK PICKER */}
                        <div className="relative">
                            <label className="text-[8px] text-gray-600 font-black uppercase ml-2 mb-1 block">Deployment Time</label>
                            <input 
                                type="time" 
                                value={liveConfig.scheduledTime} 
                                onChange={(e)=>setLiveConfig({...liveConfig, scheduledTime:e.target.value})} 
                                onClick={(e) => (e.target as any).showPicker?.()} 
                                className="w-full bg-black border border-gray-800 p-3 rounded-xl text-xs text-white outline-none focus:border-neon-blue/50 cursor-pointer transition-all"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSavingLive} 
                        className="w-full bg-black border border-gray-800 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-blue hover:text-black hover:border-neon-blue transition-all disabled:opacity-50 active:scale-95"
                    >
                        {isSavingLive ? 'Synchronizing...' : 'Sync Schedule'}
                    </button>
                </form>
            </div>

            {/* SATURATION INTEL */}
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2rem] shadow-xl">
                <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Saturation Intel</h3>
                <div className="space-y-5">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Deployed Heroes</span>
                        <span className="text-4xl font-black text-neon-blue leading-none">{course.enrolledStudents?.length || 0}</span>
                    </div>
                    <div className="w-full bg-black h-2 rounded-full overflow-hidden border border-gray-800">
                        <div className="bg-neon-blue h-full shadow-[0_0_15px_rgba(0,243,255,0.5)] transition-all duration-1000 ease-out" style={{width: `${Math.min((course.enrolledStudents?.length || 0) * 10, 100)}%`}}></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCourse;