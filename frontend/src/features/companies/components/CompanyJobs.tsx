/**
 * CompanyJobs Component
 *
 * Display company's active job postings in a grid
 */

import React from 'react';
import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import {
  LocationOn as LocationIcon,
  WorkOutline as WorkIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import type { CompanyJob } from '../types';

interface CompanyJobsProps {
  jobs: CompanyJob[];
  companyName: string;
}

const CompanyJobs: React.FC<CompanyJobsProps> = ({ jobs, companyName }) => {
  if (jobs.length === 0) {
    return (
      <Paper className="p-8 text-center">
        <WorkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" className="mb-2">
          No Active Positions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {companyName} doesn't have any open positions at the moment. Follow the company to get
          notified when new jobs are posted.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5" className="font-semibold mb-4">
        Open Positions ({jobs.length})
      </Typography>

      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <Paper
            key={job.id}
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
            component={Link}
            to={`/jobs/${job.slug}`}
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" className="font-semibold mb-2 line-clamp-2">
              {job.title}
            </Typography>

            <Box className="space-y-2 mb-4 flex-1">
              <Box className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <LocationIcon fontSize="small" />
                <Typography variant="body2">{job.location}</Typography>
              </Box>

              <Box className="flex flex-wrap gap-2">
                <Chip
                  label={job.workLocation.replace('_', ' ')}
                  size="small"
                  color={job.workLocation === 'remote' ? 'primary' : 'default'}
                  variant="outlined"
                />
                <Chip
                  label={job.experienceLevel}
                  size="small"
                  variant="outlined"
                  className="capitalize"
                />
              </Box>

              {job.salaryMin && job.salaryMax && (
                <Typography variant="body2" className="font-medium text-green-600 dark:text-green-400">
                  {job.salaryCurrency || '$'}
                  {job.salaryMin.toLocaleString()} - {job.salaryCurrency || '$'}
                  {job.salaryMax.toLocaleString()}
                </Typography>
              )}
            </Box>

            <Button
              variant="text"
              endIcon={<ArrowIcon />}
              size="small"
              className="self-start"
              sx={{ mt: 'auto' }}
            >
              View Details
            </Button>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default CompanyJobs;
