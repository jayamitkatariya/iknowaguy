"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function useRequireAuth() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const apiKey = localStorage.getItem('api_key');
        if (!apiKey) {
          router.push("/login?redirect=" + encodeURIComponent(pathname));
          return;
        }
        if (cancelled) return;
        const authDataStr = localStorage.getItem('auth_data');
        if (authDataStr) {
          try {
            const authData = JSON.parse(authDataStr);
            setUser(authData.user || { email: 'User' });
          } catch {
            setUser({ email: 'User' });
          }
        } else {
          setUser({ email: 'User' });
        }
        setLoading(false);
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
    return () => { cancelled = true; };
  }, [router, pathname]);

  const signOut = () => {
    localStorage.removeItem('api_key');
    localStorage.removeItem('auth_data');
    router.push("/");
  };

  return { loading, user, signOut };
}
