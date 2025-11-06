/**
 * EndorseButton Component
 *
 * Button to endorse or unendorse a skill with optimistic updates
 */

import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Add, Check } from '@mui/icons-material';
import { useEndorseSkill, useUnendorseSkill } from '../../hooks/useEndorsements';
import { useAuthStore } from '@/store/authStore';

interface EndorseButtonProps {
  username: string;
  skillId: string;
  skillName: string;
  hasEndorsed: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  onEndorsementChange?: (hasEndorsed: boolean) => void;
}

/**
 * Endorse button component with optimistic UI updates
 */
const EndorseButton: React.FC<EndorseButtonProps> = ({
  username,
  skillId,
  skillName,
  hasEndorsed: initialHasEndorsed,
  disabled = false,
  size = 'small',
  onEndorsementChange,
}) => {
  const [hasEndorsed, setHasEndorsed] = useState(initialHasEndorsed);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { isAuthenticated } = useAuthStore();
  const endorseSkill = useEndorseSkill();
  const unendorseSkill = useUnendorseSkill();

  const isLoading = endorseSkill.isPending || unendorseSkill.isPending;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click handlers

    if (!isAuthenticated) {
      // TODO: Show login dialog or redirect to login
      return;
    }

    // Optimistic update
    const newHasEndorsed = !hasEndorsed;
    setHasEndorsed(newHasEndorsed);
    onEndorsementChange?.(newHasEndorsed);

    try {
      if (newHasEndorsed) {
        await endorseSkill.mutateAsync({ username, skillId });
        setSuccessMessage(`Successfully endorsed ${skillName}`);
      } else {
        await unendorseSkill.mutateAsync({ username, skillId });
        setSuccessMessage(`Endorsement removed from ${skillName}`);
      }
      setShowSuccess(true);
    } catch (error) {
      // Revert optimistic update on error
      setHasEndorsed(!newHasEndorsed);
      onEndorsementChange?.(!newHasEndorsed);
      console.error('Endorsement error:', error);
    }
  };

  const handleCloseSnackbar = () => {
    setShowSuccess(false);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
        size={size}
        variant={hasEndorsed ? 'contained' : 'outlined'}
        color={hasEndorsed ? 'primary' : 'default'}
        startIcon={
          isLoading ? (
            <CircularProgress size={16} />
          ) : hasEndorsed ? (
            <Check />
          ) : (
            <Add />
          )
        }
        sx={{
          minWidth: hasEndorsed ? 110 : 100,
          textTransform: 'none',
          fontWeight: hasEndorsed ? 600 : 500,
        }}
      >
        {hasEndorsed ? 'Endorsed' : '+ Endorse'}
      </Button>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EndorseButton;
