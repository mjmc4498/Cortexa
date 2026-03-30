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
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { generateEmbedding, semanticSearch } from '../../controllers/services/aiService';

interface NoteState {
  notes: Note[];
  loading: boolean;
  searchQuery: string;
  isSemanticSearch: boolean;
  selectedNoteId: string | null;
  activeFilter: 'all' | 'favorites' | 'tags' | 'archive' | 'trash';
  setSearchQuery: (query: string) => void;
  setSemanticSearch: (enabled: boolean) => void;
  setSelectedNoteId: (id: string | null) => void;
  setActiveFilter: (filter: 'all' | 'favorites' | 'tags' | 'archive' | 'trash') => void;
  fetchNotes: (userId: string) => () => void;
  addNote: (note: Partial<Note>) => Promise<string | undefined>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  addTask: (noteId: string, task: Partial<Task>) => Promise<void>;
  toggleTask: (noteId: string, taskId: string) => Promise<void>;
  removeTask: (noteId: string, taskId: string) => Promise<void>;
  performSemanticSearch: (query: string) => Promise<Note[]>;
}

const cleanObject = (obj: any) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
};

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  loading: true,
  searchQuery: '',
  isSemanticSearch: false,
  selectedNoteId: null,
  activeFilter: 'all',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSemanticSearch: (enabled) => set({ isSemanticSearch: enabled }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  fetchNotes: (userId) => {
    set({ loading: true });
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', userId),
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

    // Generate embedding for semantic search
    const embedding = await generateEmbedding(`${note.title || ''} ${note.content || ''}`);

    const newNote = cleanObject({
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
      embedding,
    });

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
      
      // If title or content changed, regenerate embedding
      if (updates.title !== undefined || updates.content !== undefined) {
        const currentNote = get().notes.find(n => n.id === id);
        const newTitle = updates.title !== undefined ? updates.title : currentNote?.title || '';
        const newContent = updates.content !== undefined ? updates.content : currentNote?.content || '';
        updates.embedding = await generateEmbedding(`${newTitle} ${newContent}`);
      }

      await updateDoc(noteRef, cleanObject({
        ...updates,
        updatedAt: new Date().toISOString(),
      }));
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
  restoreNote: async (id) => {
    try {
      const noteRef = doc(db, 'notes', id);
      await updateDoc(noteRef, {
        isDeleted: false,
        isArchived: false,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error restoring note:", error);
    }
  },
  permanentlyDeleteNote: async (id) => {
    try {
      const noteRef = doc(db, 'notes', id);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error("Error permanently deleting note:", error);
    }
  },
  emptyTrash: async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    try {
      const q = query(
        collection(db, 'notes'),
        where('userId', '==', userId),
        where('isDeleted', '==', true)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error emptying trash:", error);
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

  performSemanticSearch: async (query) => {
    return await semanticSearch(query, get().notes);
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
    await updateDoc(prefRef, cleanObject(updates));
  },

  updatePresence: async (userId, presence) => {
    const presenceRef = doc(db, 'presence', userId);
    await setDoc(presenceRef, cleanObject({
      ...presence,
      userId,
      lastActive: new Date().toISOString(),
    }), { merge: true });
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
