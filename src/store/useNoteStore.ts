import { create } from 'zustand';
import { Note, UserPreferences, Presence, Task } from '../types';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';

interface NoteState {
  notes: Note[];
  loading: boolean;
  searchQuery: string;
  selectedNoteId: string | null;
  setSearchQuery: (query: string) => void;
  setSelectedNoteId: (id: string | null) => void;
  fetchNotes: (userId: string) => () => void;
  addNote: (note: Partial<Note>) => Promise<string | undefined>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addTask: (noteId: string, task: Partial<Task>) => Promise<void>;
  toggleTask: (noteId: string, taskId: string) => Promise<void>;
  removeTask: (noteId: string, taskId: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  loading: true,
  searchQuery: '',
  selectedNoteId: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),

  fetchNotes: (userId) => {
    set({ loading: true });
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', userId),
      where('isDeleted', '==', false),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      set({ notes, loading: false });
    }, (error) => {
      console.error("Error fetching notes:", error);
      set({ loading: false });
    });

    return unsubscribe;
  },

  addNote: async (note) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const newNote = {
      ...note,
      userId,
      title: note.title || 'Sin título',
      content: note.content || '',
      tags: note.tags || [],
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: note.tasks || [],
      backlinks: [],
      forwardLinks: [],
    };

    try {
      const docRef = await addDoc(collection(db, 'notes'), newNote);
      return docRef.id;
    } catch (error) {
      console.error("Error adding note:", error);
    }
  },

  updateNote: async (id, updates) => {
    try {
      const noteRef = doc(db, 'notes', id);
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating note:", error);
    }
  },

  deleteNote: async (id) => {
    try {
      const noteRef = doc(db, 'notes', id);
      await updateDoc(noteRef, {
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  },

  addTask: async (noteId, task) => {
    const note = get().notes.find(n => n.id === noteId);
    if (!note) return;
    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      text: task.text || '',
      completed: false,
      priority: task.priority || 'medium',
      dueDate: task.dueDate,
    };
    const tasks = [...(note.tasks || []), newTask];
    await get().updateNote(noteId, { tasks });
  },

  toggleTask: async (noteId, taskId) => {
    const note = get().notes.find(n => n.id === noteId);
    if (!note) return;
    const tasks = (note.tasks || []).map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    await get().updateNote(noteId, { tasks });
  },

  removeTask: async (noteId, taskId) => {
    const note = get().notes.find(n => n.id === noteId);
    if (!note) return;
    const tasks = (note.tasks || []).filter(t => t.id !== taskId);
    await get().updateNote(noteId, { tasks });
  },
}));

interface UserState {
  preferences: UserPreferences | null;
  presences: Presence[];
  fetchPreferences: (userId: string) => () => void;
  updatePreferences: (userId: string, updates: Partial<UserPreferences>) => Promise<void>;
  updatePresence: (userId: string, presence: Partial<Presence>) => Promise<void>;
  fetchPresences: () => () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  preferences: null,
  presences: [],

  fetchPreferences: (userId) => {
    const prefRef = doc(db, 'preferences', userId);
    const unsubscribe = onSnapshot(prefRef, (snapshot) => {
      if (snapshot.exists()) {
        set({ preferences: snapshot.data() as UserPreferences });
      } else {
        // Initialize default preferences
        const defaultPrefs: UserPreferences = {
          userId,
          theme: 'light',
          language: 'es',
          focusMode: 'none',
          sidebarCollapsed: false,
        };
        setDoc(prefRef, defaultPrefs);
        set({ preferences: defaultPrefs });
      }
    });
    return unsubscribe;
  },

  updatePreferences: async (userId, updates) => {
    const prefRef = doc(db, 'preferences', userId);
    await updateDoc(prefRef, updates);
  },

  updatePresence: async (userId, presence) => {
    const presenceRef = doc(db, 'presence', userId);
    await setDoc(presenceRef, {
      ...presence,
      userId,
      lastActive: new Date().toISOString(),
    }, { merge: true });
  },

  fetchPresences: () => {
    const q = query(collection(db, 'presence'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const presences = snapshot.docs.map(doc => doc.data() as Presence);
      set({ presences });
    });
    return unsubscribe;
  }
}));
