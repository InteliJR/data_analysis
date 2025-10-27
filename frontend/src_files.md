# src\App.tsx

"""
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
"""

# src\main.tsx

"""
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
"""

# src\routes.tsx

"""
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Pages
import Login from '@/pages/Login';
import Products from '@/pages/Products';
import RawMaterials from '@/pages/RawMaterials';
import Taxes from '@/pages/Taxes';
import Freights from '@/pages/Freights';
import FixedCosts from '@/pages/FixedCosts';
import Users from '@/pages/Users';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

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
            path: 'premissas',
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
"""

# src\api\auth.ts

"""
import { apiClient } from './client';
import type { User } from '@/types/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  role?: 'ADMIN' | 'COMERCIAL' | 'LOGISTICA' | 'IMPOSTO';
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
};

export const logout = async (refreshToken: string): Promise<void> => {
  await apiClient.post('/auth/logout', { refreshToken });
};

export const refreshToken = async (
  data: RefreshTokenRequest
): Promise<RefreshTokenResponse> => {
  const response = await apiClient.post<RefreshTokenResponse>(
    '/auth/refresh',
    data
  );
  return response.data;
};

export const register = async (data: RegisterRequest): Promise<User> => {
  const response = await apiClient.post<User>('/auth/register', data);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};
"""

# src\api\client.ts

"""
import axios from 'axios';
import { API_URL } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor para adicionar token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor para tratar erros
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado - tentar refresh ou fazer logout
      const refreshToken = useAuthStore.getState().refreshToken;
      
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          
          useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(error.config);
        } catch {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }
    
    return Promise.reject(error);
  }
);
"""

# src\components\common\Button.tsx

"""
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-600': variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500': variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600': variant === 'danger',
            'hover:bg-gray-100 text-gray-700': variant === 'ghost',
            'h-9 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-11 px-6 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
"""

# src\components\common\CurrencyInput.tsx

"""
import { forwardRef } from 'react';
import { Input } from './Input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  currency?: 'BRL' | 'USD' | 'EUR';
  onChange?: (value: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ label, error, currency = 'BRL', onChange, value, ...props }, ref) => {
    const symbols = { BRL: 'R$', USD: '$', EUR: '€' };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '');
      const numberValue = parseInt(rawValue || '0') / 100;
      onChange?.(numberValue);
    };
    
    const formatValue = (val: string | number | readonly string[] | undefined) => {
      if (!val) return '';
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };
    
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {symbols[currency]}
          </span>
          <Input
            ref={ref}
            type="text"
            value={formatValue(value)}
            onChange={handleChange}
            className="pl-12"
            {...props}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
"""

# src\components\common\EmptyState.tsx

"""
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
"""

# src\components\common\Input.tsx

"""
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-600',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
"""

# src\components\common\LoadingSpinner.tsx

"""
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 
        className={cn(
          'animate-spin text-primary-600',
          {
            'h-4 w-4': size === 'sm',
            'h-8 w-8': size === 'md',
            'h-12 w-12': size === 'lg',
          },
          className
        )} 
      />
    </div>
  );
}
"""

# src\components\layout\Layout.tsx

"""
// src/components/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
// Você pode importar seu Header e Sidebar aqui quando eles estiverem prontos
// import { Header } from './Header';
// import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex h-screen">
      {/* <Sidebar /> */}
      <div className="flex-1 flex flex-col">
        {/* <Header /> */}
        <main className="flex-1 p-6">
          <Outlet /> {/* As páginas (Products, Users, etc.) serão renderizadas aqui */}
        </main>
      </div>
    </div>
  );
}
"""

# src\components\layout\ProtectedRoute.tsx

"""
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/api';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
}
"""

# src\lib\constants.ts

"""
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  COMERCIAL: 'COMERCIAL',
  LOGISTICA: 'LOGISTICA',
  IMPOSTO: 'IMPOSTO',
} as const;

export const CURRENCIES = [
  { value: 'BRL', label: 'Real (R$)' },
  { value: 'USD', label: 'Dólar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
];

export const MEASUREMENT_UNITS = [
  { value: 'KG', label: 'Quilograma (KG)' },
  { value: 'G', label: 'Grama (G)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'ML', label: 'Mililitro (ML)' },
  { value: 'M', label: 'Metro (M)' },
  { value: 'CM', label: 'Centímetro (CM)' },
  { value: 'UN', label: 'Unidade (UN)' },
  { value: 'CX', label: 'Caixa (CX)' },
  { value: 'PC', label: 'Peça (PC)' },
];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};
"""

# src\lib\utils.ts

"""
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export function formatDecimal(value: number, decimals: number = 2): string {
  return value.toFixed(decimals).replace('.', ',');
}
"""

# src\lib\validations.ts

"""
import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  role: z.enum(['ADMIN', 'COMERCIAL', 'LOGISTICA', 'IMPOSTO']).optional(),
});

// Tax
export const taxItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  rate: z.number().min(0).max(100),
  recoverable: z.boolean().default(false),
});

export const taxSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  items: z.array(taxItemSchema).min(1, 'Adicione pelo menos 1 item'),
});

// Freight
export const freightTaxSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  rate: z.number().min(0).max(100),
});

export const freightSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  paymentTerm: z.number().int().positive(),
  unitPrice: z.number().positive(),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  additionalCosts: z.number().min(0),
  freightTaxes: z.array(freightTaxSchema),
});

// Raw Material
export const rawMaterialSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  measurementUnit: z.enum(['KG', 'G', 'L', 'ML', 'M', 'CM', 'UN', 'CX', 'PC']),
  inputGroup: z.string().optional(),
  paymentTerm: z.number().int().positive(),
  acquisitionPrice: z.number().positive(),
  currency: z.enum(['BRL', 'USD', 'EUR']),
  priceConvertedBrl: z.number().positive(),
  additionalCost: z.number().min(0),
  taxId: z.string().uuid(),
  freightId: z.string().uuid(),
});

// Product
export const productRawMaterialSchema = z.object({
  rawMaterialId: z.string().uuid(),
  quantity: z.number().positive(),
});

export const productSchema = z.object({
  code: z.string().regex(/^\d+$/, 'Código deve conter apenas números'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  fixedCostId: z.string().uuid().optional(),
  rawMaterials: z.array(productRawMaterialSchema).min(1, 'Adicione pelo menos 1 matéria-prima'),
});

// Fixed Cost
export const fixedCostSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  code: z.string().optional(),
  personnelExpenses: z.number().min(0),
  generalExpenses: z.number().min(0),
  proLabore: z.number().min(0),
  depreciation: z.number().min(0),
  considerationPercentage: z.number().min(0).max(100),
  salesVolume: z.number().positive(),
});

// User
export const userSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(3).max(100),
  password: z.string().min(8).optional(),
  role: z.enum(['ADMIN', 'COMERCIAL', 'LOGISTICA', 'IMPOSTO']),
  isActive: z.boolean(),
});
"""

# src\pages\Login.tsx

"""
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

import { login } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, setUser, setTokens } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);

    try {
      const response = await login(data);

      setUser(response.user);
      setTokens(response.accessToken, response.refreshToken);

      toast.success(`Bem-vindo(a), ${response.user.name}!`);
      navigate("/", { replace: true });
    } catch (error: any) {
      const message = error.response?.data?.message || "Erro ao fazer login";

      if (error.response?.status === 401) {
        toast.error("Credenciais inválidas ou usuário inativo");
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Logo Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12">
        <div className="text-center">
          <div className="w-64 h-64 mx-auto mb-8">
            {/* Placeholder para logo */}
            <div className="w-full h-full bg-white/10 rounded-3xl flex items-center justify-center">
              <span className="text-white text-6xl font-bold">LOGO</span>
            </div>
          </div>
          <h1 className="text-white text-4xl font-bold mb-4">
            Sistema de Precificação
          </h1>
          <p className="text-blue-100 text-lg">
            Gestão completa de custos e produtos
          </p>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-3xl font-bold">L</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Sistema de Precificação
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Acesse sua conta
              </h2>
              <p className="text-gray-600">
                Digite suas credenciais para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Usuário (Email)"
                type="email"
                placeholder="seu@email.com"
                error={errors.email?.message}
                disabled={isLoading}
                {...register("email")}
              />

              <div className="relative">
                <Input
                  label="Senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  disabled={isLoading}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Entrando...</span>
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Problemas para acessar?</p>
              <p>Entre em contato com o administrador</p>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2025 Sistema de Precificação. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
"""

# src\pages\Products.tsx

"""
// src/pages/Products.tsx
export default function Products() {
  return (
    <div>
      <h1>Produtos</h1>
      <p>Página em construção...</p>
    </div>
  );
}
"""

# src\store\authStore.ts

"""
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setTokens: (accessToken, refreshToken) => 
        set({ accessToken, refreshToken }),
      
      logout: () => 
        set({ 
          user: null, 
          accessToken: null, 
          refreshToken: null, 
          isAuthenticated: false 
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
"""

# src\types\api.ts

"""
// ============================================
// BASE TYPES
// ============================================

export type UserRole = 'ADMIN' | 'COMERCIAL' | 'LOGISTICA' | 'IMPOSTO';
export type Currency = 'BRL' | 'USD' | 'EUR';
export type MeasurementUnit = 'KG' | 'G' | 'L' | 'ML' | 'M' | 'CM' | 'UN' | 'CX' | 'PC';

// ============================================
// PAGINATION & COMMON
// ============================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ============================================
// USER
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TAX (PREMISSAS)
// ============================================

export interface TaxItem {
  id: string;
  taxId: string;
  name: string;
  rate: number;
  recoverable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tax {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  taxItems: TaxItem[];
}

// Request types for Tax
export interface CreateTaxItemInput {
  name: string;
  rate: number;
  recoverable: boolean;
}

export interface UpdateTaxItemInput extends CreateTaxItemInput {
  id?: string; // Se tem ID, atualiza; se não tem, cria novo
}

export interface CreateTaxRequest {
  name: string;
  description?: string;
  items: CreateTaxItemInput[];
}

export interface UpdateTaxRequest {
  name?: string;
  description?: string;
  items?: UpdateTaxItemInput[];
}

// ============================================
// FREIGHT
// ============================================

export interface FreightTax {
  id: string;
  freightId: string;
  name: string;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

export interface Freight {
  id: string;
  name: string;
  description?: string;
  paymentTerm: number;
  unitPrice: number;
  currency: Currency;
  additionalCosts: number;
  createdAt: string;
  updatedAt: string;
  freightTaxes: FreightTax[];
}

// Request types for Freight
export interface CreateFreightTaxInput {
  name: string;
  rate: number;
}

export interface UpdateFreightTaxInput extends CreateFreightTaxInput {
  id?: string;
}

export interface CreateFreightRequest {
  name: string;
  description?: string;
  paymentTerm: number;
  unitPrice: number;
  currency: Currency;
  additionalCosts: number;
  freightTaxes: CreateFreightTaxInput[];
}

export interface UpdateFreightRequest {
  name?: string;
  description?: string;
  paymentTerm?: number;
  unitPrice?: number;
  currency?: Currency;
  additionalCosts?: number;
  freightTaxes?: UpdateFreightTaxInput[];
}

// ============================================
// RAW MATERIAL
// ============================================

export interface RawMaterialChangeLog {
  id: string;
  rawMaterialId: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
  changedByUser?: {
    name: string;
    email: string;
  };
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  description?: string;
  measurementUnit: MeasurementUnit;
  inputGroup?: string;
  paymentTerm: number;
  acquisitionPrice: number;
  currency: Currency;
  priceConvertedBrl: number;
  additionalCost: number;
  taxId: string;
  freightId: string;
  createdAt: string;
  updatedAt: string;
  tax?: Tax;
  freight?: Freight;
  changeLogs?: RawMaterialChangeLog[];
}

// Request types for Raw Material
export interface CreateRawMaterialRequest {
  code: string;
  name: string;
  description?: string;
  measurementUnit: MeasurementUnit;
  inputGroup?: string;
  paymentTerm: number;
  acquisitionPrice: number;
  currency: Currency;
  priceConvertedBrl: number;
  additionalCost: number;
  taxId: string;
  freightId: string;
}

export interface UpdateRawMaterialRequest {
  code?: string;
  name?: string;
  description?: string;
  measurementUnit?: MeasurementUnit;
  inputGroup?: string;
  paymentTerm?: number;
  acquisitionPrice?: number;
  currency?: Currency;
  priceConvertedBrl?: number;
  additionalCost?: number;
  taxId?: string;
  freightId?: string;
}

// ============================================
// PRODUCT
// ============================================

export interface ProductRawMaterial {
  productId: string;
  rawMaterialId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  rawMaterial?: RawMaterial;
}

export interface ProductCalculations {
  rawMaterialsSubtotal: number;
  taxesTotal: number;
  freightTotal: number;
  additionalCostsTotal: number;
  priceWithoutTaxesAndFreight: number;
  priceWithTaxesAndFreight: number;
  fixedCostOverhead?: number;
  finalPriceWithOverhead?: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  creatorId: string;
  fixedCostId?: string;
  priceWithoutTaxesAndFreight?: number;
  priceWithTaxesAndFreight?: number;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  fixedCost?: FixedCost;
  productRawMaterials?: ProductRawMaterial[];
  calculations?: ProductCalculations;
}

// Request types for Product
export interface ProductRawMaterialInput {
  rawMaterialId: string;
  quantity: number;
}

export interface CreateProductRequest {
  code: string;
  name: string;
  description?: string;
  fixedCostId?: string;
  rawMaterials: ProductRawMaterialInput[];
}

export interface UpdateProductRequest {
  code?: string;
  name?: string;
  description?: string;
  fixedCostId?: string;
  rawMaterials?: ProductRawMaterialInput[];
}

// Para preview de preço sem criar produto
export interface CalculatePriceRequest {
  rawMaterials: ProductRawMaterialInput[];
  fixedCostId?: string;
}

// ============================================
// FIXED COST
// ============================================

export interface FixedCost {
  id: string;
  description: string;
  code?: string;
  personnelExpenses: number;
  generalExpenses: number;
  proLabore: number;
  depreciation: number;
  totalCost: number;
  considerationPercentage: number;
  salesVolume: number;
  overheadPerUnit: number;
  calculationDate: string;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
  _count?: {
    products: number;
  };
}

// Request types for Fixed Cost
export interface CreateFixedCostRequest {
  description: string;
  code?: string;
  personnelExpenses: number;
  generalExpenses: number;
  proLabore: number;
  depreciation: number;
  considerationPercentage: number;
  salesVolume: number;
}

export interface UpdateFixedCostRequest {
  description?: string;
  code?: string;
  personnelExpenses?: number;
  generalExpenses?: number;
  proLabore?: number;
  depreciation?: number;
  considerationPercentage?: number;
  salesVolume?: number;
}

// Para funcionalidade "Gerar Overhead"
export interface CalculateOverheadRequest {
  applyToProducts: boolean;
  productIds?: string[]; // Se vazio e applyToProducts=true, aplica a todos
}

export interface OverheadCalculationResult {
  fixedCost: {
    id: string;
    description: string;
    totalCost: number;
    overheadPerUnit: number;
  };
  affectedProducts: Array<{
    id: string;
    code: string;
    name: string;
    priceBeforeOverhead: number;
    overheadApplied: number;
    priceAfterOverhead: number;
    updated: boolean;
  }>;
  summary: {
    totalProductsAffected: number;
    totalOverheadDistributed: number;
    applied: boolean;
  };
}

// ============================================
// AUTOCOMPLETE & SEARCH
// ============================================

export interface AutocompleteResult<T> {
  results: T[];
  total: number;
}

export interface SearchParams {
  q: string; // Query de busca
  limit?: number;
  fields?: string; // Campos a retornar, separados por vírgula
}

// ============================================
// EXPORT
// ============================================

export interface ExportRequest {
  format: 'csv';
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  includeDetails?: boolean;
  delimiter?: ',' | ';';
  encoding?: 'utf-8' | 'latin1';
  includeHeaders?: boolean;
}

// ============================================
// USER MANAGEMENT
// ============================================

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateProfileRequest {
  name?: string;
  password?: string;
}
"""
