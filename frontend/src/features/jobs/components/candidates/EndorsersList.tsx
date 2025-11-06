/**
 * EndorsersList Component
 *
 * Modal displaying list of users who endorsed a skill
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useEndorsements } from '../../hooks/useEndorsements';
import { format } from 'date-fns';

interface EndorsersListProps {
  open: boolean;
  onClose: () => void;
  username: string;
  skillId: string;
  skillName: string;
}

/**
 * Endorsers list modal component
 */
const EndorsersList: React.FC<EndorsersListProps> = ({
  open,
  onClose,
  username,
  skillId,
  skillName,
}) => {
  const { data, isLoading, error } = useEndorsements(username, skillId, open);

  const endorsers = data?.endorsements || [];
  const total = data?.total || 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      {/* Header */}
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Endorsements
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {skillName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ ml: 2 }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent dividers sx={{ p: 0 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">Failed to load endorsements. Please try again.</Alert>
          </Box>
        )}

        {!isLoading && !error && endorsers.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No endorsements yet
            </Typography>
          </Box>
        )}

        {!isLoading && !error && endorsers.length > 0 && (
          <>
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.default' }}>
              <Typography variant="body2" color="text.secondary">
                {total} {total === 1 ? 'person has' : 'people have'} endorsed this skill
              </Typography>
            </Box>

            <List sx={{ py: 0 }}>
              {endorsers.map((endorser, index) => {
                const displayName = endorser.firstName && endorser.lastName
                  ? `${endorser.firstName} ${endorser.lastName}`
                  : endorser.username;

                return (
                  <ListItem
                    key={endorser.id}
                    sx={{
                      borderBottom: index < endorsers.length - 1 ? 1 : 0,
                      borderColor: 'divider',
                      py: 2,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={endorser.photoUrl || undefined}
                        alt={displayName}
                        sx={{ width: 48, height: 48 }}
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight="medium">
                          {displayName}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          {endorser.headline && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 0.5 }}
                            >
                              {endorser.headline}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Endorsed {format(new Date(endorser.createdAt), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EndorsersList;
