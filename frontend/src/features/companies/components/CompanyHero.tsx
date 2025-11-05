/**
 * CompanyHero Component
 *
 * Hero section with company branding, logo, and follow button
 */

import React from 'react';
import { Box, Typography, Button, Chip, Avatar } from '@mui/material';
import {
  Verified as VerifiedIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import type { Company } from '../types';

interface CompanyHeroProps {
  company: Company;
  isOwner?: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onEdit?: () => void;
  followLoading?: boolean;
}

const CompanyHero: React.FC<CompanyHeroProps> = ({
  company,
  isOwner = false,
  isFollowing = false,
  onFollow,
  onUnfollow,
  onEdit,
  followLoading = false,
}) => {
  const handleFollowClick = () => {
    if (isFollowing && onUnfollow) {
      onUnfollow();
    } else if (!isFollowing && onFollow) {
      onFollow();
    }
  };

  return (
    <Box className="relative">
      {/* Header Image */}
      <Box
        className="w-full h-64 md:h-80 bg-gradient-to-r from-blue-600 to-purple-600"
        sx={{
          backgroundImage: company.headerImageUrl
            ? `url(${company.headerImageUrl})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Company Info */}
      <Box className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Box className="relative -mt-16 sm:-mt-20 mb-8">
          <Box className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
            {/* Logo */}
            <Avatar
              src={company.logoUrl}
              alt={company.name}
              sx={{
                width: { xs: 120, sm: 160 },
                height: { xs: 120, sm: 160 },
                border: '4px solid white',
                boxShadow: 3,
                bgcolor: 'background.paper',
              }}
            >
              <BusinessIcon sx={{ fontSize: { xs: 48, sm: 64 } }} />
            </Avatar>

            {/* Company Name and Actions */}
            <Box className="flex-1 min-w-0">
              <Box className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <Box className="flex items-center gap-2">
                  <Typography
                    variant="h4"
                    component="h1"
                    className="font-bold truncate"
                    sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                  >
                    {company.name}
                  </Typography>
                  {company.verifiedCompany && (
                    <Chip
                      icon={<VerifiedIcon />}
                      label="Verified"
                      color="primary"
                      size="small"
                      className="shrink-0"
                    />
                  )}
                </Box>

                <Box className="flex items-center gap-2 sm:ml-auto">
                  {isOwner && onEdit && (
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={onEdit}
                      size="small"
                    >
                      Edit Profile
                    </Button>
                  )}
                  {!isOwner && (
                    <Button
                      variant={isFollowing ? 'outlined' : 'contained'}
                      onClick={handleFollowClick}
                      disabled={followLoading}
                      size="small"
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Location and Industry */}
              <Box className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400">
                {company.location && (
                  <Box className="flex items-center gap-1">
                    <LocationIcon fontSize="small" />
                    <Typography variant="body2">{company.location}</Typography>
                  </Box>
                )}
                {company.industry && (
                  <Chip label={company.industry} size="small" variant="outlined" />
                )}
                {company.companySize && (
                  <Chip label={`${company.companySize} employees`} size="small" variant="outlined" />
                )}
              </Box>

              {/* Stats */}
              <Box className="flex items-center gap-6 mt-3">
                <Box>
                  <Typography variant="h6" className="font-semibold">
                    {company.followerCount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Followers
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" className="font-semibold">
                    {company.viewCount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Profile Views
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CompanyHero;
