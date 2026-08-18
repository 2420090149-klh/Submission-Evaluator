import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Globe, Info } from 'lucide-react';

export default function HostLogin() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 py-12">
      <div className="glass-panel p-10 rounded-3xl max-w-md w-full text-center relative overflow-hidden mb-12" style={{ animation: 'float 6s ease-in-out infinite' }}>
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-500/20 rounded-full border border-indigo-500/30">
            <Sparkles className="w-10 h-10 text-indigo-300" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">
          Evaluator Portal
        </h1>
        <p className="text-indigo-200/70 mb-10 text-sm font-medium tracking-wide">
          Secure host access to manage events.
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm backdrop-blur-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="group relative w-full py-4 px-6 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden"
          style={{ animation: 'pulse-glow 3s infinite' }}
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 mr-3 drop-shadow-md" />
              Sign in with Google
            </>
          )}
        </button>
      </div>

      {/* About Section */}
      <div className="max-w-2xl w-full glass-panel p-8 rounded-3xl text-indigo-100/90 border border-white/10 shadow-xl bg-black/20 backdrop-blur-md">
        <div className="flex items-center mb-4">
          <Info className="w-6 h-6 mr-3 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">About Submission Evaluator</h2>
        </div>
        <p className="mb-4 leading-relaxed text-sm md:text-base">
          Submission Evaluator is a premium platform designed to streamline the collection and evaluation of project submissions for hackathons, competitions, and corporate events. It features real-time anonymous voting, seamless cloud storage for media handling, and intuitive host dashboards.
        </p>
        
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-semibold text-white mb-1">Developed by</p>
            <p className="text-indigo-300 font-bold text-lg">K Dheeran</p>
          </div>
          <a 
            href="https://www.linkedin.com/in/k-dheeran-37684a315" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center px-6 py-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-300 hover:text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-900/20"
          >
            <Globe className="w-5 h-5 mr-3" />
            Connect on LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
