/**
 * Reputation Components - Usage Examples
 *
 * This file demonstrates how to use the reputation display components
 * implemented in SPRINT-4-011.
 */

import React from 'react';
import { Box, Container, Stack, Typography, Divider } from '@mui/material';
import {
  ReputationBadge,
  ReputationWidget,
  ReputationHistory,
  ReputationNotification,
  useReputationNotification,
} from './index';
import { useReputation } from '../hooks';

/**
 * Example 1: ReputationBadge - Inline display next to username
 * Used in TopicCard, ReplyCard, and user cards
 */
export const ReputationBadgeExample: React.FC = () => {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">ReputationBadge Examples</Typography>

      {/* Small badge with icon, no points */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography>John Doe</Typography>
        <ReputationBadge
          level="contributor"
          totalReputation={250}
          size="small"
          showPoints={false}
          showIcon={true}
        />
      </Box>

      {/* Medium badge with points */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography>Jane Expert</Typography>
        <ReputationBadge
          level="expert"
          totalReputation={750}
          size="medium"
          showPoints={true}
          showIcon={true}
        />
      </Box>

      {/* All levels showcase */}
      <Stack spacing={1}>
        {(['newcomer', 'contributor', 'expert', 'master', 'legend'] as const).map((level) => (
          <Box key={level} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ minWidth: 120 }}>{level}:</Typography>
            <ReputationBadge
              level={level}
              totalReputation={level === 'newcomer' ? 50 : level === 'contributor' ? 250 : level === 'expert' ? 750 : level === 'master' ? 1500 : 3000}
              size="small"
              showPoints={true}
              showIcon={true}
            />
          </Box>
        ))}
      </Stack>
    </Stack>
  );
};

/**
 * Example 2: ReputationWidget - Detailed view on user profile
 * Shows level, progress bar, breakdown, and permissions
 */
export const ReputationWidgetExample: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: reputation } = useReputation({ userId });

  if (!reputation) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>ReputationWidget Example</Typography>
      <ReputationWidget reputation={reputation} />
    </Box>
  );
};

/**
 * Example 3: ReputationHistory - Timeline of reputation changes
 * Shows recent activity on user profile
 */
export const ReputationHistoryExample: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: reputation } = useReputation({ userId });

  if (!reputation || reputation.recentActivity.length === 0) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>ReputationHistory Example</Typography>
      <ReputationHistory activities={reputation.recentActivity} maxItems={5} />
    </Box>
  );
};

/**
 * Example 4: ReputationNotification - Toast notification for reputation changes
 * Triggered when user gains or loses reputation
 */
export const ReputationNotificationExample: React.FC = () => {
  const { notification, showNotification, hideNotification } = useReputationNotification();

  const handleShowGain = () => {
    showNotification(10, 'Upvote received on your topic');
  };

  const handleShowLoss = () => {
    showNotification(-5, 'Downvote received on your reply');
  };

  const handleShowBestAnswer = () => {
    showNotification(25, 'Your answer was accepted as best answer!');
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>ReputationNotification Examples</Typography>
      <Stack direction="row" spacing={2}>
        <button onClick={handleShowGain}>Show +10 notification</button>
        <button onClick={handleShowLoss}>Show -5 notification</button>
        <button onClick={handleShowBestAnswer}>Show +25 best answer</button>
      </Stack>

      <ReputationNotification
        open={notification.open}
        points={notification.points}
        reason={notification.reason}
        onClose={hideNotification}
      />
    </Box>
  );
};

/**
 * Example 5: Complete Profile Integration
 * Shows how reputation components are integrated on user profile
 */
export const CompleteProfileExample: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: reputation } = useReputation({ userId });

  if (!reputation) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        User Profile with Reputation
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 3 }}>
        {/* Left Column - Reputation Widget */}
        <Box>
          <ReputationWidget reputation={reputation} />
        </Box>

        {/* Right Column - Reputation History */}
        <Box>
          <ReputationHistory activities={reputation.recentActivity} maxItems={10} />
        </Box>
      </Box>
    </Container>
  );
};

/**
 * Example 6: Responsive Behavior
 * Shows how components adapt to different screen sizes
 */
export const ResponsiveExample: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: reputation } = useReputation({ userId });

  if (!reputation) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Responsive Design Example</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Resize your browser to see how components adapt:
      </Typography>
      <ul>
        <li><strong>Mobile:</strong> Single column layout, condensed badges</li>
        <li><strong>Tablet:</strong> Two column layout, full badges</li>
        <li><strong>Desktop:</strong> Multi-column layout, all details visible</li>
      </ul>

      <Divider sx={{ my: 3 }} />

      {/* Mobile-first responsive layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',           // Mobile: single column
            sm: '1fr 1fr',       // Tablet: two columns
            lg: '1fr 2fr',       // Desktop: asymmetric columns
          },
          gap: { xs: 2, sm: 3 },
        }}
      >
        <ReputationWidget reputation={reputation} />
        <ReputationHistory activities={reputation.recentActivity} maxItems={5} />
      </Box>
    </Box>
  );
};

/**
 * Example 7: Accessibility Features
 * All components include proper ARIA labels and semantic HTML
 */
export const AccessibilityExample: React.FC = () => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Accessibility Features</Typography>
      <ul>
        <li><strong>Screen Reader Support:</strong> All badges have descriptive aria-labels</li>
        <li><strong>Keyboard Navigation:</strong> All interactive elements are keyboard accessible</li>
        <li><strong>Color Contrast:</strong> All text meets WCAG 2.1 AA standards</li>
        <li><strong>Semantic HTML:</strong> Proper heading hierarchy and landmarks</li>
        <li><strong>Tooltips:</strong> Additional context on hover/focus</li>
        <li><strong>Progress Indicators:</strong> Announced to screen readers</li>
      </ul>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Test with:
        <ul>
          <li>NVDA (Windows)</li>
          <li>JAWS (Windows)</li>
          <li>VoiceOver (macOS/iOS)</li>
          <li>TalkBack (Android)</li>
        </ul>
      </Typography>
    </Box>
  );
};

export default {
  ReputationBadgeExample,
  ReputationWidgetExample,
  ReputationHistoryExample,
  ReputationNotificationExample,
  CompleteProfileExample,
  ResponsiveExample,
  AccessibilityExample,
};
