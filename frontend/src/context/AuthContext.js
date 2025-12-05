import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // You might want to fetch user data here if the token is present
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    if (data.user) {
      setUser(data.user);
      try { localStorage.setItem('user', JSON.stringify(data.user)); } catch(e) {}
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    try { localStorage.removeItem('user'); } catch(e) {}
  };

  // helper to check roles
  const hasRole = (roles) => {
    if (!user) return false;
    if (!roles) return true;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes((user.role || '').toString().toLowerCase());
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
