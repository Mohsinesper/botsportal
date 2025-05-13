
"use client";

import type { CallCenter } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MOCK_GLOBAL_CALL_CENTERS } from "@/lib/mock-data"; // Assuming mock data is here

interface CallCenterContextType {
  callCenters: CallCenter[];
  currentCallCenter: CallCenter | null;
  setCurrentCallCenterById: (id: string | null) => void;
  addCallCenter: (newCallCenterData: Omit<CallCenter, "id">) => void;
  isLoading: boolean;
}

const CallCenterContext = createContext<CallCenterContextType | undefined>(undefined);

const CALL_CENTERS_STORAGE_KEY = "callFlowAi_callCenters";
const CURRENT_CALL_CENTER_ID_STORAGE_KEY = "callFlowAi_currentCallCenterId";

export const CallCenterProvider = ({ children }: { children: ReactNode }) => {
  const [callCenters, setCallCenters] = useState<CallCenter[]>([]);
  const [currentCallCenter, setCurrentCallCenter] = useState<CallCenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedCallCenters = localStorage.getItem(CALL_CENTERS_STORAGE_KEY);
      const storedCurrentId = localStorage.getItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY);

      let initialCallCenters = MOCK_GLOBAL_CALL_CENTERS;
      if (storedCallCenters) {
        try {
            const parsedCenters = JSON.parse(storedCallCenters);
            if (Array.isArray(parsedCenters) && parsedCenters.length > 0) {
                 initialCallCenters = parsedCenters;
            }
        } catch (e) {
            console.warn("Failed to parse stored call centers, using default.", e);
        }
      }
      setCallCenters(initialCallCenters);

      if (storedCurrentId && storedCurrentId !== "null") {
        const foundCenter = initialCallCenters.find(cc => cc.id === storedCurrentId);
        setCurrentCallCenter(foundCenter || initialCallCenters[0] || null);
      } else if (initialCallCenters.length > 0) {
        setCurrentCallCenter(initialCallCenters[0]);
        localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, initialCallCenters[0].id);
      } else {
        setCurrentCallCenter(null);
      }
    } catch (error) {
        console.error("Error accessing localStorage:", error);
        // Fallback if localStorage is not available (e.g. server-side rendering part or incognito with restrictions)
        setCallCenters(MOCK_GLOBAL_CALL_CENTERS);
        if (MOCK_GLOBAL_CALL_CENTERS.length > 0) {
            setCurrentCallCenter(MOCK_GLOBAL_CALL_CENTERS[0]);
        }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
        try {
            localStorage.setItem(CALL_CENTERS_STORAGE_KEY, JSON.stringify(callCenters));
        } catch (error) {
            console.error("Error saving call centers to localStorage:", error);
        }
    }
  }, [callCenters, isLoading]);

  const setCurrentCallCenterById = (id: string | null) => {
    if (id === null) {
        setCurrentCallCenter(null);
        try {
            localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, "null");
        } catch (error) {
            console.error("Error saving current call center ID to localStorage:", error);
        }
        return;
    }
    const center = callCenters.find(cc => cc.id === id);
    if (center) {
      setCurrentCallCenter(center);
      try {
        localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, id);
      } catch (error) {
        console.error("Error saving current call center ID to localStorage:", error);
      }
    }
  };

  const addCallCenter = (newCallCenterData: Omit<CallCenter, "id">) => {
    const newCallCenter: CallCenter = {
      ...newCallCenterData,
      id: `cc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setCallCenters(prev => {
        const updatedCenters = [...prev, newCallCenter];
        if (prev.length === 0) { // If this is the first call center, set it as current
            setCurrentCallCenter(newCallCenter);
            try {
                localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, newCallCenter.id);
            } catch (error) {
                 console.error("Error setting first call center in localStorage:", error);
            }
        }
        return updatedCenters;
    });
  };


  return (
    <CallCenterContext.Provider value={{ callCenters, currentCallCenter, setCurrentCallCenterById, addCallCenter, isLoading }}>
      {children}
    </CallCenterContext.Provider>
  );
};

export const useCallCenter = () => {
  const context = useContext(CallCenterContext);
  if (context === undefined) {
    throw new Error("useCallCenter must be used within a CallCenterProvider");
  }
  return context;
};
