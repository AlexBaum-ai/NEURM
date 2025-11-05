/**
 * ReputationNotification Component
 * Displays a toast notification when user gains or loses reputation
 * Can be triggered via events or direct calls
 */

import React from 'react';
import { Snackbar, Alert, Box, Typography, Chip } from '@mui/material';
import { TrendingUp, Add, Remove } from '@mui/icons-material';

interface ReputationNotificationProps {
  open: boolean;
  points: number;
  reason: string;
  onClose: () => void;
  autoHideDuration?: number;
}

const ReputationNotification: React.FC<ReputationNotificationProps> = ({
  open,
  points,
  reason,
  onClose,
  autoHideDuration = 4000,
}) => {
  const isPositive = points > 0;
  const severity = isPositive ? 'success' : 'warning';

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        icon={<TrendingUp />}
        sx={{
          minWidth: 300,
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Reputation {isPositive ? 'Gained' : 'Lost'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {reason}
            </Typography>
          </Box>
          <Chip
            icon={isPositive ? <Add sx={{ fontSize: '1rem' }} /> : <Remove sx={{ fontSize: '1rem' }} />}
            label={`${isPositive ? '+' : ''}${points}`}
            size="small"
            sx={{
              backgroundColor: isPositive ? '#4CAF5030' : '#F4433630',
              color: isPositive ? '#4CAF50' : '#F44336',
              border: `1px solid ${isPositive ? '#4CAF5060' : '#F4433660'}`,
              fontWeight: 700,
              minWidth: 60,
              '& .MuiChip-icon': {
                color: isPositive ? '#4CAF50' : '#F44336',
              },
            }}
            aria-label={`${isPositive ? 'Gained' : 'Lost'} ${Math.abs(points)} reputation points`}
          />
        </Box>
      </Alert>
    </Snackbar>
  );
};

// Hook to manage reputation notifications
export const useReputationNotification = () => {
  const [notification, setNotification] = React.useState<{
    open: boolean;
    points: number;
    reason: string;
  }>({
    open: false,
    points: 0,
    reason: '',
  });

  const showNotification = React.useCallback((points: number, reason: string) => {
    setNotification({
      open: true,
      points,
      reason,
    });
  }, []);

  const hideNotification = React.useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    notification,
    showNotification,
    hideNotification,
  };
};

export default ReputationNotification;
