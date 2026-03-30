import React, { useState, useMemo } from 'react';
import { useNoteStore } from '../../models/store/useNoteStore';
import { Note } from '../../models/types';
import { Plus, MoreVertical, Star, Pin, Trash2, Archive, X, Layout, List, Calendar, Map, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLUMNS = [
  { id: 'todo', title: 'Por Hacer', color: 'bg-slate-100 border-slate-200' },
  { id: 'doing', title: 'En Progreso', color: 'bg-blue-50 border-blue-100' },
  { id: 'done', title: 'Completado', color: 'bg-green-50 border-green-100' },
  { id: 'backlog', title: 'Backlog', color: 'bg-orange-50 border-orange-100' }
];

export const KanbanView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notes, updateNote, setSelectedNoteId } = useNoteStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const groupedNotes = useMemo(() => {
    const groups: Record<string, Note[]> = {
      todo: [],
      doing: [],
      done: [],
      backlog: []
    };

    notes.forEach(note => {
      // Logic to determine column: check tags or category
      if (note.tags.includes('todo') || note.category === 'todo') groups.todo.push(note);
      else if (note.tags.includes('doing') || note.category === 'doing') groups.doing.push(note);
      else if (note.tags.includes('done') || note.category === 'done') groups.done.push(note);
      else groups.backlog.push(note);
    });

    return groups;
  }, [notes]);

  const handleMove = async (noteId: string, newColumn: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const newTags = note.tags.filter(t => !['todo', 'doing', 'done', 'backlog'].includes(t));
    newTags.push(newColumn);

    await updateNote(noteId, { 
      tags: newTags,
      category: newColumn
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col ${isFullscreen ? 'p-0' : 'p-8'}`}
    >
      <div className="flex items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
            <Layout size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Tablero Kanban</h2>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Organización visual de tus proyectos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
            title={isFullscreen ? "Minimizar" : "Maximizar"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
            title="Cerrar"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-6 px-4 custom-scrollbar">
        {COLUMNS.map(column => (
          <div 
            key={column.id} 
            className="flex-shrink-0 w-80 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col backdrop-blur-sm"
          >
            <div className="p-4 flex items-center justify-between border-b border-zinc-800/50">
              <h3 className="font-bold text-zinc-300 flex items-center gap-2 text-sm uppercase tracking-wider">
                {column.title}
                <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-500">
                  {groupedNotes[column.id].length}
                </span>
              </h3>
              <button className="p-1 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-colors">
                <Plus size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {groupedNotes[column.id].map(note => (
                <motion.div
                  key={note.id}
                  layoutId={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id);
                    onClose();
                  }}
                  className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-zinc-200 text-sm line-clamp-2 group-hover:text-orange-500 transition-colors">{note.title}</h4>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {note.isPinned && <Pin size={12} className="text-orange-500" />}
                      {note.isFavorite && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-3 mb-4 leading-relaxed">
                    {note.summary || note.content.substring(0, 100)}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800/50">
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {format(new Date(note.updatedAt), 'd MMM', { locale: es })}
                    </span>
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
              {groupedNotes[column.id].length === 0 && (
                <div className="h-24 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-700 text-xs italic">
                  Sin notas aquí
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
