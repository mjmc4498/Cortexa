import { Search, Star, Pin, Tag, Clock, Sparkles, Target, Zap, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNoteStore, useUserStore } from '../store/useNoteStore';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { generatePredictiveSuggestions } from '../services/aiService';
import { useEffect, useState } from 'react';
import { Note } from '../types';

export function NoteList() {
  const { 
    notes, 
    searchQuery, 
    setSearchQuery, 
    selectedNoteId, 
    setSelectedNoteId, 
    loading,
    isSemanticSearch,
    setSemanticSearch,
    performSemanticSearch
  } = useNoteStore();
  const { preferences } = useUserStore();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [semanticResults, setSemanticResults] = useState<Note[]>([]);
  const [searchingSemantic, setSearchingSemantic] = useState(false);

  useEffect(() => {
    if (notes.length > 0 && preferences?.focusMode) {
      const fetchSuggestions = async () => {
        const context = preferences.focusMode === 'none' ? 'general' : preferences.focusMode;
        const res = await generatePredictiveSuggestions(context, notes);
        setSuggestions(res);
      };
      fetchSuggestions();
    }
  }, [notes, preferences?.focusMode]);

  useEffect(() => {
    const doSemanticSearch = async () => {
      if (isSemanticSearch && searchQuery.length > 3) {
        setSearchingSemantic(true);
        const results = await performSemanticSearch(searchQuery);
        setSemanticResults(results);
        setSearchingSemantic(false);
      } else {
        setSemanticResults([]);
      }
    };
    const timer = setTimeout(doSemanticSearch, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, isSemanticSearch]);

  const filteredNotes = isSemanticSearch && searchQuery.length > 3
    ? semanticResults
    : notes.filter(note => {
        const matchesSearch = 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesFocus = 
          !preferences?.focusMode || 
          preferences.focusMode === 'none' || 
          note.category === preferences.focusMode || 
          note.tags.includes(preferences.focusMode);

        return matchesSearch && matchesFocus;
      });

  return (
    <div className="w-80 flex flex-col bg-[#0a0a0a] h-full border-r border-zinc-800">
      <div className="p-4 space-y-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            placeholder={isSemanticSearch ? "Búsqueda semántica (IA)..." : "Buscar notas..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border-none rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-orange-500/50 transition-all"
          />
          <button 
            onClick={() => setSemanticSearch(!isSemanticSearch)}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all",
              isSemanticSearch ? "bg-orange-500 text-white" : "text-zinc-500 hover:bg-zinc-800"
            )}
            title="Búsqueda Semántica (IA)"
          >
            <BrainCircuit size={14} />
          </button>
        </div>

        {searchingSemantic && (
          <div className="px-1 py-1 text-[10px] text-orange-500 font-mono animate-pulse flex items-center gap-2">
            <BrainCircuit size={12} /> Analizando significado...
          </div>
        )}

        {/* Predictive Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                <Zap size={10} className="text-orange-500" />
                Memoria Predictiva
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => setSearchQuery(s)}
                    className="text-[10px] bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-1 rounded-lg hover:bg-orange-500/20 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col space-y-2 p-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-zinc-900/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600 space-y-2">
            <Search className="w-8 h-8 opacity-20" />
            <p className="text-sm">No se encontraron notas</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredNotes.map((note) => (
              <motion.button
                layout
                key={note.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedNoteId(note.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden",
                  selectedNoteId === note.id 
                    ? "bg-zinc-900 border border-zinc-800 shadow-xl" 
                    : "hover:bg-zinc-900/50 border border-transparent"
                )}
              >
                {note.isPinned && (
                  <Pin className="absolute top-4 right-4 w-3 h-3 text-orange-500 fill-orange-500" />
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {note.category && (
                      <span className="text-[8px] font-bold uppercase tracking-tighter bg-zinc-800 text-zinc-500 px-1 rounded">
                        {note.category}
                      </span>
                    )}
                    <h3 className={cn(
                      "font-semibold truncate pr-6",
                      selectedNoteId === note.id ? "text-white" : "text-zinc-300"
                    )}>
                      {note.title || 'Sin título'}
                    </h3>
                  </div>
                  
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {note.summary || note.content || 'Sin contenido...'}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-600 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true, locale: es })}</span>
                    </div>
                    
                    {note.isFavorite && (
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {note.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md flex items-center">
                          <Tag className="w-2 h-2 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 2 && (
                        <span className="text-[9px] text-zinc-600">+{note.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
