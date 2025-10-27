// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import {
  Boxes,
  Component,
  Landmark,
  Truck,
  PieChart,
  Users,
  Building,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/api';

const navItems = [
  {
    label: 'Produtos',
    path: '/produtos',
    icon: Boxes,
    allowedRoles: ['ADMIN', 'COMERCIAL'],
  },
  {
    label: 'Matérias-primas',
    path: '/materias-primas',
    icon: Component,
    allowedRoles: ['ADMIN', 'COMERCIAL', 'IMPOSTO'],
  },
  {
    label: 'Premissas',
    path: '/premissas',
    icon: Landmark,
    allowedRoles: ['ADMIN', 'IMPOSTO', 'COMERCIAL'],
  },
  {
    label: 'Frete',
    path: '/frete',
    icon: Truck,
    allowedRoles: ['ADMIN', 'LOGISTICA'],
  },
  {
    label: 'Custos Fixos',
    path: '/custos-fixos',
    icon: PieChart,
    allowedRoles: ['ADMIN'],
  },
  {
    label: 'Usuários',
    path: '/usuarios',
    icon: Users,
    allowedRoles: ['ADMIN'],
  },
];

export function Sidebar() {
  const { user } = useAuthStore();

  const accessibleNavItems = navItems.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  const baseLinkClass =
    'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-700';
  const activeLinkClass = 'bg-gray-700 text-white';

  return (
    <aside className="hidden w-64 flex-col border-r bg-gray-800 p-4 md:flex">
      <div className="flex h-16 items-center gap-2 px-3 text-white">
        <Building className="h-6 w-6" />
        <span className="text-xl font-semibold">Precificação</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 mt-4">
        {accessibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(baseLinkClass, isActive && activeLinkClass)
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}