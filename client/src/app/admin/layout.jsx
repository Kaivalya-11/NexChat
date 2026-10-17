import React from 'react';
import AdminProviders from './AdminProviders';

export const metadata = {
  title: "NexChat — Admin Dashboard",
  description: "Administrative console and platform management for NexChat",
};

export default function AdminLayout({ children }) {
  return (
    <AdminProviders>
      {children}
    </AdminProviders>
  );
}

