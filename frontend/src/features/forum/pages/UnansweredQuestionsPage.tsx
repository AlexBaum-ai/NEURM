/**
 * UnansweredQuestionsPage
 * Displays a list of questions without accepted answers
 * Sprint 5, Task SPRINT-5-010
 */

import React, { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Stack,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  HelpOutline as QuestionIcon,
  Visibility as ViewIcon,
  ThumbUp as VoteIcon,
  Schedule as TimeIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useUnansweredTopics, useCategories } from '../hooks';
import TopicCard from '../components/TopicCard';
import { formatDistanceToNow } from 'date-fns';

// Empty State Component
const EmptyState: React.FC = () => (
  <Paper
    elevation={0}
    sx={{
      p: 8,
      textAlign: 'center',
      border: 1,
      borderColor: 'divider',
      borderRadius: 2,
      bgcolor: alpha('#4caf50', 0.05),
    }}
  >
    <Box
      sx={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        bgcolor: alpha('#4caf50', 0.1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: 'auto',
        mb: 3,
      }}
    >
      <QuestionIcon sx={{ fontSize: 40, color: 'success.main' }} />
    </Box>
    <Typography variant="h5" fontWeight={700} gutterBottom>
      All Questions Answered! 🎉
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
      Great job, community! There are currently no unanswered questions. Check back later or
      explore other categories.
    </Typography>
    <Button
      component={Link}
      to="/forum"
      variant="contained"
      sx={{ mt: 3, textTransform: 'none' }}
    >
      Back to Forum
    </Button>
  </Paper>
);

// Loading Skeleton Component
const LoadingSkeleton: React.FC = () => (
  <Stack spacing={2}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Paper
        key={i}
        elevation={0}
        sx={{
          p: 3,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          height: 180,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress size={32} />
        </Box>
      </Paper>
    ))}
  </Stack>
);

// Main Content Component
const UnansweredQuestionsContent: React.FC = () => {
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_viewed' | 'most_voted'>('newest');

  // Fetch categories for filter
  const { categories } = useCategories();

  // Map sort options to API parameters
  const getSortParams = (sort: typeof sortBy) => {
    switch (sort) {
      case 'newest':
        return { sortBy: 'createdAt' as const, sortOrder: 'desc' as const };
      case 'oldest':
        return { sortBy: 'createdAt' as const, sortOrder: 'asc' as const };
      case 'most_viewed':
        return { sortBy: 'viewCount' as const, sortOrder: 'desc' as const };
      case 'most_voted':
        return { sortBy: 'voteScore' as const, sortOrder: 'desc' as const };
      default:
        return { sortBy: 'createdAt' as const, sortOrder: 'desc' as const };
    }
  };

  // Fetch unanswered questions
  const { topics, pagination, totalCount } = useUnansweredTopics({
    page,
    limit: 20,
    categoryId: categoryId || undefined,
    ...getSortParams(sortBy),
  });

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (event: any) => {
    setCategoryId(event.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value);
    setPage(1); // Reset to first page when sort changes
  };

  const activeFiltersCount = categoryId ? 1 : 0;

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

        {/* Header */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: alpha('#ff9800', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QuestionIcon sx={{ fontSize: 32, color: '#ff9800' }} />
            </Box>
            <Box flex={1}>
              <Typography variant="h3" fontWeight={700}>
                Unanswered Questions
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Help answer these questions from the community
              </Typography>
            </Box>
            <Chip
              label={`${totalCount} questions`}
              color="warning"
              size="medium"
              sx={{ fontWeight: 600, fontSize: '0.95rem', py: 2.5, px: 1 }}
            />
          </Stack>
        </Box>

        {/* Filters and Sort Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryId} onChange={handleCategoryChange} label="Category">
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.icon && `${cat.icon} `}
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Sort Dropdown */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} onChange={handleSortChange} label="Sort By">
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="most_viewed">Most Viewed</MenuItem>
                <MenuItem value="most_voted">Most Voted</MenuItem>
              </Select>
            </FormControl>

            {/* Active Filters Count */}
            {activeFiltersCount > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon sx={{ fontSize: '1.25rem', color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setCategoryId('');
                    setPage(1);
                  }}
                  sx={{ textTransform: 'none', minWidth: 'auto' }}
                >
                  Clear
                </Button>
              </Box>
            )}

            {/* Spacer */}
            <Box flex={1} />

            {/* Results Count */}
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              Showing {topics.length} of {totalCount}
            </Typography>
          </Stack>
        </Paper>

        {/* Call to Action Banner */}
        <Alert
          severity="info"
          icon={<QuestionIcon />}
          sx={{
            bgcolor: alpha('#2196f3', 0.1),
            '& .MuiAlert-icon': {
              color: 'info.main',
            },
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            💡 Help the community grow!
          </Typography>
          <Typography variant="body2">
            Each answer you provide helps others learn and builds your reputation. Even partial
            answers or suggestions can be valuable.
          </Typography>
        </Alert>

        {/* Topics List */}
        {topics.length === 0 ? (
          <EmptyState />
        ) : (
          <Stack spacing={3}>
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </Stack>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={pagination.totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Stack>
    </Container>
  );
};

// Main Page Component with Suspense
export const UnansweredQuestionsPage: React.FC = () => {
  return (
    <Suspense fallback={<Container maxWidth="xl" sx={{ py: 4 }}><LoadingSkeleton /></Container>}>
      <UnansweredQuestionsContent />
    </Suspense>
  );
};

export default UnansweredQuestionsPage;
