import * as React from 'react';
import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/common/Button/Button';
import { useUIStore } from '@/store/uiStore';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useUIStore();

  const getIcon = () => {
    if (theme === 'dark') {
      return <MoonIcon className="h-5 w-5" />;
    }
    return <SunIcon className="h-5 w-5" />;
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return 'System theme';
      default:
        return 'Toggle theme';
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </Button>
  );
};

export default ThemeToggle;
