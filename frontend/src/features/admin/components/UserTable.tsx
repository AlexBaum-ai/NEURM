import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/common/Badge/Badge';
import UserActionsDropdown from './UserActionsDropdown';
import type { AdminUser } from '../types';

interface UserTableProps {
  users: AdminUser[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSuspendUser: (user: AdminUser) => void;
  onBanUser: (user: AdminUser) => void;
  onSendMessage: (user: AdminUser) => void;
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'moderator':
      return 'secondary';
    default:
      return 'default';
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'suspended':
      return 'warning';
    case 'banned':
      return 'destructive';
    case 'pending_verification':
      return 'default';
    default:
      return 'default';
  }
};

export const UserTable: React.FC<UserTableProps> = ({
  users,
  currentPage,
  totalPages,
  onPageChange,
  onSuspendUser,
  onBanUser,
  onSendMessage,
  selectedUsers,
  onSelectionChange,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="w-4 h-4 rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 rounded border-gray-300"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'displayName',
        header: 'User',
        cell: ({ row }) => (
          <Link
            to={`/admin/users/${row.original.id}`}
            className="flex items-center gap-3 hover:text-primary-600"
          >
            {row.original.avatarUrl ? (
              <img
                src={row.original.avatarUrl}
                alt={row.original.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-semibold">
                  {row.original.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {row.original.displayName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                @{row.original.username}
              </div>
            </div>
          </Link>
        ),
      },
      {
        accessorKey: 'email',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-primary-600"
          >
            Email
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-sm text-gray-700 dark:text-gray-300">{row.original.email}</div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant={getRoleBadgeVariant(row.original.role)}>
            {row.original.role.charAt(0).toUpperCase() + row.original.role.slice(1)}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={getStatusBadgeVariant(row.original.status)}>
            {row.original.status.replace('_', ' ').charAt(0).toUpperCase() + row.original.status.slice(1).replace('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-2 hover:text-primary-600"
          >
            Joined
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {format(new Date(row.original.createdAt), 'MMM d, yyyy')}
          </div>
        ),
      },
      {
        accessorKey: 'lastLoginAt',
        header: 'Last Login',
        cell: ({ row }) => (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {row.original.lastLoginAt
              ? format(new Date(row.original.lastLoginAt), 'MMM d, yyyy')
              : 'Never'}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <UserActionsDropdown
            user={row.original}
            onSuspend={() => onSuspendUser(row.original)}
            onBan={() => onBanUser(row.original)}
            onSendMessage={() => onSendMessage(row.original)}
          />
        ),
        enableSorting: false,
      },
    ],
    [onSuspendUser, onBanUser, onSendMessage]
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      const selectedIds = Object.keys(newSelection)
        .filter((key) => newSelection[key])
        .map((key) => users[parseInt(key)].id);
      onSelectionChange(selectedIds);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-200 dark:border-gray-700">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-4 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
