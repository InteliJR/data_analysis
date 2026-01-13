import { createBrowserRouter, Navigate } from 'react-router-dom';

import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Pages
import Login from '@/pages/Login';
import Products from '@/pages/Products';
import RawMaterials from '@/pages/RawMaterials';
import Freights from '@/pages/Freights';
import FixedCosts from '@/pages/FixedCosts';
import Users from '@/pages/Users';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
import Taxes from '@/pages/Taxes';
import ProductGroups from '@/pages/ProductGroups';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Navigate to="/produtos" replace />,
          },
          {
            path: 'produtos',
            element: <ProtectedRoute allowedRoles={['ADMIN', 'COMERCIAL']} />,
            children: [
              {
                index: true,
                element: <Products />,
              },
            ],
          },
          {
            path: 'grupos',
            element: <ProtectedRoute allowedRoles={['ADMIN', 'COMERCIAL']} />,
            children: [
              {
                index: true,
                element: <ProductGroups />,
              },
            ],
          },
          {
            path: 'materias-primas',
            element: <ProtectedRoute allowedRoles={['ADMIN', 'COMERCIAL', 'IMPOSTO']} />,
            children: [
              {
                index: true,
                element: <RawMaterials />,
              },
            ],
          },
          {
            path: 'impostos',
            element: <ProtectedRoute allowedRoles={['ADMIN', 'IMPOSTO', 'COMERCIAL']} />,
            children: [
              {
                index: true,
                element: <Taxes />,
              },
            ],
          },
          {
            path: 'frete',
            element: <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICA']} />,
            children: [
              {
                index: true,
                element: <Freights />,
              },
            ],
          },
          {
            path: 'custos-fixos',
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            children: [
              {
                index: true,
                element: <FixedCosts />,
              },
            ],
          },
          {
            path: 'usuarios',
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            children: [
              {
                index: true,
                element: <Users />,
              },
            ],
          },
          {
            path: 'perfil',
            children: [
              {
                index: true,
                element: <Profile />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);