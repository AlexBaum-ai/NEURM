import React, { ComponentType } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  width?: string | number;
  className?: string;
  overscanCount?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

/**
 * VirtualList component that uses react-window for efficient rendering of large lists
 *
 * Features:
 * - Only renders visible items
 * - Configurable item height and list height
 * - Supports custom item renderer
 * - Overscan for smoother scrolling
 *
 * @example
 * <VirtualList
 *   items={articles}
 *   itemHeight={120}
 *   height={600}
 *   renderItem={(article, index) => (
 *     <ArticleCard key={article.id} article={article} />
 *   )}
 * />
 */
export function VirtualList<T>({
  items,
  itemHeight,
  height,
  width = '100%',
  className,
  overscanCount = 5,
  renderItem,
}: VirtualListProps<T>) {
  // Row renderer for react-window
  const Row: ComponentType<ListChildComponentProps> = ({ index, style }) => {
    const item = items[index];
    return (
      <div style={style} className={className}>
        {renderItem(item, index)}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        No items to display
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      overscanCount={overscanCount}
      className={className}
    >
      {Row}
    </List>
  );
}

export default VirtualList;
