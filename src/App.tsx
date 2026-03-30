import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './firebase';
import { useNoteStore, useUserStore } from './models/store/useNoteStore';
import { Sidebar } from './views/components/Sidebar';
import { NoteList } from './views/components/NoteList';
import { NoteEditor } from './views/components/NoteEditor';
import { AIAssistant } from './views/components/AIAssistant';
import { GraphView } from './views/components/GraphView';
import { KanbanView } from './views/components/KanbanView';
import { SmartCapture } from './views/components/SmartCapture';
import { TimelineView } from './views/components/TimelineView';
import { WorkspaceView } from './views/components/WorkspaceView';
import { ErrorBoundary } from './views/components/ErrorBoundary';
import { LogIn, Loader2, Sparkles, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { fetchNotes, selectedNoteId, setSelectedNoteId } = useNoteStore();
  const { fetchPreferences, updatePresence, fetchPresences } = useUserStore();

  const [showGraph, setShowGraph] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showSmartCapture, setShowSmartCapture] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubNotes = fetchNotes(user.uid);
      const unsubPrefs = fetchPreferences(user.uid);
      const unsubPresences = fetchPresences();
      
      // Update presence
      updatePresence(user.uid, {
        userName: user.displayName || 'Usuario',
        userPhoto: user.photoURL || undefined
      });

      const presenceInterval = setInterval(() => {
        updatePresence(user.uid, {
          activeNoteId: selectedNoteId || undefined
        });
      }, 30000);

      return () => {
        unsubNotes();
        unsubPrefs();
        unsubPresences();
        clearInterval(presenceInterval);
      };
    }
  }, [user, fetchNotes, fetchPreferences, fetchPresences, updatePresence, selectedNoteId]);

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
    <ErrorBoundary>
      <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-orange-500/30 relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        <div className={cn(
          "fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Sidebar 
            user={user} 
            onLogout={logout} 
            onOpenGraph={() => { setShowGraph(true); setIsSidebarOpen(false); }}
            onOpenKanban={() => { setShowKanban(true); setIsSidebarOpen(false); }}
            onOpenSmartCapture={() => { setShowSmartCapture(true); setIsSidebarOpen(false); }}
            onOpenTimeline={() => { setShowTimeline(true); setIsSidebarOpen(false); }}
            onOpenWorkspace={() => { setShowWorkspace(true); setIsSidebarOpen(false); }}
            onCloseMobile={() => setIsSidebarOpen(false)}
          />
        </div>
        
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">Cortexa</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-zinc-900 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className={cn(
            "w-full lg:w-80 flex-shrink-0 border-r border-zinc-800/50",
            selectedNoteId && "hidden lg:flex"
          )}>
            <NoteList />
          </div>
          
          <div className={cn(
            "flex-1 flex flex-col min-w-0 bg-[#0f0f0f] border-l border-zinc-800/50",
            !selectedNoteId && "hidden lg:flex"
          )}>
            <AnimatePresence mode="wait">
              {selectedNoteId ? (
                <div className="flex-1 flex flex-col h-full relative">
                  <NoteEditor key={selectedNoteId} />
                </div>
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

          <div className="hidden xl:block">
            <AIAssistant />
          </div>
        </main>

        <AnimatePresence>
          {showGraph && <GraphView onClose={() => setShowGraph(false)} />}
          {showKanban && <KanbanView onClose={() => setShowKanban(false)} />}
          {showSmartCapture && <SmartCapture onClose={() => setShowSmartCapture(false)} />}
          {showTimeline && <TimelineView onClose={() => setShowTimeline(false)} />}
          {showWorkspace && <WorkspaceView onClose={() => setShowWorkspace(false)} />}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
