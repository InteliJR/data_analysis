import type { User } from "@/types/user";
import { getUserStatusText, getUserStatusVariant } from "@/types/user";
import { Text } from "@/components/common/Text";
import { StatusBadge } from "@/components/common/StatusBadge";
import { IconButton } from "@/components/common/IconButton";
import { FiEdit, FiUserX } from "react-icons/fi";

interface UserTableRowProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
}

export function UserTableRow({ user, onEdit, onDelete }: UserTableRowProps) {
  return (
    <tr className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
      {/* Usuário (Email) */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div>
          <Text variant="body" className="font-medium text-gray-900">
            {user.name}
          </Text>
          <Text variant="caption" className="text-gray-500">
            {user.email}
          </Text>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge
          status={getUserStatusText(user.isActive)}
          variant={getUserStatusVariant(user.isActive)}
        />
      </td>

      {/* Função */}
      <td className="px-4 py-3 whitespace-nowrap">
        <Text variant="body">{user.role}</Text>
      </td>

      {/* Ação */}
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <div className="flex items-center gap-2">
          <IconButton
            icon={FiEdit}
            aria-label="Editar usuário"
            title="Editar usuário"
            onClick={onEdit}
            className="hover:bg-blue-100 hover:text-blue-600 cursor-pointer"
          />
          <IconButton
            title="Desativar usuário"
            icon={FiUserX}
            aria-label="Desativar usuário"
            onClick={onDelete}
            className="hover:bg-red-100 hover:text-red-600 cursor-pointer"
          />
        </div>
      </td>
    </tr>
  );
}
