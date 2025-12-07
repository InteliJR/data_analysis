import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Save } from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { User } from '@/types/user';

// ========================================
// Schema de Validação
// ========================================

const profileSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string()
    .email('Email inválido')
    .max(100, 'Email deve ter no máximo 100 caracteres'),
  currentPassword: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: 'Senha atual deve ter no mínimo 6 caracteres',
    }),
  newPassword: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: 'Nova senha deve ter no mínimo 6 caracteres',
    })
    .refine((val) => !val || val.length <= 50, {
      message: 'Nova senha deve ter no máximo 50 caracteres',
    }),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => {
    // Se preencheu nova senha, precisa preencher senha atual
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'Informe a senha atual para alterar a senha',
    path: ['currentPassword'],
  }
).refine(
  (data) => {
    // Se preencheu nova senha, as senhas devem coincidir
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  }
);

type ProfileFormData = z.infer<typeof profileSchema>;

// ========================================
// Props do Componente
// ========================================

interface ProfileFormProps {
  user: User;
  onSubmit: (data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

// ========================================
// Componente
// ========================================

export function ProfileForm({ user, onSubmit, isLoading }: ProfileFormProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');
  const isChangingPassword = !!newPassword;

  const handleFormSubmit = async (data: ProfileFormData) => {
    const payload: {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    } = {};

    // Só envia campos que foram alterados
    if (data.name !== user.name) {
      payload.name = data.name;
    }

    if (data.email !== user.email) {
      payload.email = data.email;
    }

    // Só envia senha se estiver alterando
    if (data.newPassword && data.currentPassword) {
      payload.currentPassword = data.currentPassword;
      payload.newPassword = data.newPassword;
    }

    // Se não houver mudanças, não faz nada
    if (Object.keys(payload).length === 0) {
      return;
    }

    await onSubmit(payload);

    // Limpa campos de senha após sucesso
    reset({
      name: data.name,
      email: data.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Informações Pessoais
        </h3>

        <div>
          <Label htmlFor="name">
            Nome <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            {...register('name')}
            error={errors.name?.message}
            disabled={isLoading}
            placeholder="Digite seu nome"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            Mínimo 3 caracteres, máximo 100 caracteres
          </p>
        </div>

        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            disabled={isLoading}
            placeholder="seu@email.com"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            Máximo 100 caracteres
          </p>
        </div>
      </div>

      {/* Alteração de Senha */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Alterar Senha
        </h3>
        <p className="text-sm text-gray-600">
          Deixe em branco se não deseja alterar a senha
        </p>

        <div>
          <Label htmlFor="currentPassword">Senha Atual</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
              disabled={isLoading}
              placeholder="Digite sua senha atual"
              maxLength={50}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showCurrentPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {isChangingPassword && (
            <p className="text-xs text-gray-500 mt-1">
              Obrigatório ao alterar a senha
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="newPassword">Nova Senha</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              {...register('newPassword')}
              error={errors.newPassword?.message}
              disabled={isLoading}
              placeholder="Digite sua nova senha"
              maxLength={50}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showNewPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Mínimo 6 caracteres, máximo 50 caracteres
          </p>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              disabled={isLoading}
              placeholder="Confirme sua nova senha"
              maxLength={50}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {isChangingPassword && (
            <p className="text-xs text-gray-500 mt-1">
              Deve ser igual à nova senha
            </p>
          )}
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <Button
          type="submit"
          disabled={isLoading || !isDirty}
          className="min-w-[140px]"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </form>
  );
}