import { User as UserIcon, Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heading } from '@/components/common/Heading';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ProfileForm } from '@/components/features/profile/ProfileForm';
import { useMeQuery, useUpdateProfileMutation } from '@/api/profile';
import { USER_ROLES } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function Profile() {
  const { data: user, isLoading, isError, refetch } = useMeQuery();
  const updateProfileMutation = useUpdateProfileMutation();

  const handleUpdateProfile = async (data: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      
      // Mensagem de sucesso personalizada
      if (data.newPassword) {
        toast.success('Perfil e senha atualizados com sucesso!');
      } else {
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Erro ao atualizar perfil. Verifique os dados e tente novamente.';
      toast.error(message);
      throw error; // Propaga o erro para o formulário não resetar
    }
  };

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  // Estado de erro
  if (isError || !user) {
    return (
      <div className="flex justify-center items-center h-96">
        <EmptyState
          icon={UserIcon}
          title="Erro ao carregar perfil"
          description="Não foi possível carregar suas informações. Tente novamente."
          action={{
            label: 'Recarregar',
            onClick: () => refetch(),
          }}
        />
      </div>
    );
  }

  const userRole = USER_ROLES[user.role];
  const formattedCreatedAt = format(
    new Date(user.createdAt),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  return (
    <div className="max-w-4xl mx-auto">
      <Heading as="h1" variant="title" className="mb-6">
        Meu Perfil
      </Heading>

      {/* Card de Informações do Usuário */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          {/* Informações */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {user.name}
            </h2>
            <p className="text-gray-600 truncate">{user.email}</p>

            <div className="flex flex-wrap gap-4 mt-4">
              {/* Função */}
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Função:</span>
                <span className="font-medium text-gray-900">
                  {userRole || user.role}
                </span>
              </div>

              {/* Data de Cadastro */}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Membro desde:</span>
                <span className="font-medium text-gray-900">
                  {formattedCreatedAt}
                </span>
              </div>
            </div>

            {/* Badge de Status */}
            <div className="mt-4">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de Edição */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ProfileForm
          user={user}
          onSubmit={handleUpdateProfile}
          isLoading={updateProfileMutation.isPending}
        />
      </div>

      {/* Informações Adicionais */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Sobre a segurança da sua conta</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Use uma senha forte com no mínimo 6 caracteres</li>
              <li>Não compartilhe sua senha com outras pessoas</li>
              <li>Altere sua senha regularmente</li>
              <li>Se suspeitar de acesso não autorizado, altere sua senha imediatamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}