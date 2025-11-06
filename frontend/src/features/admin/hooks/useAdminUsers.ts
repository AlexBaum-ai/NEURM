import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import * as adminApi from '../api/userManagement';
import type {
  UserFilters,
  SuspendUserPayload,
  BanUserPayload,
  UpdateUserRolePayload,
  SendMessagePayload,
  ExportUsersPayload,
} from '../types';

// Query keys
export const adminQueryKeys = {
  users: (filters: UserFilters, page: number, limit: number) =>
    ['admin', 'users', filters, page, limit] as const,
  userDetail: (userId: string) => ['admin', 'users', userId] as const,
  userActivity: (userId: string) => ['admin', 'users', userId, 'activity'] as const,
  userContent: (userId: string) => ['admin', 'users', userId, 'content'] as const,
  userReports: (userId: string) => ['admin', 'users', userId, 'reports'] as const,
  stats: () => ['admin', 'stats'] as const,
};

// Get users with filters
export const useUsers = (filters: UserFilters = {}, page: number = 1, limit: number = 50) => {
  return useSuspenseQuery({
    queryKey: adminQueryKeys.users(filters, page, limit),
    queryFn: () => adminApi.getUsers(filters, page, limit),
  });
};

// Get user detail
export const useUserDetail = (userId: string) => {
  return useSuspenseQuery({
    queryKey: adminQueryKeys.userDetail(userId),
    queryFn: () => adminApi.getUserDetail(userId),
  });
};

// Get user activity
export const useUserActivity = (userId: string) => {
  return useQuery({
    queryKey: adminQueryKeys.userActivity(userId),
    queryFn: () => adminApi.getUserActivity(userId),
    enabled: !!userId,
  });
};

// Get user content
export const useUserContent = (userId: string) => {
  return useQuery({
    queryKey: adminQueryKeys.userContent(userId),
    queryFn: () => adminApi.getUserContent(userId),
    enabled: !!userId,
  });
};

// Get user reports
export const useUserReports = (userId: string) => {
  return useQuery({
    queryKey: adminQueryKeys.userReports(userId),
    queryFn: () => adminApi.getUserReports(userId),
    enabled: !!userId,
  });
};

// Get admin stats
export const useAdminStats = () => {
  return useQuery({
    queryKey: adminQueryKeys.stats(),
    queryFn: adminApi.getAdminStats,
  });
};

// Update user role mutation
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserRolePayload) => adminApi.updateUserRole(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(variables.userId) });
    },
  });
};

// Verify user email mutation
export const useVerifyUserEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.verifyUserEmail(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(userId) });
    },
  });
};

// Suspend user mutation
export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SuspendUserPayload) => adminApi.suspendUser(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userActivity(variables.userId) });
    },
  });
};

// Unsuspend user mutation
export const useUnsuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.unsuspendUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userActivity(userId) });
    },
  });
};

// Ban user mutation
export const useBanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BanUserPayload) => adminApi.banUser(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userActivity(variables.userId) });
    },
  });
};

// Unban user mutation
export const useUnbanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.unbanUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.userActivity(userId) });
    },
  });
};

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

// Send message to user mutation
export const useSendMessageToUser = () => {
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => adminApi.sendMessageToUser(payload),
  });
};

// Export users
export const useExportUsers = () => {
  return useCallback(async (payload: ExportUsersPayload) => {
    const blob = await adminApi.exportUsers(payload);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = 'users-export-' + today + '.' + payload.format;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);
};
