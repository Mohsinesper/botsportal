
"use client";

import type { CallCenter } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MOCK_GLOBAL_CALL_CENTERS } from "@/lib/mock-data";
import { useAuth } from "./AuthContext"; // Import useAuth

interface CallCenterContextType {
  callCenters: CallCenter[]; // This will be the list of *accessible* call centers
  allCallCenters: CallCenter[]; // All call centers in the system (for super admin, etc.)
  currentCallCenter: CallCenter | null;
  setCurrentCallCenterById: (id: string | null) => void;
  addCallCenter: (newCallCenterData: Omit<CallCenter, "id">) => void;
  isLoading: boolean; // Combined loading state
}

const CallCenterContext = createContext<CallCenterContextType | undefined>(undefined);

const CALL_CENTERS_STORAGE_KEY = "callFlowAi_callCenters"; // Stores all CCs
const CURRENT_CALL_CENTER_ID_STORAGE_KEY = "callFlowAi_currentCallCenterId";

export const CallCenterProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [allCallCenters, setAllCallCenters] = useState<CallCenter[]>([]); // All system CCs
  const [accessibleCallCenters, setAccessibleCallCenters] = useState<CallCenter[]>([]);
  const [currentCallCenter, setCurrentCallCenter] = useState<CallCenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(isAuthLoading); // Sync with auth loading state
    if (isAuthLoading) return;

    try {
      const storedCallCenters = localStorage.getItem(CALL_CENTERS_STORAGE_KEY);
      let initialAllCallCenters = MOCK_GLOBAL_CALL_CENTERS;
      if (storedCallCenters) {
        try {
          const parsedCenters = JSON.parse(storedCallCenters);
          if (Array.isArray(parsedCenters) && parsedCenters.length > 0) {
            initialAllCallCenters = parsedCenters;
          }
        } catch (e) {
          console.warn("Failed to parse stored call centers, using default.", e);
        }
      }
      setAllCallCenters(initialAllCallCenters);

      // Filter accessible call centers based on user role
      let userAccessibleCenters: CallCenter[] = [];
      if (currentUser) {
        if (currentUser.role === "SUPER_ADMIN") {
          userAccessibleCenters = initialAllCallCenters;
        } else if ((currentUser.role === "CALL_CENTER_ADMIN" || currentUser.role === "DESIGN_ADMIN") && currentUser.assignedCallCenterIds) {
          userAccessibleCenters = initialAllCallCenters.filter(cc => 
            currentUser.assignedCallCenterIds?.includes(cc.id)
          );
        }
      }
      setAccessibleCallCenters(userAccessibleCenters);
      
      const storedCurrentId = localStorage.getItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY);
      let activeCenter: CallCenter | null = null;

      if (storedCurrentId && storedCurrentId !== "null") {
        // Ensure the stored current CC is accessible to the user
        activeCenter = userAccessibleCenters.find(cc => cc.id === storedCurrentId) || null;
      }
      
      if (!activeCenter && userAccessibleCenters.length > 0) {
        activeCenter = userAccessibleCenters[0];
      }
      
      setCurrentCallCenter(activeCenter);
      if (activeCenter) {
        localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, activeCenter.id);
      } else {
        localStorage.removeItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY);
      }

    } catch (error) {
      console.error("Error accessing localStorage for Call Centers:", error);
      setAllCallCenters(MOCK_GLOBAL_CALL_CENTERS);
      // Basic fallback if localStorage fails or no user context yet
      setAccessibleCallCenters(MOCK_GLOBAL_CALL_CENTERS); 
      if (MOCK_GLOBAL_CALL_CENTERS.length > 0) {
          setCurrentCallCenter(MOCK_GLOBAL_CALL_CENTERS[0]);
      }
    }
    setIsLoading(false);
  }, [currentUser, isAuthLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthLoading) { // Save allCallCenters, not just accessible ones
        try {
            localStorage.setItem(CALL_CENTERS_STORAGE_KEY, JSON.stringify(allCallCenters));
        } catch (error) {
            console.error("Error saving all call centers to localStorage:", error);
        }
    }
  }, [allCallCenters, isLoading, isAuthLoading]);

  const setCurrentCallCenterById = (id: string | null) => {
    if (id === null) {
      setCurrentCallCenter(null);
      try {
        localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, "null");
      } catch (error) {
        console.error("Error clearing current call center ID in localStorage:", error);
      }
      return;
    }
    // Ensure the center being set is in the list of accessible centers for the current user
    const center = accessibleCallCenters.find(cc => cc.id === id);
    if (center) {
      setCurrentCallCenter(center);
      try {
        localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, id);
      } catch (error) {
        console.error("Error saving current call center ID to localStorage:", error);
      }
    } else {
        // If trying to set a non-accessible CC, clear it or set to first accessible
        if (accessibleCallCenters.length > 0) {
            setCurrentCallCenter(accessibleCallCenters[0]);
            localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, accessibleCallCenters[0].id);
        } else {
            setCurrentCallCenter(null);
            localStorage.removeItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY);
        }
        console.warn("Attempted to set a non-accessible call center as current.");
    }
  };

  const addCallCenter = (newCallCenterData: Omit<CallCenter, "id">) => {
    // Only Super Admins should ideally be able to add call centers.
    // This logic might be better in a server action with permission checks.
    // For now, client-side for mock.
    if (currentUser?.role !== "SUPER_ADMIN") {
        console.warn("Only Super Admins can add new call centers.");
        // Optionally show a toast message to the user
        return;
    }

    const newCallCenter: CallCenter = {
      ...newCallCenterData,
      id: `cc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setAllCallCenters(prev => {
        const updatedCenters = [...prev, newCallCenter];
         // If current user is super admin, they can access it.
        if (currentUser?.role === "SUPER_ADMIN") {
            setAccessibleCallCenters(updatedCenters);
             // If it's the first CC overall or first accessible one after filtering
            if (!currentCallCenter || accessibleCallCenters.length === 0) {
                setCurrentCallCenter(newCallCenter);
                try {
                    localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, newCallCenter.id);
                } catch (error) {
                     console.error("Error setting first call center in localStorage:", error);
                }
            }
        }
        return updatedCenters;
    });
  };

  return (
    <CallCenterContext.Provider value={{ 
        callCenters: accessibleCallCenters, 
        allCallCenters,
        currentCallCenter, 
        setCurrentCallCenterById, 
        addCallCenter, 
        isLoading 
    }}>
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
