/**
 * ReportButton Component
 * Displays a flag icon button to report content
 */

import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Flag as FlagIcon } from '@mui/icons-material';
import { ReportModal } from './ReportModal';
import type { ReportableType } from '../types/report';

interface ReportButtonProps {
  reportableType: ReportableType;
  reportableId: string;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

export const ReportButton: React.FC<ReportButtonProps> = ({
  reportableType,
  reportableId,
  size = 'small',
  showLabel = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <Tooltip title="Report this content">
        <IconButton
          size={size}
          onClick={handleClick}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'error.main',
              bgcolor: (theme) => `${theme.palette.error.main}10`,
            },
          }}
          aria-label={`Report this ${reportableType}`}
        >
          <FlagIcon fontSize={size} />
          {showLabel && (
            <span style={{ marginLeft: 4, fontSize: '0.875rem' }}>Report</span>
          )}
        </IconButton>
      </Tooltip>

      <ReportModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportableType={reportableType}
        reportableId={reportableId}
      />
    </>
  );
};

export default ReportButton;
