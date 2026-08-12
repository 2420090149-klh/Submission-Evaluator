import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { CheckCircle, UploadCloud, Send } from 'lucide-react';

export default function SubmissionForm() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().status === 'collecting') {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else if (docSnap.exists()) {
          setError('This event is no longer accepting submissions.');
        } else {
          setError('Event not found.');
        }
      } catch (err) {
        setError('Error loading event.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select a file to upload.');
    setIsSubmitting(true);
    setError('');
    setUploadProgress(0);

    try {
      // 1. Upload file to Storage with Progress
      const fileUrl = await new Promise((resolve, reject) => {
        const fileRef = ref(storage, `submissions/${eventId}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.round(progress));
          }, 
          (err) => reject(err), 
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      // 2. Save submission to Firestore
      await addDoc(collection(db, 'submissions'), {
        eventId,
        participantName: name,
        email,
        phone,
        description,
        fileUrl,
        fileType: file.type,
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-400"></div>
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

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-panel p-10 rounded-3xl max-w-md w-full text-center" style={{ animation: 'float 6s ease-in-out infinite' }}>
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <CheckCircle size={48} className="text-green-400" />
          </div>
          <h2 className="text-3xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-200">
            Success!
          </h2>
          <p className="text-indigo-200/80 font-medium">Your entry has been securely received.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-xl w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
            Submit your Idea
          </h1>
          <p className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-sm font-semibold text-indigo-200 border border-white/10">
            {event.title}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-indigo-200 ml-1">Full Name</label>
            <input 
              type="text" required 
              value={name} onChange={e => setName(e.target.value)}
              className="glass-input w-full px-5 py-4 rounded-xl transition-all placeholder-white/30 font-medium"
              placeholder="e.g. Jane Doe" 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-indigo-200 ml-1">Email</label>
              <input 
                type="email" required 
                value={email} onChange={e => setEmail(e.target.value)}
                className="glass-input w-full px-5 py-4 rounded-xl transition-all placeholder-white/30 font-medium"
                placeholder="jane@example.com" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-indigo-200 ml-1">Phone Number</label>
              <input 
                type="tel" required 
                value={phone} onChange={e => setPhone(e.target.value)}
                className="glass-input w-full px-5 py-4 rounded-xl transition-all placeholder-white/30 font-medium"
                placeholder="+1 (555) 000-0000" 
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-indigo-200 ml-1">Project Description / Note (Optional)</label>
            <textarea 
              value={description} onChange={e => setDescription(e.target.value)}
              className="glass-input w-full px-5 py-4 rounded-xl transition-all placeholder-white/30 font-medium resize-none h-24"
              placeholder="Tell the voters what your submission is about..." 
            ></textarea>
          </div>
          
          <div className="space-y-1.5 pt-2">
            <label className="block text-sm font-semibold text-indigo-200 ml-1">Upload File</label>
            <div className="relative group mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-indigo-400/30 rounded-xl hover:border-indigo-400 transition-colors bg-white/5">
              <div className="space-y-2 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-indigo-300/60 group-hover:text-indigo-400 transition-colors" />
                <div className="flex text-sm text-indigo-200 justify-center">
                  <label className="relative cursor-pointer rounded-md font-medium text-indigo-300 hover:text-indigo-200 focus-within:outline-none">
                    <span className="bg-white/10 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/20 transition-all inline-block">
                      {file ? file.name : "Browse from your laptop"}
                    </span>
                    <input type="file" className="sr-only" onChange={e => setFile(e.target.files[0])} />
                  </label>
                </div>
                <p className="text-xs text-indigo-200/50 pt-2">Allowed: Word Docs, PDFs, Images, Videos</p>
              </div>
            </div>
          </div>

          <div className="pt-6 relative">
            {isSubmitting && (
              <div className="absolute -top-6 left-0 w-full">
                <div className="flex justify-between text-xs text-indigo-200 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-pink-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30 overflow-hidden flex justify-center items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-indigo-500/50'}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2 group-hover:animate-bounce" />
                  Submit Entry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
