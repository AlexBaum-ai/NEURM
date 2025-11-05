/**
 * SearchResults Page
 * Display forum search results with filters and highlighting
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Stack,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Pagination,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  useMediaQuery,
  useTheme,
  Drawer,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  ThumbUp as VoteIcon,
  Comment as ReplyIcon,
  Visibility as ViewIcon,
  QuestionAnswer as QuestionIcon,
  Chat as DiscussionIcon,
  CheckCircle as SolvedIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useForumSearch, useSavedSearches } from '../hooks';
import SearchFilters from '../components/SearchFilters';
import SearchBar from '../components/SearchBar';
import type {
  SearchQuery,
  SearchFilters as SearchFiltersType,
  SearchSortBy,
  SearchResult,
  SearchResultTopic,
  SearchResultReply,
  TopicType,
} from '../types';

const topicTypeConfig: Record<TopicType, { icon: React.ElementType; label: string; color: string }> = {
  question: { icon: QuestionIcon, label: 'Question', color: '#1976d2' },
  discussion: { icon: DiscussionIcon, label: 'Discussion', color: '#9c27b0' },
  showcase: { icon: DiscussionIcon, label: 'Showcase', color: '#f57c00' },
  tutorial: { icon: DiscussionIcon, label: 'Tutorial', color: '#388e3c' },
  announcement: { icon: DiscussionIcon, label: 'Announcement', color: '#d32f2f' },
  paper: { icon: DiscussionIcon, label: 'Paper', color: '#5e35b1' },
};

export const SearchResults: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = (searchParams.get('sortBy') as SearchSortBy) || 'relevance';

  const [filters, setFilters] = useState<SearchFiltersType>({
    categoryId: searchParams.get('categoryId') || undefined,
    type: searchParams.get('type') as TopicType | undefined,
    status: searchParams.get('status') as any,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
    hasCode: searchParams.get('hasCode') === 'true' ? true : undefined,
    minUpvotes: searchParams.get('minUpvotes') ? parseInt(searchParams.get('minUpvotes')!) : undefined,
    tag: searchParams.get('tag') || undefined,
  });

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');

  const { saveSearch, isSaving } = useSavedSearches();

  const searchQuery: SearchQuery = {
    q: query,
    page,
    limit: 20,
    sortBy,
    ...filters,
  };

  const { data, isLoading, isError } = useForumSearch(searchQuery);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('page', page.toString());
    if (sortBy !== 'relevance') params.set('sortBy', sortBy);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value.toString());
      }
    });

    setSearchParams(params, { replace: true });
  }, [filters, sortBy, page, query, setSearchParams]);

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    setSearchParams({ ...Object.fromEntries(searchParams), page: '1' });
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchParams({ q: query, page: '1' });
  };

  const handleSortChange = (newSortBy: SearchSortBy) => {
    const params = new URLSearchParams(searchParams);
    params.set('sortBy', newSortBy);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveSearch = () => {
    if (savedSearchName.trim()) {
      saveSearch(
        {
          name: savedSearchName.trim(),
          query,
          filters,
        },
        {
          onSuccess: () => {
            setIsSaveDialogOpen(false);
            setSavedSearchName('');
          },
        }
      );
    }
  };

  const highlightText = (text: string, matchedTerms?: string[]) => {
    if (!matchedTerms || matchedTerms.length === 0) return text;

    let highlighted = text;
    matchedTerms.forEach((term) => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });

    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  const renderSearchResult = (result: SearchResult, index: number) => {
    if (result.resultType === 'topic') {
      return <TopicResultCard key={`topic-${result.id}-${index}`} topic={result} highlightText={highlightText} />;
    } else {
      return <ReplyResultCard key={`reply-${result.id}-${index}`} reply={result} highlightText={highlightText} />;
    }
  };

  const filtersDrawer = (
    <Box sx={{ p: isMobile ? 2 : 0 }}>
      <SearchFilters filters={filters} onFiltersChange={handleFiltersChange} onClear={handleClearFilters} />
    </Box>
  );

  if (!query) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Search the Forum
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Enter a search query to find topics and discussions
          </Typography>
          <Box maxWidth={600} mx="auto">
            <SearchBar autoFocus />
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Filters Sidebar (Desktop) */}
        {!isMobile && (
          <Grid item xs={12} md={3}>
            {filtersDrawer}
          </Grid>
        )}

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Stack spacing={3}>
            {/* Search Header */}
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  <Typography variant="h5" fontWeight={600}>
                    Search Results
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<BookmarkBorderIcon />}
                      onClick={() => setIsSaveDialogOpen(true)}
                    >
                      Save Search
                    </Button>
                    {isMobile && (
                      <IconButton color="primary" onClick={() => setIsFiltersOpen(true)}>
                        <FilterIcon />
                      </IconButton>
                    )}
                  </Stack>
                </Stack>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Showing results for:{' '}
                    <Typography component="span" fontWeight={600} color="text.primary">
                      "{query}"
                    </Typography>
                  </Typography>
                  {data && (
                    <Typography variant="body2" color="text.secondary">
                      {data.pagination.totalCount} result{data.pagination.totalCount !== 1 ? 's' : ''} found
                    </Typography>
                  )}
                </Box>

                {/* Sort */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Sort by:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select value={sortBy} onChange={(e) => handleSortChange(e.target.value as SearchSortBy)}>
                      <MenuItem value="relevance">Relevance</MenuItem>
                      <MenuItem value="date">Newest First</MenuItem>
                      <MenuItem value="votes">Most Voted</MenuItem>
                      <MenuItem value="popularity">Most Popular</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            </Paper>

            {/* Results */}
            {isLoading && (
              <Stack spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={200} />
                ))}
              </Stack>
            )}

            {isError && (
              <Alert severity="error">
                An error occurred while searching. Please try again.
              </Alert>
            )}

            {data && data.results.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No results found
                </Typography>
                <Typography color="text.secondary" mb={2}>
                  Try different keywords or adjust your filters
                </Typography>
                <Button onClick={handleClearFilters}>Clear Filters</Button>
              </Paper>
            )}

            {data && data.results.length > 0 && (
              <>
                <Stack spacing={2}>{data.results.map((result, index) => renderSearchResult(result, index))}</Stack>

                {/* Pagination */}
                {data.pagination.totalPages > 1 && (
                  <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination
                      count={data.pagination.totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      size={isMobile ? 'small' : 'medium'}
                    />
                  </Box>
                )}
              </>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Mobile Filters Drawer */}
      {isMobile && (
        <Drawer anchor="right" open={isFiltersOpen} onClose={() => setIsFiltersOpen(false)}>
          <Box sx={{ width: 300 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" p={2}>
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={() => setIsFiltersOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Stack>
            <Divider />
            {filtersDrawer}
          </Box>
        </Drawer>
      )}

      {/* Save Search Dialog */}
      <Dialog open={isSaveDialogOpen} onClose={() => setIsSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Search</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Search Name"
            value={savedSearchName}
            onChange={(e) => setSavedSearchName(e.target.value)}
            placeholder="E.g., Machine Learning Questions"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSearch} variant="contained" disabled={!savedSearchName.trim() || isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Topic Result Card Component
const TopicResultCard: React.FC<{
  topic: SearchResultTopic;
  highlightText: (text: string, terms?: string[]) => React.ReactNode;
}> = ({ topic, highlightText }) => {
  const typeConfig = topicTypeConfig[topic.type];
  const TypeIcon = typeConfig.icon;
  const isResolved = topic.status === 'resolved';

  return (
    <Paper sx={{ p: 3, '&:hover': { boxShadow: 3 } }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            icon={<TypeIcon sx={{ fontSize: '1rem' }} />}
            label={typeConfig.label}
            size="small"
            sx={{ bgcolor: `${typeConfig.color}20`, color: typeConfig.color }}
          />
          {isResolved && <Chip icon={<SolvedIcon />} label="Solved" size="small" color="success" />}
        </Stack>

        <Link to={`/forum/t/${topic.slug}/${topic.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography variant="h6" fontWeight={600} sx={{ '&:hover': { color: 'primary.main' } }}>
            {topic.highlightedTitle ? highlightText(topic.title, topic.matchedTerms) : topic.title}
          </Typography>
        </Link>

        <Typography variant="body2" color="text.secondary">
          {topic.highlightedContent ? highlightText(topic.excerpt, topic.matchedTerms) : topic.excerpt}
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar src={topic.author.avatarUrl || undefined} sx={{ width: 24, height: 24 }}>
              {topic.author.displayName?.[0] || topic.author.username[0]}
            </Avatar>
            <Typography variant="body2">{topic.author.displayName || topic.author.username}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true })}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <VoteIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="body2">{topic.voteScore}</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <ReplyIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="body2">{topic.replyCount}</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <ViewIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              <Typography variant="body2">{topic.viewCount}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

// Reply Result Card Component
const ReplyResultCard: React.FC<{
  reply: SearchResultReply;
  highlightText: (text: string, terms?: string[]) => React.ReactNode;
}> = ({ reply, highlightText }) => {
  return (
    <Paper sx={{ p: 3, '&:hover': { boxShadow: 3 } }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label="Reply" size="small" color="secondary" variant="outlined" />
          <Typography variant="body2" color="text.secondary">
            in topic:
          </Typography>
          <Link to={`/forum/t/${reply.topicSlug}/${reply.topicId}#reply-${reply.id}`} style={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary" fontWeight={500}>
              {reply.topicTitle}
            </Typography>
          </Link>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {reply.highlightedContent ? highlightText(reply.content.slice(0, 200), reply.matchedTerms) : reply.content.slice(0, 200)}
          {reply.content.length > 200 && '...'}
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar src={reply.author.avatarUrl || undefined} sx={{ width: 24, height: 24 }}>
              {reply.author.displayName?.[0] || reply.author.username[0]}
            </Avatar>
            <Typography variant="body2">{reply.author.displayName || reply.author.username}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <VoteIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant="body2">{reply.voteScore}</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default SearchResults;
