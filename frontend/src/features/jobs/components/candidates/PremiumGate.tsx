/**
 * PremiumGate Component
 *
 * Gate that checks if company has premium subscription for candidate search
 */

import React from 'react';
import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/material';
import { Lock, Star, Search, Mail, FileDownload } from '@mui/icons-material';

interface PremiumGateProps {
  hasPremium: boolean;
  onUpgrade?: () => void;
}

/**
 * Premium feature gate component
 * Shows upgrade prompt if company doesn't have premium subscription
 */
const PremiumGate: React.FC<PremiumGateProps> = ({ hasPremium, onUpgrade }) => {
  if (hasPremium) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          textAlign: 'center',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.primary.main}05 100%)`,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
              mb: 3,
            }}
          >
            <Lock sx={{ fontSize: 40 }} />
          </Box>

          <Typography variant="h4" gutterBottom fontWeight="bold">
            Premium Feature
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Unlock the power of our candidate search to find the perfect talent for your team.
          </Typography>

          <Stack spacing={2} sx={{ mb: 4, textAlign: 'left' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Search sx={{ color: 'primary.main', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  Advanced Search & Filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Find candidates with specific skills, experience, and tech stack expertise
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Mail sx={{ color: 'primary.main', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  Direct Messaging
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reach out directly to potential candidates that match your criteria
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <FileDownload sx={{ color: 'primary.main', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  Export & Save Searches
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Export candidate lists and save your searches for future reference
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Star sx={{ color: 'primary.main', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  Match Scoring
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  See compatibility scores and detailed match breakdowns for each candidate
                </Typography>
              </Box>
            </Box>
          </Stack>

          <Button
            variant="contained"
            size="large"
            onClick={onUpgrade}
            startIcon={<Star />}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              },
            }}
          >
            Upgrade to Premium
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Starting at $99/month • Cancel anytime
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PremiumGate;
