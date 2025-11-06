import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-600 text-white hover:bg-primary-700',
        primary: 'border-transparent bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'border-transparent bg-secondary-100 text-secondary-900 hover:bg-secondary-200 dark:bg-secondary-900 dark:text-secondary-100',
        success: 'border-transparent bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-900 dark:text-green-100',
        destructive: 'border-transparent bg-accent-600 text-white hover:bg-accent-700',
        accent: 'border-transparent bg-accent-100 text-accent-900 hover:bg-accent-200 dark:bg-accent-900 dark:text-accent-100',
        outline: 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
        tech: 'border-transparent bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
