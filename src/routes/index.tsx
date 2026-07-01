import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Categories from '@/pages/Categories';
import Settings from '@/pages/Settings';
import MainLayout from '@/components/layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  // ── Public auth routes ────────────────────────────────────────────────
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },

  // ── Protected layout routes ───────────────────────────────────────────
  // ProtectedRoute wraps MainLayout; MainLayout renders <Outlet /> for children
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/transactions',
        element: <Transactions />,
      },
      {
        path: '/categories',
        element: <Categories />,
      },
      {
        path: '/settings',
        element: <Settings />,
      },
    ],
  },

  // ── Redirects ─────────────────────────────────────────────────────────
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
