/**
 * CategoryDetail Page
 * Displays a single category with its topics
 */

import React, { Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  Chip,
  Alert,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Forum as ForumIcon,
  Article as ArticleIcon,
  People as PeopleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useCategoryBySlug } from '../hooks';
import TopicList from '../components/TopicList';

const CategoryDetailContent: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Category not found</Alert>
      </Container>
    );
  }

  const { category } = useCategoryBySlug(slug);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Back Button */}
        <Link to="/forum" style={{ textDecoration: 'none', display: 'inline-block', width: 'fit-content' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            sx={{
              textTransform: 'none',
              color: 'text.primary',
            }}
          >
            Back to Forum
          </Button>
        </Link>

        {/* Category Header */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Stack spacing={3}>
            <Stack direction="row" spacing={3} alignItems="flex-start">
              {/* Icon */}
              {category.icon && (
                <Box
                  sx={{
                    fontSize: '3rem',
                    flexShrink: 0,
                  }}
                >
                  {category.icon}
                </Box>
              )}

              {/* Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h3" fontWeight={700} gutterBottom>
                  {category.name}
                </Typography>
                {category.description && (
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {category.description}
                  </Typography>
                )}

                {/* Stats */}
                <Stack direction="row" spacing={4} alignItems="center" sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ForumIcon sx={{ fontSize: '1.25rem', color: 'text.secondary' }} />
                    <Typography variant="body2" fontWeight={600}>
                      {category.topicCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Topics
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <ArticleIcon sx={{ fontSize: '1.25rem', color: 'text.secondary' }} />
                    <Typography variant="body2" fontWeight={600}>
                      {category.postCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Posts
                    </Typography>
                  </Stack>

                  {category.followerCount !== undefined && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PeopleIcon sx={{ fontSize: '1.25rem', color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight={600}>
                        {category.followerCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Followers
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>

              {/* Follow Button */}
              <Button
                variant={category.isFollowing ? 'outlined' : 'contained'}
                size="large"
                sx={{ textTransform: 'none' }}
              >
                {category.isFollowing ? 'Following' : 'Follow'}
              </Button>
            </Stack>

            {/* Guidelines */}
            {category.guidelines && (
              <Alert
                icon={<InfoIcon />}
                severity="info"
                sx={{
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                  '& .MuiAlert-icon': {
                    color: 'info.main',
                  },
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Category Guidelines
                </Typography>
                <Typography variant="body2">{category.guidelines}</Typography>
              </Alert>
            )}
          </Stack>
        </Paper>

        {/* Topics List */}
        <TopicList categoryId={category.id} showFilters={true} />
      </Stack>
    </Container>
  );
};

export const CategoryDetail: React.FC = () => {
  return (
    <Suspense
      fallback={
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        </Container>
      }
    >
      <CategoryDetailContent />
    </Suspense>
  );
};

export default CategoryDetail;
