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
  Hash
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNoteStore } from '../store/useNoteStore';
import { cn } from '../lib/utils';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const { addNote, setSelectedNoteId } = useNoteStore();

  const handleNewNote = () => {
    addNote({ title: 'Nueva Nota', content: '' });
  };

  const menuItems = [
    { icon: LayoutGrid, label: 'Todas las Notas', id: 'all' },
    { icon: Star, label: 'Favoritos', id: 'favorites' },
    { icon: Hash, label: 'Etiquetas', id: 'tags' },
    { icon: Archive, label: 'Archivo', id: 'archive' },
    { icon: Trash2, label: 'Papelera', id: 'trash' },
  ];

  return (
    <aside className="w-64 flex flex-col bg-[#0a0a0a] border-r border-zinc-800/50 p-4">
      <div className="flex items-center space-x-3 px-2 mb-8">
        <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">Cortexa</span>
      </div>

      <button
        onClick={handleNewNote}
        className="flex items-center space-x-3 w-full bg-orange-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-orange-600 transition-all mb-8 active:scale-95 shadow-lg shadow-orange-500/20"
      >
        <Plus className="w-5 h-5" />
        <span>Nueva Nota</span>
      </button>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={cn(
              "flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all group",
              item.id === 'all' && "text-white bg-zinc-900"
            )}
          >
            <item.icon className="w-5 h-5" />
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
            <p className="text-sm font-medium truncate">{user.displayName}</p>
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
