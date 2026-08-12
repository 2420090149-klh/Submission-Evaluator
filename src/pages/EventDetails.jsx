import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { Copy, Users, ExternalLink, Award, FileText, ChevronLeft, Calendar, Link as LinkIcon, Trash2 } from 'lucide-react';

export default function EventDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEventDetails();
    fetchSubmissions();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const docRef = doc(db, 'events', eventId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEvent({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const q = query(collection(db, 'submissions'), where('eventId', '==', eventId));
      const querySnapshot = await getDocs(q);
      let subs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), averageScore: 0 }));
      
      const votesQuery = query(collection(db, 'votes'), where('eventId', '==', eventId));
      const votesSnapshot = await getDocs(votesQuery);
      
      const voteTotals = {}; 
      votesSnapshot.docs.forEach(doc => {
        const v = doc.data();
        if (!voteTotals[v.submissionId]) voteTotals[v.submissionId] = { total: 0, count: 0 };
        voteTotals[v.submissionId].total += v.score;
        voteTotals[v.submissionId].count += 1;
      });

      subs = subs.map(sub => {
        if (voteTotals[sub.id]) {
          sub.averageScore = voteTotals[sub.id].total / voteTotals[sub.id].count;
        }
        return sub;
      });

      subs.sort((a, b) => b.averageScore - a.averageScore);
      setSubmissions(subs);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (path, type) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handleStartVoting = async () => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, { status: 'voting' });
      setEvent({ ...event, status: 'voting' });
    } catch (error) {
      console.error("Error starting voting:", error);
    }
  };

  const handleStopVoting = async () => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, { status: 'finished' });
      setEvent({ ...event, status: 'finished' });
    } catch (error) {
      console.error("Error stopping voting:", error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this event? This will erase all submissions, cast votes, and completely delete the files from Storage to free up space. This cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      // 1. Delete all submissions and their files
      const q = query(collection(db, 'submissions'), where('eventId', '==', eventId));
      const querySnapshot = await getDocs(q);
      
      for (const subDoc of querySnapshot.docs) {
        const subData = subDoc.data();
        if (subData.fileUrl) {
          try {
            const fileRef = ref(storage, subData.fileUrl);
            await deleteObject(fileRef);
          } catch (e) {
            console.error("Error deleting file:", e);
          }
        }
        await deleteDoc(doc(db, 'submissions', subDoc.id));
      }

      // 2. Delete all votes
      const votesQuery = query(collection(db, 'votes'), where('eventId', '==', eventId));
      const votesSnapshot = await getDocs(votesQuery);
      for (const voteDoc of votesSnapshot.docs) {
        await deleteDoc(doc(db, 'votes', voteDoc.id));
      }

      // 3. Delete event
      await deleteDoc(doc(db, 'events', eventId));
      
      navigate('/dashboard');
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Error deleting event. Check console.");
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-400"></div>
    </div>
  );
  if (!event) return <div className="min-h-screen flex items-center justify-center text-white text-xl">Event not found.</div>;

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-panel sticky top-0 z-40 border-b border-white/10 rounded-none shadow-xl mb-12">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="p-2 bg-white/5 hover:bg-white/10 text-indigo-200 hover:text-white rounded-full transition-all border border-white/10">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
              {event.title}
            </h1>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
            event.status === 'collecting' ? 'bg-green-500/20 text-green-300 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]' :
            event.status === 'voting' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 
            event.status === 'finished' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
            'bg-white/10 text-white/70 border border-white/20'
          }`}>
            {event.status}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Management & Links */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-indigo-400/20 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-white flex items-center">
              <LinkIcon className="mr-3 text-indigo-400" size={20} /> Distribution Links
            </h3>
            
            <div className="mb-6 space-y-2">
              <label className="block text-sm font-semibold text-indigo-200">Participant Submission Link</label>
              <div className="flex relative group">
                <input type="text" readOnly value={`${window.location.origin}/submit/${eventId}`} className="glass-input flex-1 px-4 py-3 rounded-l-xl text-sm font-medium w-full overflow-hidden text-ellipsis whitespace-nowrap" />
                <button onClick={() => copyToClipboard(`/submit/${eventId}`, 'submission')} className="px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-r-xl transition-all border border-indigo-500">
                  <Copy size={18} className={copiedLink === 'submission' ? 'text-green-300' : ''} />
                </button>
              </div>
              {copiedLink === 'submission' && <p className="text-xs text-green-400 font-medium">Copied to clipboard!</p>}
            </div>

            {event.status !== 'collecting' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-amber-200">Voter Evaluation Link</label>
                <div className="flex relative group">
                  <input type="text" readOnly value={`${window.location.origin}/vote/${eventId}`} className="glass-input flex-1 px-4 py-3 rounded-l-xl text-sm font-medium w-full overflow-hidden text-ellipsis whitespace-nowrap border-amber-500/30" />
                  <button onClick={() => copyToClipboard(`/vote/${eventId}`, 'voting')} className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-r-xl transition-all border border-amber-600">
                    <Copy size={18} className={copiedLink === 'voting' ? 'text-green-300' : ''} />
                  </button>
                </div>
                {copiedLink === 'voting' && <p className="text-xs text-green-400 font-medium">Copied to clipboard!</p>}
              </div>
            )}
          </div>

          <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-white/10 shadow-xl">
            <h3 className="text-xl font-bold mb-6 text-white">Event Actions</h3>
            <div className="space-y-4">
              {event.status === 'collecting' ? (
                <button 
                  onClick={handleStartVoting} 
                  className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center transform hover:scale-[1.02]"
                >
                  <Users size={20} className="mr-3" /> Start Voting Phase
                </button>
              ) : event.status === 'voting' ? (
                <button 
                  onClick={handleStopVoting} 
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center transform hover:scale-[1.02]"
                >
                  <Award size={20} className="mr-3" /> Stop Voting & Finalize
                </button>
              ) : (
                <button disabled className="w-full py-4 px-6 bg-white/5 border border-white/10 text-white/50 font-bold rounded-xl flex items-center justify-center cursor-not-allowed">
                  <Award size={20} className="mr-3 opacity-50 text-yellow-500" /> Event Finished
                </button>
              )}
              
              <button 
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className={`w-full py-4 px-6 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-300 font-bold rounded-xl transition-all flex items-center justify-center ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-red-500/20'}`}
              >
                {isDeleting ? 'Deleting Event...' : <><Trash2 size={20} className="mr-3" /> Delete Event</>}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Submissions */}
        <div className="lg:col-span-8">
          <div className="glass-panel rounded-3xl p-6 lg:p-10 border border-white/10 shadow-xl">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
              <h2 className="text-2xl font-bold flex items-center text-white">
                <FileText className="mr-3 text-indigo-400" size={28} /> Submissions <span className="ml-3 bg-white/10 px-3 py-1 rounded-full text-sm">{submissions.length}</span>
              </h2>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-20 px-6 glass-panel border border-white/5 border-dashed rounded-2xl bg-black/20">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText size={32} className="text-white/30" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Submissions Yet</h3>
                <p className="text-indigo-200/60 max-w-sm mx-auto">Share the participant submission link on the left to start collecting entries.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub, idx) => (
                  <div key={sub.id} className="flex flex-col md:flex-row justify-between md:items-center p-5 lg:p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 group">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center mb-1">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider mr-3">Entry #{idx + 1}</span>
                        {event.status !== 'collecting' && idx === 0 && sub.averageScore > 0 && (
                          <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs px-2 py-0.5 rounded flex items-center">
                            <Award size={12} className="mr-1" /> Current Leader
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-lg text-white">{sub.participantName}</h4>
                      <p className="text-sm text-indigo-200/60">{sub.email} • {sub.phone}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 items-center">
                      {event.status !== 'collecting' && (
                        <div className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl flex items-center min-w-[120px] justify-center">
                          <Award size={18} className="text-yellow-400 mr-2" />
                          <span className="font-bold text-lg text-white">
                            {sub.averageScore ? sub.averageScore.toFixed(1) : <span className="text-white/40 text-sm">No votes</span>}
                          </span>
                        </div>
                      )}
                      <a 
                        href={sub.fileUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-5 py-2.5 bg-indigo-600/80 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors border border-indigo-500/50 flex items-center"
                      >
                        View Material <ExternalLink size={16} className="ml-2" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
