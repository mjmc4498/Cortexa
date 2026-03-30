import { useState, useEffect, useCallback } from 'react';
import { 
  Star, 
  Pin, 
  Trash2, 
  Sparkles, 
  Tag as TagIcon, 
  Clock, 
  Save, 
  FileText,
  Download,
  History,
  Share2,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNoteStore } from '../store/useNoteStore';
import { summarizeNote, suggestTags } from '../services/aiService';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export function NoteEditor() {
  const { notes, selectedNoteId, updateNote, deleteNote, setSelectedNoteId } = useNoteStore();
  const note = notes.find(n => n.id === selectedNoteId);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note?.id]);

  const handleSave = useCallback(async () => {
    if (!note) return;
    await updateNote(note.id, { title, content });
  }, [note, title, content, updateNote]);

  // Auto-save debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      if (note && (title !== note.title || content !== note.content)) {
        handleSave();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, content, note, handleSave]);

  const handleSummarize = async () => {
    if (!note) return;
    setIsSummarizing(true);
    const summary = await summarizeNote({ ...note, title, content });
    await updateNote(note.id, { summary });
    setIsSummarizing(false);
  };

  const handleSuggestTags = async () => {
    if (!note) return;
    setIsSuggestingTags(true);
    const suggested = await suggestTags(content);
    const newTags = Array.from(new Set([...note.tags, ...suggested]));
    await updateNote(note.id, { tags: newTags });
    setIsSuggestingTags(false);
  };

  const handleExport = () => {
    const element = document.createElement("a");
    const file = new Blob([`# ${title}\n\n${content}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(element);
    element.click();
  };

  if (!note) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      {/* Toolbar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-zinc-800/50 bg-[#0f0f0f]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
            className={cn(
              "p-2 rounded-xl transition-all",
              note.isPinned ? "bg-orange-500/10 text-orange-500" : "text-zinc-500 hover:bg-zinc-800"
            )}
          >
            <Pin className={cn("w-5 h-5", note.isPinned && "fill-orange-500")} />
          </button>
          <button 
            onClick={() => updateNote(note.id, { isFavorite: !note.isFavorite })}
            className={cn(
              "p-2 rounded-xl transition-all",
              note.isFavorite ? "bg-yellow-500/10 text-yellow-500" : "text-zinc-500 hover:bg-zinc-800"
            )}
          >
            <Star className={cn("w-5 h-5", note.isFavorite && "fill-yellow-500")} />
          </button>
          <div className="h-6 w-px bg-zinc-800 mx-2" />
          <div className="flex items-center space-x-2 text-xs text-zinc-500 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Editado por última vez el {format(new Date(note.updatedAt), "d 'de' MMM, h:mm a", { locale: es })}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsPreview(!isPreview)}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
              isPreview ? "bg-orange-500 text-white" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>{isPreview ? 'Editando' : 'Vista Previa'}</span>
          </button>
          <button 
            onClick={handleExport}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 transition-all"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              deleteNote(note.id);
              setSelectedNoteId(null);
            }}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {/* AI Summary Section */}
        <AnimatePresence>
          {(note.summary || isSummarizing) && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 space-y-3 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-orange-500 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Resumen de IA</span>
                </div>
                <button 
                  onClick={() => updateNote(note.id, { summary: '' })}
                  className="p-1 rounded-lg hover:bg-orange-500/10 text-orange-500/50 hover:text-orange-500 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {isSummarizing ? (
                <div className="flex items-center space-x-3 text-orange-500/60 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm italic">Generando resumen...</span>
                </div>
              ) : (
                <p className="text-zinc-300 text-sm leading-relaxed italic">
                  "{note.summary}"
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className="max-w-4xl mx-auto space-y-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la Nota"
            className="w-full bg-transparent border-none text-4xl font-bold text-white placeholder:text-zinc-800 focus:ring-0 p-0"
          />

          <div className="flex flex-wrap gap-2 items-center">
            {note.tags.map(tag => (
              <span key={tag} className="flex items-center space-x-1.5 bg-zinc-900 text-zinc-400 px-3 py-1 rounded-full text-xs font-medium border border-zinc-800">
                <TagIcon className="w-3 h-3" />
                <span>{tag}</span>
                <button 
                  onClick={() => updateNote(note.id, { tags: note.tags.filter(t => t !== tag) })}
                  className="hover:text-red-400 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button 
              onClick={handleSuggestTags}
              disabled={isSuggestingTags}
              className="flex items-center space-x-1.5 text-orange-500 hover:bg-orange-500/10 px-3 py-1 rounded-full text-xs font-medium transition-all disabled:opacity-50"
            >
              {isSuggestingTags ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>Sugerir Etiquetas</span>
            </button>
          </div>

          <div className="min-h-[500px]">
            {isPreview ? (
              <div className="prose prose-invert prose-orange max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Comienza a escribir tus pensamientos... (Soporta Markdown)"
                className="w-full h-full min-h-[500px] bg-transparent border-none text-zinc-400 text-lg leading-relaxed placeholder:text-zinc-800 focus:ring-0 p-0 resize-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <footer className="px-8 py-4 border-t border-zinc-800/50 bg-[#0f0f0f]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleSummarize}
            disabled={isSummarizing || !content}
            className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-orange-500/20"
          >
            {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Resumir con IA</span>
          </button>
          <button className="flex items-center space-x-2 text-zinc-500 hover:text-white transition-all text-sm font-medium">
            <History className="w-4 h-4" />
            <span>Historial</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 text-zinc-500 hover:text-white transition-all text-sm font-medium">
            <Share2 className="w-4 h-4" />
            <span>Compartir</span>
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center space-x-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Guardado</span>
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
