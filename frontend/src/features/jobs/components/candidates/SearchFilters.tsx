/**
 * SearchFilters Component
 *
 * Advanced filters sidebar for candidate search
 */

import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Slider,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore,
  Clear,
} from '@mui/icons-material';
import type { CandidateSearchFilters, ExperienceLevel } from '../../types';

interface SearchFiltersProps {
  filters: CandidateSearchFilters;
  onChange: (filters: CandidateSearchFilters) => void;
  onReset: () => void;
}

// Common skills, models, frameworks for autocomplete
const commonSkills = [
  'Prompt Engineering',
  'Fine-tuning',
  'RAG',
  'LangChain',
  'Vector Databases',
  'Embeddings',
  'Model Evaluation',
  'Python',
  'TypeScript',
  'React',
  'Node.js',
];

const commonModels = [
  'GPT-4',
  'GPT-3.5',
  'Claude',
  'Gemini',
  'Llama 2',
  'Mistral',
  'PaLM',
];

const commonFrameworks = [
  'LangChain',
  'LlamaIndex',
  'Haystack',
  'Semantic Kernel',
  'AutoGPT',
];

const experienceLevels: ExperienceLevel[] = ['junior', 'mid', 'senior', 'lead', 'principal'];

/**
 * Search filters sidebar component
 */
const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onChange, onReset }) => {
  const handleFilterChange = <K extends keyof CandidateSearchFilters>(
    key: K,
    value: CandidateSearchFilters[K]
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'sort' || key === 'query') return false;
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  }).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
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
        {activeFilterCount > 0 && (
          <Button
            size="small"
            startIcon={<Clear />}
            onClick={onReset}
          >
            Clear all
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Skills */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight="medium">Skills</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete
                multiple
                options={commonSkills}
                freeSolo
                value={filters.skills || []}
                onChange={(_, value) => handleFilterChange('skills', value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Required Skills"
                    placeholder="Add skills..."
                    size="small"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />

              {filters.skills && filters.skills.length > 1 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Match Type
                  </Typography>
                  <ToggleButtonGroup
                    value={filters.skillsOperator || 'AND'}
                    exclusive
                    onChange={(_, value) => value && handleFilterChange('skillsOperator', value)}
                    size="small"
                    fullWidth
                  >
                    <ToggleButton value="AND">
                      AND (all)
                    </ToggleButton>
                    <ToggleButton value="OR">
                      OR (any)
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Tech Stack */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight="medium">Tech Stack</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete
                multiple
                options={commonModels}
                freeSolo
                value={filters.models || []}
                onChange={(_, value) => handleFilterChange('models', value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="LLM Models"
                    placeholder="Add models..."
                    size="small"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      color="primary"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />

              <Autocomplete
                multiple
                options={commonFrameworks}
                freeSolo
                value={filters.frameworks || []}
                onChange={(_, value) => handleFilterChange('frameworks', value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Frameworks"
                    placeholder="Add frameworks..."
                    size="small"
                  />
                )}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Location */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight="medium">Location</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Location"
                size="small"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="City, Country"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.remoteOnly || false}
                    onChange={(e) => handleFilterChange('remoteOnly', e.target.checked)}
                  />
                }
                label="Remote only"
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Experience */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight="medium">Experience</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete
                multiple
                options={experienceLevels}
                value={filters.experienceLevel || []}
                onChange={(_, value) => handleFilterChange('experienceLevel', value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Experience Level"
                    size="small"
                  />
                )}
                getOptionLabel={(option) => option.charAt(0).toUpperCase() + option.slice(1)}
              />

              <Box>
                <Typography variant="body2" gutterBottom>
                  Years of Experience
                </Typography>
                <Slider
                  value={[filters.minYearsExperience || 0, filters.maxYearsExperience || 20]}
                  onChange={(_, value) => {
                    const [min, max] = value as number[];
                    handleFilterChange('minYearsExperience', min);
                    handleFilterChange('maxYearsExperience', max);
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={20}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                    { value: 15, label: '15' },
                    { value: 20, label: '20+' },
                  ]}
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Reputation & Activity */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight="medium">Reputation & Activity</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Minimum Reputation"
                type="number"
                size="small"
                value={filters.minReputation || ''}
                onChange={(e) => handleFilterChange('minReputation', parseInt(e.target.value) || undefined)}
                placeholder="e.g. 500"
              />

              <Box>
                <Typography variant="body2" gutterBottom>
                  Last Active
                </Typography>
                <ToggleButtonGroup
                  value={filters.lastActiveWithin || 'any'}
                  exclusive
                  onChange={(_, value) => value && handleFilterChange('lastActiveWithin', value)}
                  size="small"
                  fullWidth
                  orientation="vertical"
                >
                  <ToggleButton value="7d">Last 7 days</ToggleButton>
                  <ToggleButton value="30d">Last 30 days</ToggleButton>
                  <ToggleButton value="90d">Last 90 days</ToggleButton>
                  <ToggleButton value="any">Any time</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Availability */}
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={filters.openToWorkOnly || false}
                onChange={(e) => handleFilterChange('openToWorkOnly', e.target.checked)}
              />
            }
            label="Open to work only"
          />
        </Box>

        <Divider />

        {/* Sort */}
        <Box>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Sort By
          </Typography>
          <ToggleButtonGroup
            value={filters.sort || 'relevance'}
            exclusive
            onChange={(_, value) => value && handleFilterChange('sort', value)}
            size="small"
            fullWidth
            orientation="vertical"
          >
            <ToggleButton value="relevance">Relevance</ToggleButton>
            <ToggleButton value="reputation">Reputation</ToggleButton>
            <ToggleButton value="experience">Experience</ToggleButton>
            <ToggleButton value="recent">Recently Active</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
    </Box>
  );
};

export default SearchFilters;
