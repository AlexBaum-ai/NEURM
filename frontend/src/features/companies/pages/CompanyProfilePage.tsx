/**
 * CompanyProfilePage
 *
 * Public company profile page showing company information, jobs, and culture
 */

import React, { Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, CircularProgress, Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { CompanyHero, CompanyAbout, CompanyJobs } from '../components';
import { useCompany, useFollowCompany } from '../hooks/useCompany';
import { useAuth } from '@/features/auth/hooks/useAuth';

const CompanyProfileContent: React.FC<{ slug: string }> = ({ slug }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company, jobs } = useCompany(slug);
  const { follow, unfollow, isFollowing, isUnfollowing } = useFollowCompany(company.id, slug);

  // Check if current user is the company owner
  const isOwner = user?.userId === company.ownerUserId;

  const handleEdit = () => {
    navigate(`/companies/${slug}/settings`);
  };

  return (
    <>
      <Helmet>
        <title>{company.name} - Company Profile | Neurmatic</title>
        <meta
          name="description"
          content={company.description || `Learn about ${company.name} and view open positions.`}
        />
        <meta property="og:title" content={`${company.name} - Company Profile`} />
        <meta
          property="og:description"
          content={company.description || `Learn about ${company.name} and view open positions.`}
        />
        {company.logoUrl && <meta property="og:image" content={company.logoUrl} />}
        <meta property="og:type" content="profile" />
        <link rel="canonical" href={`https://neurmatic.com/companies/${slug}`} />
      </Helmet>

      <Box className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <CompanyHero
          company={company}
          isOwner={isOwner}
          isFollowing={company.isFollowing}
          onFollow={follow}
          onUnfollow={unfollow}
          onEdit={handleEdit}
          followLoading={isFollowing || isUnfollowing}
        />

        {/* Main Content */}
        <Container maxWidth="lg" className="py-8">
          {/* Breadcrumbs */}
          <Breadcrumbs aria-label="breadcrumb" className="mb-6">
            <MuiLink color="inherit" href="/" className="hover:underline">
              Home
            </MuiLink>
            <MuiLink color="inherit" href="/companies" className="hover:underline">
              Companies
            </MuiLink>
            <Typography color="text.primary">{company.name}</Typography>
          </Breadcrumbs>

          <Box className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - About */}
            <Box className="lg:col-span-2">
              <CompanyAbout company={company} />
            </Box>

            {/* Right Column - Jobs */}
            <Box className="lg:col-span-1">
              <Box className="sticky top-4">
                <CompanyJobs jobs={jobs} companyName={company.name} />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
};

const CompanyProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return (
      <Container maxWidth="lg" className="py-12 text-center">
        <Typography variant="h5" color="error">
          Company not found
        </Typography>
      </Container>
    );
  }

  return (
    <Suspense
      fallback={
        <Box className="flex items-center justify-center min-h-screen">
          <CircularProgress />
        </Box>
      }
    >
      <CompanyProfileContent slug={slug} />
    </Suspense>
  );
};

export default CompanyProfilePage;
