import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Star, X, BookOpen, Sword, Loader2, Terminal, Play, XCircle } from 'lucide-react';
import api from '../../utils/api';
import Mascot from '../../components/Mascot';
import Confetti from 'react-confetti';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
const socket = io(SOCKET_URL);

const CODE_TEMPLATES = {
    c: `#include <stdio.h>\n\nint main() {\n    // Read from standard input\n    return 0;\n}\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read from standard input\n    return 0;\n}\n`,
    java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read from standard input\n    }\n}\n`,
    python: `import sys\n\ndef main():\n    # Read all standard input\n    pass\n\nif __name__ == '__main__':\n    main()\n`
};

const LessonPlayer = () => {
  const { courseId, sectionIndex } = useParams();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [course, setCourse] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [mascotMood, setMascotMood] = useState<'idle' | 'happy' | 'sad'>('idle');
  const [showVictory, setShowVictory] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [completing, setCompleting] = useState(false);

  const [language, setLanguage] = useState('python');
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [runResults, setRunResults] = useState<any[]>([]);
  const templateRef = useRef("");

  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [completedSections, setCompletedSections] = useState<string[]>([]);

  const [showCertificate, setShowCertificate] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const nextTemplate = CODE_TEMPLATES[language as keyof typeof CODE_TEMPLATES] || "";
      if (!code || code === templateRef.current) {
          setCode(nextTemplate);
          templateRef.current = nextTemplate;
      }
  }, [language, code]);

  useEffect(() => {
    const fetchCourseAndProgress = async () => {
      try {
        setLoading(true);
        const courseRes = await api.get(`/courses/${courseId}`);
        setCourse(courseRes.data);
        setIsLive(courseRes.data.liveSession?.isActive || false);

        const currentUserId = localStorage.getItem("userId");
        const existingRating = courseRes.data.ratings?.find((r: any) => r.student === currentUserId);
        if (existingRating) {
            setUserRating(existingRating.rating);
            setHasRated(true);
        }

        try {
            const progressRes = await api.get(`/users/progress/${courseId}`);
            setCompletedSections(progressRes.data.completedSections || []);
        } catch (e) {
            setCompletedSections([]);
        }

        const idx = parseInt(sectionIndex || '0');
        if (courseRes.data.sections && courseRes.data.sections[idx]) {
          const sec = courseRes.data.sections[idx];
          setCurrentSection(sec);
          if (sec.type === 'code' && sec.codeChallenge?.starterCode) {
              setCode(sec.codeChallenge.starterCode);
              templateRef.current = sec.codeChallenge.starterCode; 
          }
        }
        
        setLoading(false);
        setShowVictory(false);
        setQuizMode(false);
        setOutput("");
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
        
        resetQuiz();
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchCourseAndProgress();

    socket.emit('join_room', courseId);
    fetchChatHistory();

    const handleReceiveMessage = (data: any) => {
        setChatMessages((prev) => [...prev, data]);
        scrollToBottom();
    };

    socket.on('receive_message', handleReceiveMessage);
    return () => { socket.off('receive_message', handleReceiveMessage); };
  }, [courseId, sectionIndex]);

  const resetQuiz = () => {
    setCurrentQIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setQuizScore(0);
    setMascotMood('idle');
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) 
      ? `https://www.youtube.com/embed/${match[2]}?rel=0&modestbranding=1` 
      : url;
  };

  const runCode = async () => {
    setRunLoading(true);
    setOutput('> Compiling and executing against sample cases...\n');
    setRunResults([]);

    try {
        const res = await api.post(`/courses/${courseId}/sections/${currentSection._id}/execute`, { 
            code, language, mode: 'run' 
        });
        setRunResults(res.data.results || []);
        setOutput(`> Execution Complete.\n> Passed: ${res.data.passedCases} / ${res.data.totalCases} Sample Cases.`);
        setMascotMood(res.data.passedCases === res.data.totalCases ? 'happy' : 'sad');
    } catch (err: any) {
        setOutput(`> ❌ System Error: ${err.response?.data?.error || "Compilation Failed"}`);
        setMascotMood('sad');
    } finally {
        setRunLoading(false);
    }
  };

  const submitCode = async () => {
    setSubmitLoading(true);
    setOutput('> Initiating final submission sequence...\n> Testing against hidden parameters...');
    setRunResults([]);

    try {
        const res = await api.post(`/courses/${courseId}/sections/${currentSection._id}/execute`, { 
            code, language, mode: 'submit' 
        });
        
        if (res.data.isWinner) {
            setOutput('> ALL CASES PASSED. Objective Secured!');
            setMascotMood('happy');
            finishLevel(); 
        } else {
            setOutput(`> Submission Failed.\n> Passed: ${res.data.passedCases} / ${res.data.totalCases} Total Cases.\n> Failed at Case #${res.data.failedCaseNumber}`);
            setMascotMood('sad');
        }
    } catch (err: any) {
        setOutput(`> ❌ Critical Error: ${err.response?.data?.error || "Submission Failed"}`);
        setMascotMood('sad');
    } finally {
        setSubmitLoading(false);
    }
  };

  const finishLevel = async () => {
    if (completing) return;
    
    if (currentSection.quiz?.length > 0) {
      if (quizScore < currentSection.quiz.length / 2) {
        alert(`Mission Failure: Score ${quizScore}/${currentSection.quiz.length}. 50% accuracy required.`);
        resetQuiz();
        setQuizMode(false);
        return;
      }
    }

    setCompleting(true);
    try {
      const marksObtained = currentSection.quiz?.length > 0 ? quizScore : 10;
      const totalPossible = currentSection.quiz?.length > 0 ? currentSection.quiz.length : 10;

      await api.put('/users/progress', {
        courseId: course._id,
        sectionId: currentSection._id,
        xpEarned: currentSection.points || 10,
        score: marksObtained,
        totalPossible: totalPossible
      });

      setXpEarned(currentSection.points || 10);
      setShowVictory(true);
    } catch (err) {
      setShowVictory(true);
    } finally {
      setCompleting(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
        const res = await api.get(`/courses/${courseId}/chat`);
        setChatMessages(res.data);
        scrollToBottom();
    } catch (err) { console.error("Chat Error", err); }
  };

  const scrollToBottom = () => {
    setTimeout(() => { chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const sendMessage = async (e: any) => {
    e.preventDefault();
    const currentUserName = localStorage.getItem("username") || "Student";
    const currentUserId = localStorage.getItem("userId");
    if (!newMessage.trim() || !currentUserId) return;
    const messageData = { courseId: courseId, userId: currentUserId, userName: currentUserName, role: "student", message: newMessage, createdAt: new Date() };
    await socket.emit('send_message', messageData);
    setNewMessage("");
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;
    try {
        const canvas = await html2canvas(certificateRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${course.title}_Certificate.pdf`);
    } catch (err) { console.error("Certificate download failed", err); }
  };

  if (loading || !currentSection) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-neon-blue mb-4" size={40} />
        <h2 className="text-neon-blue font-black tracking-widest animate-pulse text-sm md:text-base">LOADING MISSION DATA...</h2>
      </div>
    );
  }

  const hasQuiz = currentSection.quiz && currentSection.quiz.length > 0;

  // --- VICTORY SCREEN ---
  if (showVictory) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={300} />
        <div className="bg-gray-900 border-2 border-yellow-500/50 p-6 md:p-10 rounded-3xl max-w-md w-full text-center shadow-[0_0_60px_rgba(234,179,8,0.15)] z-10">
          <Mascot mood="happy" />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2 mt-6 uppercase tracking-tighter italic">Mission Clear</h2>
          <div className="bg-black/50 p-4 md:p-5 rounded-2xl mb-8 flex justify-between items-center border border-white/5">
            <span className="text-gray-500 font-bold uppercase text-[10px] md:text-xs tracking-widest">Rewards Data</span>
            <span className="text-yellow-400 font-black text-xl md:text-2xl">+{xpEarned} XP</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <button onClick={() => navigate(`/student/course/${courseId}`)} className="w-full sm:w-auto flex-1 py-3 md:py-4 rounded-xl font-bold text-gray-500 hover:text-white transition-colors border border-gray-800 text-sm">MAP</button>
            <button onClick={() => {
              const nextIdx = parseInt(sectionIndex || '0') + 1;
              if (course.sections && nextIdx < course.sections.length) {
                navigate(`/student/course/${courseId}/play/${nextIdx}`);
              } else {
                navigate(`/student/dashboard`);
              }
            }} className="w-full sm:w-auto flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 md:py-4 rounded-xl shadow-lg uppercase transition-transform hover:scale-105 text-sm">Next Mission</button>
          </div>
        </div>
      </div>
    );
  }

  // --- QUIZ VIEW ---
  if (quizMode && currentSection.quiz) {
    const question = currentSection.quiz[currentQIndex];
    const progress = ((currentQIndex) / currentSection.quiz.length) * 100;

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <div className="p-4 md:p-6 flex items-center gap-4 md:gap-6 bg-gray-900/50 border-b border-white/5">
          <button onClick={() => setQuizMode(false)} className="text-gray-500 hover:text-white transition-colors"><X size={24} className="md:w-7 md:h-7" /></button>
          <div className="flex-1 bg-gray-800 h-2 md:h-3 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-neon-blue transition-all duration-700 shadow-[0_0_15px_#00f3ff]" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 text-yellow-500 font-black px-3 md:px-4 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20 text-sm md:text-base">
            <Star size={14} className="md:w-4 md:h-4" fill="currentColor" /> {quizScore}
          </div>
        </div>

        <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row items-center gap-8 md:gap-12 justify-center">
          <div className="hidden md:block transform hover:scale-110 transition-transform"><Mascot mood={mascotMood} /></div>
          <div className="flex-1 w-full space-y-4 md:space-y-6">
            <div className="bg-gray-900 p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 shadow-2xl relative mt-4 md:mt-0">
              <span className="absolute -top-3 left-6 md:left-8 bg-neon-blue text-black text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full uppercase">Current Task</span>
              <h2 className="text-xl md:text-2xl font-black leading-snug">{question.question}</h2>
            </div>

            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {question.options.map((opt: string, idx: number) => {
                let btnStyle = "border-white/5 bg-gray-900/50 hover:bg-gray-800 hover:border-white/20";
                if (selectedOption === idx) btnStyle = "border-neon-blue bg-neon-blue/10 text-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.1)]";
                if (isAnswerChecked) {
                  if (idx === question.correctIndex) btnStyle = "border-green-500 bg-green-500/20 text-green-400";
                  else if (idx === selectedOption && !isCorrect) btnStyle = "border-red-500 bg-red-500/20 text-red-400";
                }
                return (
                  <button key={idx} disabled={isAnswerChecked} onClick={() => setSelectedOption(idx)} className={`p-4 md:p-6 rounded-xl md:rounded-2xl border-2 text-sm md:text-lg font-bold transition-all text-left flex items-center justify-between group ${btnStyle}`}>
                    {opt}
                    {isAnswerChecked && idx === question.correctIndex && <CheckCircle className="text-green-500 w-5 h-5 md:w-6 md:h-6" />}
                    {isAnswerChecked && idx === selectedOption && !isCorrect && <X className="text-red-500 w-5 h-5 md:w-6 md:h-6" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`p-6 md:p-8 border-t border-white/5 transition-colors duration-500 ${isAnswerChecked ? (isCorrect ? 'bg-green-900/10' : 'bg-red-900/10') : 'bg-black'}`}>
          <div className="max-w-4xl mx-auto flex justify-center md:justify-between items-center">
            <div className="hidden md:flex flex-col">
              {isAnswerChecked && (
                <span className={`font-black text-2xl uppercase italic tracking-tighter ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                  {isCorrect ? "Precision +100" : "Data Corrupted"}
                </span>
              )}
            </div>
            {!isAnswerChecked ? (
              <button onClick={() => {
                const currentQ = currentSection.quiz[currentQIndex];
                const correct = currentQ.correctIndex === selectedOption;
                setIsCorrect(correct);
                setIsAnswerChecked(true);
                setMascotMood(correct ? 'happy' : 'sad');
                if (correct) setQuizScore(s => s + 1);
              }} disabled={selectedOption === null} className={`w-full md:w-auto px-12 md:px-20 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl uppercase tracking-widest transition-all ${selectedOption !== null ? 'bg-neon-blue text-black shadow-lg hover:brightness-110' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>Verify</button>
            ) : (
              <button onClick={() => {
                if (currentQIndex < currentSection.quiz.length - 1) {
                  setCurrentQIndex(i => i + 1);
                  setSelectedOption(null);
                  setIsAnswerChecked(false);
                  setMascotMood('idle');
                } else {
                  finishLevel();
                }
              }} className="w-full md:w-auto px-12 md:px-20 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl uppercase bg-white text-black hover:bg-neon-blue transition-all">Next</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN LESSON VIEW ---
  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-md p-3 md:p-4 flex items-center justify-between border-b border-white/5 z-20 shrink-0">
        <button onClick={() => navigate(`/student/course/${courseId}`)} className="flex items-center gap-1 md:gap-2 text-gray-500 hover:text-white font-bold transition-all group text-xs md:text-base">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform md:w-5 md:h-5" /> <span className="hidden sm:inline">BACK TO MAP</span><span className="sm:hidden">BACK</span>
        </button>
        <div className="text-center truncate px-2">
          <p className="text-[8px] md:text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Sector {parseInt(sectionIndex || '0') + 1}</p>
          <h1 className="font-black text-sm md:text-lg text-neon-blue uppercase tracking-tight truncate max-w-[150px] md:max-w-md">{currentSection.title}</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {isLive && <span className="hidden sm:inline bg-red-600 text-white px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]">🔴 LIVE SESSION</span>}
          <div className="bg-yellow-500/10 px-2 md:px-4 py-1 rounded-lg md:rounded-xl text-yellow-500 font-black text-xs md:text-sm border border-yellow-500/20">+{currentSection.points} <span className="hidden sm:inline">XP</span></div>
        </div>
      </div>

      {/* ✅ RESPONSIVE STACKING LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        
        {/* Left/Top Content Area (Video/Text/Description) */}
        <div ref={scrollContainerRef} className={`w-full ${currentSection.type === 'code' ? 'lg:w-1/3 lg:border-r border-gray-800' : 'max-w-4xl mx-auto'} flex-shrink-0 lg:flex-shrink p-4 md:p-6 lg:p-10 overflow-y-auto custom-scrollbar flex flex-col`}>
          <div className="w-full space-y-6 md:space-y-8">
            
            {currentSection.type === 'video' && (
              <div className="space-y-6 md:space-y-8">
                <div className="aspect-video bg-gray-900 rounded-2xl md:rounded-[2rem] overflow-hidden border-2 md:border-4 border-gray-800 shadow-2xl">
                  <iframe src={getEmbedUrl(currentSection.videoUrl)} className="w-full h-full" allowFullScreen title="Video Content" />
                </div>
                {!hasQuiz && (
                  <div className="bg-gray-900 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 text-center sm:text-left">
                    <div>
                      <h3 className="text-lg md:text-xl font-black uppercase italic">Objective Complete?</h3>
                      <p className="text-gray-500 text-xs md:text-sm mt-1">Synchronize your progress once the transmission ends.</p>
                    </div>
                    <button onClick={finishLevel} disabled={completing} className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-black py-3 md:py-4 px-8 md:px-12 rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base">
                      {completing ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />} SUBMIT MISSION
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentSection.type === 'text' && (
              <div className="space-y-6 md:space-y-8">
                <div className="bg-gray-900 p-8 md:p-12 rounded-2xl md:rounded-[2.5rem] border border-white/5 shadow-2xl relative">
                  <div className="absolute top-0 right-6 md:right-10 transform -translate-y-1/2 bg-purple-600 p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg">
                    <BookOpen className="text-white w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 uppercase tracking-tighter">Mission Intelligence</h2>
                  <div className="whitespace-pre-wrap text-gray-300 leading-relaxed text-base md:text-xl font-medium prose prose-invert max-w-none">{currentSection.content}</div>
                </div>
                {!hasQuiz && (
                  <button onClick={finishLevel} disabled={completing} className="w-full bg-white hover:bg-neon-blue text-black font-black py-4 md:py-6 rounded-xl md:rounded-2xl shadow-xl flex items-center justify-center gap-2 md:gap-3 uppercase tracking-widest transition-all text-sm md:text-base">
                    {completing ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />} ACKNOWLEDGE INTEL
                  </button>
                )}
              </div>
            )}

            {currentSection.type === 'code' && (
              <>
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="p-1.5 md:p-2 bg-yellow-500/20 rounded-lg"><Sword className="text-yellow-500 w-4 h-4 md:w-6 md:h-6" /></div>
                  <h3 className="text-gray-200 font-black uppercase text-xs md:text-sm tracking-widest">Mission Task</h3>
                </div>
                <div className="text-sm md:text-lg text-gray-400 leading-relaxed italic mb-6 md:mb-8">{currentSection.codeChallenge?.problemStatement}</div>
              </>
            )}

          </div>
        </div>

        {/* Right/Bottom Content Area (Code Editor specifically) */}
        {currentSection.type === 'code' && (
          <div className="w-full lg:w-2/3 h-[70vh] lg:h-full flex flex-col bg-[#0a0a0a] shrink-0 lg:shrink">
            <div className="p-3 md:p-4 border-t lg:border-t-0 border-b border-gray-800 flex flex-wrap justify-between items-center shrink-0 bg-[#0a0a0a]">
                <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-gray-900 border border-gray-800 text-white text-[10px] md:text-xs font-bold uppercase rounded-lg px-3 py-2 outline-none focus:border-neon-blue transition-colors cursor-pointer w-full sm:w-auto mb-2 sm:mb-0">
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                </select>
                
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={runCode} disabled={runLoading || submitLoading} className="flex-1 sm:flex-none justify-center bg-gray-800 hover:bg-gray-700 text-white font-black px-4 md:px-6 py-2 md:py-2.5 rounded-lg flex items-center gap-1.5 md:gap-2 uppercase tracking-widest text-[9px] md:text-[10px] transition-colors disabled:opacity-50">
                        {runLoading ? <Loader2 className="animate-spin" size={14}/> : <Play size={14}/>} <span className="hidden sm:inline">RUN TEST</span><span className="sm:hidden">RUN</span>
                    </button>
                    <button onClick={submitCode} disabled={runLoading || submitLoading} className="flex-1 sm:flex-none justify-center bg-neon-blue hover:bg-cyan-400 text-black font-black px-4 md:px-8 py-2 md:py-2.5 rounded-lg flex items-center gap-1.5 md:gap-2 uppercase tracking-widest text-[9px] md:text-[10px] transition-colors shadow-[0_0_15px_rgba(0,243,255,0.4)] disabled:opacity-50">
                        {submitLoading ? <Loader2 className="animate-spin" size={14}/> : <Sword size={14}/>} SUBMIT
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-[#050505] border-b border-gray-800 p-4 md:p-6 font-mono text-xs md:text-sm text-green-400 shadow-inner relative overflow-hidden group min-h-[250px]">
              <div className="absolute top-2 right-4 md:top-4 md:right-6 text-[9px] md:text-[10px] text-gray-600 uppercase font-black tracking-widest flex items-center gap-1.5 md:gap-2">
                <Terminal size={10} className="md:w-3 md:h-3" /> IDE_CORE_v1.0
              </div>
              <textarea value={code} onChange={e => setCode(e.target.value)} className="w-full h-full bg-transparent outline-none resize-none custom-scrollbar" spellCheck={false} />
            </div>

            <div className="h-40 md:h-48 lg:h-56 bg-gray-950 flex flex-col shrink-0 overflow-hidden">
              <div className="bg-gray-900 px-3 md:px-4 py-2 border-b border-gray-800 flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 shrink-0">
                  <Terminal size={12} className="md:w-3.5 md:h-3.5" /> System Logs
              </div>
              <div className="p-3 md:p-4 overflow-y-auto custom-scrollbar flex-1 font-mono text-[10px] md:text-xs">
                  <pre className={`${output.includes('Error') || output.includes('Failed') ? 'text-red-400' : 'text-gray-400'} whitespace-pre-wrap mb-4 leading-relaxed`}>
                      {output}
                  </pre>

                  {runResults.length > 0 && (
                      <div className="space-y-2 md:space-y-3 mt-3 md:mt-4 border-t border-gray-800 pt-3 md:pt-4">
                          {runResults.map((r, i) => (
                              <div key={i} className={`p-2 md:p-3 rounded-lg border ${r.passed ? 'bg-green-900/10 border-green-900/50' : 'bg-red-900/10 border-red-900/50'}`}>
                                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                                      {r.passed ? <CheckCircle size={12} className="text-green-500 md:w-3.5 md:h-3.5" /> : <XCircle size={12} className="text-red-500 md:w-3.5 md:h-3.5" />}
                                      <span className={`font-bold uppercase tracking-widest text-[9px] md:text-[10px] ${r.passed ? 'text-green-500' : 'text-red-500'}`}>Case {r.caseNumber}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 md:gap-4 text-[9px] md:text-[11px]">
                                      <div><span className="text-gray-600 block mb-0.5 md:mb-1">Input:</span><span className="text-gray-300 break-words">{r.input || "N/A"}</span></div>
                                      <div><span className="text-gray-600 block mb-0.5 md:mb-1">Expected:</span><span className="text-gray-300 break-words">{r.expected}</span></div>
                                      <div className="col-span-2"><span className="text-gray-600 block mb-0.5 md:mb-1">Your Output:</span><span className={`${r.passed ? 'text-green-400' : 'text-red-400'} break-words`}>{r.output || "No output"}</span></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonPlayer;