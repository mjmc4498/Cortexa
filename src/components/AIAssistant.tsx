import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  X, 
  MessageSquare,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNoteStore } from '../store/useNoteStore';
import { askAboutNotes } from '../services/aiService';
import { ChatMessage } from '../types';
import { cn } from '../lib/utils';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "¡Hola! Soy tu asistente de Cortexa. ¡Pregúntame cualquier cosa sobre tus notas!", timestamp: new Date().toISOString() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { notes } = useNoteStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: new Date().toISOString() }]);
    setIsLoading(true);

    try {
      const response = await askAboutNotes(userMessage, notes);
      setMessages(prev => [...prev, { role: 'model', text: response, timestamp: new Date().toISOString() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Lo siento, tuve problemas para procesar eso.", timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all z-50 active:scale-95",
          isOpen ? "bg-zinc-900 text-white rotate-90" : "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-[#0f0f0f] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <header className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">IA de Cortexa</h2>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">En línea</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
            >
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={cn(
                    "flex items-start space-x-3",
                    msg.role === 'user' ? "flex-row-reverse space-x-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    msg.role === 'model' ? "bg-orange-500/10 text-orange-500" : "bg-zinc-800 text-zinc-400"
                  )}>
                    {msg.role === 'model' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'model' 
                      ? "bg-zinc-900 text-zinc-300 rounded-tl-none" 
                      : "bg-orange-500 text-white rounded-tr-none"
                  )}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-2xl rounded-tl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/30">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Pregunta sobre tus notas..."
                  className="w-full bg-zinc-900 border-zinc-800 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-orange-500/50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!query.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-zinc-600 text-center mt-4 font-medium">
                La IA puede cometer errores. Verifica la información importante.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
