'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ReactNode } from 'react';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register'];

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuth, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // If user is not authenticated and trying to access a protected route
      if (!isAuth && !publicRoutes.includes(pathname as string)) {
        router.push('/login');
      }
      
      // If user is authenticated and trying to access login/register pages
      if (isAuth && publicRoutes.includes(pathname as string)) {
        router.push('/dashboard');
      }
    }
  }, [isAuth, loading, pathname, router]);

  // Show loading state or children
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
