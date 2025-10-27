// src/components/layout/Header.tsx
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { logout as apiLogout } from '@/api/auth';
import { Button } from '@/components/common/Button';

export function Header() {
  const { user, logout: storeLogout, refreshToken } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        // Notifica o backend para invalidar o token
        await apiLogout(refreshToken);
      }
    } catch (error) {
      console.error('Falha ao fazer logout no servidor:', error);
    } finally {
      // Limpa o estado local e redireciona
      storeLogout();
      navigate('/login');
    }
  };

  return (
    <header className="flex h-16 items-center border-b bg-white px-6">
      {/* Futuramente, você pode usar um store/context 
        para exibir o título da página aqui 
      */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold"></h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>

        {/* NOTA: Você precisará de um componente DropdownMenu. 
          Enquanto não o cria, pode usar um botão de Link simples.
          Vou usar um botão simples por enquanto.
        */}
        <Button variant="ghost" size="sm" asChild>
          <Link to="/perfil">
            <User className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          title="Sair"
        >
          <LogOut className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </header>
  );
}