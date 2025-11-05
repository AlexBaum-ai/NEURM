/**
 * MediaLibraryPage
 * Admin page for media management
 */

import React from 'react';
import MediaLibrary from '../components/MediaLibrary';

export const MediaLibraryPage: React.FC = () => {
  return (
    <div className="h-screen flex flex-col">
      <MediaLibrary />
    </div>
  );
};

export default MediaLibraryPage;
