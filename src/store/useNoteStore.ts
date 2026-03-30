import { create } from 'zustand';
import { Note } from '../types';
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
  Timestamp
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
  addNote: (note: Partial<Note>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
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
    };

    try {
      await addDoc(collection(db, 'notes'), newNote);
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
      // Soft delete
      await updateDoc(noteRef, {
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  },
}));
