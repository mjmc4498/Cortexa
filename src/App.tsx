import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './firebase';
import { useNoteStore } from './store/useNoteStore';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { AIAssistant } from './components/AIAssistant';
import { LogIn, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { fetchNotes, selectedNoteId } = useNoteStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = fetchNotes(user.uid);
      return () => unsubscribe();
    }
  }, [user, fetchNotes]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold tracking-tighter">Cortexa</h1>
            <p className="text-zinc-400 text-lg">
              Tu segundo cerebro. Organiza tus pensamientos, resume tu vida y encuentra respuestas al instante.
            </p>
          </div>

          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center space-x-3 bg-white text-black font-semibold py-4 px-6 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            <span>Continuar con Google</span>
          </button>
          
          <div className="space-y-2">
            <p className="text-zinc-500 text-sm">
              Autenticación segura mediante Firebase.
            </p>
            <p className="text-zinc-600 text-xs font-medium uppercase tracking-widest">
              Miguel J. Mogrovejo Cardenas
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-orange-500/30">
      <Sidebar user={user} onLogout={logout} />
      
      <main className="flex-1 flex overflow-hidden relative">
        <NoteList />
        
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f0f0f] border-l border-zinc-800/50">
          <AnimatePresence mode="wait">
            {selectedNoteId ? (
              <NoteEditor key={selectedNoteId} />
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-lg font-medium">Selecciona una nota para empezar a editar</p>
                <p className="text-sm opacity-60">O crea una nueva desde la barra lateral</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AIAssistant />
      </main>
    </div>
  );
}
