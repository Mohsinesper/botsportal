
"use client";

import type { CallCenter } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MOCK_GLOBAL_CALL_CENTERS, MOCK_BOTS } from "@/lib/mock-data"; // Import MOCK_BOTS
import { useAuth } from "./AuthContext";

interface CallCenterContextType {
  callCenters: CallCenter[]; 
  allCallCenters: CallCenter[]; 
  currentCallCenter: CallCenter | null;
  setCurrentCallCenterById: (id: string | null) => void;
  addCallCenter: (newCallCenterData: Omit<CallCenter, "id" | "billingConfig" | "status"> & { billingConfig?: CallCenter['billingConfig'], status?: CallCenter['status'] }) => void;
  updateCallCenter: (updatedCallCenterData: CallCenter) => void;
  updateCallCenterBillingConfig: (callCenterId: string, config: CallCenter['billingConfig']) => CallCenter | undefined;
  updateCallCenterStatus: (callCenterId: string, status: CallCenter['status']) => CallCenter | undefined;
  isLoading: boolean; 
}

const CallCenterContext = createContext<CallCenterContextType | undefined>(undefined);

const CALL_CENTERS_STORAGE_KEY = "callFlowAi_callCenters"; 
const CURRENT_CALL_CENTER_ID_STORAGE_KEY = "callFlowAi_currentCallCenterId";

export const CallCenterProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [allCallCentersState, setAllCallCentersState] = useState<CallCenter[]>([]); 
  const [accessibleCallCenters, setAccessibleCallCenters] = useState<CallCenter[]>([]);
  const [currentCallCenter, setCurrentCallCenter] = useState<CallCenter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(isAuthLoading); 
    if (isAuthLoading) return;

    try {
      const storedCallCenters = localStorage.getItem(CALL_CENTERS_STORAGE_KEY);
      let initialAllCallCenters = MOCK_GLOBAL_CALL_CENTERS;
      if (storedCallCenters) {
        try {
          const parsedCenters = JSON.parse(storedCallCenters);
          if (Array.isArray(parsedCenters) && parsedCenters.length > 0) {
            initialAllCallCenters = parsedCenters.map(cc => ({ ...cc, status: cc.status || 'active' })); // Ensure status default
          }
        } catch (e) {
          console.warn("Failed to parse stored call centers, using default.", e);
          initialAllCallCenters = MOCK_GLOBAL_CALL_CENTERS.map(cc => ({ ...cc, status: cc.status || 'active' }));
        }
      } else {
         initialAllCallCenters = MOCK_GLOBAL_CALL_CENTERS.map(cc => ({ ...cc, status: cc.status || 'active' }));
      }
      setAllCallCentersState(initialAllCallCenters);

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
      const defaultCenters = MOCK_GLOBAL_CALL_CENTERS.map(cc => ({ ...cc, status: cc.status || 'active' }));
      setAllCallCentersState(defaultCenters);
      setAccessibleCallCenters([]); 
      if (defaultCenters.length > 0 && currentUser?.role === "SUPER_ADMIN") {
          setAccessibleCallCenters(defaultCenters);
          setCurrentCallCenter(defaultCenters[0]);
      }
    }
    setIsLoading(false);
  }, [currentUser, isAuthLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthLoading) { 
        try {
            localStorage.setItem(CALL_CENTERS_STORAGE_KEY, JSON.stringify(allCallCentersState));
        } catch (error) {
            console.error("Error saving all call centers to localStorage:", error);
        }
    }
  }, [allCallCentersState, isLoading, isAuthLoading]);

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
    const center = accessibleCallCenters.find(cc => cc.id === id);
    if (center) {
      setCurrentCallCenter(center);
      try {
        localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, id);
      } catch (error) {
        console.error("Error saving current call center ID to localStorage:", error);
      }
    } else {
        if (accessibleCallCenters.length > 0) {
            setCurrentCallCenter(accessibleCallCenters[0]);
            localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, accessibleCallCenters[0].id);
        } else {
            setCurrentCallCenter(null);
            localStorage.removeItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY);
        }
    }
  };

  const addCallCenter = (newCallCenterData: Omit<CallCenter, "id" | "billingConfig" | "status"> & { billingConfig?: CallCenter['billingConfig'], status?: CallCenter['status'] }) => {
    if (currentUser?.role !== "SUPER_ADMIN") {
        return;
    }

    const newCallCenter: CallCenter = {
      ...newCallCenterData,
      id: `cc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: newCallCenterData.status || "active",
      billingConfig: newCallCenterData.billingConfig || { rateType: "per_month", amount: 0, currency: "USD" }
    };
    setAllCallCentersState(prev => {
        const updatedCenters = [...prev, newCallCenter];
        if (currentUser?.role === "SUPER_ADMIN") {
            setAccessibleCallCenters(updatedCenters); 
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

  const updateCallCenter = (updatedData: CallCenter) => {
    if (currentUser?.role !== "SUPER_ADMIN") return;
    const fullUpdateData = { ...updatedData, status: updatedData.status || 'active' };


    setAllCallCentersState(prevAll => 
      prevAll.map(cc => (cc.id === fullUpdateData.id ? fullUpdateData : cc))
    );
    
    if (currentCallCenter?.id === fullUpdateData.id) {
      setCurrentCallCenter(fullUpdateData);
    }
  };
  
  // This effect ensures accessibleCallCenters and currentCallCenter are updated when allCallCentersState changes
  useEffect(() => {
    if (isAuthLoading || isLoading) return; // Prevent updates while initial loading is in progress

    let userAccessibleCenters: CallCenter[] = [];
    if (currentUser) {
      if (currentUser.role === "SUPER_ADMIN") {
        userAccessibleCenters = allCallCentersState;
      } else if ((currentUser.role === "CALL_CENTER_ADMIN" || currentUser.role === "DESIGN_ADMIN") && currentUser.assignedCallCenterIds) {
        userAccessibleCenters = allCallCentersState.filter(cc => 
          currentUser.assignedCallCenterIds?.includes(cc.id)
        );
      }
    }
    setAccessibleCallCenters(userAccessibleCenters);

    // Re-evaluate currentCallCenter
    if (currentCallCenter) {
      const updatedCurrent = userAccessibleCenters.find(cc => cc.id === currentCallCenter.id);
      if (updatedCurrent) {
        setCurrentCallCenter(updatedCurrent);
      } else if (userAccessibleCenters.length > 0) {
        setCurrentCallCenter(userAccessibleCenters[0]);
        localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, userAccessibleCenters[0].id);
      } else {
        setCurrentCallCenter(null);
        localStorage.removeItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY);
      }
    } else if (userAccessibleCenters.length > 0) {
        setCurrentCallCenter(userAccessibleCenters[0]);
        localStorage.setItem(CURRENT_CALL_CENTER_ID_STORAGE_KEY, userAccessibleCenters[0].id);
    }

  }, [allCallCentersState, currentUser, isAuthLoading, isLoading, currentCallCenter]);


  const updateCallCenterBillingConfig = (
    callCenterId: string, 
    config: CallCenter['billingConfig']
  ): CallCenter | undefined => {
    let updatedCenter: CallCenter | undefined = undefined;
    setAllCallCentersState(prevAll => {
      const newAll = prevAll.map(cc => {
        if (cc.id === callCenterId) {
          updatedCenter = { ...cc, billingConfig: config };
          return updatedCenter;
        }
        return cc;
      });
      return newAll;
    });
    return updatedCenter;
  };

  const updateCallCenterStatus = (
    callCenterId: string,
    status: CallCenter['status']
  ): CallCenter | undefined => {
    if (currentUser?.role !== "SUPER_ADMIN") return undefined;
    let updatedCenter: CallCenter | undefined = undefined;
    
    // Update Call Center status
    setAllCallCentersState(prevAll => {
      const newAll = prevAll.map(cc => {
        if (cc.id === callCenterId) {
          updatedCenter = { ...cc, status: status };
          return updatedCenter;
        }
        return cc;
      });
      return newAll;
    });

    // If call center is set to inactive, update associated bots
    if (status === "inactive") {
      MOCK_BOTS.forEach(bot => {
        if (bot.callCenterId === callCenterId) {
          bot.status = "inactive"; 
        }
      });
      // In a real app, you'd also need to trigger an update to the component
      // that displays bots if it's currently rendered and showing these bots.
      // For this mock setup, MOCK_BOTS is modified directly.
      // If BotTrackingPage is open, it might need a way to re-fetch or re-filter.
    }
    
    return updatedCenter;
  };


  return (
    <CallCenterContext.Provider value={{ 
        callCenters: accessibleCallCenters, 
        allCallCenters: allCallCentersState,
        currentCallCenter, 
        setCurrentCallCenterById, 
        addCallCenter, 
        updateCallCenter,
        updateCallCenterBillingConfig,
        updateCallCenterStatus,
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

