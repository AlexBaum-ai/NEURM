# Contributing to Neurmatic

Thank you for your interest in contributing to Neurmatic! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory comments
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

Ensure you have the required tools installed:

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL >= 15
- Redis >= 7
- Docker (optional, recommended)
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/neurmatic.git
cd neurmatic
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/neurmatic/neurmatic.git
```

### Setup Development Environment

#### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with backend API URL
npm run dev
```

#### Docker (Recommended)

```bash
docker-compose up -d
```

## Development Workflow

### Branch Naming Convention

Create a new branch for your work:

```bash
git checkout -b <type>/<description>
```

Branch types:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

Examples:
```bash
git checkout -b feature/add-user-profile
git checkout -b fix/login-validation
git checkout -b docs/update-api-endpoints
```

### Keep Your Fork Updated

Regularly sync your fork with the upstream repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### Making Changes

1. Create a new branch from `main`
2. Make your changes
3. Write or update tests
4. Ensure all tests pass
5. Lint and format your code
6. Commit your changes
7. Push to your fork
8. Open a pull request

## Code Style Guidelines

### General Principles

- Write clean, readable, and maintainable code
- Follow the Single Responsibility Principle
- Use descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Avoid code duplication (DRY principle)

### TypeScript

#### Type Safety

- **Always use TypeScript types** - No `any` types unless absolutely necessary
- **Explicit return types** for functions
- **Interface over type** for object shapes (unless union/intersection needed)

```typescript
// Good
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Bad
function calculateTotal(items: any): any {
  return items.reduce((sum: any, item: any) => sum + item.price, 0);
}
```

#### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_URL` |
| Functions | camelCase | `getUserById`, `formatDate` |
| Classes | PascalCase | `UserController`, `AuthService` |
| Interfaces | PascalCase (no I prefix) | `User`, `ApiResponse` |
| Types | PascalCase | `UserRole`, `HttpMethod` |
| Enums | PascalCase | `UserStatus`, `HttpStatusCode` |
| Files | kebab-case or PascalCase | `user-service.ts`, `UserController.ts` |

### Backend Code Style

#### Controllers

- Extend `BaseController` class
- Use `async/await` for asynchronous operations
- Return consistent response format

```typescript
class AuthController extends BaseController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      this.sendSuccess(res, result, 'Login successful', 200);
    } catch (error) {
      this.sendError(res, error);
    }
  }
}
```

#### Services

- Keep business logic in services
- Use dependency injection
- Return typed data

```typescript
class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = this.generateTokens(user);
    return { user, tokens };
  }
}
```

#### Validation

- Use Zod schemas for validation
- Define schemas in separate files

```typescript
// auth.validation.ts
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Route usage
router.post('/login', validate(loginSchema), authController.login);
```

### Frontend Code Style

#### Components

- Use functional components with hooks
- Type props with TypeScript interfaces
- Export default at the end of file

```typescript
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
};

export default Button;
```

#### Hooks

- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations
- Extract complex logic into custom hooks

```typescript
const handleSubmit = useCallback((data: FormData) => {
  // Handle submission
}, [dependency]);

const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

#### State Management

- Use Zustand for client state
- Use TanStack Query for server state
- Keep stores small and focused

```typescript
// Good: Focused store
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

// Bad: Bloated store
interface AppStore {
  user: User | null;
  theme: string;
  sidebar: boolean;
  notifications: Notification[];
  // ... too many concerns
}
```

### Linting and Formatting

#### ESLint

Run linting before committing:

```bash
# Backend
cd backend
npm run lint
npm run lint:fix

# Frontend
cd frontend
npm run lint
npm run lint:fix
```

#### Prettier

Format code:

```bash
# Backend
cd backend
npm run format

# Frontend
cd frontend
npm run format
```

#### Pre-commit Hook

Install pre-commit hook to automatically lint and format:

```bash
npm install -D husky lint-staged
npx husky install
```

## Commit Message Guidelines

### Commit Message Format

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type

Must be one of:

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without changing functionality
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build config, etc.)
- **ci**: CI/CD changes
- **revert**: Revert a previous commit

#### Scope

Optional, specifies the affected area:

- **backend**: Backend changes
- **frontend**: Frontend changes
- **auth**: Authentication module
- **api**: API changes
- **db**: Database changes
- **docs**: Documentation
- **deps**: Dependencies

#### Subject

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize the first letter
- No period at the end
- Max 72 characters

#### Examples

```
feat(auth): add OAuth GitHub provider

- Implement GitHub OAuth strategy
- Add callback route handler
- Update user model to support OAuth providers

Closes #123
```

```
fix(backend): resolve JWT token expiration issue

The refresh token was not being properly validated,
causing users to be logged out prematurely.

Fixes #456
```

```
docs(readme): update installation instructions

Add Docker setup instructions and troubleshooting section.
```

```
chore(deps): upgrade Prisma to v6.0.0

Update Prisma dependencies and regenerate client.
```

## Pull Request Process

### Before Submitting

1. **Update your branch** with the latest `main`:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests** and ensure they pass:
   ```bash
   npm test
   ```

3. **Run linting** and fix issues:
   ```bash
   npm run lint:fix
   ```

4. **Run type checking**:
   ```bash
   npm run type-check
   ```

5. **Update documentation** if needed

### Creating a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to the GitHub repository and click "New Pull Request"

3. Select your fork and branch as the source

4. Fill out the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
How did you test these changes?

## Screenshots (if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
   - Linting
   - Type checking
   - Tests
   - Build

2. **Code Review**: Maintainers will review your PR
   - Be responsive to feedback
   - Make requested changes
   - Discuss disagreements constructively

3. **Approval**: PR needs approval from at least one maintainer

4. **Merge**: Once approved, maintainers will merge your PR

### After Merge

1. Delete your feature branch:
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. Update your local `main`:
   ```bash
   git checkout main
   git pull upstream main
   ```

## Testing Requirements

### Test Coverage

- **Minimum coverage**: 80% overall
- **Services**: 90% coverage
- **Controllers**: 80% coverage
- **Utilities**: 90% coverage

### Writing Tests

#### Backend Tests (Jest)

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const result = await authService.login('user@example.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      await expect(
        authService.login('user@example.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

#### Frontend Tests (Vitest)

```typescript
describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Running Tests

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend
cd frontend
npm test
npm run test:coverage
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain "why" not "what"

```typescript
/**
 * Calculates match score between user skills and job requirements
 *
 * Uses weighted algorithm considering:
 * - Skill level match (40%)
 * - Years of experience (30%)
 * - Domain expertise (30%)
 *
 * @param userSkills - User's skill set with proficiency levels
 * @param jobRequirements - Job's required skills
 * @returns Match score between 0 and 100
 */
function calculateMatchScore(
  userSkills: Skill[],
  jobRequirements: JobRequirement[]
): number {
  // Implementation
}
```

### README Updates

When adding new features, update relevant README files:

- Root `README.md` for major features
- `backend/README.md` for API changes
- `frontend/README.md` for UI changes
- `projectdoc/` for technical details

### API Documentation

Update `projectdoc/03-API_ENDPOINTS.md` when:
- Adding new endpoints
- Modifying request/response formats
- Changing authentication requirements
- Updating rate limits

## Issue Reporting

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check documentation** for solutions
3. **Verify it's actually a bug** and not expected behavior

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
Clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Firefox]
- Node.js version: [e.g., 20.0.0]
- Version: [e.g., Sprint 0]

**Additional context**
Any other relevant information.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
Clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Mockups, examples, or other context.
```

## Getting Help

- **Documentation**: Check `projectdoc/` directory
- **Discord**: Join our Discord server (coming soon)
- **Issues**: Ask questions in GitHub Issues
- **Email**: dev@neurmatic.com

## License

By contributing to Neurmatic, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Neurmatic!
