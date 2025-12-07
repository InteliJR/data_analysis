import type { User } from '@/types/user';
import { UserTableRow } from './UserTableRow';
import { TableHeaderCell } from '@/components/common/ProductTableHeaderCell';

interface UsersTableProps {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

export function UsersTable({ users, onEditUser, onDeleteUser }: UsersTableProps) {
  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <TableHeaderCell>Usuário</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Função</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                onEdit={() => onEditUser(user)}
                onDelete={() => onDeleteUser(user)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}