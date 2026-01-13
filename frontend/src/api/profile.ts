import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { User } from '@/types/user';

// ========================================
// Tipagens de Requisição e Resposta
// ========================================

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface GetMeResponse extends User {}

// ========================================
// Funções de API
// ========================================

const ME_QUERY_KEY = 'me';

// GET /users/me - Busca dados do usuário logado
export async function getMe(): Promise<GetMeResponse> {
  const { data } = await apiClient.get('/users/me');
  return data;
}

// PATCH /users/me - Atualiza perfil do usuário logado
export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await apiClient.patch('/users/me', payload);
  return data;
}

// ========================================
// Hooks do React Query
// ========================================

export function useMeQuery() {
  return useQuery({
    queryKey: [ME_QUERY_KEY],
    queryFn: getMe,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1, // Tenta apenas 1 vez em caso de erro
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Atualiza o cache com os novos dados
      queryClient.setQueryData([ME_QUERY_KEY], data);
      
      // Invalida queries relacionadas para garantir sincronização
      queryClient.invalidateQueries({ queryKey: [ME_QUERY_KEY] });
      
      // Se o email foi alterado, pode ser necessário atualizar o auth store
      // Isso depende da implementação do seu authStore
    },
  });
}