import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import './index.css';
import App from './App';

// ── React Query client ────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// ── Root render ───────────────────────────────────────────────────────────
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          theme="dark"
          richColors={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-graphite)',
              border: '1px solid var(--border-default)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              borderRadius: '10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
