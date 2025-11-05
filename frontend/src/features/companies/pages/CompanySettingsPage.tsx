/**
 * CompanySettingsPage
 *
 * Company profile settings page with form for editing company information
 */

import React, { Suspense, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
  MenuItem,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useCompany, useUpdateCompany } from '../hooks/useCompany';
import { useAuth } from '@/features/auth/hooks/useAuth';
import ImageUpload from '../components/ImageUpload';
import { companySettingsSchema, type CompanySettingsFormData } from '../validation/companySchema';
import type { CompanySize } from '../types';

const companySizeOptions: { value: CompanySize; label: string }[] = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const CompanySettingsContent: React.FC<{ slug: string }> = ({ slug }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company } = useCompany(slug);
  const updateMutation = useUpdateCompany(company.id);

  const [newLocation, setNewLocation] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [techStackField, setTechStackField] = useState('');

  // Check if current user is the company owner
  const isOwner = user?.userId === company.ownerUserId;

  if (!isOwner) {
    return (
      <Container maxWidth="md" className="py-12 text-center">
        <Typography variant="h5" color="error" className="mb-2">
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mb-4">
          You don't have permission to edit this company profile.
        </Typography>
        <Button variant="contained" onClick={() => navigate(`/companies/${slug}`)}>
          Back to Profile
        </Button>
      </Container>
    );
  }

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: company.name,
      website: company.website || '',
      description: company.description || '',
      logoUrl: company.logoUrl || '',
      headerImageUrl: company.headerImageUrl || '',
      industry: company.industry || '',
      companySize: company.companySize || '',
      location: company.location || '',
      locations: company.locations || [],
      foundedYear: company.foundedYear || null,
      mission: company.mission || '',
      benefits: company.benefits || [],
      cultureDescription: company.cultureDescription || '',
      techStack: company.techStack || {},
      linkedinUrl: company.linkedinUrl || '',
      twitterUrl: company.twitterUrl || '',
      githubUrl: company.githubUrl || '',
    },
  });

  const locations = watch('locations') || [];
  const benefits = watch('benefits') || [];
  const techStack = watch('techStack') || {};

  const onSubmit = async (data: CompanySettingsFormData) => {
    try {
      await updateMutation.mutateAsync(data);
      navigate(`/companies/${slug}`);
    } catch (error) {
      console.error('Failed to update company:', error);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/companies/${slug}`);
      }
    } else {
      navigate(`/companies/${slug}`);
    }
  };

  const handleAddLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setValue('locations', [...locations, newLocation.trim()], { shouldDirty: true });
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    setValue(
      'locations',
      locations.filter((l) => l !== location),
      { shouldDirty: true }
    );
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setValue('benefits', [...benefits, newBenefit.trim()], { shouldDirty: true });
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (benefit: string) => {
    setValue(
      'benefits',
      benefits.filter((b) => b !== benefit),
      { shouldDirty: true }
    );
  };

  const handleAddTechStackItem = (field: keyof typeof techStack, value: string) => {
    if (value.trim()) {
      const currentArray = techStack[field] || [];
      if (!currentArray.includes(value.trim())) {
        setValue(
          `techStack.${field}`,
          [...currentArray, value.trim()],
          { shouldDirty: true }
        );
      }
      setTechStackField('');
    }
  };

  const handleRemoveTechStackItem = (field: keyof typeof techStack, value: string) => {
    const currentArray = techStack[field] || [];
    setValue(
      `techStack.${field}`,
      currentArray.filter((item) => item !== value),
      { shouldDirty: true }
    );
  };

  return (
    <>
      <Helmet>
        <title>Edit {company.name} - Company Settings | Neurmatic</title>
      </Helmet>

      <Box className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <Container maxWidth="lg">
          {/* Header */}
          <Box className="flex items-center justify-between mb-6">
            <Box>
              <Breadcrumbs aria-label="breadcrumb" className="mb-2">
                <MuiLink color="inherit" href="/" className="hover:underline">
                  Home
                </MuiLink>
                <MuiLink
                  color="inherit"
                  href={`/companies/${slug}`}
                  className="hover:underline"
                >
                  {company.name}
                </MuiLink>
                <Typography color="text.primary">Settings</Typography>
              </Breadcrumbs>
              <Typography variant="h4" className="font-bold">
                Company Settings
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={handleCancel}
            >
              Back
            </Button>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box className="space-y-6">
              {/* Basic Information */}
              <Paper className="p-6">
                <Typography variant="h6" className="font-semibold mb-4">
                  Basic Information
                </Typography>
                <Box className="space-y-4">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Company Name"
                        fullWidth
                        required
                        error={!!errors.name}
                        helperText={errors.name?.message}
                      />
                    )}
                  />

                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Description"
                        fullWidth
                        multiline
                        rows={4}
                        error={!!errors.description}
                        helperText={errors.description?.message || `${field.value?.length || 0}/5000`}
                      />
                    )}
                  />

                  <Controller
                    name="mission"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Mission Statement"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.mission}
                        helperText={errors.mission?.message}
                      />
                    )}
                  />
                </Box>
              </Paper>

              {/* Company Details */}
              <Paper className="p-6">
                <Typography variant="h6" className="font-semibold mb-4">
                  Company Details
                </Typography>
                <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="industry"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Industry"
                        fullWidth
                        error={!!errors.industry}
                        helperText={errors.industry?.message}
                      />
                    )}
                  />

                  <Controller
                    name="companySize"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Company Size"
                        fullWidth
                        select
                        error={!!errors.companySize}
                        helperText={errors.companySize?.message}
                      >
                        <MenuItem value="">Not specified</MenuItem>
                        {companySizeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />

                  <Controller
                    name="foundedYear"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Founded Year"
                        fullWidth
                        type="number"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        error={!!errors.foundedYear}
                        helperText={errors.foundedYear?.message}
                      />
                    )}
                  />

                  <Controller
                    name="website"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Website"
                        fullWidth
                        error={!!errors.website}
                        helperText={errors.website?.message}
                      />
                    )}
                  />

                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Primary Location"
                        fullWidth
                        error={!!errors.location}
                        helperText={errors.location?.message}
                      />
                    )}
                  />
                </Box>

                {/* Multiple Locations */}
                <Box className="mt-4">
                  <Typography variant="subtitle2" className="mb-2">
                    Additional Locations
                  </Typography>
                  <Box className="flex gap-2 mb-2">
                    <TextField
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="Add location"
                      size="small"
                      fullWidth
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddLocation();
                        }
                      }}
                    />
                    <Button onClick={handleAddLocation} variant="outlined">
                      Add
                    </Button>
                  </Box>
                  <Box className="flex flex-wrap gap-2">
                    {locations.map((location) => (
                      <Chip
                        key={location}
                        label={location}
                        onDelete={() => handleRemoveLocation(location)}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>

              {/* Branding */}
              <Paper className="p-6">
                <Typography variant="h6" className="font-semibold mb-4">
                  Branding
                </Typography>
                <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="logoUrl"
                    control={control}
                    render={({ field }) => (
                      <ImageUpload
                        label="Company Logo"
                        currentImage={field.value}
                        onUpload={(file) => {
                          // In real implementation, this would upload to server
                          // For now, just update the URL field
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            field.onChange(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                        onRemove={() => field.onChange('')}
                        maxSize={2}
                        aspectRatio="1:1"
                        height={200}
                      />
                    )}
                  />

                  <Controller
                    name="headerImageUrl"
                    control={control}
                    render={({ field }) => (
                      <ImageUpload
                        label="Header Image"
                        currentImage={field.value}
                        onUpload={(file) => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            field.onChange(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                        onRemove={() => field.onChange('')}
                        maxSize={5}
                        aspectRatio="16:9"
                        height={200}
                      />
                    )}
                  />
                </Box>
              </Paper>

              {/* Tech Stack */}
              <Paper className="p-6">
                <Typography variant="h6" className="font-semibold mb-4">
                  Tech Stack
                </Typography>
                <Box className="space-y-4">
                  {/* LLM Models */}
                  <Box>
                    <Typography variant="subtitle2" className="mb-2">
                      LLM Models Used
                    </Typography>
                    <Box className="flex gap-2 mb-2">
                      <TextField
                        value={techStackField}
                        onChange={(e) => setTechStackField(e.target.value)}
                        placeholder="e.g., GPT-4, Claude"
                        size="small"
                        fullWidth
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTechStackItem('modelsUsed', techStackField);
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleAddTechStackItem('modelsUsed', techStackField)}
                        variant="outlined"
                      >
                        Add
                      </Button>
                    </Box>
                    <Box className="flex flex-wrap gap-2">
                      {(techStack.modelsUsed || []).map((model) => (
                        <Chip
                          key={model}
                          label={model}
                          onDelete={() => handleRemoveTechStackItem('modelsUsed', model)}
                          size="small"
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Frameworks */}
                  <Box>
                    <Typography variant="subtitle2" className="mb-2">
                      Frameworks & Tools
                    </Typography>
                    <Box className="flex gap-2 mb-2">
                      <TextField
                        value={techStackField}
                        onChange={(e) => setTechStackField(e.target.value)}
                        placeholder="e.g., LangChain, LlamaIndex"
                        size="small"
                        fullWidth
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTechStackItem('frameworks', techStackField);
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleAddTechStackItem('frameworks', techStackField)}
                        variant="outlined"
                      >
                        Add
                      </Button>
                    </Box>
                    <Box className="flex flex-wrap gap-2">
                      {(techStack.frameworks || []).map((framework) => (
                        <Chip
                          key={framework}
                          label={framework}
                          onDelete={() => handleRemoveTechStackItem('frameworks', framework)}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Languages */}
                  <Box>
                    <Typography variant="subtitle2" className="mb-2">
                      Programming Languages
                    </Typography>
                    <Box className="flex gap-2 mb-2">
                      <TextField
                        value={techStackField}
                        onChange={(e) => setTechStackField(e.target.value)}
                        placeholder="e.g., Python, TypeScript"
                        size="small"
                        fullWidth
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTechStackItem('languages', techStackField);
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleAddTechStackItem('languages', techStackField)}
                        variant="outlined"
                      >
                        Add
                      </Button>
                    </Box>
                    <Box className="flex flex-wrap gap-2">
                      {(techStack.languages || []).map((language) => (
                        <Chip
                          key={language}
                          label={language}
                          onDelete={() => handleRemoveTechStackItem('languages', language)}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* Benefits */}
              <Paper className="p-6">
                <Typography variant="h6" className="font-semibold mb-4">
                  Benefits & Perks
                </Typography>
                <Box className="flex gap-2 mb-2">
                  <TextField
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Add benefit"
                    size="small"
                    fullWidth
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                  />
                  <Button onClick={handleAddBenefit} variant="outlined">
                    Add
                  </Button>
                </Box>
                <Box className="flex flex-wrap gap-2">
                  {benefits.map((benefit) => (
                    <Chip
                      key={benefit}
                      label={benefit}
                      onDelete={() => handleRemoveBenefit(benefit)}
                      size="small"
                    />
                  ))}
                </Box>
              </Paper>

              {/* Culture */}
              <Paper className="p-6">
                <Typography variant="h6" className="font-semibold mb-4">
                  Culture & Values
                </Typography>
                <Controller
                  name="cultureDescription"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Culture Description"
                      fullWidth
                      multiline
                      rows={6}
                      error={!!errors.cultureDescription}
                      helperText={
                        errors.cultureDescription?.message || `${field.value?.length || 0}/5000`
                      }
                    />
                  )}
                />
              </Paper>

              {/* Social Links */}
              <Paper className="p-6">
                <Typography variant="h6" className="font-semibold mb-4">
                  Social Links
                </Typography>
                <Box className="space-y-4">
                  <Controller
                    name="linkedinUrl"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="LinkedIn URL"
                        fullWidth
                        error={!!errors.linkedinUrl}
                        helperText={errors.linkedinUrl?.message}
                      />
                    )}
                  />

                  <Controller
                    name="twitterUrl"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Twitter URL"
                        fullWidth
                        error={!!errors.twitterUrl}
                        helperText={errors.twitterUrl?.message}
                      />
                    )}
                  />

                  <Controller
                    name="githubUrl"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="GitHub URL"
                        fullWidth
                        error={!!errors.githubUrl}
                        helperText={errors.githubUrl?.message}
                      />
                    )}
                  />
                </Box>
              </Paper>

              {/* Form Actions */}
              <Paper className="p-6">
                <Box className="flex justify-end gap-3">
                  <Button variant="outlined" onClick={handleCancel} disabled={updateMutation.isPending}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={updateMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={!isDirty || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Paper>
            </Box>
          </form>
        </Container>
      </Box>
    </>
  );
};

const CompanySettingsPage: React.FC = () => {
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
      <CompanySettingsContent slug={slug} />
    </Suspense>
  );
};

export default CompanySettingsPage;
