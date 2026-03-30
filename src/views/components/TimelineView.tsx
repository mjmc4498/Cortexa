import React from 'react';
import { useNoteStore } from '../../models/store/useNoteStore';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Calendar as CalendarIcon, X } from 'lucide-react';

export const TimelineView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notes, setSelectedNoteId } = useNoteStore();

  const sortedNotes = [...notes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const groupedNotes = sortedNotes.reduce((acc, note) => {
    const date = format(new Date(note.createdAt), 'MMMM yyyy', { locale: es });
    if (!acc[date]) acc[date] = [];
    acc[date].push(note);
    return acc;
  }, {} as Record<string, typeof notes>);

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col"
    >
      <header className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Clock className="text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Línea de Tiempo de Memoria</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-zinc-800 hidden md:block" />
          
          {Object.entries(groupedNotes).map(([month, monthNotes]) => (
            <div key={month} className="mb-12">
              <h3 className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                <CalendarIcon size={16} />
                {month}
              </h3>
              
              <div className="space-y-6">
                {monthNotes.map((note) => (
                  <motion.div 
                    key={note.id}
                    whileHover={{ x: 10 }}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      onClose();
                    }}
                    className="relative pl-0 md:pl-16 cursor-pointer group"
                  >
                    <div className="absolute left-8 top-4 w-3 h-3 bg-zinc-800 border-2 border-zinc-700 rounded-full -translate-x-1/2 group-hover:bg-orange-500 group-hover:border-orange-500 transition-all hidden md:block" />
                    
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:bg-zinc-900 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500 font-mono">
                          {format(new Date(note.createdAt), 'dd MMM, HH:mm', { locale: es })}
                        </span>
                        {note.category && (
                          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded uppercase font-bold text-zinc-400">
                            {note.category}
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold mb-2 group-hover:text-orange-500 transition-colors">
                        {note.title}
                      </h4>
                      <p className="text-sm text-zinc-400 line-clamp-2">
                        {note.summary || note.content}
                      </p>
                      {note.tags.length > 0 && (
                        <div className="flex gap-2 mt-4">
                          {note.tags.map(tag => (
                            <span key={tag} className="text-[10px] text-zinc-600">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
