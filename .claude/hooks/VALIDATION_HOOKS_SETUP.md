# Validation Hooks Setup Guide

## Overview

This guide explains how to configure the validation hooks that ensure code quality and spec compliance.

## Available Validation Hooks

### 1. pre-implementation-checker.ts

**When**: Runs BEFORE Write/Edit/NotebookEdit tools
**Purpose**: Warn when implementing features without specifications

**Features**:
- Detects new feature implementations
- Checks for API specifications (projectdoc/04-API-ENDPOINTS.md)
- Checks for database schema docs (projectdoc/03-DATABASE-SCHEMA.md)
- Checks for sprint task acceptance criteria
- Suggests spec-guardian skill if specs are missing

**Type**: Non-blocking reminder

### 2. post-implementation-reminder.sh

**When**: Runs AFTER Write/Edit/NotebookEdit tools
**Purpose**: Remind to test and validate after code changes

**Features**:
- Detects code modifications
- Reminds to run test-validator skill
- Reminds to check spec compliance
- Provides quality checklist

**Type**: Non-blocking reminder

## Installation

### Step 1: Make Hooks Executable

```bash
cd /path/to/your/project

chmod +x .claude/hooks/pre-implementation-checker.ts
chmod +x .claude/hooks/post-implementation-reminder.sh
```

### Step 2: Install Dependencies (for TypeScript hooks)

```bash
cd .claude/hooks

# If package.json already exists
npm install

# If starting fresh
npm init -y
npm install --save-dev @types/node
```

### Step 3: Configure in settings.json

Create or edit `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      ".claude/hooks/skill-activation-prompt.ts"
    ],
    "PreToolUse": [
      ".claude/hooks/pre-implementation-checker.ts"
    ],
    "PostToolUse": [
      ".claude/hooks/post-implementation-reminder.sh",
      ".claude/hooks/post-tool-use-tracker.sh"
    ]
  }
}
```

## Testing Hooks

### Test Pre-Implementation Hook

Create a test input:
```bash
echo '{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "src/controllers/test.controller.ts"
  },
  "cwd": "'$(pwd)'",
  "session_id": "test",
  "transcript_path": ".claude/transcript.json"
}' | .claude/hooks/pre-implementation-checker.ts
```

Expected output:
```
⚠️ PRE-IMPLEMENTATION CHECK
Detected: New feature implementation
...
```

### Test Post-Implementation Hook

```bash
echo '{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "src/services/auth.service.ts"
  }
}' | .claude/hooks/post-implementation-reminder.sh
```

Expected output:
```
✅ POST-IMPLEMENTATION REMINDER
Code has been modified. Before marking as complete:
...
```

## Hook Behavior

### Pre-Implementation Hook Flow

```
User: "Implement payment processing"
  ↓
Tool: Write src/controllers/payment.controller.ts
  ↓
Hook Detects:
  - New file being created
  - Implementation file pattern (controller)
  - Keywords: "implement"
  ↓
Hook Checks:
  ✅ API spec exists? → Check projectdoc/04-API-ENDPOINTS.md
  ✅ DB schema exists? → Check projectdoc/03-DATABASE-SCHEMA.md
  ✅ Sprint task exists? → Check .claude/sprints/
  ↓
If specs missing:
  ⚠️ Display warning
  💡 Suggest: Use spec-guardian or project-architect
  ✅ Allow implementation to continue (non-blocking)
  ↓
If specs present:
  ✅ Silent (no warning needed)
```

### Post-Implementation Hook Flow

```
Tool: Edit src/controllers/auth.controller.ts completes
  ↓
Hook Detects:
  - Code modification
  - Implementation file (not test, not config)
  ↓
Hook Displays Reminder:
  ✅ POST-IMPLEMENTATION REMINDER
  Quality Checklist:
  1. Run test-validator
  2. Run spec-guardian
  3. Validate acceptance criteria
  4. Update tests if needed
  ↓
Developer continues (non-blocking)
```

## Customization

### Adjust File Patterns

Edit `pre-implementation-checker.ts`:

```typescript
function isImplementationFile(filePath: string): boolean {
    const implementationPatterns = [
        /\/(controllers|services|repositories|routes)\//,
        /\/(components|features|pages)\//,
        // Add your patterns here:
        /\/your-pattern\//,
    ];

    const excludePatterns = [
        /\.test\.(ts|tsx|js|jsx)$/,
        // Add exclusions:
        /\.your-exclusion$/,
    ];

    // ...
}
```

### Adjust Spec Paths

Edit `pre-implementation-checker.ts`:

```typescript
function checkSpecifications(projectDir: string, ...): {
    // Add your spec paths:
    const apiSpecPaths = [
        join(projectDir, 'projectdoc', '04-API-ENDPOINTS.md'),
        join(projectDir, 'your-custom-path', 'api-specs.md'),
    ];

    // ...
}
```

### Disable for Specific Files

Add skip logic to hooks:

```typescript
// Skip hook for specific paths
if (filePath.includes('/generated/') || filePath.includes('/vendor/')) {
    process.exit(0);
}
```

## Integration with Validation Skills

### Complete Workflow

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER STARTS FEATURE                                  │
│    "Implement user authentication"                      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. BEFORE WRITING CODE (PreToolUse)                     │
│    pre-implementation-checker.ts runs                   │
│    → Checks for specs                                   │
│    → Warns if missing                                   │
│    → Suggests spec-guardian skill                       │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. DEVELOPER USES SPEC-GUARDIAN (if needed)             │
│    → Loads API specs                                    │
│    → Shows acceptance criteria                          │
│    → Presents architecture requirements                 │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. DEVELOPER WRITES CODE                                │
│    Implementation...                                    │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. AFTER WRITING CODE (PostToolUse)                     │
│    post-implementation-reminder.sh runs                 │
│    → Reminds to test                                    │
│    → Reminds to validate                                │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 6. DEVELOPER VALIDATES                                  │
│    → Uses test-validator skill (run tests)              │
│    → Uses spec-guardian skill (check compliance)        │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 7. MARK COMPLETE (if all passes)                        │
│    task-tracker marks sprint task complete              │
└─────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Hook doesn't trigger

**Check**:
1. Is hook path correct in settings.json?
2. Is hook executable? Run: `ls -la .claude/hooks/*.ts`
3. Are there syntax errors? Run hook manually with test input

### Hook triggers on wrong files

**Solution**:
- Adjust file patterns in `isImplementationFile()`
- Add more exclusion patterns
- Test with various file paths

### Hook shows errors

**Check**:
1. Dependencies installed? (`npm install` in .claude/hooks/)
2. File paths valid?
3. JSON parsing works?

**Debug**:
```bash
# Run hook directly with debug
echo '{"tool_name":"Write","tool_input":{"file_path":"test.ts"},"cwd":"'$(pwd)'"}' | \
  .claude/hooks/pre-implementation-checker.ts 2>&1
```

### TypeScript hook won't run

**Check**:
1. `#!/usr/bin/env node` shebang at top of file?
2. TypeScript dependencies installed?
3. Hook is executable?

**Fix**:
```bash
chmod +x .claude/hooks/pre-implementation-checker.ts

cd .claude/hooks
npm install --save-dev @types/node typescript ts-node
```

## Best Practices

### For Developers

1. **Don't ignore warnings** - Hooks warn for good reasons
2. **Use suggested skills** - They exist to help you
3. **Keep specs updated** - Prevents warnings
4. **Test after changes** - Don't wait until "done"

### For Teams

1. **Enforce spec-first development**
   - Create specs before implementation
   - Use project-architect agent for new features
   - Maintain API documentation

2. **Make hooks non-blocking**
   - Reminders, not blockers
   - Developers can override when needed
   - Focus on education, not enforcement

3. **Monitor hook effectiveness**
   - Are developers using suggested skills?
   - Are fewer bugs reaching production?
   - Adjust hook sensitivity as needed

## Configuration Examples

### Minimal Setup (Reminders Only)

```json
{
  "hooks": {
    "PostToolUse": [
      ".claude/hooks/post-implementation-reminder.sh"
    ]
  }
}
```

### Full Validation Setup

```json
{
  "hooks": {
    "UserPromptSubmit": [
      ".claude/hooks/skill-activation-prompt.ts"
    ],
    "PreToolUse": [
      ".claude/hooks/pre-implementation-checker.ts"
    ],
    "PostToolUse": [
      ".claude/hooks/post-implementation-reminder.sh",
      ".claude/hooks/post-tool-use-tracker.sh"
    ]
  }
}
```

### With Error Tracking

```json
{
  "hooks": {
    "UserPromptSubmit": [
      ".claude/hooks/skill-activation-prompt.ts"
    ],
    "PreToolUse": [
      ".claude/hooks/pre-implementation-checker.ts",
      ".claude/hooks/error-handling-reminder.ts"
    ],
    "PostToolUse": [
      ".claude/hooks/post-implementation-reminder.sh"
    ]
  }
}
```

## Related Documentation

- **VALIDATION_WORKFLOW.md** - Complete validation workflow
- **../skills/test-validator/SKILL.md** - Test validation skill
- **../skills/spec-guardian/SKILL.md** - Spec compliance skill
- **README.md** - General hooks documentation

## Support

Issues with hooks? Check:
1. File permissions (chmod +x)
2. Dependencies installed (npm install)
3. Paths in settings.json correct
4. Test hooks manually with sample input
