import * as React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/common/Modal/Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useAuth } from '../hooks/useAuth';
import type { AuthView, LoginFormData, RegisterFormData } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: AuthView;
  redirectTo?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultView = 'login',
  redirectTo,
}) => {
  const [view, setView] = React.useState<AuthView>(defaultView);
  const [error, setError] = React.useState<string | null>(null);

  const {
    login,
    register,
    handleOAuth,
    isLoggingIn,
    isRegistering,
    loginError,
    registerError,
  } = useAuth({
    redirectTo,
    onSuccess: () => {
      onClose();
      setError(null);
    },
    onError: (err) => {
      setError(err.message || 'An error occurred. Please try again.');
    },
  });

  // Reset view and error when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setView(defaultView);
      setError(null);
    }
  }, [isOpen, defaultView]);

  // Update error from mutations
  React.useEffect(() => {
    if (loginError) {
      const errorResponse = loginError as { response?: { data?: { message?: string } } };
      setError(errorResponse?.response?.data?.message || loginError.message || 'Login failed');
    }
  }, [loginError]);

  React.useEffect(() => {
    if (registerError) {
      const errorResponse = registerError as { response?: { data?: { message?: string } } };
      setError(errorResponse?.response?.data?.message || registerError.message || 'Registration failed');
    }
  }, [registerError]);

  const handleSwitchToRegister = React.useCallback(() => {
    setView('register');
    setError(null);
  }, []);

  const handleSwitchToLogin = React.useCallback(() => {
    setView('login');
    setError(null);
  }, []);

  const handleForgotPassword = React.useCallback(() => {
    // TODO: Implement forgot password flow
    alert('Forgot password feature coming soon!');
  }, []);

  const handleLoginSubmit = React.useCallback(async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data);
    } catch {
      // Error handled by useAuth hook
    }
  }, [login]);

  const handleRegisterSubmit = React.useCallback(async (data: RegisterFormData) => {
    setError(null);
    try {
      await register(data);
    } catch {
      // Error handled by useAuth hook
    }
  }, [register]);

  const isLoading = isLoggingIn || isRegistering;

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>
            {view === 'login' ? 'Welcome back' : 'Create your account'}
          </ModalTitle>
          <ModalDescription>
            {view === 'login'
              ? 'Sign in to your account to continue'
              : 'Join the LLM community today'}
          </ModalDescription>
        </ModalHeader>

        <div className="mt-4">
          {view === 'login' ? (
            <LoginForm
              onSubmit={handleLoginSubmit}
              onSwitchToRegister={handleSwitchToRegister}
              onForgotPassword={handleForgotPassword}
              onOAuthClick={handleOAuth}
              isLoading={isLoading}
              error={error}
            />
          ) : (
            <RegisterForm
              onSubmit={handleRegisterSubmit}
              onSwitchToLogin={handleSwitchToLogin}
              onOAuthClick={handleOAuth}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;
