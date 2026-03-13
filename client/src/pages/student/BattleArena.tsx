import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Trophy, Users, Loader2, Sword, Terminal, CheckCircle, XCircle, Skull, Clock } from 'lucide-react';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import io from 'socket.io-client';
import Confetti from 'react-confetti';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
const CODE_TEMPLATES = {
    c: `#include <stdio.h>\n\nint main() {\n    // 1. Read from standard input (stdin)\n    // Example: int n; scanf("%d", &n);\n\n    // 2. Write your logic here\n\n    // 3. Print to standard output (stdout)\n    // Example: printf("%d", n);\n\n    return 0;\n}\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // 1. Read from standard input (stdin)\n    // Example: int n; cin >> n;\n\n    // 2. Write your logic here\n\n    // 3. Print to standard output (stdout)\n    // Example: cout << n << endl;\n\n    return 0;\n}\n`,
    java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // 1. Read from standard input (stdin)\n        // Example: int n = sc.nextInt();\n\n        // 2. Write your logic here\n\n        // 3. Print to standard output (stdout)\n        // Example: System.out.println(n);\n    }\n}\n`,
    python: `import sys\n\ndef main():\n    # 1. Read all standard input\n    # Example: input_data = sys.stdin.read().split()\n    \n    # 2. Write your logic here\n    \n    # 3. Print to standard output\n    pass\n\nif __name__ == '__main__':\n    main()\n`
};

const BattleArena = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext) as any;
    
    const [battle, setBattle] = useState<any>(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const templateRef = useRef("");
    
    const [submitLoading, setSubmitLoading] = useState(false);
    const [runLoading, setRunLoading] = useState(false);
    
    const [winner, setWinner] = useState<string | null>(null);
    const [winReason, setWinReason] = useState<string | null>(null);
    const [debugOutput, setDebugOutput] = useState<string>('> System idle. Awaiting combatant input...');
    const [runResults, setRunResults] = useState<any[]>([]);
    
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        const nextTemplate = CODE_TEMPLATES[language as keyof typeof CODE_TEMPLATES] || "";
        if (!code || code === templateRef.current) {
            setCode(nextTemplate);
            templateRef.current = nextTemplate;
        }
    }, [language, code]);

    useEffect(() => {
        api.post(`/battles/join-room/${roomId}`).then(res => {
            setBattle(res.data.battle || res.data);
        }).catch(() => {
            alert("Room not found or unauthorized.");
            navigate('/student/battle-hub');
        });

        socket.emit('join_battle', roomId);
        
        socket.on('player_joined', () => {
            api.get(`/battles/${roomId}/status`).then(res => setBattle(res.data.battle));
        });

        socket.on('battle_started', () => {
            api.get(`/battles/${roomId}/status`).then(res => setBattle(res.data.battle));
        });

        socket.on('battle_over', ({ winnerName, reason }) => {
            setWinner(winnerName);
            if (reason) setWinReason(reason);
            setTimeLeft(0);
        });

        return () => { 
            socket.off('player_joined'); 
            socket.off('battle_started'); 
            socket.off('battle_over'); 
        }
    }, [roomId, navigate]);

    useEffect(() => {
        if (battle?.status === 'active' && battle?.startTime) {
            const durationSeconds = (battle.duration || 30) * 60;
            
            const tick = () => {
                const elapsed = Math.floor((Date.now() - new Date(battle.startTime).getTime()) / 1000);
                const remaining = Math.max(0, durationSeconds - elapsed);
                setTimeLeft(remaining);
                
                if (remaining === 0) {
                    clearInterval(interval);
                    if (!winner) setDebugOutput('> TIME EXPIRED. COMBAT CONCLUDED.');
                }
            };
            
            tick(); 
            const interval = setInterval(tick, 1000);
            return () => clearInterval(interval);
        }
    }, [battle, winner]);

    const startBattle = () => {
        socket.emit('start_battle', roomId);
    };

    const handleAbandon = () => {
        if (window.confirm("Are you sure you want to abandon the arena? You will forfeit the match and your opponent will win.")) {
            socket.emit('abandon_battle', { roomId, userId: user._id });
            navigate('/student/battle-hub');
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const runCode = async () => {
        setRunLoading(true);
        setDebugOutput('> Compiling and executing against sample cases...\n');
        setRunResults([]);

        try {
            const res = await api.post(`/battles/${roomId}/run`, { code, language });
            setRunResults(res.data.results || []);
            setDebugOutput(`> Execution Complete.\n> Passed: ${res.data.passedCases} / ${res.data.totalCases} Sample Cases.`);
        } catch (err: any) {
            setDebugOutput(`> Error: ${err.response?.data?.error || "Compilation Failed"}`);
        } finally {
            setRunLoading(false);
        }
    };

    const submitCode = async () => {
        setSubmitLoading(true);
        setDebugOutput('> Initiating final submission sequence...\n> Testing against hidden parameters...');
        setRunResults([]);

        try {
            const res = await api.post(`/battles/${roomId}/submit`, { code, language });
            
            if (res.data.isWinner) {
                setDebugOutput('> ALL CASES PASSED. Transmitting victory signal...');
                socket.emit('battle_won', { roomId, winnerName: user.name });
            } else {
                setDebugOutput(`> Submission Failed.\n> Passed: ${res.data.passedCases} / ${res.data.totalCases} Total Cases.\n> Failed at Case #${res.data.failedCaseNumber}`);
            }
        } catch (err: any) {
            setDebugOutput(`> Critical Error: ${err.response?.data?.error || "Submission Failed"}`);
        } finally {
            setSubmitLoading(false);
        }
    };

    if (!battle) return <div className="h-screen bg-black flex items-center justify-center text-neon-blue"><Loader2 className="animate-spin" size={40}/></div>;

    if (winner) {
        const isMe = winner === user.name;
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center text-center relative overflow-hidden p-4">
                {isMe && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}
                <div className={`absolute inset-0 blur-[150px] opacity-20 ${isMe ? 'bg-yellow-500' : 'bg-red-600'}`} />
                <div className="relative z-10 flex flex-col items-center">
                    {isMe ? <Trophy size={80} className="text-yellow-500 mb-6 animate-bounce md:w-24 md:h-24" /> : <Skull size={80} className="text-red-600 mb-6 md:w-24 md:h-24" />}
                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic mb-4 tracking-tighter">
                        {isMe ? "VICTORY ACHIEVED" : winner === "Time Expired" ? "TIME EXPIRED" : "MISSION FAILED"}
                    </h1>
                    <p className={`text-lg md:text-2xl font-bold uppercase tracking-widest ${isMe ? 'text-yellow-400' : 'text-red-500'}`}>
                        {isMe ? "You conquered the arena!" : winner === "Time Expired" ? "The battle ended in a draw." : `${winner} secured the objective.`}
                    </p>
                    {winReason && (
                        <p className="mt-4 text-orange-400 font-bold uppercase tracking-widest text-xs md:text-sm bg-orange-500/10 px-6 py-2 rounded-full border border-orange-500/20">
                            {winReason}
                        </p>
                    )}
                    <button onClick={() => navigate('/student/dashboard')} className="mt-10 bg-white text-black font-black px-8 py-4 rounded-2xl hover:scale-105 transition-transform uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    const isTimeExpired = timeLeft !== null && timeLeft === 0;

    return (
        <div className="h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
            {/* NAVBAR */}
            <div className="bg-[#0a0a0a] border-b border-gray-800 p-3 md:p-4 flex flex-wrap justify-between items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 md:gap-4">
                    <span className="bg-red-600/20 border border-red-500 text-red-500 px-3 py-1.5 rounded font-mono font-black tracking-widest text-[10px] md:text-xs">ROOM: {roomId}</span>
                    <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase flex items-center gap-1 md:gap-2 bg-gray-900 px-2 md:px-3 py-1.5 rounded"><Users size={14} className="text-neon-blue"/> {battle.participants.length} <span className="hidden sm:inline">Connected</span></span>
                </div>
                
                {battle.status === 'active' && timeLeft !== null && (
                    <div className={`flex items-center gap-2 font-mono text-sm md:text-xl px-4 py-1.5 rounded-full border ${timeLeft <= 300 ? 'text-red-500 bg-red-500/10 border-red-500/20 animate-pulse' : 'text-orange-500 bg-orange-500/10 border-orange-500/20'}`}>
                        <Clock size={16} className="md:w-5 md:h-5" />
                        <span className="font-black">{formatTime(timeLeft)}</span>
                    </div>
                )}

                <button onClick={handleAbandon} className="text-gray-500 hover:text-white text-[10px] md:text-xs font-bold uppercase transition-colors">Abandon</button>
            </div>

            {battle.status === 'waiting' ? (
                /* 🕒 LOBBY VIEW */
                <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-y-auto">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-orange-600/10 blur-[100px] md:blur-[120px] rounded-full pointer-events-none" />
                    
                    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl max-w-lg w-full relative z-10 text-center">
                        <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase mb-2">Combat <span className="text-orange-500">Lobby</span></h2>
                        <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6 md:mb-8 animate-pulse">Awaiting Squad Synchronization...</p>
                        
                        <div className="bg-black/50 border border-gray-800 rounded-2xl p-4 mb-6 md:mb-8 text-left max-h-48 overflow-y-auto custom-scrollbar">
                            <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Connected Heroes</h3>
                            <div className="space-y-2">
                                {battle.participants.map((p: any, idx: number) => (
                                    <div key={idx} className="bg-gray-900 border border-gray-800 px-4 py-3 rounded-xl flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]" />
                                        <span className="font-bold text-sm text-gray-300">{p.user?.name || "Hero"}</span>
                                        {idx === 0 && <span className="ml-auto text-[8px] bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded uppercase font-black">Host</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {(battle.participants[0].user?._id === user._id || battle.participants[0].user === user._id) ? (
                            <button 
                                onClick={startBattle} 
                                disabled={battle.participants.length < 2}
                                className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg transition-all active:scale-95 text-xs md:text-sm"
                            >
                                {battle.participants.length < 2 ? "Waiting for Opponent..." : "Initialize Battle"}
                            </button>
                        ) : (
                            <div className="py-4 border border-dashed border-gray-700 rounded-xl text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                                Waiting for Host to Start...
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* ⚔️ ACTIVE BATTLE VIEW - RESPONSIVE STACKING */
                <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
                    
                    {/* Top/Left Side: Problem Description */}
                    <div className="w-full lg:w-1/3 lg:h-full min-h-[40vh] bg-gray-900 border-b lg:border-b-0 lg:border-r border-gray-800 flex flex-col shrink-0 lg:shrink">
                        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="flex items-center gap-3 mb-3 md:mb-4">
                                <span className={`px-2 py-1 rounded text-[9px] md:text-[10px] font-black uppercase ${battle.problem?.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' : battle.problem?.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>
                                    {battle.problem?.difficulty || "Medium"}
                                </span>
                                <span className="text-yellow-500 text-[10px] md:text-xs font-black">+{battle.problem?.xpReward} XP</span>
                            </div>
                            
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-4 md:mb-6 uppercase italic tracking-tighter">{battle.problem?.title}</h2>
                            
                            <div className="text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap mb-6 md:mb-8 bg-black/40 p-4 md:p-5 rounded-2xl border border-gray-800">
                                {battle.problem?.description}
                            </div>

                            <h3 className="font-black text-orange-500 uppercase tracking-widest text-[9px] md:text-[10px] mb-3 md:mb-4">Sample Executions</h3>
                            {battle.problem?.examples?.map((ex: any, i: number) => (
                                <div key={i} className="bg-black border border-gray-800 p-4 md:p-5 rounded-xl md:rounded-2xl mb-3 md:mb-4 font-mono text-[10px] md:text-xs shadow-inner">
                                    <div className="mb-2"><span className="text-gray-600 uppercase font-bold text-[8px] md:text-[9px] block mb-1">Input</span> <span className="text-neon-blue">{ex.input}</span></div>
                                    <div className="mb-2"><span className="text-gray-600 uppercase font-bold text-[8px] md:text-[9px] block mb-1">Output</span> <span className="text-green-400">{ex.output}</span></div>
                                    {ex.explanation && <div><span className="text-gray-600 uppercase font-bold text-[8px] md:text-[9px] block mb-1 mt-2">Explanation</span> <span className="text-gray-400">{ex.explanation}</span></div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom/Right Side: Code Editor & Terminal */}
                    <div className="w-full lg:w-2/3 h-[60vh] lg:h-full flex flex-col bg-[#0a0a0a] shrink-0 lg:shrink">
                        {/* Editor Toolbar */}
                        <div className="p-3 md:p-4 border-b border-gray-800 flex flex-wrap gap-3 justify-between items-center shrink-0">
                            <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-gray-900 border border-gray-800 text-white text-[10px] md:text-xs font-bold uppercase rounded-lg px-3 py-2 outline-none focus:border-neon-blue transition-colors cursor-pointer w-full sm:w-auto">
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                                <option value="c">C</option>
                            </select>
                            
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button onClick={runCode} disabled={runLoading || submitLoading || isTimeExpired} className="flex-1 sm:flex-none justify-center bg-gray-800 hover:bg-gray-700 text-white font-black px-4 md:px-6 py-2.5 rounded-lg flex items-center gap-1.5 md:gap-2 uppercase tracking-widest text-[9px] md:text-[10px] transition-colors disabled:opacity-50">
                                    {runLoading ? <Loader2 className="animate-spin" size={14}/> : <Play size={14}/>} <span className="hidden sm:inline">RUN TEST</span><span className="sm:hidden">RUN</span>
                                </button>

                                <button onClick={submitCode} disabled={runLoading || submitLoading || isTimeExpired} className="flex-1 sm:flex-none justify-center bg-orange-600 hover:bg-orange-500 text-white font-black px-4 md:px-8 py-2.5 rounded-lg flex items-center gap-1.5 md:gap-2 uppercase tracking-widest text-[9px] md:text-[10px] transition-colors shadow-[0_0_15px_rgba(234,88,12,0.4)] disabled:opacity-50">
                                    {submitLoading ? <Loader2 className="animate-spin" size={14}/> : <Sword size={14}/>} SUBMIT
                                </button>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 relative min-h-[250px]">
                            <textarea 
                                value={code} 
                                onChange={e => setCode(e.target.value)} 
                                spellCheck={false}
                                disabled={isTimeExpired}
                                className="absolute inset-0 w-full h-full bg-[#050505] p-4 md:p-6 font-mono text-xs md:text-sm text-green-400 outline-none resize-none custom-scrollbar leading-relaxed disabled:opacity-50" 
                                placeholder="// Write your main program here.\n// Read from standard input (stdin) and print to standard output (stdout)." 
                            />
                        </div>

                        {/* Terminal Window */}
                        <div className="h-48 md:h-64 bg-gray-950 border-t-4 border-gray-800 flex flex-col shrink-0">
                            <div className="bg-gray-900 px-3 md:px-4 py-2 border-b border-gray-800 flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 shrink-0">
                                <Terminal size={14} /> System Logs
                            </div>
                            <div className="p-3 md:p-4 overflow-y-auto custom-scrollbar flex-1 font-mono text-[10px] md:text-xs">
                                <pre className={`${debugOutput.includes('Error') || debugOutput.includes('Failed') ? 'text-red-400' : 'text-gray-400'} whitespace-pre-wrap mb-4 leading-relaxed`}>
                                    {debugOutput}
                                </pre>

                                {runResults.length > 0 && (
                                    <div className="space-y-3 mt-4 border-t border-gray-800 pt-4">
                                        {runResults.map((r, i) => (
                                            <div key={i} className={`p-3 rounded-lg border ${r.passed ? 'bg-green-900/10 border-green-900/50' : 'bg-red-900/10 border-red-900/50'}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    {r.passed ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-500" />}
                                                    <span className={`font-bold uppercase tracking-widest text-[9px] md:text-[10px] ${r.passed ? 'text-green-500' : 'text-red-500'}`}>Case {r.caseNumber}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 md:gap-4 text-[9px] md:text-[11px]">
                                                    <div><span className="text-gray-600 block mb-1">Input:</span><span className="text-gray-300 break-words">{r.input || "N/A"}</span></div>
                                                    <div><span className="text-gray-600 block mb-1">Expected:</span><span className="text-gray-300 break-words">{r.expected}</span></div>
                                                    <div className="col-span-2"><span className="text-gray-600 block mb-1">Your Output:</span><span className={`${r.passed ? 'text-green-400' : 'text-red-400'} break-words`}>{r.output || "No output"}</span></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BattleArena;