/**
 * SearchBar Component
 * Forum search bar with autocomplete, history, and saved searches
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Typography,
  Chip,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Bookmark as BookmarkIcon,
  TrendingUp as TrendingIcon,
  QuestionAnswer as QuestionIcon,
  Chat as DiscussionIcon,
  EmojiObjects as ShowcaseIcon,
  School as TutorialIcon,
} from '@mui/icons-material';
import { useSearchSuggestions, useSearchHistory, useSavedSearches, usePopularSearches } from '../hooks';
import type { TopicType } from '../types';

interface SearchBarProps {
  autoFocus?: boolean;
  placeholder?: string;
  size?: 'small' | 'medium';
}

const topicTypeIcons: Record<TopicType, React.ElementType> = {
  question: QuestionIcon,
  discussion: DiscussionIcon,
  showcase: ShowcaseIcon,
  tutorial: TutorialIcon,
  announcement: TrendingIcon,
  paper: BookmarkIcon,
};

export const SearchBar: React.FC<SearchBarProps> = ({
  autoFocus = false,
  placeholder = 'Search forum...',
  size = 'medium',
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced query for suggestions
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: suggestions = [], isLoading } = useSearchSuggestions(debouncedQuery);
  const { data: history = [] } = useSearchHistory();
  const { savedSearches } = useSavedSearches();
  const { data: popularSearches = [] } = usePopularSearches();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      navigate(`/forum/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = getDropdownItems();

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        handleSearch(items[selectedIndex].query);
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const getDropdownItems = () => {
    const items: Array<{ type: string; query: string; label?: string; topicType?: TopicType }> = [];

    if (query.length >= 2 && suggestions.length > 0) {
      items.push(
        ...suggestions.map((s) => ({
          type: 'suggestion',
          query: s.title,
          label: s.categoryName,
          topicType: s.type,
        }))
      );
    } else if (query.length === 0) {
      // Show history
      if (history.length > 0) {
        items.push(
          ...history.slice(0, 5).map((h) => ({
            type: 'history',
            query: h.query,
          }))
        );
      }

      // Show saved searches
      if (savedSearches.length > 0) {
        items.push(
          ...savedSearches.slice(0, 3).map((s) => ({
            type: 'saved',
            query: s.query,
            label: s.name,
          }))
        );
      }

      // Show popular searches
      if (popularSearches.length > 0 && items.length < 8) {
        items.push(
          ...popularSearches.slice(0, 3).map((p) => ({
            type: 'popular',
            query: p.query,
          }))
        );
      }
    }

    return items;
  };

  const dropdownItems = getDropdownItems();
  const showDropdown = isOpen && (query.length >= 2 || dropdownItems.length > 0);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        inputRef={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        size={size}
        autoFocus={autoFocus}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              {isLoading ? (
                <CircularProgress size={20} />
              ) : (
                <IconButton
                  size="small"
                  onClick={() => {
                    setQuery('');
                    setIsOpen(false);
                    inputRef.current?.focus();
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
          },
        }}
      />

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <Paper
          ref={dropdownRef}
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1300,
          }}
        >
          <List disablePadding>
            {dropdownItems.map((item, index) => {
              const Icon =
                item.type === 'history'
                  ? HistoryIcon
                  : item.type === 'saved'
                  ? BookmarkIcon
                  : item.type === 'popular'
                  ? TrendingIcon
                  : item.topicType
                  ? topicTypeIcons[item.topicType]
                  : SearchIcon;

              return (
                <React.Fragment key={`${item.type}-${item.query}-${index}`}>
                  {index > 0 &&
                    dropdownItems[index - 1].type !== item.type && (
                      <Divider />
                    )}
                  <ListItem disablePadding>
                    <ListItemButton
                      selected={selectedIndex === index}
                      onClick={() => handleSearch(item.query)}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'action.selected',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <Icon fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2">{item.query}</Typography>
                            {item.label && (
                              <Chip
                                label={item.label}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                }}
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          item.type === 'history'
                            ? 'Recent search'
                            : item.type === 'saved'
                            ? 'Saved search'
                            : item.type === 'popular'
                            ? 'Popular'
                            : undefined
                        }
                        secondaryTypographyProps={{
                          variant: 'caption',
                          color: 'text.secondary',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </React.Fragment>
              );
            })}

            {query.length >= 2 && dropdownItems.length === 0 && !isLoading && (
              <ListItem>
                <ListItemText
                  primary="No suggestions found"
                  secondary="Press Enter to search"
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'text.secondary',
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                  }}
                />
              </ListItem>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default SearchBar;
