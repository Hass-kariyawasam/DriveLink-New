import React, { createContext, useState, useContext } from 'react';

const VehicleContext = createContext();

export const VehicleProvider = ({ children }) => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([]); // User ගේ වාහන ලිස්ට් එක

  return (
    <VehicleContext.Provider value={{ selectedVehicle, setSelectedVehicle, vehicles, setVehicles }}>
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => useContext(VehicleContext);