import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const RegisterOnboardingGuard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        setIsAuthed(!!data.session);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    check();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setIsAuthed(!!session);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  if (!isAuthed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RegisterOnboardingGuard;
