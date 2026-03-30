import { User } from 'firebase/auth';
import { 
  Plus, 
  Search, 
  Star, 
  Archive, 
  Trash2, 
  Settings, 
  LogOut, 
  Sparkles,
  LayoutGrid,
  Hash,
  Network,
  Layout,
  Upload,
  Zap,
  Target,
  Briefcase,
  User as UserIcon,
  BookOpen,
  Clock,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNoteStore, useUserStore } from '../../models/store/useNoteStore';
import { cn } from '../../lib/utils';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  onOpenGraph: () => void;
  onOpenKanban: () => void;
  onOpenSmartCapture: () => void;
  onOpenTimeline: () => void;
  onOpenWorkspace: () => void;
  onCloseMobile?: () => void;
}

export function Sidebar({ 
  user, 
  onLogout, 
  onOpenGraph, 
  onOpenKanban, 
  onOpenSmartCapture,
  onOpenTimeline,
  onOpenWorkspace,
  onCloseMobile
}: SidebarProps) {
  const { addNote, activeFilter, setActiveFilter } = useNoteStore();
  const { preferences, updatePreferences } = useUserStore();

  const handleNewNote = () => {
    addNote({ title: 'Nueva Nota', content: '' });
    if (onCloseMobile) onCloseMobile();
  };

  const menuItems = [
    { icon: LayoutGrid, label: 'Todas las Notas', id: 'all' },
    { icon: Star, label: 'Favoritos', id: 'favorites' },
    { icon: Hash, label: 'Etiquetas', id: 'tags' },
    { icon: Archive, label: 'Archivo', id: 'archive' },
    { icon: Trash2, label: 'Papelera', id: 'trash' },
  ];

  const focusModes = [
    { id: 'none', label: 'Sin Filtro', icon: Zap },
    { id: 'work', label: 'Trabajo', icon: Briefcase },
    { id: 'study', label: 'Estudio', icon: BookOpen },
    { id: 'personal', label: 'Personal', icon: UserIcon },
  ];

  return (
    <aside className="w-64 h-full flex flex-col bg-[#0a0a0a] border-r border-zinc-800/50 p-4 relative">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Cortexa</span>
        </div>
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
            title="Cerrar menú"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <button
        onClick={handleNewNote}
        className="flex items-center space-x-3 w-full bg-orange-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-orange-600 transition-all mb-6 active:scale-95 shadow-lg shadow-orange-500/20"
      >
        <Plus className="w-5 h-5" />
        <span>Nueva Nota</span>
      </button>

      <div className="space-y-1 mb-6">
        <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Módulos IA</p>
        <button 
          onClick={() => { onOpenWorkspace(); if (onCloseMobile) onCloseMobile(); }}
          className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group"
        >
          <LayoutGrid className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium">Workspace</span>
        </button>
        <button 
          onClick={() => { onOpenSmartCapture(); if (onCloseMobile) onCloseMobile(); }}
          className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group"
        >
          <Upload className="w-4 h-4 text-pink-500" />
          <span className="text-sm font-medium">Captura Inteligente</span>
        </button>
        <button 
          onClick={() => { onOpenGraph(); if (onCloseMobile) onCloseMobile(); }}
          className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group"
        >
          <Network className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium">Cerebro Digital</span>
        </button>
        <button 
          onClick={() => { onOpenTimeline(); if (onCloseMobile) onCloseMobile(); }}
          className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group"
        >
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">Línea de Tiempo</span>
        </button>
        <button 
          onClick={() => { onOpenKanban(); if (onCloseMobile) onCloseMobile(); }}
          className="flex items-center space-x-3 w-full px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group"
        >
          <Layout className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">Tablero Kanban</span>
        </button>
      </div>

      <div className="space-y-1 mb-6">
        <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Focus Mode</p>
        <div className="grid grid-cols-2 gap-1 px-2">
          {focusModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => updatePreferences(user.uid, { focusMode: mode.id as any })}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1",
                preferences?.focusMode === mode.id 
                  ? "bg-orange-500/10 border-orange-500/50 text-orange-500" 
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
              )}
            >
              <mode.icon size={14} />
              <span className="text-[9px] font-bold">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Biblioteca</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveFilter(item.id as any);
              if (onCloseMobile) onCloseMobile();
            }}
            className={cn(
              "flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl transition-all group",
              item.id === activeFilter 
                ? "text-white bg-zinc-900 border border-zinc-800" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            )}
          >
            <item.icon className={cn("w-5 h-5", item.id === activeFilter && "text-orange-500")} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-zinc-800/50 space-y-4">
        <div className="flex items-center space-x-3 px-2">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
            alt="User" 
            className="w-8 h-8 rounded-full border border-zinc-700"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white">{user.displayName}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <button className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Ajustes</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
