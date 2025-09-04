// @ts-nocheck
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import supabase from "@/supabaseClient";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setReady(true);
    });
  }, []);

  if (!ready) return null; // or a spinner
  return authed ? children : <Navigate to="/login" replace />;
}