import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ExternalLink, CheckCircle, Star } from 'lucide-react';

export default function VotingForm() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [votes, setVotes] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    if (localStorage.getItem(`voted_${eventId}`)) {
      setHasVoted(true);
    }
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      const docRef = doc(db, 'events', eventId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().status === 'voting') {
        setEvent({ id: docSnap.id, ...docSnap.data() });
        
        const q = query(collection(db, 'submissions'), where('eventId', '==', eventId));
        const querySnapshot = await getDocs(q);
        const subs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setSubmissions(subs.sort(() => Math.random() - 0.5));
      } else if (docSnap.exists() && docSnap.data().status !== 'voting') {
        setError('Voting is not currently active for this event.');
      } else {
        setError('Event not found.');
      }
    } catch (err) {
      setError('Error loading data.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteChange = (subId, score) => {
    setVotes(prev => ({ ...prev, [subId]: score }));
  };

  const submitVotes = async () => {
    if (Object.keys(votes).length !== submissions.length && submissions.length > 0) {
      alert("Please rate all submissions before saving.");
      return;
    }

    setIsSubmitting(true);
    try {
      const voterId = `voter_${Math.random().toString(36).substr(2, 9)}`;
      
      const votePromises = Object.entries(votes).map(([subId, score]) => 
        addDoc(collection(db, 'votes'), {
          eventId,
          submissionId: subId,
          score: parseInt(score, 10),
          voterId,
          createdAt: serverTimestamp()
        })
      );

      await Promise.all(votePromises);
      localStorage.setItem(`voted_${eventId}`, 'true');
      setHasVoted(true);
    } catch (err) {
      console.error(err);
      alert("Error saving votes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-400"></div>
    </div>
  );

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center">
          <p className="text-red-300 font-bold text-lg bg-red-900/30 p-4 rounded-xl border border-red-500/20">{error}</p>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-panel p-10 rounded-3xl max-w-md w-full text-center" style={{ animation: 'float 6s ease-in-out infinite' }}>
          <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
            <CheckCircle size={48} className="text-amber-400" />
          </div>
          <h2 className="text-3xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">
            Votes Recorded!
          </h2>
          <p className="text-indigo-200/80 font-medium">Thank you for evaluating the submissions. Your voice matters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen pb-24">
      <div className="mb-12 text-center mt-8">
        <div className="inline-flex p-4 bg-amber-500/10 rounded-full mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <Star className="text-amber-400 w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-amber-200 mb-4 drop-shadow-sm">
          Evaluate Submissions
        </h1>
        <p className="text-xl text-indigo-200 font-medium">{event.title}</p>
        
        <div className="mt-8 inline-block">
          <p className="text-sm font-bold tracking-wide text-amber-200 bg-amber-900/40 px-6 py-3 rounded-2xl border border-amber-500/30 shadow-lg backdrop-blur-md">
            Review each submission anonymously and rate them from 1 (Poor) to 10 (Excellent).
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {submissions.map((sub, index) => (
          <div key={sub.id} className="glass-panel rounded-3xl p-6 lg:p-8 shadow-xl border border-white/10 hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8">
              
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <span className="text-xl font-black text-white">{index + 1}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Anonymous Entry</h3>
                </div>
                
                {sub.description && (
                  <p className="text-indigo-200/80 mb-6 bg-white/5 p-4 rounded-xl border border-white/10 italic text-sm">
                    "{sub.description}"
                  </p>
                )}

                <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                  {sub.fileType?.startsWith('image/') ? (
                    <img 
                      src={sub.fileUrl} 
                      alt="Submission" 
                      className="w-full h-auto max-h-64 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                      onClick={() => setZoomedImage(sub.fileUrl)}
                    />
                  ) : sub.fileType?.startsWith('video/') ? (
                    <video 
                      src={sub.fileUrl} 
                      controls 
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                      <p className="text-indigo-200 mb-4 text-sm">This entry contains a document or unsupported media.</p>
                      <a 
                        href={sub.fileUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center px-6 py-3 bg-indigo-600/50 hover:bg-indigo-500/80 text-white font-semibold rounded-xl transition-all border border-indigo-500/50 shadow-lg hover:shadow-indigo-500/20"
                      >
                        Download / View Material <ExternalLink size={18} className="ml-3 text-amber-300" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-black/30 p-6 rounded-2xl border border-white/5 flex-1 lg:max-w-md w-full">
                <div className="flex justify-between items-end mb-4">
                  <label className="block text-sm font-bold text-indigo-200 uppercase tracking-widest">
                    Your Rating
                  </label>
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 drop-shadow-md">
                    {votes[sub.id] || '-'}
                  </div>
                </div>
                
                <div className="relative">
                  <input 
                    type="range" 
                    min="1" max="10" 
                    value={votes[sub.id] || 5} 
                    onChange={(e) => handleVoteChange(sub.id, e.target.value)}
                    className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                  />
                  <div className="flex justify-between text-xs font-bold text-indigo-300/50 mt-3 px-1 uppercase tracking-wider">
                    <span>1 (Poor)</span>
                    <span>10 (Excellent)</span>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        ))}

        {submissions.length === 0 && (
          <div className="text-center py-24 glass-panel rounded-3xl border border-white/10">
            <p className="text-indigo-200 text-lg">No submissions found for this event yet.</p>
          </div>
        )}
      </div>

      {submissions.length > 0 && (
        <div className="mt-12 flex justify-center sticky bottom-8 z-50">
          <button 
            onClick={submitVotes}
            disabled={isSubmitting}
            className={`px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-lg font-black tracking-wide rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.4)] border border-green-400/50 transition-all transform hover:-translate-y-2 hover:scale-105 flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Processing Votes...' : 'Finalize & Submit All Votes'}
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={zoomedImage} 
            alt="Zoomed Submission" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/20"
          />
          <p className="absolute bottom-6 text-white/50 text-sm">Click anywhere to close</p>
        </div>
      )}
    </div>
  );
}
