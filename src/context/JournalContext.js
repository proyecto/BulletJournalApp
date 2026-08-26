import React, { createContext, useState, useContext, useEffect } from 'react';
import db from '../database/db';

// Formato utilitario para devolver 'YYYY-MM-DD'
export const getFormattedDate = (date, timezone = 'system') => {
  if (!timezone || timezone === 'system') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone });
    return formatter.format(new Date(date));
  } catch (e) {
    // Fallback if Intl or the specific timezone is not supported
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

const JournalContext = createContext();

export const JournalProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [lists, setLists] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadJournal = async () => {
      try {
        const loadedLists = await db.getAllAsync('SELECT * FROM lists ORDER BY order_index ASC');
        const loadedEntries = await db.getAllAsync('SELECT * FROM entries');
        setLists(loadedLists);
        setEntries(loadedEntries);
      } catch (e) {
        console.error('Error loading journal from SQLite', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadJournal();
  }, []);

  const addEntry = async (entry) => {
    try {
      await db.runAsync(
        'INSERT INTO entries (id, text, type, status, date, completedAt, listId) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [entry.id, entry.text, entry.type, entry.status, entry.date, entry.completedAt || null, entry.listId || null]
      );
      setEntries((prev) => [...prev, entry]);
    } catch (e) {
      console.error('Error adding entry', e);
    }
  };

  const addList = async (title) => {
    const id = Date.now().toString();
    const orderIndex = lists.length;
    const newList = { id, title, order_index: orderIndex };
    try {
      await db.runAsync('INSERT INTO lists (id, title, order_index) VALUES (?, ?, ?)', [id, title, orderIndex]);
      setLists((prev) => [...prev, newList]);
    } catch (e) {
      console.error('Error adding list', e);
    }
  };

  const reorderLists = async (newOrder) => {
    setLists(newOrder); // Optimistic update
    try {
      for (let i = 0; i < newOrder.length; i++) {
        const list = newOrder[i];
        await db.runAsync('UPDATE lists SET order_index = ? WHERE id = ?', [i, list.id]);
      }
    } catch (e) {
      console.error('Error reordering lists', e);
    }
  };

  const deleteList = async (id) => {
    try {
      // First delete all entries associated with this list
      await db.runAsync('DELETE FROM entries WHERE listId = ?', [id]);
      // Then delete the list itself
      await db.runAsync('DELETE FROM lists WHERE id = ?', [id]);
      
      // Update state
      setLists((prev) => prev.filter((list) => list.id !== id));
      setEntries((prev) => prev.filter((entry) => entry.listId !== id));
    } catch (e) {
      console.error('Error deleting list', e);
    }
  };

  const toggleStatus = async (id, currentLogDate) => {
    const entryIndex = entries.findIndex(e => e.id === id);
    if (entryIndex === -1) return;
    
    const entry = entries[entryIndex];
    if (entry.type !== 'task') return;
    
    const isCompleting = entry.status === 'open';
    const newStatus = isCompleting ? 'completed' : 'open';
    const newCompletedAt = isCompleting ? currentLogDate : null;

    try {
      await db.runAsync('UPDATE entries SET status = ?, completedAt = ? WHERE id = ?', [newStatus, newCompletedAt, id]);
      
      setEntries((prev) => 
        prev.map(e => {
          if (e.id === id) {
            return { ...e, status: newStatus, completedAt: newCompletedAt };
          }
          return e;
        })
      );
    } catch (error) {
      console.error('Error toggling status', error);
    }
  };

  if (!isLoaded) return null;

  return (
    <JournalContext.Provider value={{ entries, addEntry, toggleStatus, lists, addList, reorderLists, deleteList }}>
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => useContext(JournalContext);
