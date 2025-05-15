import { ReactNode } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type AppWrapperProps = {
  children: ReactNode;
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function AppWrapper({ children }: AppWrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <MainLayout>{children}</MainLayout>
      </AuthGuard>
    </QueryClientProvider>
  );
}
