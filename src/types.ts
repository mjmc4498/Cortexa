export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  summary?: string;
  backlinks?: string[]; // IDs of notes that link to this one
  forwardLinks?: string[]; // IDs of notes this one links to
  tasks?: Task[];
  collaborators?: string[]; // User IDs with access
  lastEditor?: string;
  version?: number;
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  focusMode: 'work' | 'personal' | 'study' | 'none';
  lastActiveNoteId?: string;
  sidebarCollapsed: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface Presence {
  userId: string;
  userName: string;
  userPhoto?: string;
  lastActive: string;
  activeNoteId?: string;
}
