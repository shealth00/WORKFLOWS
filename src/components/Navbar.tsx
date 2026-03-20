import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { signInWithPopup, googleProvider, signOut, auth } from '../firebase';
import { LogOut, Plus, User as UserIcon, Loader2 } from 'lucide-react';

const Navbar: React.FC<{ onNewForm?: () => void }> = ({ onNewForm }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/consent', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-blocked') {
        alert('Sign-in popup was blocked. Please allow popups for this site and try again.');
      } else if (code === 'auth/popup-closed-by-user') {
        // User closed the popup; no need to alert
          } else {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Sign-in error', code, err);
        alert(`Sign-in failed: ${code || msg}`);
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <nav className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
              F
            </div>
            <span className="text-xl font-bold tracking-tight">FormFlow</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <a href="/workspace" className="flex items-center gap-2 text-slate-700 hover:text-orange-600 px-3 py-2 rounded-full text-sm font-medium transition-colors">
                  My Workspace
                </a>
                <a href="/templates" className="flex items-center gap-2 text-slate-700 hover:text-orange-600 px-3 py-2 rounded-full text-sm font-medium transition-colors">
                  Templates
                </a>
                <a href="/precision-screening" className="flex items-center gap-2 text-slate-700 hover:text-orange-600 px-3 py-2 rounded-full text-sm font-medium transition-colors">
                  Precision Screening
                </a>
                <a href="/precision-diagnostic" className="flex items-center gap-2 text-slate-700 hover:text-orange-600 px-3 py-2 rounded-full text-sm font-medium transition-colors">
                  Precision Diagnostic
                </a>
                <a href="/integrations" className="flex items-center gap-2 text-slate-700 hover:text-orange-600 px-3 py-2 rounded-full text-sm font-medium transition-colors">
                  Integrations
                </a>
                <a href="/products" className="flex items-center gap-2 text-slate-700 hover:text-orange-600 px-3 py-2 rounded-full text-sm font-medium transition-colors">
                  Products
                </a>
                <a href="/settings" className="flex items-center gap-2 text-slate-700 hover:text-orange-600 px-3 py-2 rounded-full text-sm font-medium transition-colors">
                  Settings
                </a>
                {onNewForm && (
                  <button 
                    onClick={onNewForm}
                    className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-orange-700 transition-colors shadow-sm"
                  >
                    <Plus size={18} />
                    Create Form
                  </button>
                )}
                <div className="flex items-center gap-3 pl-4 border-l border-black/5">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-black/50">{user.email}</p>
                  </div>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-black/5" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                      <UserIcon size={16} className="text-black/40" />
                    </div>
                  )}
                  <button 
                    onClick={() => signOut(auth)}
                    className="p-2 text-black/40 hover:text-black/80 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
                <button 
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="flex items-center gap-2 border border-black/10 px-4 py-2 rounded-full text-sm font-medium hover:bg-black/5 transition-colors disabled:opacity-50"
                >
                  {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Sign In with Google
                </button>
              )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
