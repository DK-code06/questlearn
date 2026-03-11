import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Radio, Video, Mic, Share, StopCircle } from 'lucide-react';
import api from '../utils/api'; // Your API utility

const InstructorLiveManager = () => {
  const { courseId } = useParams(); // Ensure your route provides this
  const [isLive, setIsLive] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Fetch current live status on load
  useEffect(() => {
    const checkStatus = async () => {
        try {
            const res = await api.get(`/courses/${courseId}/live-status`);
            setIsLive(res.data.isActive);
            setMeetingLink(res.data.meetingLink);
        } catch (err) {
            console.error("Failed to fetch live status");
        }
    };
    checkStatus();
  }, [courseId]);

  // 2. Toggle Live Status
  const toggleLive = async () => {
    setLoading(true);
    try {
        const newStatus = !isLive;
        // API call to update DB
        await api.post(`/courses/${courseId}/live-status`, { 
            isActive: newStatus 
        });
        
        setIsLive(newStatus);
        
        if (newStatus) {
            alert("🔴 You are LIVE! Students have been notified.");
            window.open(meetingLink, '_blank'); // Auto-open meet for instructor
        } else {
            alert("Live session ended.");
        }
    } catch (err) {
        alert("Error updating live status");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-2xl border border-gray-800 text-white shadow-xl max-w-2xl mx-auto mt-10">
      
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Video className="text-purple-500" /> Live Class Control
            </h2>
            <p className="text-gray-400 text-sm mt-1">Manage your active session visibility.</p>
        </div>
        
        {/* STATUS INDICATOR */}
        <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isLive ? 'bg-red-600 animate-pulse' : 'bg-gray-700 text-gray-400'}`}>
            {isLive ? '🔴 Broadcasting' : '⚫ Offline'}
        </div>
      </div>

      <div className="bg-black p-6 rounded-xl border border-gray-800 flex flex-col items-center gap-6">
        
        {/* PREVIEW / INFO */}
        <div className="text-center">
            <p className="text-gray-500 text-sm font-bold uppercase mb-2">Meeting Link</p>
            <a href={meetingLink} target="_blank" rel="noreferrer" className="text-blue-400 underline truncate block max-w-md mx-auto">
                {meetingLink || "No link configured in settings"}
            </a>
        </div>

        {/* CONTROLS */}
        <div className="flex gap-4 w-full">
            <button 
                onClick={toggleLive}
                disabled={loading || !meetingLink}
                className={`flex-1 py-4 rounded-xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isLive 
                    ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600' // Stop Button Style
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40 hover:scale-105' // Start Button Style
                }`}
            >
                {loading ? "Updating..." : isLive ? (
                    <> <StopCircle /> END SESSION </>
                ) : (
                    <> <Radio /> GO LIVE NOW </>
                )}
            </button>
        </div>

        {!meetingLink && (
            <p className="text-red-400 text-xs mt-2">
                ⚠️ You must add a meeting link in the "Edit Course" section before going live.
            </p>
        )}
      </div>

    </div>
  );
};

export default InstructorLiveManager;