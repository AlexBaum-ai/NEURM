/**
 * ProfilePreview Component
 *
 * Condensed profile view respecting privacy settings
 */

import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Avatar,
  IconButton,
  Button,
  Chip,
  Stack,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Link as MuiLink,
} from '@mui/material';
import {
  Close,
  Mail,
  LocationOn,
  Star,
  WorkOutline,
  GitHub,
  LinkedIn,
  Language,
  Bookmark,
  BookmarkBorder,
  Description,
} from '@mui/icons-material';
import { useCandidate, useSaveCandidate, useUnsaveCandidate, useSendMessage } from '../../hooks';
import { useAuthStore } from '@/store/authStore';
import type { CandidateSearchResult, CandidateSkill } from '../../types/candidates';
import EndorseButton from './EndorseButton';
import EndorsersList from './EndorsersList';

interface ProfilePreviewProps {
  candidate: CandidateSearchResult | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Profile preview drawer component
 * Shows condensed profile view respecting privacy settings
 */
const ProfilePreview: React.FC<ProfilePreviewProps> = ({ candidate, open, onClose }) => {
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [endorsersModalOpen, setEndorsersModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<CandidateSkill | null>(null);

  const { user } = useAuthStore();
  const { data: fullProfile, isLoading } = useCandidate(candidate?.id || '', open && !!candidate);
  const saveCandidate = useSaveCandidate();
  const unsaveCandidate = useUnsaveCandidate();
  const sendMessage = useSendMessage();

  const profile = fullProfile || candidate;
  const isOwnProfile = user?.username === profile?.username;

  if (!candidate || !profile) {
    return null;
  }

  const handleSave = async () => {
    if (isSaved) {
      await unsaveCandidate.mutateAsync(candidate.id);
      setIsSaved(false);
    } else {
      await saveCandidate.mutateAsync({ candidateId: candidate.id });
      setIsSaved(true);
    }
  };

  const handleSendMessage = async () => {
    await sendMessage.mutateAsync({
      recipientId: candidate.userId,
      subject: messageSubject,
      message: messageBody,
    });
    setMessageDialogOpen(false);
    setMessageSubject('');
    setMessageBody('');
  };

  const showEmail = profile.privacySettings?.showEmail ?? false;
  const showGithub = profile.privacySettings?.showGithub ?? false;
  const showLinkedin = profile.privacySettings?.showLinkedin ?? false;
  const showResume = profile.privacySettings?.showResume ?? false;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 500 },
          },
        }}
      >
        {isLoading && <LinearProgress />}

        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">
              Candidate Profile
            </Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>

          {/* Profile Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              src={profile.avatarUrl}
              alt={profile.displayName}
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
            >
              {profile.displayName.charAt(0).toUpperCase()}
            </Avatar>

            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {profile.displayName}
            </Typography>

            {profile.headline && (
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {profile.headline}
              </Typography>
            )}

            {profile.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 2 }}>
                <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {profile.location}
                </Typography>
              </Box>
            )}

            {/* Match Score */}
            {candidate.matchScore !== undefined && (
              <Chip
                label={`${candidate.matchScore}% Match`}
                color={candidate.matchScore >= 80 ? 'success' : candidate.matchScore >= 60 ? 'warning' : 'default'}
                sx={{ mb: 2 }}
              />
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={1} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<Mail />}
                onClick={() => setMessageDialogOpen(true)}
              >
                Contact
              </Button>
              <IconButton onClick={handleSave} color={isSaved ? 'primary' : 'default'}>
                {isSaved ? <Bookmark /> : <BookmarkBorder />}
              </IconButton>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Bio */}
          {profile.bio && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                About
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile.bio}
              </Typography>
            </Box>
          )}

          {/* Experience */}
          {(profile.experienceLevel || profile.yearsOfExperience) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Experience
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WorkOutline sx={{ fontSize: 18, color: 'text.secondary' }} />
                {profile.experienceLevel && (
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {profile.experienceLevel.replace('_', ' ')} Level
                  </Typography>
                )}
                {profile.yearsOfExperience && (
                  <Typography variant="body2" color="text.secondary">
                    • {profile.yearsOfExperience} years
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Skills
              </Typography>
              <Stack spacing={2}>
                {profile.skills.map((skill, index) => (
                  <Box
                    key={skill.id || index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'background.default',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight="medium" noWrap>
                        {skill.name}
                      </Typography>
                      {skill.endorsementCount !== undefined && skill.endorsementCount > 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            cursor: skill.id ? 'pointer' : 'default',
                            '&:hover': skill.id
                              ? {
                                  textDecoration: 'underline',
                                  color: 'primary.main',
                                }
                              : {},
                          }}
                          onClick={() => {
                            if (skill.id) {
                              setSelectedSkill(skill);
                              setEndorsersModalOpen(true);
                            }
                          }}
                        >
                          {skill.endorsementCount}{' '}
                          {skill.endorsementCount === 1 ? 'endorsement' : 'endorsements'}
                        </Typography>
                      )}
                    </Box>

                    {/* Endorse Button - Only show if not own profile and skill has ID */}
                    {!isOwnProfile && skill.id && (
                      <EndorseButton
                        username={profile.username}
                        skillId={skill.id}
                        skillName={skill.name}
                        hasEndorsed={skill.hasEndorsed || false}
                        size="small"
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Top Skills (fallback if detailed skills not available) */}
          {(!profile.skills || profile.skills.length === 0) &&
            profile.topSkills &&
            profile.topSkills.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Top Skills
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.topSkills.map((skill, index) => (
                    <Chip key={index} label={skill} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

          {/* Tech Stack */}
          {profile.primaryLlms && profile.primaryLlms.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                LLM Models
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.primaryLlms.map((model, index) => (
                  <Chip key={index} label={model} size="small" color="primary" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {profile.frameworks && profile.frameworks.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Frameworks
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profile.frameworks.map((framework, index) => (
                  <Chip key={index} label={framework} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}

          {/* Reputation */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Community Reputation
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star sx={{ color: 'warning.main' }} />
              <Typography variant="h6" fontWeight="medium">
                {profile.reputation.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                points
              </Typography>
            </Box>
          </Box>

          {/* Links */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Links
            </Typography>
            <Stack spacing={1}>
              {showGithub && profile.githubUrl && (
                <MuiLink
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <GitHub sx={{ fontSize: 18 }} />
                  <Typography variant="body2">GitHub Profile</Typography>
                </MuiLink>
              )}
              {showLinkedin && profile.linkedinUrl && (
                <MuiLink
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <LinkedIn sx={{ fontSize: 18 }} />
                  <Typography variant="body2">LinkedIn Profile</Typography>
                </MuiLink>
              )}
              {profile.portfolioUrl && (
                <MuiLink
                  href={profile.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Language sx={{ fontSize: 18 }} />
                  <Typography variant="body2">Portfolio</Typography>
                </MuiLink>
              )}
              {showResume && profile.resumeUrl && (
                <MuiLink
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Description sx={{ fontSize: 18 }} />
                  <Typography variant="body2">Resume/CV</Typography>
                </MuiLink>
              )}
            </Stack>
          </Box>

          {!showEmail && !showGithub && !showLinkedin && !showResume && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This candidate has limited their profile visibility. Contact them directly to request more information.
            </Alert>
          )}
        </Box>
      </Drawer>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onClose={() => setMessageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message to {profile.displayName}</DialogTitle>
        <DialogContent>
          <TextField
            label="Subject"
            fullWidth
            value={messageSubject}
            onChange={(e) => setMessageSubject(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            label="Message"
            fullWidth
            multiline
            rows={6}
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Introduce yourself and describe the opportunity..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessageDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!messageSubject || !messageBody || sendMessage.isPending}
          >
            {sendMessage.isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Endorsers List Modal */}
      {selectedSkill && selectedSkill.id && (
        <EndorsersList
          open={endorsersModalOpen}
          onClose={() => {
            setEndorsersModalOpen(false);
            setSelectedSkill(null);
          }}
          username={profile.username}
          skillId={selectedSkill.id}
          skillName={selectedSkill.name}
        />
      )}
    </>
  );
};

export default ProfilePreview;
