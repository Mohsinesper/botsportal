
"use client";

import type { User, UserRole } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { MOCK_USERS } from "@/lib/mock-data";
import { addAuditLog } from "@/services/audit-log-service"; // Import the service

interface AuthContextType {
  currentUser: User | null;
  setCurrentUserById: (id: string | null) => void;
  users: User[];
  addUser: (newUser: Omit<User, "id">) => User;
  updateUser: (updatedUser: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = "callFlowAi_users";
const CURRENT_USER_ID_STORAGE_KEY = "callFlowAi_currentUserId";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      const storedCurrentUserId = localStorage.getItem(CURRENT_USER_ID_STORAGE_KEY);

      let initialUsers = MOCK_USERS;
      if (storedUsers) {
        try {
          const parsedUsers = JSON.parse(storedUsers);
          if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
            initialUsers = parsedUsers;
          }
        } catch (e) {
          console.warn("Failed to parse stored users, using default.", e);
        }
      }
      setUsers(initialUsers);

      if (storedCurrentUserId && storedCurrentUserId !== "null") {
        const foundUser = initialUsers.find(u => u.id === storedCurrentUserId);
        setCurrentUser(foundUser || initialUsers[0] || null);
      } else if (initialUsers.length > 0) {
        setCurrentUser(initialUsers[0]); // Default to the first mock user
        localStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, initialUsers[0].id);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Error accessing localStorage during auth init:", error);
      setUsers(MOCK_USERS);
      if (MOCK_USERS.length > 0) {
        setCurrentUser(MOCK_USERS[0]);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      } catch (error) {
        console.error("Error saving users to localStorage:", error);
      }
    }
  }, [users, isLoading]);

  const setCurrentUserById = (id: string | null) => {
    let oldUser: User | null = null;
    if (id === null) {
      oldUser = currentUser;
      setCurrentUser(null);
      try {
        localStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, "null");
      } catch (error) {
        console.error("Error clearing current user ID in localStorage:", error);
      }
    } else {
        const userToSet = users.find(u => u.id === id);
        if (userToSet) {
            oldUser = currentUser;
            setCurrentUser(userToSet);
            try {
                localStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, id);
            } catch (error) {
                console.error("Error saving current user ID to localStorage:", error);
            }
        }
    }
    // Log user switch / logout / login
    if (oldUser && id === null) { // Logout
        addAuditLog({
            action: "USER_LOGOUT",
            userId: oldUser.id,
            userName: oldUser.name || oldUser.email,
            details: { message: `User ${oldUser.name || oldUser.email} logged out (switched to no user).` }
        });
    } else if (id !== null && oldUser?.id !== id) { // Login or switch
        const newUser = users.find(u => u.id === id);
        if (newUser) {
             addAuditLog({
                action: "USER_LOGIN_SWITCH",
                userId: newUser.id,
                userName: newUser.name || newUser.email,
                details: { message: `User switched to ${newUser.name || newUser.email}. Previous: ${oldUser ? (oldUser.name || oldUser.email) : 'None'}` }
            });
        }
    }
  };

  const addUser = (newUserData: Omit<User, "id">): User => {
    const newUser: User = {
      ...newUserData,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setUsers(prev => {
      const updatedUsers = [...prev, newUser];
       if (prev.length === 0 || !currentUser) { 
            setCurrentUser(newUser);
            try {
                localStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, newUser.id);
            } catch (error) {
                 console.error("Error setting first user in localStorage:", error);
            }
        }
      return updatedUsers;
    });

    if (currentUser) { // Logged by the admin performing the action
        addAuditLog({
            action: "USER_CREATED",
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email,
            details: { createdUserId: newUser.id, createdUserName: newUser.name, createdUserEmail: newUser.email, role: newUser.role }
        });
    }
    return newUser;
  };

  const updateUser = (updatedUserData: User) => {
    let oldUserDetails: User | undefined;
    setUsers(prevUsers => {
        oldUserDetails = prevUsers.find(user => user.id === updatedUserData.id);
        return prevUsers.map(user => user.id === updatedUserData.id ? updatedUserData : user);
    });
    if (currentUser?.id === updatedUserData.id) {
      setCurrentUser(updatedUserData);
    }

    if (currentUser && oldUserDetails) { // Logged by the admin performing the action
        const changes: Record<string, any> = {};
        if (oldUserDetails.name !== updatedUserData.name) changes.name = { old: oldUserDetails.name, new: updatedUserData.name };
        if (oldUserDetails.email !== updatedUserData.email) changes.email = { old: oldUserDetails.email, new: updatedUserData.email };
        if (oldUserDetails.role !== updatedUserData.role) changes.role = { old: oldUserDetails.role, new: updatedUserData.role };
        if (JSON.stringify(oldUserDetails.assignedCallCenterIds) !== JSON.stringify(updatedUserData.assignedCallCenterIds)) {
            changes.assignedCallCenterIds = { old: oldUserDetails.assignedCallCenterIds, new: updatedUserData.assignedCallCenterIds };
        }

        addAuditLog({
            action: "USER_UPDATED",
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email,
            details: { updatedUserId: updatedUserData.id, updatedUserName: updatedUserData.name, changes }
        });
    }
  };


  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUserById, users, addUser, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
