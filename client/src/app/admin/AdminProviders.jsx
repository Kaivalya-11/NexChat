"use client";
import React from 'react';
import { AuthProvider } from '../../context/AuthContext';

export default function AdminProviders({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

