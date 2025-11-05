/**
 * CandidateSearchPage
 *
 * Talent search interface for recruiters with filters and candidate previews
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Autocomplete,
  Drawer,
  Paper,
  Pagination,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Checkbox,
  Snackbar,
} from '@mui/material';
import {
  Search,
  FilterList,
  BookmarkBorder,
  FileDownload,
  Close,
  Add,
  Code,
} from '@mui/icons-material';
import { CandidateCard, ProfilePreview, SearchFilters, PremiumGate } from '../components/candidates';
import {
  useCandidates,
  useSavedSearches,
  useSaveSearch,
  useDeleteSavedSearch,
  useExportCandidates,
  useSearchSuggestions,
  useTrackProfileView,
} from '../hooks';
import type { CandidateSearchFilters, CandidateSearchResult } from '../types';

/**
 * Candidate search page component
 * Premium feature for recruiters to search and filter talent
 */
const CandidateSearchPage: React.FC = () => {
  // Check if company has premium subscription (mock for now)
  const [hasPremium] = useState(true); // TODO: Replace with actual subscription check

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<CandidateSearchFilters>({});
  const [page, setPage] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSearchResult | null>(null);
  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Menus
  const [savedSearchMenuAnchor, setSavedSearchMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  // Hooks
  const { data: searchResults, isLoading, error } = useCandidates({
    page,
    limit: 20,
    filters: { ...filters, query: searchQuery },
    enabled: hasPremium,
  });

  const { data: savedSearches } = useSavedSearches();
  const saveSearch = useSaveSearch();
  const deleteSearch = useDeleteSavedSearch();
  const exportCandidates = useExportCandidates();
  const trackView = useTrackProfileView();

  const { data: suggestions } = useSearchSuggestions(searchQuery, 'all', searchQuery.length >= 2);

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: CandidateSearchFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  }, []);

  const handleCandidateClick = useCallback((candidate: CandidateSearchResult) => {
    setSelectedCandidate(candidate);
    setProfilePreviewOpen(true);
    trackView.mutate({ candidateId: candidate.id, source: 'search' });
  }, [trackView]);

  const handleToggleSelect = useCallback((candidateId: string) => {
    setSelectedCandidates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  }, []);

  const handleSaveSearch = useCallback(async () => {
    const name = prompt('Enter a name for this search:');
    if (name) {
      await saveSearch.mutateAsync({ name, filters: { ...filters, query: searchQuery } });
      setSnackbarMessage('Search saved successfully');
    }
  }, [filters, searchQuery, saveSearch]);

  const handleLoadSavedSearch = useCallback((search: any) => {
    setFilters(search.filters);
    setSearchQuery(search.filters.query || '');
    setPage(1);
    setSavedSearchMenuAnchor(null);
    setSnackbarMessage(`Loaded search: ${search.name}`);
  }, []);

  const handleDeleteSavedSearch = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this saved search?')) {
      await deleteSearch.mutateAsync(id);
      setSnackbarMessage('Search deleted');
    }
  }, [deleteSearch]);

  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    const candidateIds = Array.from(selectedCandidates);
    if (candidateIds.length === 0) {
      alert('Please select candidates to export');
      return;
    }

    const blob = await exportCandidates.mutateAsync({ format, candidateIds });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `candidates-${Date.now()}.${format}`;
    link.click();
    window.URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
    setSnackbarMessage(`Exported ${candidateIds.length} candidates as ${format.toUpperCase()}`);
  }, [selectedCandidates, exportCandidates]);

  // Boolean search helper
  const handleBooleanOperator = useCallback((operator: string) => {
    setSearchQuery((prev) => `${prev} ${operator} `);
  }, []);

  // Computed values
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'sort') return false;
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [filters]);

  // Premium gate
  if (!hasPremium) {
    return <PremiumGate hasPremium={hasPremium} onUpgrade={() => console.log('Upgrade')} />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Candidate Search
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find the perfect talent for your team
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Autocomplete
            freeSolo
            options={suggestions || []}
            value={searchQuery}
            onInputChange={(_, value) => handleSearch(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search by name, skills, or keywords..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          {/* Boolean Search Helper */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Boolean operators:
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Code />}
              onClick={() => handleBooleanOperator('AND')}
            >
              AND
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Code />}
              onClick={() => handleBooleanOperator('OR')}
            >
              OR
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Code />}
              onClick={() => handleBooleanOperator('NOT')}
            >
              NOT
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFiltersDrawerOpen(true)}
          >
            Filters
            {activeFilterCount > 0 && (
              <Chip label={activeFilterCount} size="small" sx={{ ml: 1 }} />
            )}
          </Button>

          <Button
            variant="outlined"
            startIcon={<BookmarkBorder />}
            onClick={(e) => setSavedSearchMenuAnchor(e.currentTarget)}
          >
            Saved Searches
          </Button>

          {searchQuery || activeFilterCount > 0 ? (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleSaveSearch}
            >
              Save Search
            </Button>
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1}>
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            {selectedCandidates.size} selected
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
            disabled={selectedCandidates.size === 0}
          >
            Export
          </Button>
        </Stack>
      </Box>

      {/* Results */}
      <Grid container spacing={3}>
        {/* Candidates Grid */}
        <Grid item xs={12}>
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load candidates. Please try again.
            </Alert>
          )}

          {!isLoading && !error && searchResults && searchResults.candidates.length === 0 && (
            <Paper sx={{ p: 8, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No candidates found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search criteria or filters
              </Typography>
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                sx={{ mt: 2 }}
              >
                Clear Filters
              </Button>
            </Paper>
          )}

          {!isLoading && !error && searchResults && searchResults.candidates.length > 0 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Found {searchResults.total} candidates
              </Typography>

              <Grid container spacing={2}>
                {searchResults.candidates.map((candidate) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={candidate.id}>
                    <Box sx={{ position: 'relative' }}>
                      <Checkbox
                        checked={selectedCandidates.has(candidate.id)}
                        onChange={() => handleToggleSelect(candidate.id)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1,
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                        }}
                      />
                      <CandidateCard
                        candidate={candidate}
                        onClick={handleCandidateClick}
                        selected={selectedCandidate?.id === candidate.id}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {searchResults.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={searchResults.totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* Filters Drawer */}
      <Drawer
        anchor="left"
        open={filtersDrawerOpen}
        onClose={() => setFiltersDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 350 },
            p: 3,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Advanced Filters
          </Typography>
          <IconButton onClick={() => setFiltersDrawerOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        <SearchFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </Drawer>

      {/* Profile Preview */}
      <ProfilePreview
        candidate={selectedCandidate}
        open={profilePreviewOpen}
        onClose={() => setProfilePreviewOpen(false)}
      />

      {/* Saved Searches Menu */}
      <Menu
        anchorEl={savedSearchMenuAnchor}
        open={Boolean(savedSearchMenuAnchor)}
        onClose={() => setSavedSearchMenuAnchor(null)}
      >
        {savedSearches && savedSearches.length > 0 ? (
          savedSearches.map((search) => (
            <MenuItem
              key={search.id}
              onClick={() => handleLoadSavedSearch(search)}
              sx={{ display: 'flex', justifyContent: 'space-between', minWidth: 250 }}
            >
              <Typography>{search.name}</Typography>
              <IconButton
                size="small"
                onClick={(e) => handleDeleteSavedSearch(search.id, e)}
              >
                <Close fontSize="small" />
              </IconButton>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No saved searches</MenuItem>
        )}
      </Menu>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
        <MenuItem onClick={() => handleExport('json')}>Export as JSON</MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={3000}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default CandidateSearchPage;
