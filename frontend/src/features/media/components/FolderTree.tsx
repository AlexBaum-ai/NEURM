/**
 * FolderTree Component
 * Hierarchical folder navigation tree
 */

import React, { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Plus, Edit2, Trash2 } from 'lucide-react';
import { useFolderTree, useCreateFolder, useUpdateFolder, useDeleteFolder } from '../hooks/useMedia';
import type { FolderTreeNode } from '../types/media.types';
import { Button } from '@/components/common/Button/Button';

interface FolderTreeProps {
  selectedFolderId?: string;
  onSelectFolder: (folderId?: string) => void;
}

interface FolderNodeProps {
  node: FolderTreeNode;
  level: number;
  selectedFolderId?: string;
  onSelectFolder: (folderId?: string) => void;
  onCreateFolder: (parentId: string) => void;
  onRenameFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

const FolderNode: React.FC<FolderNodeProps> = ({
  node,
  level,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const isSelected = selectedFolderId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group
          ${isSelected ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={() => onSelectFolder(node.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        {isExpanded ? (
          <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        )}

        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
          {node.name}
        </span>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {node.mediaCount}
        </span>

        {showActions && (
          <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onCreateFolder(node.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Add subfolder"
            >
              <Plus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => onRenameFolder(node.id, node.name)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Rename folder"
            >
              <Edit2 className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => onDeleteFolder(node.id)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
              title="Delete folder"
            >
              <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <FolderNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({ selectedFolderId, onSelectFolder }) => {
  const { data: folderTree, isLoading } = useFolderTree();
  const { mutate: createFolder } = useCreateFolder();
  const { mutate: updateFolder } = useUpdateFolder();
  const { mutate: deleteFolder } = useDeleteFolder();

  const handleCreateFolder = (parentId?: string) => {
    const name = prompt('Enter folder name:');
    if (name) {
      createFolder({ name, parentId });
    }
  };

  const handleRenameFolder = (folderId: string, currentName: string) => {
    const name = prompt('Enter new folder name:', currentName);
    if (name && name !== currentName) {
      updateFolder({ id: folderId, name });
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    if (confirm('Are you sure you want to delete this folder? All media will be moved to root.')) {
      deleteFolder(folderId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading folders...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Folders</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleCreateFolder()}
            className="h-7 px-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* All Media (Root) */}
        <div
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
            ${!selectedFolderId ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
          `}
          onClick={() => onSelectFolder(undefined)}
        >
          <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">All Media</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {folderTree?.map((node) => (
          <FolderNode
            key={node.id}
            node={node}
            level={0}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />
        ))}
      </div>
    </div>
  );
};

export default FolderTree;
