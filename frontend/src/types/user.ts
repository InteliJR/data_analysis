// src/types/user.ts

export type UserRole = "ADMIN" | "COMERCIAL" | "LOGISTICA" | "IMPOSTO";
export type UserStatusText = "Ativo" | "Inativo";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ExportUsersPayload {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  columns?: string[];
}

// Helpers para conversão de status
export function getUserStatusText(isActive: boolean): UserStatusText {
  return isActive ? "Ativo" : "Inativo";
}

export function getUserStatusVariant(isActive: boolean): "success" | "default" {
  return isActive ? "success" : "default";
}
