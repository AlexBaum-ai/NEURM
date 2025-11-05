import React from 'react';
import { Box, ListItem, ListItemButton, ListItemText, IconButton, Menu, MenuItem, Chip } from '@mui/material';
import { MoreVert, Edit, Delete, Folder, FolderSpecial } from '@mui/icons-material';
import type { BookmarkCollection } from '../types';

interface CollectionItemProps {
  collection: BookmarkCollection;
  isActive: boolean;
  onClick: () => void;
  onEdit: (collection: BookmarkCollection) => void;
  onDelete: (collection: BookmarkCollection) => void;
}

export const CollectionItem: React.FC<CollectionItemProps> = ({
  collection,
  isActive,
  onClick,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    onEdit(collection);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleMenuClose();
    onDelete(collection);
  };

  return (
    <>
      <ListItem
        disablePadding
        secondaryAction={
          !collection.isDefault && (
            <IconButton edge="end" size="small" onClick={handleMenuOpen}>
              <MoreVert fontSize="small" />
            </IconButton>
          )
        }
      >
        <ListItemButton selected={isActive} onClick={onClick}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>
            {collection.isDefault ? (
              <FolderSpecial fontSize="small" color="primary" />
            ) : (
              <Folder fontSize="small" />
            )}
            <ListItemText
              primary={collection.name}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                noWrap: true,
              }}
            />
            <Chip
              label={collection.bookmarkCount}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.75rem',
                minWidth: 32,
              }}
            />
          </Box>
        </ListItemButton>
      </ListItem>

      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};
