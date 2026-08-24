import React, { createContext, useState, useContext } from 'react';

// Formato utilitario para devolver 'YYYY-MM-DD'
export const getFormattedDate = (date) => {
  return date.toISOString().split('T')[0];
};

const JournalContext = createContext();

export const JournalProvider = ({ children }) => {
  // Las entradas ahora vivirán aquí de forma global
  const [entries, setEntries] = useState([]);

  const addEntry = (entry) => {
    setEntries((prev) => [...prev, entry]);
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
    <JournalContext.Provider value={{ entries, addEntry, toggleStatus }}>
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => useContext(JournalContext);
