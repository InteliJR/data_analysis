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
      {/* ===========================================
        Logo Section (Desktop)
        - 'hidden' (escondido por padrão)
        - 'lg:flex' (exibido como flex em telas 'lg' 1024px ou maiores)
        ===========================================
      */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12">
        <div className="text-center">
          {/* LOGO GRANDE AJUSTADA:
            - Removido o 'w-64 h-64' fixo.
            - 'w-full' e 'max-w-lg' (512px) fazem ela ser grande e responsiva.
            - 'mb-10' para dar mais espaço.
          */}
          <div className="rounded-3xl bg-gray-100/30 p-4 pb-6 mb-6">
              <img
                src="/logo_symbol_and_letters_light.png"
                alt="Logo Sistema de Precificação"
                className="w-full max-w-lg mx-auto"
              />
          </div>
          <h1 className="text-white text-4xl font-bold mb-4">
            Sistema de Precificação
          </h1>
          <p className="text-blue-100 text-lg">
            Gestão completa de custos e produtos
          </p>
        </div>
      </div>

      {/* ===========================================
        Login Form Section (Mobile e Desktop)
        - 'flex-1' (ocupa o espaço restante, 100% em mobile, 50% em desktop)
        ===========================================
      */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo (como no seu screenshot)
            - 'lg:hidden' (exibido apenas em telas menores que 'lg' 1024px)
          */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-4  rounded-2xl flex items-center justify-center p-3">
              <img
                src="/logo_symbol.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Sistema de Precificação
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-8 text-center lg:text-left">
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