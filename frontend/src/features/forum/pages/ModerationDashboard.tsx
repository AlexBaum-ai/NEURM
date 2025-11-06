/**
 * ModerationDashboard Page
 * Central dashboard for moderators to manage forum content and users
 */

import React, { Suspense } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Report as ReportIcon,
  History as HistoryIcon,
  TrendingUp as StatsIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { forumApi } from '../api/forumApi';
import { useAuthStore } from '@/store/authStore';
import { ModerationLog } from '../components/ModerationLog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`moderation-tabpanel-${index}`}
      aria-labelledby={`moderation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ModerationDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const isModerator = user?.role === 'moderator' || user?.role === 'admin';

  // Redirect if not moderator
  if (!isModerator) {
    navigate('/forum');
    return null;
  }

  // Fetch moderation statistics
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['moderation-stats'],
    queryFn: forumApi.getModerationStats,
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch report statistics
  const { data: reportStats, isLoading: loadingReportStats } = useQuery({
    queryKey: ['report-statistics'],
    queryFn: forumApi.getReportStatistics,
    staleTime: 60 * 1000, // 1 minute
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setSearchParams({ tab: newValue });
  };

  const tabs = [
    { value: 'overview', label: 'Overview', icon: <DashboardIcon /> },
    { value: 'reports', label: 'Reports', icon: <ReportIcon /> },
    { value: 'logs', label: 'Action Log', icon: <HistoryIcon /> },
  ];

  const tabIndex = tabs.findIndex((tab) => tab.value === currentTab);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Moderation Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and manage forum content, users, and reports
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="moderation dashboard tabs"
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              value={tab.value}
              icon={tab.icon}
              iconPosition="start"
              id={`moderation-tab-${tab.value}`}
              aria-controls={`moderation-tabpanel-${tab.value}`}
            />
          ))}
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tabIndex >= 0 ? tabIndex : 0} index={0}>
        <Grid container spacing={3}>
          {/* Statistics Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <StatsIcon color="primary" />
                  <Typography variant="h6">Actions Today</Typography>
                </Box>
                {loadingStats ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography variant="h3">{stats?.actionsToday || 0}</Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Moderation actions taken today
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ReportIcon color="error" />
                  <Typography variant="h6">Pending Reports</Typography>
                </Box>
                {loadingReportStats ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography variant="h3" color="error.main">
                    {stats?.pendingReports || 0}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Reports awaiting review
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon color="warning" />
                  <Typography variant="h6">Active Suspensions</Typography>
                </Box>
                {loadingStats ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography variant="h3" color="warning.main">
                    {stats?.activeSuspensions || 0}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Currently suspended users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <HistoryIcon color="action" />
                  <Typography variant="h6">Total Actions</Typography>
                </Box>
                {loadingStats ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography variant="h3">{stats?.totalActions || 0}</Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  All-time moderation actions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Actions */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Recent Moderation Actions"
                subheader="Latest actions taken by moderators"
              />
              <CardContent>
                <Suspense
                  fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  }
                >
                  <ModerationLog limit={10} showFilters={false} />
                </Suspense>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Reports Tab */}
      <TabPanel value={tabIndex >= 0 ? tabIndex : 0} index={1}>
        <Alert severity="info" sx={{ mb: 3 }}>
          The report management interface will be implemented in Sprint 5 Task SPRINT-5-004.
          This tab will show the moderation queue with filtering and review capabilities.
        </Alert>
        <Card>
          <CardHeader
            title="Reports Queue"
            subheader="Manage user-submitted reports"
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Coming soon: View and resolve reports, filter by status and reason, batch actions.
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Logs Tab */}
      <TabPanel value={tabIndex >= 0 ? tabIndex : 0} index={2}>
        <Card>
          <CardHeader
            title="Moderation Action Log"
            subheader="Complete history of moderation actions"
          />
          <CardContent>
            <Suspense
              fallback={
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              }
            >
              <ModerationLog limit={20} showFilters={true} />
            </Suspense>
          </CardContent>
        </Card>
      </TabPanel>
    </Container>
  );
};

export default ModerationDashboard;
