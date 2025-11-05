/**
 * TopicFilters Component
 * Filter panel for topic listing with type, status, sort, and code filters
 */

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
} from '@mui/material';
import {
  QuestionAnswer,
  Chat,
  EmojiObjects,
  School,
  Campaign,
  Article,
  Code,
} from '@mui/icons-material';
import type { TopicType, TopicStatus } from '../types';

export interface TopicFilterState {
  type?: TopicType;
  status?: TopicStatus;
  hasCode?: boolean;
  sortBy: 'createdAt' | 'updatedAt' | 'viewCount' | 'replyCount' | 'voteScore';
  sortOrder: 'asc' | 'desc';
}

interface TopicFiltersProps {
  filters: TopicFilterState;
  onChange: (filters: TopicFilterState) => void;
}

const topicTypes: Array<{ value: TopicType; label: string; icon: React.ElementType }> = [
  { value: 'question', label: 'Question', icon: QuestionAnswer },
  { value: 'discussion', label: 'Discussion', icon: Chat },
  { value: 'showcase', label: 'Showcase', icon: EmojiObjects },
  { value: 'tutorial', label: 'Tutorial', icon: School },
  { value: 'announcement', label: 'Announcement', icon: Campaign },
  { value: 'paper', label: 'Paper Discussion', icon: Article },
];

const statusOptions: Array<{ value: TopicStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'archived', label: 'Archived' },
];

const sortOptions = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'updatedAt', label: 'Recently Updated' },
  { value: 'voteScore', label: 'Most Popular' },
  { value: 'replyCount', label: 'Most Discussed' },
  { value: 'viewCount', label: 'Most Viewed' },
];

const TopicFilters: React.FC<TopicFiltersProps> = ({ filters, onChange }) => {
  const handleTypeChange = (type: TopicType | undefined) => {
    onChange({ ...filters, type });
  };

  const handleStatusChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as TopicStatus | '';
    onChange({ ...filters, status: value || undefined });
  };

  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    onChange({ ...filters, sortBy: value as TopicFilterState['sortBy'] });
  };

  const handleCodeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, hasCode: event.target.checked ? true : undefined });
  };

  const activeFilterCount =
    (filters.type ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.hasCode ? 1 : 0);

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Filters
            {activeFilterCount > 0 && (
              <Chip
                label={activeFilterCount}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>

        {/* Type Filter */}
        <Box>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Topic Type
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip
              label="All"
              onClick={() => handleTypeChange(undefined)}
              color={!filters.type ? 'primary' : 'default'}
              variant={!filters.type ? 'filled' : 'outlined'}
              size="small"
            />
            {topicTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Chip
                  key={type.value}
                  icon={<Icon sx={{ fontSize: '1rem' }} />}
                  label={type.label}
                  onClick={() => handleTypeChange(type.value)}
                  color={filters.type === type.value ? 'primary' : 'default'}
                  variant={filters.type === type.value ? 'filled' : 'outlined'}
                  size="small"
                />
              );
            })}
          </Stack>
        </Box>

        <Divider />

        {/* Status Filter */}
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status || ''}
            onChange={handleStatusChange as any}
            label="Status"
          >
            <MenuItem value="">All Statuses</MenuItem>
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sort Filter */}
        <FormControl fullWidth size="small">
          <InputLabel>Sort By</InputLabel>
          <Select
            value={filters.sortBy}
            onChange={handleSortChange as any}
            label="Sort By"
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider />

        {/* Has Code Filter */}
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.hasCode || false}
                onChange={handleCodeToggle}
                icon={<Code />}
                checkedIcon={<Code />}
              />
            }
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <Code sx={{ fontSize: '1rem' }} />
                <Typography variant="body2">Contains Code</Typography>
              </Stack>
            }
          />
        </FormGroup>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Chip
            label="Clear All Filters"
            onClick={() =>
              onChange({
                sortBy: 'createdAt',
                sortOrder: 'desc',
              })
            }
            onDelete={() =>
              onChange({
                sortBy: 'createdAt',
                sortOrder: 'desc',
              })
            }
            variant="outlined"
            size="small"
          />
        )}
      </Stack>
    </Box>
  );
};

export default TopicFilters;
