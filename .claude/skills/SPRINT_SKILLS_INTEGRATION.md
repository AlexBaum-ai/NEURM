# Sprint Skills Integration Guide

## Overzicht

Dit document beschrijft hoe de development agents (backend-developer, frontend-developer, qa-software-tester, sprint-orchestrator, project-architect) automatisch de juiste skills aanroepen voor sprint-gebaseerd werken.

## Beschikbare Sprint Skills

### 1. sprint-reader
**Doel**: Sprint task data lezen en parsen vanuit JSON bestanden

**Wordt aangeroepen wanneer:**
- Agent begint met een sprint task (SPRINT-X-YYY)
- Gebruiker vraagt naar beschikbare tasks
- Dependencies moeten worden geverifieerd
- Task details nodig zijn voor implementatie

**Triggers:**
- Keywords: "SPRINT-", "sprint task", "available tasks", "start task"
- Intent patterns: "work on SPRINT-1-005", "what tasks are available"

**Wat het doet:**
- Leest `.claude/sprints/*.json` en `.claude/TODO/*.json`
- Parset task details (titel, beschrijving, acceptance criteria)
- Controleert dependencies
- Presenteert alle informatie voor de agent

### 2. task-tracker
**Doel**: Sprint task status automatisch updaten

**Wordt aangeroepen wanneer:**
- Agent start met een sprint task → status: `in-progress`
- Agent rondt een sprint task af → status: `completed`
- Agent tegenkomt een blocker → status: `blocked`

**Triggers:**
- Keywords: "mark complete", "task complete", "finished SPRINT", "task blocked"
- Intent patterns: "mark SPRINT-1-005 as complete", "I've finished SPRINT-1-005"

**Wat het doet:**
- Update task status in JSON bestanden
- Voegt timestamps toe (startedAt, completedAt)
- Verplaatst completed tasks naar `.claude/DONE/`
- Update `.claude/PROGRESS.md` met status indicatoren
- Berekent sprint voortgang percentages

### 3. todo-sync
**Doel**: Sprint tasks synchroniseren met TodoWrite tool

**Wordt aangeroepen wanneer:**
- Agent start met een sprint task → creëert TodoWrite items
- Task wordt opgebroken in sub-taken
- TodoWrite items worden completed → synct naar sprint status

**Triggers:**
- Keywords: "create todos", "break down task", "sub-tasks"
- Intent patterns: "break down SPRINT-1-005", "create todo items"

**Wat het doet:**
- Converteert acceptance criteria naar TodoWrite items
- Breekt complexe taken op in kleinere stappen
- Houdt TodoWrite status gesynchroniseerd met sprint status
- Cleared TodoWrite lijst wanneer sprint task compleet is

## Automatische Workflow

### Scenario: Backend Developer werkt aan SPRINT-1-005

```
Gebruiker: "Work on SPRINT-1-005"

1. skill-activation-prompt hook detecteert "SPRINT-1-005" keyword
   ↓
2. Hook suggereert: sprint-reader, task-tracker, todo-sync skills
   ↓
3. Agent roept sprint-reader aan:
   → Leest task details uit .claude/sprints/sprint-1.json
   → Controleert dependencies
   → Presenteert acceptance criteria
   ↓
4. Agent roept todo-sync aan:
   → Converteert acceptance criteria naar 6 TodoWrite items
   → Alle items op 'pending' status
   ↓
5. Agent roept task-tracker aan:
   → Markeert SPRINT-1-005 als 'in-progress'
   → Update .claude/TODO/sprint-1.json
   → Update .claude/PROGRESS.md
   ↓
6. Agent implementeert feature:
   → Gebruikt TodoWrite om voortgang te tracken
   → Markeert sub-taken als 'completed' tijdens implementatie
   ↓
7. Agent rondt alle TodoWrite items af:
   → todo-sync detecteert alle items compleet
   → Roept task-tracker aan
   ↓
8. task-tracker markeert task als compleet:
   → Update status naar 'completed'
   → Voegt completedAt timestamp toe
   → Verplaatst naar .claude/DONE/sprint-1.json
   → Update PROGRESS.md met ✅ en nieuwe percentages
   ↓
9. Agent rapporteert success:
   → "SPRINT-1-005 completed!"
   → "API endpoints ready for frontend integration"
```

## Hook Integratie

### skill-activation-prompt.ts

Deze hook draait **VOOR** elke user prompt en:

1. Leest `.claude/skills/skill-rules.json`
2. Matcht user prompt tegen keywords en intent patterns
3. Suggereert relevante skills
4. Toont prioriteit (critical, high, medium, low)

**Configuratie:**

```json
{
  "sprint-reader": {
    "priority": "critical",  // Altijd suggereren wanneer SPRINT-X-YYY gedetecteerd
    "enforcement": "suggest" // Geen blocking, alleen suggestie
  },
  "task-tracker": {
    "priority": "critical",  // Essentieel voor status tracking
    "enforcement": "suggest"
  },
  "todo-sync": {
    "priority": "high",      // Belangrijk maar niet altijd nodig
    "enforcement": "suggest"
  }
}
```

## Folder Structuur

```
.claude/
├── sprints/           # Originele sprint definities (read-only tijdens dev)
│   ├── sprint-1.json
│   └── sprint-2.json
├── TODO/              # Actieve sprint tasks
│   ├── sprint-1.json  # Updated door task-tracker
│   └── sprint-2.json
├── DONE/              # Completed tasks (archief)
│   ├── sprint-1.json  # Completed tasks uit sprint 1
│   └── sprint-2.json
├── PROGRESS.md        # Real-time progress dashboard
└── skills/
    ├── sprint-reader/
    │   └── SKILL.md
    ├── task-tracker/
    │   └── SKILL.md
    └── todo-sync/
        └── SKILL.md
```

## Sprint Task JSON Structuur

```json
{
  "sprintNumber": 1,
  "sprintGoal": "Foundation & Core Infrastructure",
  "status": "in-progress",
  "tasks": [
    {
      "taskId": "SPRINT-1-005",
      "title": "Implement user authentication API",
      "description": "Create JWT-based authentication endpoints",
      "assignedTo": "backend",
      "estimatedHours": 8,
      "priority": "high",
      "status": "in-progress",
      "startedAt": "2025-11-01T14:30:00Z",
      "completedAt": null,
      "dependencies": ["SPRINT-1-002"],
      "acceptanceCriteria": [
        "POST /api/auth/register creates new user accounts",
        "POST /api/auth/login returns JWT access token",
        "All endpoints include proper error handling"
      ],
      "notes": "Use unifiedConfig for JWT secret"
    }
  ]
}
```

## Agent Instructies

Elk development agent (backend-developer, frontend-developer, qa-software-tester) heeft een sectie "Agent Skills Integration" die instructies bevat:

**CRITICAL**: You have access to specialized skills that automate sprint and todo management. These skills should be invoked automatically during your workflow.

### Auto-invoke workflow:

1. User mentions SPRINT-X-YYY → Invoke "sprint-reader"
2. Starting work → Invoke "todo-sync" + "task-tracker"
3. During implementation → Use TodoWrite (synced by todo-sync)
4. Completing work → Invoke "task-tracker" + "todo-sync"

## Voordelen

✅ **Zero manual tracking**: Skills handelen alle status updates automatisch af
✅ **Always in sync**: TodoWrite en sprint JSON blijven gesynchroniseerd
✅ **Real-time visibility**: Gebruikers zien live voortgang
✅ **Consistency**: Alle agents volgen hetzelfde tracking protocol
✅ **Audit trail**: Timestamps tonen wanneer werk gebeurde
✅ **Dependency management**: Blockers worden systematisch getracked

## Testen

### Test 1: Sprint Reader
```
Gebruiker: "Show available sprint tasks"
Verwacht: sprint-reader skill wordt gesuggereerd en aangeroepen
```

### Test 2: Task Tracker - Start
```
Gebruiker: "Start working on SPRINT-1-005"
Verwacht:
- sprint-reader leest task details
- task-tracker markeert als in-progress
- PROGRESS.md wordt geüpdatet met 🔄
```

### Test 3: Task Tracker - Complete
```
Agent: "I've finished SPRINT-1-005"
Verwacht:
- task-tracker markeert als completed
- Task verplaatst naar DONE/
- PROGRESS.md updated met ✅ en percentage
```

### Test 4: Todo Sync
```
Gebruiker: "Work on SPRINT-1-005"
Verwacht:
- sprint-reader haalt acceptance criteria op
- todo-sync creëert TodoWrite items
- Alle items op 'pending' status
```

## Troubleshooting

### Skills worden niet gesuggereerd

**Probleem**: Hook detecteert skills niet

**Oplossing**:
1. Check of skill-activation-prompt hook enabled is in settings
2. Verify skill-rules.json syntax (valid JSON)
3. Test keyword matching (is "SPRINT-" in prompt?)

### Task status niet geüpdatet

**Probleem**: task-tracker update faalt

**Oplossing**:
1. Check of .claude/TODO/ folder bestaat
2. Verify JSON bestanden zijn valid
3. Check file permissions
4. Verify task ID bestaat in sprint JSON

### TodoWrite niet gesynchroniseerd

**Probleem**: todo-sync werkt niet

**Oplossing**:
1. Check of TodoWrite tool beschikbaar is
2. Verify acceptance criteria in sprint JSON
3. Check dat agent todo-sync skill aanroept

## Best Practices

1. **Gebruik altijd SPRINT-X-YYY format** voor task IDs (triggert skills automatisch)
2. **Laat agents de skills aanroepen** (via Skill tool command)
3. **Update PROGRESS.md frequent** (houdt real-time metrics actueel)
4. **Breek complexe tasks op** in kleinere TodoWrite items
5. **Documenteer blockers** uitgebreid in task notes
6. **Check dependencies** voordat je een task start

## Voorbeeld Output

### Sprint Reader Output
```
📋 TASK DETAILS: SPRINT-1-005
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Title: Implement user authentication API
Assigned To: backend
Priority: high
Status: pending

Acceptance Criteria:
✓ POST /api/auth/register creates new user accounts
✓ POST /api/auth/login returns JWT access token
✓ All endpoints include proper error handling

Dependencies:
→ SPRINT-1-002: Database schema setup (completed)

Status: All dependencies met - safe to proceed
```

### Task Tracker Output
```
✅ TASK STARTED: SPRINT-1-005
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Task: Implement user authentication API
Status: pending → in-progress
Started At: 2025-11-01 14:30:00 UTC

Files Updated:
✓ .claude/TODO/sprint-1.json
✓ .claude/PROGRESS.md
```

### Todo Sync Output
```
✅ TODO SYNC: Created TodoWrite Items
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sprint Task: SPRINT-1-005
Created 6 TodoWrite items:
✓ Create POST /api/auth/register endpoint
✓ Create POST /api/auth/login endpoint with JWT
✓ Add error handling to all auth endpoints
...
```

## Conclusie

De sprint skills zorgen voor naadloze integratie tussen:
- Sprint planning (JSON files)
- Development agents (backend/frontend/qa)
- Todo tracking (TodoWrite tool)
- Progress reporting (PROGRESS.md)

Alle agents zijn geconfigureerd om deze skills automatisch aan te roepen wanneer sprint-gebaseerd werk wordt gedetecteerd. De skill-activation-prompt hook zorgt ervoor dat agents altijd de juiste skills op het juiste moment gebruiken.

**Resultaat**: Zero-effort sprint tracking met 100% accuraatheid! 🎉
