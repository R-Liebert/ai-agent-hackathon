import React, { createContext, useState, ReactNode } from 'react';

type SelectedValueContextType = {
  selectedValue: string;
  setSelectedValue: (value: string) => void;
};

type SelectedValueProviderProps = {
  children: ReactNode;
};

export const SelectedValueContext = createContext<SelectedValueContextType>({
  selectedValue: '',
  setSelectedValue: () => {},
});

export const SelectedValueProvider: React.FC<SelectedValueProviderProps> = ({ children }) => {
  const [selectedValue, setSelectedValue] = useState('');

  return (
    <SelectedValueContext.Provider value={{ selectedValue, setSelectedValue }}>
      {children}
    </SelectedValueContext.Provider>
  );
};