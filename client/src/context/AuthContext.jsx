import React, { createContext, useState, useEffect, useContext } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('chat_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const userData = await api.getMe(token);
          setUser(userData);
        } catch (err) {
          console.error('Failed to load user info', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (username, password) => {
    const data = await api.loginUser(username, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('chat_token', data.token);
  };

  const register = async (userData) => {
    const data = await api.registerUser(userData);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('chat_token', data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('chat_token');
  };

  const updateProfile = async (profileData) => {
    const updatedUser = await api.updateProfile(token, profileData);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
