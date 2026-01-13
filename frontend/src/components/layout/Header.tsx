import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { logout as apiLogout } from '@/api/auth';
import { Button } from '@/components/common/Button';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, logout: storeLogout, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  // Detecta scroll para animar o header
  useEffect(() => {
    const mainElement = document.querySelector('main');

    if (!mainElement) return;

    // Handler que lê diretamente o mainElement.scrollTop (mais robusto)
    const handleScroll = () => {
      setIsScrolled(mainElement.scrollTop > 20);
    };

    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    // inicializa estado (caso já esteja scrolled)
    handleScroll();

    return () => {
      mainElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await apiLogout(refreshToken);
      }
    } catch (error) {
      console.error('Falha ao fazer logout no servidor:', error);
    } finally {
      storeLogout();
      navigate('/login');
    }
  };

  const isProfilePage = location.pathname === '/perfil' || location.pathname === '/profile';

  // Background inline styles garantem rgba + backdrop-filter mesmo sem utilitários específicos de Tailwind
  const bgStyle = isScrolled
    ? {
        backgroundColor: 'rgba(255,255,255,0.70)',
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
      }
    : {
        backgroundColor: 'rgba(255,255,255,0.95)',
        WebkitBackdropFilter: 'blur(6px)',
        backdropFilter: 'blur(6px)',
      };

  return (
    <header
      style={bgStyle}
      className={`
        fixed top-2 right-6 z-50
        flex items-center
        transition-all duration-500 ease-in-out
        rounded-2xl border border-gray-200/50
        ${isScrolled ? 'px-3 py-2 shadow-lg' : 'px-4 py-3 shadow-md'}
        ${isScrolled ? 'backdrop-blur' : 'backdrop-blur'}
        ${isScrolled ? 'gap-0' : 'gap-3'}
      `}
    >
      {/* Informações do Usuário - animar/ocultar sem deixar gap */}
      <div
        aria-hidden={isScrolled}
        className={`
          flex items-center gap-3
          overflow-hidden flex-shrink-0
          transition-all duration-500 ease-in-out
          ${isScrolled ? 'max-w-0 opacity-0 scale-95 p-0 mr-0' : 'max-w-[220px] opacity-100 scale-100'}
        `}
        style={{ minWidth: 0 }} // garante truncation
      >
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-sm font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">
            {user?.name || 'Usuário'}
          </p>
          <p className="text-xs text-gray-500 truncate max-w-[140px]">
            {user?.email || 'email@exemplo.com'}
          </p>
        </div>
      </div>

      {/* Separador apenas quando visível — evita espaço fantasma */}
      {!isScrolled && (
        <div className="w-px h-8 bg-gray-200 transition-opacity duration-300 opacity-100" />
      )}

      {/* Botões de Ação */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className={`
            relative
            transition-all duration-300
            hover:bg-blue-50 hover:scale-110
            ${isProfilePage ? 'bg-blue-100 text-blue-600 shadow-md scale-105' : 'text-gray-600'}
          `}
        >
          <Link to="/perfil" className="relative">
            <User className="h-4 w-4" />
            {isProfilePage && (
              <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          title="Sair"
          className="
            text-gray-600 
            hover:bg-red-50 hover:text-red-600 hover:scale-110
            transition-all duration-300
          "
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
