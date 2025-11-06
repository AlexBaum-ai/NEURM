import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Activity,
  FileText,
  MessageSquare,
  Briefcase,
  AlertTriangle,
  Edit,
  MailCheck,
  UserCheck,
  UserMinus,
  ShieldX,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/common/Badge/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { Select } from '@/components/forms/Select';
import SuspendUserModal from '../components/SuspendUserModal';
import BanUserModal from '../components/BanUserModal';
import SendMessageModal from '../components/SendMessageModal';
import {
  useUserDetail,
  useUserActivity,
  useUserContent,
  useUserReports,
  useUpdateUserRole,
  useVerifyUserEmail,
  useSuspendUser,
  useUnsuspendUser,
  useBanUser,
  useUnbanUser,
} from '../hooks/useAdminUsers';
import toast from 'react-hot-toast';
import type { UserRole, UserActivityType } from '../types';

const UserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const { data: user } = useUserDetail(userId!);
  const { data: activities } = useUserActivity(userId!);
  const { data: content } = useUserContent(userId!);
  const { data: reports } = useUserReports(userId!);

  const updateRoleMutation = useUpdateUserRole();
  const verifyEmailMutation = useVerifyUserEmail();
  const suspendMutation = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();

  const handleRoleChange = async (newRole: UserRole) => {
    if (!confirm('Are you sure you want to change this user role?')) {
      return;
    }

    try {
      await updateRoleMutation.mutateAsync({ userId: user.id, role: newRole });
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
      console.error(error);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await verifyEmailMutation.mutateAsync(user.id);
      toast.success('Email verified successfully');
    } catch (error) {
      toast.error('Failed to verify email');
      console.error(error);
    }
  };

  const handleUnsuspend = async () => {
    if (!confirm('Are you sure you want to remove the suspension from this user?')) {
      return;
    }

    try {
      await unsuspendMutation.mutateAsync(user.id);
      toast.success('User suspension removed');
    } catch (error) {
      toast.error('Failed to remove suspension');
      console.error(error);
    }
  };

  const handleUnban = async () => {
    if (!confirm('Are you sure you want to unban this user?')) {
      return;
    }

    try {
      await unbanMutation.mutateAsync(user.id);
      toast.success('User unbanned successfully');
    } catch (error) {
      toast.error('Failed to unban user');
      console.error(error);
    }
  };

  const getActivityIcon = (type: UserActivityType) => {
    const iconMap: Record<UserActivityType, React.ReactNode> = {
      account_created: <UserCheck className="w-4 h-4" />,
      email_verified: <MailCheck className="w-4 h-4" />,
      profile_updated: <Edit className="w-4 h-4" />,
      article_published: <FileText className="w-4 h-4" />,
      topic_created: <MessageSquare className="w-4 h-4" />,
      reply_posted: <MessageSquare className="w-4 h-4" />,
      job_applied: <Briefcase className="w-4 h-4" />,
      role_changed: <Shield className="w-4 h-4" />,
      suspended: <UserMinus className="w-4 h-4 text-yellow-500" />,
      ban_applied: <ShieldX className="w-4 h-4 text-red-500" />,
      ban_removed: <UserCheck className="w-4 h-4 text-green-500" />,
    };
    return iconMap[type] || <Activity className="w-4 h-4" />;
  };

  return (
    <div className="container-custom py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/users')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.displayName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'moderator' ? 'secondary' : 'default'}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                <Badge variant={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'warning' : user.status === 'banned' ? 'destructive' : 'default'}>
                  {user.status.replace('_', ' ').charAt(0).toUpperCase() + user.status.slice(1).replace('_', ' ')}
                </Badge>
                {!user.emailVerified && (
                  <Badge variant="warning">Email Not Verified</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!user.emailVerified && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyEmail}
                disabled={verifyEmailMutation.isPending}
              >
                <MailCheck className="w-4 h-4 mr-2" />
                Verify Email
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsMessageModalOpen(true)}>
              <Mail className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <p className="text-gray-900 dark:text-white">{user.email}</p>
                </div>

                {user.location && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <MapPin className="w-4 h-4" />
                      Location
                    </div>
                    <p className="text-gray-900 dark:text-white">{user.location}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    Joined
                  </div>
                  <p className="text-gray-900 dark:text-white">
                    {format(new Date(user.createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Clock className="w-4 h-4" />
                    Last Login
                  </div>
                  <p className="text-gray-900 dark:text-white">
                    {user.lastLoginAt
                      ? format(new Date(user.lastLoginAt), 'MMMM d, yyyy h:mm a')
                      : 'Never'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Shield className="w-4 h-4" />
                    Role
                  </div>
                  <Select
                    value={user.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    disabled={updateRoleMutation.isPending}
                    className="w-full"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Activity className="w-4 h-4" />
                    Reputation
                  </div>
                  <p className="text-gray-900 dark:text-white">{user.reputation}</p>
                </div>
              </div>

              {user.bio && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Bio</p>
                  <p className="text-gray-900 dark:text-white">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {user.suspensionInfo?.isActive && (
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-yellow-700 dark:text-yellow-400">
                  Suspension Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Reason:</strong> {user.suspensionInfo.reason}
                  </p>
                  <p className="text-sm">
                    <strong>Suspended By:</strong> {user.suspensionInfo.suspendedByUsername}
                  </p>
                  <p className="text-sm">
                    <strong>Suspended At:</strong>{' '}
                    {format(new Date(user.suspensionInfo.suspendedAt), 'MMMM d, yyyy h:mm a')}
                  </p>
                  {user.suspensionInfo.expiresAt && (
                    <p className="text-sm">
                      <strong>Expires At:</strong>{' '}
                      {format(new Date(user.suspensionInfo.expiresAt), 'MMMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnsuspend}
                  disabled={unsuspendMutation.isPending}
                  className="mt-4"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Remove Suspension
                </Button>
              </CardContent>
            </Card>
          )}

          {user.banInfo && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400">Ban Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Reason:</strong> {user.banInfo.reason}
                  </p>
                  <p className="text-sm">
                    <strong>Banned By:</strong> {user.banInfo.bannedByUsername}
                  </p>
                  <p className="text-sm">
                    <strong>Banned At:</strong>{' '}
                    {format(new Date(user.banInfo.bannedAt), 'MMMM d, yyyy h:mm a')}
                  </p>
                  <p className="text-sm">
                    <strong>Type:</strong> {user.banInfo.isPermanent ? 'Permanent' : 'Temporary'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnban}
                  disabled={unbanMutation.isPending}
                  className="mt-4"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Unban User
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities && activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {format(new Date(activity.createdAt), 'MMMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.status === 'suspended' ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleUnsuspend}
                    disabled={unsuspendMutation.isPending}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Remove Suspension
                  </Button>
                ) : user.status !== 'banned' ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsSuspendModalOpen(true)}
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Suspend User
                  </Button>
                ) : null}

                {user.status === 'banned' ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleUnban}
                    disabled={unbanMutation.isPending}
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Unban User
                  </Button>
                ) : user.status !== 'suspended' ? (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setIsBanModalOpen(true)}
                  >
                    <ShieldX className="w-4 h-4 mr-2" />
                    Ban User
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Articles</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user.articleCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Topics</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user.topicCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Replies</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user.replyCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Job Applications</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {user.jobApplicationCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {content && (
            <Card>
              <CardHeader>
                <CardTitle>Content Created</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {content.articles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Articles
                      </h4>
                      <div className="space-y-2">
                        {content.articles.slice(0, 3).map((article) => (
                          <Link
                            key={article.id}
                            to={`/news/${article.slug}`}
                            className="block text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                          >
                            {article.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {content.topics.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Forum Topics
                      </h4>
                      <div className="space-y-2">
                        {content.topics.slice(0, 3).map((topic) => (
                          <Link
                            key={topic.id}
                            to={`/forum/t/${topic.slug}/${topic.id}`}
                            className="block text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                          >
                            {topic.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {reports && reports.length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Reports ({reports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.slice(0, 3).map((report) => (
                    <div key={report.id} className="text-sm">
                      <p className="text-gray-900 dark:text-white font-medium">{report.reason}</p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                        By {report.reporterDisplayName} on{' '}
                        {format(new Date(report.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {isSuspendModalOpen && (
        <SuspendUserModal
          user={user}
          isOpen={true}
          onClose={() => setIsSuspendModalOpen(false)}
          onSuspend={async (payload) => {
            await suspendMutation.mutateAsync(payload);
          }}
        />
      )}

      {isBanModalOpen && (
        <BanUserModal
          user={user}
          isOpen={true}
          onClose={() => setIsBanModalOpen(false)}
          onBan={async (payload) => {
            await banMutation.mutateAsync(payload);
          }}
        />
      )}

      {isMessageModalOpen && (
        <SendMessageModal
          user={user}
          isOpen={true}
          onClose={() => setIsMessageModalOpen(false)}
          onSend={async (payload) => {
            await sendMessageMutation.mutateAsync(payload);
          }}
        />
      )}
    </div>
  );
};

export default UserDetail;
