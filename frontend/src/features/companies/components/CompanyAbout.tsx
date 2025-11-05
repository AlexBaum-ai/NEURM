/**
 * CompanyAbout Component
 *
 * About section with description, mission, and company details
 */

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Link as MuiLink,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Language as WebsiteIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  GitHub as GitHubIcon,
  CheckCircle as CheckIcon,
  Code as CodeIcon,
  Memory as MemoryIcon,
} from '@mui/icons-material';
import type { Company } from '../types';

interface CompanyAboutProps {
  company: Company;
}

const CompanyAbout: React.FC<CompanyAboutProps> = ({ company }) => {
  const hasTechStack =
    company.techStack &&
    (company.techStack.modelsUsed?.length ||
      company.techStack.frameworks?.length ||
      company.techStack.languages?.length);

  return (
    <Box className="space-y-6">
      {/* About Section */}
      <Paper className="p-6">
        <Typography variant="h5" className="font-semibold mb-4">
          About {company.name}
        </Typography>

        {company.description && (
          <Typography variant="body1" className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
            {company.description}
          </Typography>
        )}

        {company.mission && (
          <Box className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Typography variant="subtitle2" className="font-semibold mb-2">
              Our Mission
            </Typography>
            <Typography variant="body2" className="text-gray-700 dark:text-gray-300">
              {company.mission}
            </Typography>
          </Box>
        )}

        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {company.foundedYear && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Founded
              </Typography>
              <Typography variant="body1" className="font-medium">
                {company.foundedYear}
              </Typography>
            </Box>
          )}
          {company.companySize && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Company Size
              </Typography>
              <Typography variant="body1" className="font-medium">
                {company.companySize} employees
              </Typography>
            </Box>
          )}
          {company.locations.length > 0 && (
            <Box className="md:col-span-2">
              <Typography variant="caption" color="text.secondary" className="mb-2 block">
                Locations
              </Typography>
              <Box className="flex flex-wrap gap-2">
                {company.locations.map((location) => (
                  <Chip key={location} label={location} size="small" />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Tech Stack Section */}
      {hasTechStack && (
        <Paper className="p-6">
          <Typography variant="h6" className="font-semibold mb-4 flex items-center gap-2">
            <CodeIcon />
            Tech Stack
          </Typography>

          <Box className="space-y-4">
            {company.techStack.modelsUsed && company.techStack.modelsUsed.length > 0 && (
              <Box>
                <Box className="flex items-center gap-2 mb-2">
                  <MemoryIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" className="font-medium">
                    LLM Models
                  </Typography>
                </Box>
                <Box className="flex flex-wrap gap-2">
                  {company.techStack.modelsUsed.map((model) => (
                    <Chip key={model} label={model} size="small" color="primary" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {company.techStack.frameworks && company.techStack.frameworks.length > 0 && (
              <Box>
                <Typography variant="subtitle2" className="font-medium mb-2">
                  Frameworks & Tools
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {company.techStack.frameworks.map((framework) => (
                    <Chip key={framework} label={framework} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {company.techStack.languages && company.techStack.languages.length > 0 && (
              <Box>
                <Typography variant="subtitle2" className="font-medium mb-2">
                  Programming Languages
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {company.techStack.languages.map((language) => (
                    <Chip key={language} label={language} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Benefits Section */}
      {company.benefits.length > 0 && (
        <Paper className="p-6">
          <Typography variant="h6" className="font-semibold mb-4">
            Benefits & Perks
          </Typography>
          <List dense>
            {company.benefits.map((benefit, index) => (
              <ListItem key={index} disablePadding className="mb-2">
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={benefit} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Culture Section */}
      {company.cultureDescription && (
        <Paper className="p-6">
          <Typography variant="h6" className="font-semibold mb-4">
            Culture & Values
          </Typography>
          <Typography variant="body1" className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {company.cultureDescription}
          </Typography>
        </Paper>
      )}

      {/* Social Links Section */}
      {(company.website || company.linkedinUrl || company.twitterUrl || company.githubUrl) && (
        <Paper className="p-6">
          <Typography variant="h6" className="font-semibold mb-4">
            Connect With Us
          </Typography>
          <Divider className="mb-4" />
          <Box className="space-y-2">
            {company.website && (
              <Box className="flex items-center gap-2">
                <WebsiteIcon color="action" />
                <MuiLink
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {company.website}
                </MuiLink>
              </Box>
            )}
            {company.linkedinUrl && (
              <Box className="flex items-center gap-2">
                <LinkedInIcon color="action" />
                <MuiLink
                  href={company.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  LinkedIn
                </MuiLink>
              </Box>
            )}
            {company.twitterUrl && (
              <Box className="flex items-center gap-2">
                <TwitterIcon color="action" />
                <MuiLink
                  href={company.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Twitter
                </MuiLink>
              </Box>
            )}
            {company.githubUrl && (
              <Box className="flex items-center gap-2">
                <GitHubIcon color="action" />
                <MuiLink
                  href={company.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  GitHub
                </MuiLink>
              </Box>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default CompanyAbout;
