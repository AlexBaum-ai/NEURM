/**
 * SearchFilters Component
 * Advanced filters sidebar for forum search
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  TextField,
  Select,
  MenuItem,
  Button,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { useCategories } from '../hooks';
import type { SearchFilters as SearchFiltersType, TopicType, TopicStatus } from '../types';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onClear: () => void;
}

const topicTypes: Array<{ value: TopicType; label: string }> = [
  { value: 'question', label: 'Question' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'paper', label: 'Paper' },
];

const statusOptions: Array<{ value: TopicStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'archived', label: 'Archived' },
];

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClear,
}) => {
  const { data: categories = [] } = useCategories();

  const handleChange = (key: keyof SearchFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Filters
              </Typography>
              {activeFiltersCount > 0 && (
                <Chip
                  label={activeFiltersCount}
                  size="small"
                  color="primary"
                  sx={{ height: 20, minWidth: 20 }}
                />
              )}
            </Stack>
            {activeFiltersCount > 0 && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={onClear}
                color="secondary"
              >
                Clear All
              </Button>
            )}
          </Stack>
          <Divider />
        </Box>

        {/* Category Filter */}
        <FormControl fullWidth>
          <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Category</FormLabel>
          <Select
            value={filters.categoryId || ''}
            onChange={(e) => handleChange('categoryId', e.target.value || undefined)}
            size="small"
            displayEmpty
          >
            <MenuItem value="">
              <em>All Categories</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.level > 0 && '└─ '}
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider />

        {/* Type Filter */}
        <FormControl>
          <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Topic Type</FormLabel>
          <RadioGroup
            value={filters.type || ''}
            onChange={(e) => handleChange('type', e.target.value || undefined)}
          >
            <FormControlLabel value="" control={<Radio size="small" />} label="All Types" />
            {topicTypes.map((type) => (
              <FormControlLabel
                key={type.value}
                value={type.value}
                control={<Radio size="small" />}
                label={type.label}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <Divider />

        {/* Status Filter */}
        <FormControl>
          <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Status</FormLabel>
          <RadioGroup
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value || undefined)}
          >
            <FormControlLabel value="" control={<Radio size="small" />} label="All Statuses" />
            {statusOptions.map((status) => (
              <FormControlLabel
                key={status.value}
                value={status.value}
                control={<Radio size="small" />}
                label={status.label}
              />
            ))}
          </RadioGroup>
        </FormControl>

        <Divider />

        {/* Date Range */}
        <FormControl fullWidth>
          <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Date Range</FormLabel>
          <Stack spacing={2}>
            <TextField
              label="From"
              type="date"
              size="small"
              value={filters.dateFrom || ''}
              onChange={(e) => handleChange('dateFrom', e.target.value || undefined)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              value={filters.dateTo || ''}
              onChange={(e) => handleChange('dateTo', e.target.value || undefined)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </FormControl>

        <Divider />

        {/* Has Code */}
        <FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.hasCode || false}
                onChange={(e) => handleChange('hasCode', e.target.checked || undefined)}
                icon={<CodeIcon />}
                checkedIcon={<CodeIcon color="primary" />}
              />
            }
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2">Contains Code</Typography>
              </Stack>
            }
          />
        </FormControl>

        <Divider />

        {/* Minimum Upvotes */}
        <FormControl fullWidth>
          <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Minimum Upvotes</FormLabel>
          <TextField
            type="number"
            size="small"
            value={filters.minUpvotes || ''}
            onChange={(e) =>
              handleChange('minUpvotes', e.target.value ? parseInt(e.target.value) : undefined)
            }
            placeholder="0"
            inputProps={{ min: 0, step: 1 }}
          />
        </FormControl>

        <Divider />

        {/* Tag Filter */}
        <FormControl fullWidth>
          <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Tag</FormLabel>
          <TextField
            size="small"
            value={filters.tag || ''}
            onChange={(e) => handleChange('tag', e.target.value || undefined)}
            placeholder="Enter tag name..."
          />
        </FormControl>
      </Stack>
    </Paper>
  );
};

export default SearchFilters;
