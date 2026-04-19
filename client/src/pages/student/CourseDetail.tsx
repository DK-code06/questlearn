import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Lock, Play, User, Star,
  Download, Award, X, MessageCircle, Send,
  Minimize2, Users, LockKeyhole
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import Confetti from 'react-confetti';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext) as any;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [completedSectionIds, setCompletedSectionIds] = useState<string[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ✅ Handles every possible shape the API returns
  const normalizeIds = (sections: any[]): string[] => {
    if (!Array.isArray(sections)) return [];
    return sections.map((s: any) => {
      if (!s) return '';
      if (typeof s === 'string') return s;
      // Object shape: { sectionId: "...", score: ... }
      const raw = s.sectionId ?? s._id ?? s;
      return raw?.toString() ?? '';
    }).filter(Boolean);
  };

  const fetchProgress = useCallback(async () => {
    try {
      const res = await api.get(`/users/progress/${id}`);
      const ids = normalizeIds(res.data.completedSections || []);
      console.log('[CourseDetail] completedSectionIds after fetch:', ids);
      setCompletedSectionIds(ids);
    } catch {
      setCompletedSectionIds([]);
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      try {
        const courseRes = await api.get(`/courses/${id}`);
        setCourse(courseRes.data);

        const existingRating = courseRes.data.ratings?.find((r: any) => r.student === user._id);
        if (existingRating) {
          setUserRating(existingRating.rating);
          setHasRated(true);
        }

        await fetchProgress();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();

    if (user && id) {
      socket.emit('join_room', id);
      api.get(`/courses/${id}/chat`).then(res => {
        setChatMessages(res.data);
      }).catch(console.error);
    }

    const handleMsg = (data: any) => {
      setChatMessages(prev => [...prev, data]);
      setTimeout(() => chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    socket.on('receive_message', handleMsg);
    return () => { socket.off('receive_message', handleMsg); };
  }, [id, user, fetchProgress]);

  // ✅ Re-fetch when LessonPlayer navigates back with { state: { refreshProgress: true } }
  useEffect(() => {
    if (location.state?.refreshProgress) {
      fetchProgress();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fetchProgress]);

  // ✅ Re-fetch on tab focus (backup for same-tab navigation)
  useEffect(() => {
    window.addEventListener('focus', fetchProgress);
    return () => window.removeEventListener('focus', fetchProgress);
  }, [fetchProgress]);

  const submitRating = async (stars: number) => {
    try {
      const res = await api.post(`/courses/${id}/rate`, { rating: stars });
      setCourse((prev: any) => ({ ...prev, averageRating: res.data.averageRating }));
      setUserRating(stars);
      setHasRated(true);
      alert("Feedback received! Victory Certificate unlocked. 🏆");
    } catch (err: any) {
      alert(err.response?.data?.msg || "Failed to submit rating");
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.msg || "Enrollment failed");
      setEnrolling(false);
    }
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;
    try {
      const canvas = await html2canvas(certificateRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      pdf.save(`${course.title}_Certificate.pdf`);
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-neon-blue"></div>
    </div>
  );

  const isEnrolled = course.enrolledStudents.includes(user._id);

  const isSectionCompleted = (sectionId: any): boolean =>
    completedSectionIds.includes(sectionId?.toString() ?? '');

  const completedCount = course.sections.filter((s: any) => isSectionCompleted(s._id)).length;
  const isFinished = course.sections.length > 0 && completedCount === course.sections.length;

  // ✅ activeIndex = the first incomplete level (next level to play)
  let activeIndex = course.sections.findIndex((s: any) => !isSectionCompleted(s._id));
  if (activeIndex === -1) activeIndex = course.sections.length;
  if (!isEnrolled) activeIndex = 0;

  const getPosition = (i: number) => Math.sin(i / 2) * 60;

  return (
    <div className="min-h-screen bg-[#111] text-white font-sans pb-20">

      {/* CERTIFICATE MODAL */}
      {showCertificate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-500">
          <Confetti width={window.innerWidth} height={window.innerHeight} recycle={true} numberOfPieces={300} />
          <div className="relative max-w-4xl w-full flex flex-col items-center gap-6">
            <button onClick={() => setShowCertificate(false)} className="absolute -top-12 right-0 text-gray-400 hover:text-white"><X size={32} /></button>
            <div ref={certificateRef} className="bg-white text-black p-2 rounded-lg shadow-2xl w-full aspect-[1.414/1]">
              <div className="w-full h-full border-8 border-double border-yellow-600 p-8 flex flex-col items-center justify-center text-center bg-[#fffdf5]">
                <div className="mb-6 text-yellow-500"><Award size={64} /></div>
                <h1 className="text-5xl font-serif font-black text-gray-800 tracking-wider mb-2 uppercase">Certificate</h1>
                <h2 className="text-xl font-serif text-gray-500 uppercase tracking-[0.3em] mb-8">Of Completion</h2>
                <p className="text-gray-500 text-lg italic mb-2">This is to certify that</p>
                <h3 className="text-4xl font-bold text-black border-b-2 border-gray-300 pb-2 mb-6 min-w-[300px]">{user.name}</h3>
                <p className="text-gray-500 text-lg italic mb-2">Has successfully completed the course</p>
                <h3 className="text-3xl font-bold text-purple-700 mb-10">{course.title}</h3>
                <div className="flex justify-between w-full max-w-2xl mt-8 px-10">
                  <div className="text-center">
                    <p className="font-bold text-lg text-gray-800">{new Date().toLocaleDateString()}</p>
                    <div className="w-40 h-0.5 bg-gray-400 mt-1"></div>
                    <p className="text-xs text-gray-500 mt-1 uppercase">Date</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-gray-800 font-serif italic">QuestLearn</p>
                    <div className="w-40 h-0.5 bg-gray-400 mt-1"></div>
                    <p className="text-xs text-gray-500 mt-1 uppercase">Signature</p>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={downloadCertificate} className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl py-4 px-12 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform">
              <Download size={24} /> DOWNLOAD PDF
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-[#111]/95 backdrop-blur-md border-b border-gray-800 p-4 shadow-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/student/dashboard')} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-black text-lg text-white truncate max-w-[200px]">{course.title}</h1>
          <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
            <Star size={14} className="text-yellow-400 fill-yellow-400 inline mr-1" />
            <span className="text-xs font-bold text-yellow-400">{completedCount * 10} XP</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">

        {/* HERO CARD */}
        <div className="relative h-48 rounded-3xl overflow-hidden mb-8 border-4 border-gray-800 shadow-2xl group">
          {course.thumbnail
            ? <img src={course.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt={course.title} />
            : <div className="w-full h-full bg-gray-900 flex items-center justify-center text-4xl font-black text-gray-800">QUEST</div>
          }
          <div className="absolute bottom-0 left-0 p-6 bg-gradient-to-t from-black to-transparent w-full">
            <span className="bg-neon-blue text-black text-[10px] font-black px-2 py-1 rounded uppercase mb-2 inline-block">{course.category}</span>
            <h2 className="text-2xl font-black text-white leading-tight">{course.title}</h2>
            <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs font-bold">
              <User size={12} /> {course.instructor?.name || "Instructor"}
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-8 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Quest Stats</h3>
              <div className="flex items-center gap-2 mt-1 text-gray-400">
                <Users size={16} className="text-neon-blue" />
                <span className="text-sm font-bold">{course.enrolledStudents?.length || 0} Students Joined</span>
              </div>
              {isEnrolled && (
                <p className="text-neon-blue text-xs font-bold mt-2">
                  {completedCount} / {course.sections.length} Levels Completed
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-400 font-black text-3xl">
                <Star fill="currentColor" size={24} /> {course.averageRating?.toFixed(1) || "0.0"}
              </div>
              <p className="text-gray-500 text-[10px] uppercase font-black">Average Rating</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {!isEnrolled ? (
          <button onClick={handleEnroll} disabled={enrolling}
            className="bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl shadow-[0_8px_0_rgb(21,128,61)] transition-all w-full">
            {enrolling ? "JOINING..." : "START QUEST"}
          </button>
        ) : (
          <div className="text-center mb-12">
            {isFinished ? (
              <div className="space-y-6">
                {!hasRated ? (
                  <div className="bg-yellow-600/10 border-2 border-yellow-500/50 p-8 rounded-3xl">
                    <h3 className="text-yellow-500 font-black text-2xl mb-2">MISSION CLEAR! 🏆</h3>
                    <p className="text-gray-300 text-sm mb-6 uppercase tracking-widest">Rate this course to unlock your certificate</p>
                    <div className="flex justify-center gap-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => submitRating(star)}
                          className="transition-all hover:scale-150 text-gray-700 hover:text-yellow-400">
                          <Star size={44} fill={userRating >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                    <div className="mt-8 flex items-center justify-center gap-2 text-gray-500 font-bold text-xs">
                      <LockKeyhole size={14} /> CERTIFICATE LOCKED
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowCertificate(true)}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl py-5 rounded-2xl w-full flex items-center justify-center gap-3 animate-bounce shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                    <Award fill="black" size={28} /> CLAIM VICTORY CERTIFICATE
                  </button>
                )}
              </div>
            ) : (
              <button onClick={() => navigate(`/student/course/${id}/play/${activeIndex}`)}
                className="bg-neon-blue hover:bg-cyan-400 text-black font-black text-xl py-4 rounded-2xl w-full flex items-center justify-center gap-3">
                <Play fill="black" size={24} />
                {completedCount === 0 ? 'START LEVEL 1' : `RESUME LEVEL ${activeIndex + 1}`}
              </button>
            )}
          </div>
        )}

        {/* 🗺️ GAME MAP */}
        <div className="relative flex flex-col items-center py-10 space-y-6">
          {course.sections.map((sec: any, idx: number) => {
            const xOffset = getPosition(idx);
            const isCompleted = isSectionCompleted(sec._id);

            // ✅ THE FIX: idx <= activeIndex means ALL completed levels
            // AND the very next level are unlocked. Previously was:
            // (isCompleted || idx === activeIndex) which caused only
            // ONE level to ever be unlocked at a time, making completed
            // levels appear locked again when returning to the map.
            const isUnlocked = isEnrolled && (idx <= activeIndex);

            return (
              <div key={sec._id ?? idx} className="relative z-10 flex flex-col items-center"
                style={{ transform: `translateX(${xOffset}px)` }}>
                {idx < course.sections.length - 1 && (
                  <svg className="absolute top-10 left-1/2 -translate-x-1/2 overflow-visible pointer-events-none -z-10"
                    width="100" height="120">
                    <path
                      d={`M 0 0 C 0 50, ${getPosition(idx + 1) - xOffset} 50, ${getPosition(idx + 1) - xOffset} 100`}
                      stroke={isCompleted ? "#22c55e" : "#333"}
                      strokeWidth="8" fill="transparent" strokeDasharray="10 5"
                    />
                  </svg>
                )}
                <button
                  onClick={() => isUnlocked && navigate(`/student/course/${id}/play/${idx}`)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center border-b-4 transition-all duration-300 ${
                    isCompleted ? 'bg-green-500 border-green-700 shadow-lg shadow-green-500/30'
                      : isUnlocked ? 'bg-blue-500 border-blue-700 shadow-lg'
                      : 'bg-gray-700 border-gray-600 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <CheckCircle size={32} className="text-white" />
                    : isUnlocked ? <Star size={32} className="text-white fill-white" />
                    : <Lock size={24} />}
                </button>
                <div className={`mt-2 font-black text-[10px] uppercase tracking-widest ${
                  isCompleted ? 'text-green-400' : isUnlocked ? 'text-neon-blue' : 'text-gray-600'
                }`}>
                  Level {idx + 1}
                </div>
              </div>
            );
          })}

          {/* 🏁 TROPHY */}
          <div className="relative z-10 pt-10" style={{ transform: `translateX(${getPosition(course.sections.length)}px)` }}>
            <div
              onClick={() => isFinished && hasRated && setShowCertificate(true)}
              className={`w-24 h-24 rounded-2xl border-4 flex flex-col items-center justify-center shadow-xl transition-all relative ${
                isFinished && hasRated ? 'bg-yellow-400 border-yellow-600 animate-bounce scale-110 shadow-yellow-500/50 cursor-pointer'
                  : isFinished ? 'bg-yellow-900/30 border-yellow-700/50 cursor-pointer'
                  : 'bg-gray-800 border-gray-700 grayscale opacity-50'
              }`}
            >
              <div className="text-4xl">{isFinished ? "🏆" : "🎁"}</div>
              {isFinished && !hasRated && <LockKeyhole size={14} className="text-yellow-600 mt-1" />}
            </div>
          </div>
        </div>
      </div>

      {/* CHAT */}
      {isEnrolled && (
        <>
          <button onClick={() => setIsChatOpen(!isChatOpen)}
            className="fixed bottom-6 right-6 z-50 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform">
            {isChatOpen ? <X size={24} /> : <MessageCircle size={28} />}
          </button>
          {isChatOpen && (
            <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col h-[500px]">
              <div className="bg-purple-900/20 p-4 border-b border-purple-500/20 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <MessageCircle size={18} className="text-purple-400" /> Class Chat
                </h3>
                <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white"><Minimize2 size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.userId === user._id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      msg.userId === user._id ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'
                    }`}>{msg.message}</div>
                    <span className="text-[10px] text-gray-500 mt-1">{msg.userName}</span>
                  </div>
                ))}
                <div ref={chatScrollRef} />
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newMessage.trim()) return;
                socket.emit('send_message', {
                  courseId: id, userId: user._id, userName: user.name,
                  role: "student", message: newMessage, createdAt: new Date()
                });
                setNewMessage("");
              }} className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2">
                <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 outline-none" />
                <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl"><Send size={18} /></button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CourseDetail;