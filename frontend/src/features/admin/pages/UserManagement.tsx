import React, { useState, useMemo } from 'react';
import { Search, Download, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Select } from '@/components/forms/Select';
import { Label } from '@/components/forms/Label';
import UserTable from '../components/UserTable';
import SuspendUserModal from '../components/SuspendUserModal';
import BanUserModal from '../components/BanUserModal';
import SendMessageModal from '../components/SendMessageModal';
import { useUsers, useSuspendUser, useBanUser, useSendMessageToUser, useExportUsers } from '../hooks/useAdminUsers';
import { useDebounce } from '@/hooks/useDebounce';
import type { AdminUser, UserFilters } from '../types';

const UserManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const [suspendModalUser, setSuspendModalUser] = useState<AdminUser | null>(null);
  const [banModalUser, setBanModalUser] = useState<AdminUser | null>(null);
  const [messageModalUser, setMessageModalUser] = useState<AdminUser | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const filters: UserFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      role: roleFilter !== 'all' ? roleFilter as any : undefined,
      status: statusFilter !== 'all' ? statusFilter as any : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [debouncedSearch, roleFilter, statusFilter, dateFrom, dateTo]
  );

  const { data: usersData } = useUsers(filters, currentPage, 50);
  const suspendMutation = useSuspendUser();
  const banMutation = useBanUser();
  const sendMessageMutation = useSendMessageToUser();
  const exportUsers = useExportUsers();

  const handleFilterChange = () => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (roleFilter !== 'all') params.role = roleFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    params.page = '1';
    setSearchParams(params);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = Object.fromEntries(searchParams);
    params.page = page.toString();
    setSearchParams(params);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    await exportUsers({
      format,
      filters,
      selectedUserIds: selectedUsers.length > 0 ? selectedUsers : undefined,
    });
  };

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage users, roles, and account status
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, username..."
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              id="role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="mt-1"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="pending_verification">Pending Verification</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="dateFrom">Registration Date</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="date"
                id="dateFrom"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
              />
              <Input
                type="date"
                id="dateTo"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleFilterChange} size="sm">
            Apply Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setStatusFilter('all');
              setDateFrom('');
              setDateTo('');
              setSearchParams({});
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{selectedUsers.length}</strong> user(s) selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Users ({usersData.total})
            </h2>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>

          <UserTable
            users={usersData.users}
            currentPage={currentPage}
            totalPages={usersData.totalPages}
            onPageChange={handlePageChange}
            onSuspendUser={setSuspendModalUser}
            onBanUser={setBanModalUser}
            onSendMessage={setMessageModalUser}
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
          />
        </div>
      </div>

      {suspendModalUser && (
        <SuspendUserModal
          user={suspendModalUser}
          isOpen={true}
          onClose={() => setSuspendModalUser(null)}
          onSuspend={async (payload) => {
            await suspendMutation.mutateAsync(payload);
          }}
        />
      )}

      {banModalUser && (
        <BanUserModal
          user={banModalUser}
          isOpen={true}
          onClose={() => setBanModalUser(null)}
          onBan={async (payload) => {
            await banMutation.mutateAsync(payload);
          }}
        />
      )}

      {messageModalUser && (
        <SendMessageModal
          user={messageModalUser}
          isOpen={true}
          onClose={() => setMessageModalUser(null)}
          onSend={async (payload) => {
            await sendMessageMutation.mutateAsync(payload);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;
