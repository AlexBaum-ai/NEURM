# SPRINT-4-004: Topic Creation Form - Quick Guide

## 🚀 Quick Start

### Access the Feature
1. Navigate to `http://vps-1a707765.vps.ovh.net:5173/forum/new`
2. Must be logged in (redirects to login if not)
3. Form loads with all components ready

---

## 📋 Form Structure

```
┌─────────────────────────────────────────────┐
│           Create New Topic                   │
│  [Edit] [Preview] (Toggle)   Saved 10:30 AM │
├─────────────────────────────────────────────┤
│                                              │
│  📋 Topic Type (Required)                   │
│  ┌───────┐ ┌───────┐ ┌───────┐            │
│  │💬 Disc│ │❓Quest│ │🎨Show │            │
│  └───────┘ └───────┘ └───────┘            │
│  ┌───────┐ ┌───────┐ ┌───────┐            │
│  │📚Tutor│ │📢Annc │ │📄Paper│            │
│  └───────┘ └───────┘ └───────┘            │
│                                              │
│  📁 Category (Required)                     │
│  [Dropdown with hierarchical categories]     │
│                                              │
│  ✏️ Title (Required, max 200 chars)         │
│  [________________] 0/200 characters         │
│                                              │
│  📝 Content (Required)                      │
│  ┌──────────────────────────────────────┐  │
│  │ [B] [I] [<>] [🔗] [•] [1.] ["] [↶] [↷]│  │
│  ├──────────────────────────────────────┤  │
│  │                                       │  │
│  │  Write your content here...          │  │
│  │  (Markdown supported)                 │  │
│  │                                       │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  🖼️ Images (Optional, max 5)                │
│  ┌───┐ ┌───┐                               │
│  │img│ │img│  [+ Drop or click to upload]  │
│  └───┘ └───┘                               │
│                                              │
│  🏷️ Tags (Optional, max 5)                  │
│  [llm] [gpt] [__________] Press Enter      │
│                                              │
│  📊 Poll (Optional)                         │
│  [Add Poll]                                 │
│                                              │
├─────────────────────────────────────────────┤
│  [Cancel]        [Save as Draft] [Publish] │
└─────────────────────────────────────────────┘
```

---

## 🎯 Component Features

### 1. Topic Type Selector
**What**: Choose from 6 topic types
**How**: Click a card to select
**Types**:
- 💬 Discussion - General discussion
- ❓ Question - Ask for help
- 🎨 Showcase - Show your project
- 📚 Tutorial - Share a guide
- 📢 Announcement - Important news
- 📄 Paper - Discuss research

### 2. Category Dropdown
**What**: Select forum category
**How**: Click dropdown, select category
**Features**:
- Hierarchical (parent > child)
- Shows category icons
- Only active/public categories

### 3. Title Input
**What**: Topic title
**Validation**: 5-200 characters
**Features**: Real-time character count

### 4. Markdown Editor
**What**: Rich text content editor
**Toolbar**:
- **B** - Bold
- *I* - Italic
- `<>` - Inline code
- `[</>]` - Code block
- 🔗 - Link
- • - Bullet list
- 1. - Numbered list
- " - Quote
- ↶ - Undo
- ↷ - Redo

**Shortcuts**:
- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo

### 5. Image Uploader
**What**: Upload images
**How**: Drag-drop or click to browse
**Limits**:
- Max 5 images
- Max 5MB per image
- JPEG, PNG, GIF, WebP only
**Features**:
- Preview thumbnails
- Remove button (X) per image
- Grid layout

### 6. Tag Input
**What**: Add topic tags
**How**:
- Type and press Enter
- Click autocomplete suggestions
- Remove with X or Backspace
**Limits**:
- Max 5 tags
- Max 50 chars per tag
**Suggestions**: llm, gpt, prompt-engineering, rag, fine-tuning

### 7. Poll Builder
**What**: Create optional poll
**How**: Click "Add Poll" to enable
**Features**:
- Poll question (5-255 chars)
- 2-10 options
- Add/remove options
- Multiple choice toggle
- Optional expiration date
**Remove**: Click "Remove Poll"

### 8. Preview Mode
**What**: See how topic will look
**How**: Click "Preview" button
**Shows**:
- Rendered markdown
- Topic type badge
- Category name
- Tags
- Images
- Poll (if added)
**Toggle**: Click "Edit" to return

### 9. Auto-save
**What**: Automatic draft saving
**When**: Every 30 seconds
**Storage**: Browser localStorage
**Restore**: Auto-loads if < 24 hours old
**Indicator**: "Saved [time]" at top

### 10. Actions
**Cancel**: Go back (discards changes)
**Save as Draft**: Save without publishing
**Publish**: Submit and publish topic

---

## ✅ Validation Rules

### Required Fields
- ✅ Topic Type
- ✅ Category
- ✅ Title (5-200 chars)
- ✅ Content (10-50,000 chars)

### Optional Fields
- 🔘 Images (0-5)
- 🔘 Tags (0-5)
- 🔘 Poll

### Poll Validation (if enabled)
- ✅ Question (5-255 chars)
- ✅ Options (2-10, each required)

---

## 📱 Responsive Behavior

### Desktop (>1024px)
- 3-column grid for topic types
- 5-column grid for images
- Full toolbar visible
- Side-by-side layouts

### Tablet (640px-1024px)
- 2-column grid for topic types
- 3-column grid for images
- Full toolbar visible
- Stacked layouts

### Mobile (<640px)
- 1-column grid for topic types
- 2-column grid for images
- Responsive toolbar
- Vertical stacking

---

## 🎨 Keyboard Shortcuts

### Editor
- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + K` - (Prompt for link)
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo

### Tags
- `Enter` - Add tag
- `Backspace` - Remove last tag (when input empty)
- `Escape` - Close autocomplete

### Navigation
- `Tab` - Next field
- `Shift + Tab` - Previous field

---

## 🔄 Workflow Examples

### Basic Topic Creation
1. Select "Question" type
2. Choose "General Discussion" category
3. Enter title: "How to implement RAG?"
4. Write content in editor
5. Add tags: "rag", "llm"
6. Click "Publish"
7. Navigate to new topic page

### Draft Workflow
1. Start creating topic
2. Fill some fields
3. Wait 30 seconds (auto-save)
4. Close browser
5. Return later to /forum/new
6. Form restores your draft
7. Continue editing
8. Save as draft or publish

### Poll Creation
1. Fill basic fields
2. Click "Add Poll"
3. Enter question: "Which LLM do you prefer?"
4. Add options: "GPT-4", "Claude", "Llama 2"
5. Toggle "Allow multiple choices"
6. Set expiration (optional)
7. Preview to verify
8. Publish

---

## 🐛 Error Handling

### Validation Errors
- Shown below each field in red
- Clear, actionable messages
- Field highlights in red

### Network Errors
- Handled by React Query
- Error toast notification
- Form remains editable

### Image Upload Errors
- File too large: "X is too large (max 5MB)"
- Wrong format: "X is not a supported format"
- Too many: "Max 5 images allowed"

---

## 💡 Tips

### Best Practices
- ✅ Choose appropriate topic type
- ✅ Use descriptive titles
- ✅ Format code with code blocks
- ✅ Add relevant tags
- ✅ Preview before publishing

### Content Formatting
- Use headings for structure
- Use code blocks for code
- Use lists for steps
- Use quotes for references
- Add images to illustrate

### Tags
- Use lowercase
- Use hyphens for multi-word
- Be specific (e.g., "gpt-4" not "ai")
- Max 5 most relevant tags

---

## 🔗 Navigation

### After Success
- **Publish**: → `/forum/topics/:slug`
- **Draft**: → `/forum/drafts`

### Cancel
- Returns to previous page

---

## 📊 Limits Summary

| Feature | Limit | Validation |
|---------|-------|------------|
| Title | 5-200 chars | Required |
| Content | 10-50,000 chars | Required |
| Images | 0-5 | Optional |
| Image Size | 5MB each | Per file |
| Tags | 0-5 | Optional |
| Tag Length | 50 chars | Per tag |
| Poll Options | 2-10 | If poll enabled |
| Poll Question | 5-255 chars | If poll enabled |

---

## 🎉 Success Indicators

### Form Submitted Successfully
- ✅ Navigation to topic/drafts page
- ✅ Success toast notification
- ✅ Draft cleared from localStorage

### Auto-save Working
- ✅ "Saved [time]" indicator updates
- ✅ Draft persists in localStorage
- ✅ Draft restored on page reload

---

## 📞 Support

### Issues?
- Check browser console for errors
- Verify authentication status
- Check network requests
- Clear localStorage and retry

### Debug Mode
```javascript
// In browser console
localStorage.getItem('topic_draft') // View saved draft
localStorage.removeItem('topic_draft') // Clear draft
```

---

**Created**: November 5, 2025
**Version**: 1.0
**Status**: Production Ready ✅
