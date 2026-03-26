import React, { createContext, useContext, useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    isDndInitialized?: boolean;
  }
}

interface DndContextType {
  isDndInitialized: boolean;
}

const DndContext = createContext<DndContextType>({ isDndInitialized: false });

export const useDnd = () => useContext(DndContext);

// Create a single instance of the backend
const backend = HTML5Backend;

export const DndContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDndInitialized, setIsDndInitialized] = useState(false);

  useEffect(() => {
    if (!window.isDndInitialized) {
      setIsDndInitialized(true);
      window.isDndInitialized = true;
    }

    return () => {
      // Only clean up if this instance initialized it
      if (isDndInitialized) {
        setIsDndInitialized(false);
        window.isDndInitialized = false;
      }
    };
  }, [isDndInitialized]);

  return (
    <DndContext.Provider value={{ isDndInitialized }}>
      <DndProvider backend={backend}>{children}</DndProvider>
    </DndContext.Provider>
  );
};
