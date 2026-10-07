"use client";
import React, { useEffect, useState } from 'react';
import App from '../App';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <App />;
}
