import { NavLink } from "react-router-dom";
import {
  Boxes,
  Layers,
  Component,
  Landmark,
  Truck,
  PieChart,
  Users,
} from "lucide-react";
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: "Estruturas",
    path: "/produtos",
    icon: Boxes,
    allowedRoles: ["ADMIN", "COMERCIAL"],
  },
  {
    label: 'Grupos',
    path: '/grupos',
    icon: Layers,
    allowedRoles: ['ADMIN', 'COMERCIAL'],
  },
  {
    label: 'Produtos',
    path: '/materias-primas',
    icon: Component,
    allowedRoles: ["ADMIN", "COMERCIAL", "IMPOSTO"],
  },
  {
    label: "Impostos",
    path: "/impostos",
    icon: Landmark,
    allowedRoles: ["ADMIN", "IMPOSTO", "COMERCIAL"],
  },
  {
    label: "Frete",
    path: "/frete",
    icon: Truck,
    allowedRoles: ["ADMIN", "LOGISTICA"],
  },
  {
    label: "Custos Fixos",
    path: "/custos-fixos",
    icon: PieChart,
    allowedRoles: ["ADMIN"],
  },
  {
    label: "Usuários",
    path: "/usuarios",
    icon: Users,
    allowedRoles: ["ADMIN"],
  },
];

export function Sidebar() {
  const { user } = useAuthStore();

  const accessibleNavItems = navItems.filter(
    (item) => user && item.allowedRoles.includes(user.role)
  );

  return (
    <aside
      className="
        fixed left-4 top-1/2 -translate-y-1/2
        z-50
        flex flex-col 
        w-16 hover:w-52
        bg-gray-900 
        rounded-2xl shadow-2xl 
        py-4
        transition-all duration-300
        overflow-hidden
        group 
      "
    >
      {/* Logo Container */}
      <div className="flex items-center mb-6 px-4">
        {/* Logo - Sempre fixo à esquerda */}
        <div
          className="
            flex-shrink-0 
            h-8 w-8 
            flex items-center justify-center 
            bg-gray-100/90 
            rounded-md 
            p-0.5
          "
        >
          <img
            src="/logo_symbol.png"
            alt="GR Water Logo Symbol"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Texto - Aparece no hover */}
        <span
          className="
            ml-3
            text-lg font-semibold text-white
            whitespace-nowrap 
            opacity-0 
            transition-opacity duration-300 
            group-hover:opacity-100
          "
        >
          GR Water
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex flex-col gap-2 px-2">
        {accessibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "relative flex items-center rounded-xl py-2.5 text-gray-300 transition-all duration-300 hover:bg-gray-700 hover:text-white",
                isActive && "bg-gray-700 text-white shadow-md"
              )
            }
          >
            {/* Container do Ícone - Largura fixa */}
            <div className="flex items-center justify-center w-12 flex-shrink-0">
              <item.icon className="h-5 w-5" />
            </div>

            {/* Texto - Aparece no hover do grupo */}
            <span
              className="
                whitespace-nowrap 
                opacity-0 
                transition-opacity duration-300 
                group-hover:opacity-100
                pr-4
              "
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
