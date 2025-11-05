#!/bin/bash
#
# Post-Implementation Reminder Hook
#
# Runs AFTER Write/Edit tools to remind about:
# 1. Running tests (test-validator skill)
# 2. Checking spec compliance (spec-guardian skill)
# 3. Validating before marking tasks complete
#
# This is a REMINDER, not a blocker - allows development to continue
# but nudges towards quality practices.

# Read JSON input from stdin
input=$(cat)

# Extract tool name
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

# Only trigger for code modification tools
if [[ ! "$tool_name" =~ ^(Write|Edit|NotebookEdit)$ ]]; then
    exit 0
fi

# Extract file path
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# Skip if not an implementation file
if [[ "$file_path" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]] || \
   [[ "$file_path" =~ \.config\.(ts|js)$ ]] || \
   [[ "$file_path" =~ \.md$ ]] || \
   [[ "$file_path" =~ \.json$ ]] || \
   [[ "$file_path" =~ /test/ ]] || \
   [[ "$file_path" =~ /tests/ ]]; then
    exit 0
fi

# Check if this is implementation code
is_implementation=false
if [[ "$file_path" =~ /(controllers|services|repositories|routes|api|components|features|pages)/ ]] || \
   [[ "$file_path" =~ \.(controller|service|repository)\.(ts|js)$ ]] || \
   [[ "$file_path" =~ \.(tsx|jsx)$ ]]; then
    is_implementation=true
fi

if [ "$is_implementation" = false ]; then
    exit 0
fi

# Display reminder message
cat << 'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ POST-IMPLEMENTATION REMINDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Code has been modified. Before marking as complete:

📋 QUALITY CHECKLIST:

  1️⃣ Run Tests
     → Use test-validator skill to run automated tests
     → Command: Invoke Skill tool with "test-validator"
     → Ensures your changes don't break existing functionality

  2️⃣ Check Spec Compliance
     → Use spec-guardian skill to verify against specs
     → Command: Invoke Skill tool with "spec-guardian"
     → Confirms implementation matches requirements

  3️⃣ Validate Acceptance Criteria
     → If working on sprint task, verify all criteria met
     → Use sprint-reader to review requirements

  4️⃣ Update Tests (if needed)
     → Add tests for new functionality
     → Update existing tests if behavior changed

💡 BEST PRACTICES:

  • Test early and often (don't wait until "done")
  • Fix failing tests immediately
  • Validate against specs before marking complete
  • Document any deviations from specs

⚡ This is a reminder, not a blocker - you can continue!
   But these checks ensure quality before deployment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

exit 0
