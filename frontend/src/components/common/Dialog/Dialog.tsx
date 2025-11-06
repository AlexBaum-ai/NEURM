/**
 * Dialog Component
 * A convenience wrapper around Radix UI Dialog with consistent styling
 */

import * as React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/common/Modal/Modal';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
}) => {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className={cn('sm:max-w-lg', sizeClasses[size])}>
        {(title || description) && (
          <ModalHeader>
            {title && <ModalTitle>{title}</ModalTitle>}
            {description && <ModalDescription>{description}</ModalDescription>}
          </ModalHeader>
        )}
        {children}
      </ModalContent>
    </Modal>
  );
};

Dialog.displayName = 'Dialog';

export default Dialog;
