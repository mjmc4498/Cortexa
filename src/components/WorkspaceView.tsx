import React, { useState, useEffect } from 'react';
import { useNoteStore, useUserStore } from '../store/useNoteStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, 
  Clock, 
  CheckSquare, 
  TrendingUp, 
  Zap, 
  Search, 
  Plus, 
  X, 
  Maximize2, 
  BarChart3, 
  BrainCircuit,
  Calendar as CalendarIcon,
  MapPin,
  FileText
} from 'lucide-react';
import { generateWeeklyReport, detectContextualNotes } from '../services/aiService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const WorkspaceView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notes, setSelectedNoteId } = useNoteStore();
  const { preferences } = useUserStore();
  const [weeklyReport, setWeeklyReport] = useState<string | null>(null);
  const [contextualNotes, setContextualNotes] = useState<any[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    const report = await generateWeeklyReport(notes);
    setWeeklyReport(report);
    setLoadingReport(false);
  };

  useEffect(() => {
    const fetchContext = async () => {
      const timeStr = format(new Date(), 'HH:mm');
      const dateStr = format(new Date(), 'EEEE, d MMMM', { locale: es });
      // Mocking location and calendar for now
      const notesContext = await detectContextualNotes("Oficina", timeStr, "Reunión de equipo", notes);
      setContextualNotes(notesContext);
    };
    fetchContext();
  }, [notes]);

  const totalTasks = notes.reduce((acc, n) => acc + (n.tasks?.length || 0), 0);
  const completedTasks = notes.reduce((acc, n) => acc + (n.tasks?.filter(t => t.completed).length || 0), 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col overflow-hidden"
    >
      <header className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Layout className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Workspace Inteligente</h2>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-1">
              {format(currentTime, 'EEEE, d MMMM yyyy • HH:mm', { locale: es })}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gradient-to-b from-zinc-900/20 to-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Stats Card */}
          <div className="md:col-span-1 bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <BarChart3 size={16} />
                Productividad
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Tareas Completadas</span>
                  <span className="font-mono text-indigo-400">{completedTasks}/{totalTasks}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1">Total Notas</span>
                  <span className="text-2xl font-bold">{notes.length}</span>
                </div>
                <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
                  <span className="text-[10px] text-zinc-500 uppercase block mb-1">Categorías</span>
                  <span className="text-2xl font-bold">{new Set(notes.map(n => n.category).filter(Boolean)).size}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contextual Card */}
          <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" />
                Sugerencias Contextuales
              </h3>
              <div className="flex gap-2">
                <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-full text-zinc-400 flex items-center gap-1">
                  <MapPin size={10} /> Oficina
                </span>
                <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-full text-zinc-400 flex items-center gap-1">
                  <CalendarIcon size={10} /> Reunión
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contextualNotes.length > 0 ? (
                contextualNotes.map(note => (
                  <motion.div 
                    key={note.id}
                    whileHover={{ y: -5 }}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      onClose();
                    }}
                    className="bg-zinc-800/30 border border-zinc-700/50 p-4 rounded-2xl cursor-pointer hover:border-indigo-500/50 transition-all"
                  >
                    <h4 className="font-bold mb-1 line-clamp-1">{note.title}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-2">{note.summary || note.content}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-zinc-600 text-sm italic col-span-2">No hay sugerencias específicas para este momento.</p>
              )}
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="md:col-span-2 bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <BrainCircuit size={16} className="text-indigo-400" />
                AI Insights & Reporte Semanal
              </h3>
              <button 
                onClick={handleGenerateReport}
                disabled={loadingReport}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full font-bold transition-all disabled:opacity-50"
              >
                {loadingReport ? 'Generando...' : 'Generar Reporte'}
              </button>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              {weeklyReport ? (
                <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {weeklyReport}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
                  <TrendingUp size={48} className="mb-4 opacity-20" />
                  <p>Genera un reporte para ver el análisis de tu conocimiento.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="md:col-span-1 bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
              <Plus size={16} />
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center gap-3 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl border border-zinc-700/50 transition-all text-left group">
                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <FileText size={20} />
                </div>
                <div>
                  <span className="font-bold block">Nueva Nota</span>
                  <span className="text-[10px] text-zinc-500">Crear documento en blanco</span>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl border border-zinc-700/50 transition-all text-left group">
                <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all">
                  <CheckSquare size={20} />
                </div>
                <div>
                  <span className="font-bold block">Nueva Tarea</span>
                  <span className="text-[10px] text-zinc-500">Añadir a lista global</span>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl border border-zinc-700/50 transition-all text-left group">
                <div className="w-10 h-10 bg-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                  <Search size={20} />
                </div>
                <div>
                  <span className="font-bold block">Búsqueda Semántica</span>
                  <span className="text-[10px] text-zinc-500">Buscar por significado</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
