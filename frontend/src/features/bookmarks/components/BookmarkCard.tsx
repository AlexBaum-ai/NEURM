import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  TextField,
  Button,
} from '@mui/material';
import {
  MoreVert,
  Delete,
  Edit,
  DriveFileMove,
  Schedule,
  Person,
  Bookmark,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import type { Bookmark as BookmarkType, BookmarkCollection } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface BookmarkCardProps {
  bookmark: BookmarkType;
  collections: BookmarkCollection[];
  onRemove: (slug: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onMoveToCollection: (id: string, collectionId: string) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  collections,
  onRemove,
  onUpdateNotes,
  onMoveToCollection,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(bookmark.notes || '');
  const [moveMenuAnchor, setMoveMenuAnchor] = useState<null | HTMLElement>(null);

  const menuOpen = Boolean(anchorEl);
  const moveMenuOpen = Boolean(moveMenuAnchor);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMoveMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMoveMenuAnchor(event.currentTarget);
    handleMenuClose();
  };

  const handleMoveMenuClose = () => {
    setMoveMenuAnchor(null);
  };

  const handleRemove = () => {
    onRemove(bookmark.article.slug);
    handleMenuClose();
  };

  const handleEditNotes = () => {
    setIsEditingNotes(true);
    handleMenuClose();
  };

  const handleSaveNotes = () => {
    onUpdateNotes(bookmark.id, notes);
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNotes(bookmark.notes || '');
    setIsEditingNotes(false);
  };

  const handleMoveToCollection = (collectionId: string) => {
    onMoveToCollection(bookmark.id, collectionId);
    handleMoveMenuClose();
  };

  return (
    <Card
      sx={{
        display: 'flex',
        mb: 2,
        position: 'relative',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      {bookmark.article.featuredImageUrl && (
        <CardMedia
          component="img"
          sx={{ width: 200, objectFit: 'cover' }}
          image={bookmark.article.featuredImageUrl}
          alt={bookmark.article.title}
        />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <CardContent sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Link
                to={`/news/${bookmark.article.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {bookmark.article.title}
                </Typography>
              </Link>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {bookmark.article.summary}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Avatar
                    src={bookmark.article.author.profile.avatarUrl}
                    sx={{ width: 24, height: 24 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {bookmark.article.author.profile.displayName || bookmark.article.author.username}
                  </Typography>
                </Box>

                <Chip
                  label={bookmark.article.category.name}
                  size="small"
                  variant="outlined"
                  sx={{ height: 24 }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {bookmark.article.readingTimeMinutes} min read
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Bookmark fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Saved {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
                  </Typography>
                </Box>
              </Box>

              {isEditingNotes ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Add notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="contained" onClick={handleSaveNotes}>
                      Save
                    </Button>
                    <Button size="small" variant="outlined" onClick={handleCancelNotes}>
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                bookmark.notes && (
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      borderLeft: 3,
                      borderColor: 'primary.main',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      <strong>Notes:</strong> {bookmark.notes}
                    </Typography>
                  </Box>
                )
              )}
            </Box>

            <IconButton size="small" onClick={handleMenuOpen} sx={{ height: 40 }}>
              <MoreVert />
            </IconButton>
          </Box>
        </CardContent>
      </Box>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditNotes}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          {bookmark.notes ? 'Edit Notes' : 'Add Notes'}
        </MenuItem>
        <MenuItem onClick={handleMoveMenuOpen}>
          <DriveFileMove fontSize="small" sx={{ mr: 1 }} />
          Move to Collection
        </MenuItem>
        <MenuItem onClick={handleRemove} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Remove Bookmark
        </MenuItem>
      </Menu>

      <Menu anchorEl={moveMenuAnchor} open={moveMenuOpen} onClose={handleMoveMenuClose}>
        {collections
          .filter((col) => col.id !== bookmark.collection.id)
          .map((collection) => (
            <MenuItem key={collection.id} onClick={() => handleMoveToCollection(collection.id)}>
              {collection.name}
            </MenuItem>
          ))}
      </Menu>
    </Card>
  );
};
