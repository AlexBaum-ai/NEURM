/**
 * TopicList Component
 * Displays a paginated list of forum topics with filters
 */

import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Pagination,
  Typography,
  Stack,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTopics } from '../hooks';
import TopicCard from './TopicCard';
import TopicFilters, { TopicFilterState } from './TopicFilters';
import type { TopicListQuery } from '../types';

interface TopicListProps {
  categoryId?: string;
  showFilters?: boolean;
  limit?: number;
}

const TopicList: React.FC<TopicListProps> = ({
  categoryId,
  showFilters = true,
  limit = 20,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<TopicFilterState>({
    type: (searchParams.get('type') as any) || undefined,
    status: (searchParams.get('status') as any) || undefined,
    hasCode: searchParams.get('hasCode') === 'true' ? true : undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
  });

  const page = parseInt(searchParams.get('page') || '1', 10);

  // Build query from filters
  const query: TopicListQuery = {
    categoryId,
    page,
    limit,
    ...filters,
  };

  // Fetch topics
  const { data, isLoading, error } = useTopics({
    query,
    suspense: false,
  });

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: TopicFilterState) => {
      setFilters(newFilters);

      // Update URL params
      const params = new URLSearchParams();
      if (newFilters.type) params.set('type', newFilters.type);
      if (newFilters.status) params.set('status', newFilters.status);
      if (newFilters.hasCode) params.set('hasCode', 'true');
      if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
      if (newFilters.sortOrder) params.set('sortOrder', newFilters.sortOrder);
      params.set('page', '1'); // Reset to first page on filter change

      setSearchParams(params);
    },
    [setSearchParams]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', value.toString());
      setSearchParams(params);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [searchParams, setSearchParams]
  );

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 3 }}>
        Failed to load topics. Please try again later.
      </Alert>
    );
  }

  // No data
  if (!data || !data.data) {
    return (
      <Alert severity="info" sx={{ my: 3 }}>
        No topics found.
      </Alert>
    );
  }

  const { topics, pagination } = data.data;

  // Separate pinned and regular topics
  const pinnedTopics = topics.filter((t) => t.isPinned);
  const regularTopics = topics.filter((t) => !t.isPinned);

  return (
    <Grid container spacing={3}>
      {/* Filters Sidebar */}
      {showFilters && (
        <Grid item xs={12} md={3}>
          <Box position="sticky" top={80}>
            <TopicFilters filters={filters} onChange={handleFiltersChange} />
          </Box>
        </Grid>
      )}

      {/* Topics List */}
      <Grid item xs={12} md={showFilters ? 9 : 12}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Typography variant="h5" fontWeight={600}>
              {categoryId ? 'Topics' : 'All Topics'}
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{ ml: 2 }}
              >
                ({pagination.totalCount} topics)
              </Typography>
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              href="/forum/new"
              sx={{ textTransform: 'none' }}
            >
              New Topic
            </Button>
          </Stack>

          {/* Pinned Topics */}
          {pinnedTopics.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                color="primary"
                fontWeight={600}
                mb={2}
              >
                Pinned Topics
              </Typography>
              {pinnedTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </Box>
          )}

          {/* Regular Topics */}
          {regularTopics.length > 0 ? (
            <>
              {pinnedTopics.length > 0 && (
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                  All Topics
                </Typography>
              )}
              {regularTopics.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </>
          ) : (
            <Alert severity="info">
              No topics found matching your filters. Try adjusting your search criteria.
            </Alert>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Stack>
      </Grid>
    </Grid>
  );
};

export default TopicList;
