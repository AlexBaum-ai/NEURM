# Validation & Quality Assurance Workflow

## Overzicht

Dit document beschrijft het complete validation workflow systeem dat ervoor zorgt dat:
1. ✅ **Software werkt** - via automated testing
2. ✅ **Juiste features worden gebouwd** - via spec compliance checking
3. ✅ **Kwaliteitsstandaarden worden gehandhaafd** - via hooks en skills

## Probleem & Oplossing

### Het Probleem

Zonder validation systeem gebeurt vaak:
- ❌ Features worden gebouwd zonder specificaties
- ❌ Code wordt niet getest voordat het compleet wordt gemarkeerd
- ❌ Implementaties wijken af van originele requirements
- ❌ API endpoints matchen niet de documentatie
- ❌ Database schema wijkt af van design docs
- ❌ Bugs bereiken productie

### De Oplossing

**Twee skills + twee hooks = Complete quality assurance**

```
┌─────────────────────────────────────────────────────────┐
│                   VALIDATION WORKFLOW                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  BEFORE Implementation (Pre-Implementation Hook)         │
│  ↓                                                        │
│  1. Check: Do specifications exist?                      │
│  2. Suggest: spec-guardian skill if needed               │
│  3. Allow: Continue with implementation                  │
│                                                           │
│  DURING Implementation                                   │
│  ↓                                                        │
│  Developer implements feature                            │
│                                                           │
│  AFTER Implementation (Post-Implementation Hook)         │
│  ↓                                                        │
│  1. Remind: Run test-validator skill                     │
│  2. Remind: Run spec-guardian skill                      │
│  3. Remind: Validate acceptance criteria                 │
│                                                           │
│  BEFORE Marking Complete                                 │
│  ↓                                                        │
│  1. test-validator: Run all tests                        │
│  2. spec-guardian: Verify spec compliance                │
│  3. If PASS → task-tracker marks complete ✅             │
│  4. If FAIL → task-tracker marks blocked ❌              │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Beschikbare Skills

### 1. test-validator

**Doel**: Validate dat software werkt door automated tests te runnen

**Wanneer gebruiken:**
- ✅ Na het implementeren van een feature
- ✅ Voor het markeren van een sprint task als compleet
- ✅ Voor deployment naar productie
- ✅ Wanneer je wilt checken of alles werkt

**Wat het doet:**
```
📋 Test Suite Execution
├── Unit tests runnen
├── Integration tests runnen
├── E2E tests runnen (indien aanwezig)
├── API endpoint validation
├── Performance checking
└── Coverage metrics

📊 Acceptance Criteria Validation
├── Sprint task acceptance criteria lezen
├── Elk criterium verifiëren met tests
├── Evidence verzamelen (test results, API responses)
└── Pass/Fail status per criterium

🚀 Deployment Readiness Check
├── All tests passing?
├── Code coverage > 80%?
├── Security measures in place?
├── Performance benchmarks met?
└── Documentation updated?

Resultaat: ✅ APPROVED of ❌ BLOCKED met details
```

**Voorbeeld gebruik:**

```
User: "Test the authentication feature"

test-validator skill:
1. Runs: npm run test:integration auth
2. Validates: API endpoints /api/auth/*
3. Checks: Acceptance criteria from sprint task
4. Reports:
   ✅ 24/24 unit tests passing
   ✅ 18/20 integration tests passing
   ❌ 3/5 E2E tests failing

   Status: NOT READY - Fix E2E tests first

5. Blocks task completion until fixed
```

**Triggers:**
- Keywords: "run tests", "test this", "validate", "check if it works"
- Intent: "test the feature", "is this working", "ready for deployment"

### 2. spec-guardian

**Doel**: Ensure features worden gebouwd volgens specificaties

**Wanneer gebruiken:**
- ✅ Voor het beginnen van een feature implementatie
- ✅ Tijdens code review
- ✅ Voor het markeren van een task als compleet
- ✅ Bij API endpoint creatie
- ✅ Bij database schema changes

**Wat het doet:**
```
📋 Specification Verification
├── Check: Do specs exist?
│   ├── API spec (04-API-ENDPOINTS.md)
│   ├── Database schema (03-DATABASE-SCHEMA.md)
│   ├── Architecture docs (01-ARCHITECTUUR.md)
│   └── Sprint task acceptance criteria
│
├── If missing:
│   └── Block implementation + suggest project-architect
│
└── If present:
    └── Present specs to developer

🔍 Implementation Compliance Check
├── API Endpoints
│   ├── Request body matches spec?
│   ├── Response format matches spec?
│   ├── Status codes match spec?
│   ├── Error handling matches spec?
│   └── Extra endpoints not in spec? (scope creep)
│
├── Database Schema
│   ├── Tables match spec?
│   ├── Fields match spec?
│   ├── Indexes defined?
│   ├── Constraints correct?
│   └── Extra fields documented?
│
├── Architecture Patterns
│   ├── Layered architecture followed?
│   ├── BaseController pattern used?
│   ├── Sentry error tracking added?
│   ├── Zod validation used?
│   └── Tech stack compliance?
│
└── Scope Creep Detection
    └── Extra features not in spec? → Flag and remove

Resultaat: Compliance Score + Issues List
```

**Voorbeeld gebruik:**

```
User: "Implement user registration endpoint"

spec-guardian skill:
1. Checks: projectdoc/04-API-ENDPOINTS.md
   ✅ Found: POST /api/auth/register spec

2. Presents spec to developer:
   • Request: { email, password, name }
   • Response: 201 + JWT token
   • Errors: 400, 409, 500

3. Developer implements

4. Validates implementation:
   ✅ Request body correct
   ✅ Response format correct
   ❌ Password validation incomplete
      Spec requires: uppercase + lowercase + number
      Implementation: only checks min length

   Compliance: 85/100
   Status: FIX REQUIRED

5. Blocks task until password validation fixed
```

**Triggers:**
- Keywords: "check specs", "verify specs", "according to spec", "API spec"
- Intent: "validate against spec", "does this match requirements"

## Beschikbare Hooks

### 1. pre-implementation-checker.ts

**Wanneer**: Runt **VOOR** Write/Edit/NotebookEdit tools

**Doel**: Waarschuw als specs ontbreken voor nieuwe features

**Werking:**
```typescript
User: "Implement payment processing"
↓
pre-implementation-checker detects:
  - New feature implementation (keyword "implement")
  - File being created: controllers/payment.controller.ts
↓
Check for specs:
  ❌ API spec NOT found (04-API-ENDPOINTS.md)
  ❌ Database schema MISSING payment tables
  ⚠️ No sprint task (manual implementation)
↓
Output warning:
  ⚠️ PRE-IMPLEMENTATION CHECK
  Missing specifications:
  • API endpoints for payment
  • Database schema for payments/transactions

  RECOMMENDATIONS:
  1. Use spec-guardian skill to verify
  2. Use project-architect to create specs
  3. Create sprint task for tracking

  You can proceed but consider adding specs first!
```

**Type**: Non-blocking reminder (suggestie, geen blocker)

**Files gecontroleerd:**
- ✅ Implementation files (controllers, services, repositories, routes)
- ✅ React components (.tsx)
- ❌ Test files (.test.ts, .spec.ts)
- ❌ Config files (.config.ts)
- ❌ Documentation (.md)

### 2. post-implementation-reminder.sh

**Wanneer**: Runt **NA** Write/Edit/NotebookEdit tools

**Doel**: Herinner om te testen en valideren na code changes

**Werking:**
```bash
Developer writes code to auth.controller.ts
↓
post-implementation-reminder triggers:
↓
Output reminder:
  ✅ POST-IMPLEMENTATION REMINDER

  Code has been modified. Before marking as complete:

  QUALITY CHECKLIST:
  1. Run Tests
     → Use test-validator skill

  2. Check Spec Compliance
     → Use spec-guardian skill

  3. Validate Acceptance Criteria
     → Verify all criteria met

  4. Update Tests (if needed)
     → Add tests for new functionality

  This is a reminder - you can continue!
```

**Type**: Non-blocking reminder (nudge naar best practices)

## Complete Workflow Voorbeeld

### Scenario: Backend Developer implementeert User Authentication

```
┌──────────────────────────────────────────────────────────┐
│ FASE 1: STARTING IMPLEMENTATION                          │
└──────────────────────────────────────────────────────────┘

User: "Implement SPRINT-1-005"

1. sprint-reader skill invoked
   → Reads task details from .claude/sprints/sprint-1.json
   → Acceptance criteria:
     • POST /api/auth/register creates new accounts
     • POST /api/auth/login returns JWT
     • All endpoints have error handling
     • Passwords hashed with bcrypt

2. spec-guardian skill invoked (automatically or manually)
   → Checks: projectdoc/04-API-ENDPOINTS.md ✅
   → Checks: projectdoc/03-DATABASE-SCHEMA.md ✅
   → Presents full API spec to developer

   Status: ✅ READY TO PROCEED - All specs present

3. todo-sync skill invoked
   → Creates TodoWrite items:
     [ ] Create POST /api/auth/register route
     [ ] Implement registration controller
     [ ] Add bcrypt password hashing
     [ ] Create POST /api/auth/login route
     [ ] Implement login controller
     [ ] Add error handling

4. task-tracker skill invoked
   → Marks SPRINT-1-005 as "in-progress"


┌──────────────────────────────────────────────────────────┐
│ FASE 2: DURING IMPLEMENTATION                            │
└──────────────────────────────────────────────────────────┘

Developer: Creates auth.controller.ts

→ pre-implementation-checker hook triggers:
  ⚠️ Detected: New feature implementation
  📋 Spec Status:
     ✅ API spec found
     ✅ Sprint task found
  Status: Good to proceed!

Developer: Writes code...

Developer: Modifies auth.controller.ts

→ post-implementation-reminder hook triggers:
  ✅ POST-IMPLEMENTATION REMINDER
  Before marking complete:
  1. Run test-validator
  2. Check spec-guardian compliance


┌──────────────────────────────────────────────────────────┐
│ FASE 3: TESTING & VALIDATION                             │
└──────────────────────────────────────────────────────────┘

Developer: "Test this feature"

→ test-validator skill invoked:

  🧪 Running: npm run test:integration auth

  Results:
  ✅ POST /api/auth/register - creates user (PASS)
  ✅ POST /api/auth/login - returns JWT (PASS)
  ❌ POST /api/auth/refresh - token rotation (FAIL)

  Summary: 18/20 tests passing (90%)
  Status: ❌ NOT READY - Fix failing test

→ task-tracker: Marks SPRINT-1-005 as "blocked"
  Blocker: "Token refresh test failing"

Developer: Fixes the failing test

Developer: "Test this again"

→ test-validator skill invoked:

  Results: ✅ 20/20 tests passing (100%)
  Coverage: 87%
  Status: ✅ TESTS PASSING


┌──────────────────────────────────────────────────────────┐
│ FASE 4: SPEC COMPLIANCE CHECK                            │
└──────────────────────────────────────────────────────────┘

Developer: "Validate against specs"

→ spec-guardian skill invoked:

  🔍 API SPEC COMPLIANCE CHECK
  Endpoint: POST /api/auth/register

  Request Body:
  ✅ email: validated (Zod)
  ✅ password: validated (Zod)
  ✅ name: validated (Zod)

  Response:
  ✅ 201 status code
  ✅ JWT token returned
  ✅ user object structure correct

  Error Handling:
  ✅ 400 Bad Request implemented
  ✅ 409 Conflict implemented
  ✅ 500 with Sentry logging

  Architecture:
  ✅ Layered architecture followed
  ✅ BaseController pattern used
  ✅ Sentry error tracking added
  ✅ Zod validation used

  Compliance Score: 100/100
  Status: ✅ FULLY COMPLIANT


┌──────────────────────────────────────────────────────────┐
│ FASE 5: ACCEPTANCE CRITERIA VALIDATION                   │
└──────────────────────────────────────────────────────────┘

→ test-validator: Checks acceptance criteria

  ✅ [PASS] POST /api/auth/register creates accounts
     Evidence: Integration tests + manual validation

  ✅ [PASS] POST /api/auth/login returns JWT
     Evidence: Test suite passing, token validated

  ✅ [PASS] All endpoints have error handling
     Evidence: 400/401/409 tested, Sentry integrated

  ✅ [PASS] Passwords hashed with bcrypt
     Evidence: Database inspection, bcrypt rounds=10

  Overall: 4/4 criteria met (100%)
  Status: ✅ READY FOR COMPLETION


┌──────────────────────────────────────────────────────────┐
│ FASE 6: MARK AS COMPLETE                                 │
└──────────────────────────────────────────────────────────┘

Developer: "Mark SPRINT-1-005 as complete"

→ task-tracker skill:
  1. Final validation check:
     ✅ All tests passing
     ✅ Spec compliance 100%
     ✅ Acceptance criteria met

  2. Updates:
     • Status: "completed"
     • CompletedAt: "2025-11-01T18:45:00Z"
     • Moved to .claude/DONE/sprint-1.json
     • PROGRESS.md updated with ✅

  3. Reports:
     🎉 TASK COMPLETED: SPRINT-1-005
     Sprint 1 Progress: 6/8 tasks (75%)

     Next available tasks:
     → SPRINT-1-006: Email verification
     → SPRINT-1-007: Password reset
```

## Configuratie

### Hooks Activeren

Add to `.claude/settings.json`:

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
      ".claude/hooks/post-implementation-reminder.sh"
    ]
  }
}
```

### Skills Activeren

Skills worden automatisch geactiveerd via:
- `.claude/skills/skill-rules.json` - Triggers definiëren
- `.claude/hooks/skill-activation-prompt.ts` - Hook die skills suggereert

## Best Practices

### Voor Developers

1. **Before Implementation**
   - ✅ Check of specs bestaan (spec-guardian)
   - ✅ Lees acceptance criteria (sprint-reader)
   - ✅ Begrijp architecture requirements

2. **During Implementation**
   - ✅ Volg specs nauwkeurig
   - ✅ Test incrementeel (niet wachten tot "done")
   - ✅ Documenteer deviations

3. **After Implementation**
   - ✅ Run test-validator
   - ✅ Run spec-guardian
   - ✅ Verify acceptance criteria
   - ✅ Fix all issues before marking complete

### Voor Project Managers

1. **Ensure Specs Exist**
   - ✅ Use project-architect agent voor nieuwe features
   - ✅ Maintain API specification docs
   - ✅ Keep database schema up-to-date
   - ✅ Write clear acceptance criteria in sprint tasks

2. **Enforce Quality Gates**
   - ✅ No task marked complete without passing tests
   - ✅ No deployment without spec compliance
   - ✅ Block non-compliant code

### Voor QA Testers

1. **Use test-validator**
   - ✅ Run comprehensive test suites
   - ✅ Validate acceptance criteria
   - ✅ Check deployment readiness

2. **Use spec-guardian**
   - ✅ Verify implementation matches specs
   - ✅ Check for scope creep
   - ✅ Validate architecture compliance

## Troubleshooting

### Skills worden niet gesuggereerd

**Probleem**: Hooks triggeren niet

**Oplossing**:
1. Check `.claude/settings.json` - hooks configured?
2. Verify hook files executable: `chmod +x .claude/hooks/*.{ts,sh}`
3. Check skill-rules.json syntax (valid JSON)
4. Test keyword matching (gebruik exacte keywords)

### Tests falen maar task wordt toch compleet gemarkeerd

**Probleem**: task-tracker markeert compleet zonder validation

**Oplossing**:
1. Developer moet handmatig test-validator aanroepen
2. Hook geeft alleen reminder, geen blocker
3. Overweeg enforcement level verhogen naar "block"

### Spec compliance check faalt

**Probleem**: Implementatie matcht niet de specs

**Oplossing**:
1. Fix implementation om te matchen met spec, OF
2. Update spec als intentioneel afwijkend, AND document waarom

### Pre-implementation hook blokkeert onterecht

**Probleem**: Hook waarschuwt bij kleine edits

**Oplossing**:
- Hook is non-blocking (alleen reminder)
- Ignore warnings voor triviale changes
- Focus op nieuwe feature implementations

## Metrics & Reporting

### Track Quality Metrics

```
Sprint 1 Quality Metrics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test Coverage: 87% (target: 80%) ✅
Spec Compliance: 95% average ✅
Tests Passing: 100% ✅
Blocked Tasks: 0 ✅

Issues Found During Validation:
• 3 tasks required spec fixes before completion
• 2 tasks had failing tests initially
• 1 task had scope creep (removed extra features)

All issues resolved before deployment ✅
```

## Conclusie

Met dit validation workflow systeem heb je:

✅ **Automated Testing** - test-validator skill runt tests en valideert functionaliteit
✅ **Spec Compliance** - spec-guardian skill zorgt dat features volgens specs worden gebouwd
✅ **Quality Gates** - Hooks herinneren aan best practices
✅ **Prevention** - Catch issues voor ze productie bereiken
✅ **Documentation** - Specs en tests dienen als documentatie
✅ **Consistency** - Alle features volgen dezelfde standards

**Resultaat**: Hogere code kwaliteit, minder bugs, snellere development (minder rework) 🎉
