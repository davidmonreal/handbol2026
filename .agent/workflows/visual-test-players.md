---
description: Manual visual testing checklist for Players Management page
---

# Players Management - Manual Visual Tests

Run these tests when making changes to the Players Management page or CrudManager.

## Prerequisites
1. Backend running: `cd my-project && npm start`
2. Frontend running: `cd frontend && npm run dev`
3. Open http://localhost:5173/players

---

## Test Cases

### 1. Initial Load (No Club Selected)
- [ ] Page loads with first 20 players
- [ ] "All Clubs" is selected in the club filter
- [ ] Search bar is visible and aligned with filter
- [ ] "Load More" button shows remaining count (e.g., "Load 20 more (77 remaining)")

### 2. Club Filter (Server-Side)
- [ ] Click club filter → shows searchable dropdown with all clubs
- [ ] Type "Mataró" → filters dropdown to matching clubs
- [ ] Select "AB Investments Joventut Mataró"
- [ ] Only players from that club are shown
- [ ] Player count updates (e.g., if club has 15 players, no "Load More" button)

### 3. Search with No Club (Server-Side Search)
- [ ] Type "Albert" in search box
- [ ] Wait for debounce (500ms)
- [ ] Results show players with "Albert" in name
- [ ] Network tab shows API call with `?search=Albert`

### 4. Search with Club Selected - Small Club (Client-Side Search)
- [ ] Select a club with <20 players (e.g., "BM Granollers")
- [ ] Note: all players should be loaded (no "Load More" button)
- [ ] Type "a" in search box
- [ ] Results filter immediately (no network request)
- [ ] Verify in Network tab: NO new API call was made

### 5. Search with Club Selected - Large Club (Server-Side Search)
- [ ] Select a club with >20 players (or use "All Clubs")
- [ ] Type "Jan" in search box
- [ ] Verify in Network tab: API call made with `clubId` and `search` params

### 6. Focus Preservation
- [ ] Type in search box
- [ ] Wait for results to load
- [ ] Cursor should STILL be in search box (no focus loss)

### 7. Load More
- [ ] With "All Clubs" selected, scroll to bottom
- [ ] Click "Load More"
- [ ] 20 more players are added to the list
- [ ] Button updates remaining count

### 8. Clear Filter
- [ ] With a club selected, click filter and select "All Clubs"
- [ ] All players are shown again (first 20)

---

## Expected API Calls

| Scenario | Expected API Call |
|----------|------------------|
| Initial load | `/api/players?skip=0&take=20` |
| Club filter | `/api/players?skip=0&take=20&clubId=xxx` |
| Search (no club) | `/api/players?skip=0&take=20&search=xxx` |
| Search + Club | `/api/players?skip=0&take=20&clubId=xxx&search=xxx` or client-side if all loaded |
| Load More | `/api/players?skip=20&take=20&...` |
