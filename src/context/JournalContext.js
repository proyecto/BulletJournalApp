import React, { createContext, useState, useContext } from 'react';

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
  // Las entradas ahora vivirán aquí de forma global
  const [entries, setEntries] = useState([]);
  const [lists, setLists] = useState([]);

  const addEntry = (entry) => {
    setEntries((prev) => [...prev, entry]);
  };

  const addList = (title) => {
    const newList = {
      id: Date.now().toString(),
      title
    };
    setLists((prev) => [...prev, newList]);
  };

  const toggleStatus = (id, currentLogDate) => {
    setEntries((prev) => 
      prev.map(entry => {
        if (entry.id === id && entry.type === 'task') {
          const isCompleting = entry.status === 'open';
          return {
            ...entry,
            status: isCompleting ? 'completed' : 'open',
            // Solo registramos la fecha de completado si la estamos completando. 
            // Si la desmarcamos, borramos la fecha.
            completedAt: isCompleting ? currentLogDate : null
          };
        }
        return entry;
      })
    );
  };

  return (
    <JournalContext.Provider value={{ entries, addEntry, toggleStatus, lists, addList }}>
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => useContext(JournalContext);
