import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADED':
      return { ...state, user: action.payload, isAuthenticated: true, loading: false };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
      };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return { ...initialState, token: null, loading: false };
    case 'AUTH_ERROR':
      localStorage.removeItem('token');
      return { ...initialState, token: null, loading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from token on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'AUTH_ERROR' });
        return;
      }
      try {
        const res = await api.get('/auth/me');
        dispatch({ type: 'AUTH_LOADED', payload: res.data.user });
      } catch {
        dispatch({ type: 'AUTH_ERROR' });
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
    return res.data;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
    return res.data;
  };

  const logout = () => dispatch({ type: 'LOGOUT' });

  const updateUser = (updates) => dispatch({ type: 'UPDATE_USER', payload: updates });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};