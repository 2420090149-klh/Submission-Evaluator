import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, LogOut, Calendar, Link as LinkIcon, FileText, ChevronRight, LayoutDashboard, Sparkles } from 'lucide-react';
import { generateDemoEvent } from '../utils/demoData';

export default function HostDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/');
      } else {
        setUser(currentUser);
        fetchEvents(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchEvents = async (userId) => {
    try {
      const q = query(collection(db, 'events'), where('hostId', '==', userId));
      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by creation time descending (rough sort assuming sequential creation)
      setEvents(eventsList.reverse());
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    try {
      await addDoc(collection(db, 'events'), {
        title: newEventTitle,
        hostId: user.uid,
        createdAt: serverTimestamp(),
        status: 'collecting' // collecting, voting, finished
      });
      
      setShowCreateModal(false);
      setNewEventTitle('');
      fetchEvents(user.uid);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleGenerateDemo = async () => {
    setLoading(true);
    const success = await generateDemoEvent(user.uid);
    if (success) {
      fetchEvents(user.uid);
    } else {
      setLoading(false);
      alert("Failed to generate demo event.");
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/'));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-400"></div>
    </div>
  );

  return (
    <div className="min-h-screen pb-12">
      {/* Premium Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/10 rounded-none shadow-xl mb-12">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <LayoutDashboard className="text-indigo-300 w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
              Evaluator
            </h1>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center text-indigo-200 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all"
          >
            <LogOut size={18} className="mr-2" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h2 className="text-4xl font-extrabold text-white mb-2">Welcome Back</h2>
            <p className="text-indigo-200/70 font-medium">Manage your submission evaluation events.</p>
          </div>
          <div className="flex space-x-4 mt-6 md:mt-0">
            <button 
              onClick={handleGenerateDemo}
              className="flex items-center bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 hover:text-white px-6 py-3 rounded-2xl font-bold border border-indigo-500/30 transition-all transform hover:scale-105 hover:-translate-y-1"
            >
              <Sparkles size={20} className="mr-2" /> Generate Demo Event
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105 hover:-translate-y-1"
            >
              <PlusCircle size={20} className="mr-2" /> Create New Event
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="glass-panel rounded-3xl p-16 text-center">
            <div className="inline-flex p-6 bg-white/5 rounded-full mb-6 border border-white/10">
              <Calendar size={64} className="text-indigo-300/50" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No events found</h3>
            <p className="text-indigo-200/70 max-w-md mx-auto">You haven't created any evaluation events yet. Create your first one to start collecting participant submissions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {events.map(event => (
              <div key={event.id} className="glass-panel rounded-3xl p-8 flex flex-col hover:border-indigo-400/50 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold text-white line-clamp-2">{event.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ml-4 flex-shrink-0 ${
                    event.status === 'collecting' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    event.status === 'voting' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 
                    event.status === 'finished' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-white/10 text-white/70 border border-white/20'
                  }`}>
                    {event.status}
                  </span>
                </div>
                
                <div className="mt-auto pt-8 flex justify-end">
                  <Link 
                    to={`/event/${event.id}`} 
                    className="flex items-center justify-center w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl font-medium transition-colors border border-white/10 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40"
                  >
                    Manage Event <ChevronRight size={18} className="ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Premium Glass Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white/20 transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-white">Create New Event</h2>
            <form onSubmit={handleCreateEvent}>
              <div className="mb-8">
                <label className="block text-sm font-semibold text-indigo-200 mb-2">Event Title</label>
                <input 
                  type="text" 
                  required 
                  className="glass-input w-full px-5 py-4 rounded-xl transition-all placeholder-white/30 font-medium"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g., Spring Hackathon 2026"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="px-6 py-3 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-colors"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
