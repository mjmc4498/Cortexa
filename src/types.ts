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
  embedding?: number[]; // For semantic search
  backlinks?: string[]; // IDs of notes that link to this one
  forwardLinks?: string[]; // IDs of notes this one links to
  tasks?: Task[];
  collaborators?: string[]; // User IDs with access
  lastEditor?: string;
  version?: number;
  metadata?: {
    location?: { lat: number; lng: number; name?: string };
    source?: 'web' | 'mobile' | 'voice' | 'image';
    context?: string; // e.g., "Meeting", "Travel", "Study"
  };
}

export interface AgentConfig {
  id: string;
  name: string;
  type: 'organizer' | 'reporter' | 'cleaner' | 'task-extractor';
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'real-time';
  lastRun?: string;
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  focusMode: 'work' | 'personal' | 'study' | 'none';
  lastActiveNoteId?: string;
  sidebarCollapsed: boolean;
  agents?: AgentConfig[];
  workspaceLayout?: any; // For custom dashboards
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
  location?: { lat: number; lng: number };
}
