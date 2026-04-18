# Required Workflow Changes for Forum Archive Feature

⚠️ **IMPORTANT**: Claude Code cannot modify `.github/workflows/` files due to GitHub App permissions. The workflow file `.github/workflows/forum-weekly.yml` requires manual updates to complete this feature.

## Current Status

✅ **Completed automatically:**
- `scripts/curate-forum.js` updated with archive logic
- `/forum-archive/index.json` manifest created
- Week picker UI added to `index.html`
- All edge cases handled (missing archives, graceful fallbacks)

❌ **Requires manual edit:**
- `.github/workflows/forum-weekly.yml` (detailed instructions below)

---

## Manual Workflow Updates Required

### Change 1: Update cron schedule comment (optional but recommended)

**File**: `.github/workflows/forum-weekly.yml`  
**Line**: 3

**Current:**
```yaml
# Fetches bitcointalk RSS, runs Claude-powered curation, opens a Draft PR
```

**New:**
```yaml
# Scrapes bitcointalk HTML, runs Claude-powered curation with weekly archive, opens a Draft PR
```

**Reason**: The script uses HTML scraping (not RSS), and now produces archive snapshots.

---

### Change 2: Remove separate ISO week calculation step

**File**: `.github/workflows/forum-weekly.yml`  
**Lines**: 35-40

**Action**: DELETE these lines entirely:

```yaml
      - name: Compute ISO week number for branch name
        id: week
        run: |
          ISO_WEEK=$(date -u +%Y-W%V)
          echo "iso_week=$ISO_WEEK" >> $GITHUB_OUTPUT
          echo "Computed week: $ISO_WEEK"
```

**Reason**: The curation script now calculates the ISO week internally and includes it in the JSON output. The workflow no longer needs to compute it separately. The script writes the archive file with the computed week number automatically.

---

### Change 3: Update PR creation to read ISO week from JSON

**File**: `.github/workflows/forum-weekly.yml`  
**Lines**: 42-46 (after removing the ISO week step, this will shift to lines ~36-40)

**Current:**
```yaml
      - name: Open Draft Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: "content: forum digest ${{ steps.week.outputs.iso_week }}"
          title: "Forum Digest ${{ steps.week.outputs.iso_week }} — weekly curation"
```

**New:**
```yaml
      - name: Extract ISO week from output
        id: week
        run: |
          ISO_WEEK=$(jq -r '.iso_week // "UNKNOWN"' forum-daily.json)
          echo "iso_week=$ISO_WEEK" >> $GITHUB_OUTPUT
          echo "Extracted week from JSON: $ISO_WEEK"

      - name: Open Draft Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: "content: forum digest ${{ steps.week.outputs.iso_week }}"
          title: "Forum Digest ${{ steps.week.outputs.iso_week }} — weekly curation"
```

**Reason**: The script now writes `iso_week` directly into `forum-daily.json`. We extract it from there instead of computing it twice. This ensures the PR title/commit matches what's in the JSON.

---

## Complete Updated Workflow (for reference)

Here's what the entire `jobs.curate.steps` section should look like after the changes:

```yaml
jobs:
  curate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Run curation script
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: node scripts/curate-forum.js

      - name: Extract ISO week from output
        id: week
        run: |
          ISO_WEEK=$(jq -r '.iso_week // "UNKNOWN"' forum-daily.json)
          echo "iso_week=$ISO_WEEK" >> $GITHUB_OUTPUT
          echo "Extracted week from JSON: $ISO_WEEK"

      - name: Open Draft Pull Request
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: "content: forum digest ${{ steps.week.outputs.iso_week }}"
          title: "Forum Digest ${{ steps.week.outputs.iso_week }} — weekly curation"
          body: |
            ## Weekly Forum Curation

            Automated weekly update for the Forum section.
            21 topics curated from bitcointalk.org over the past week.

            ### Review checklist (mobile-friendly)

            - [ ] Titles translated naturally (not literal)
            - [ ] "Our Take" has editorial voice, not generic summary
            - [ ] No verbatim quoting from source posts
            - [ ] All source URLs link to bitcointalk.org
            - [ ] Thai text uses Sarabun register (not royal, not slang)

            ### How to edit on mobile

            Tap **Files changed** → tap the pencil icon on `forum-daily.json` → edit inline.
            Most edits are in the `take_th` / `take_en` fields.

            **Do not merge if any topic feels off-theme** — swap it out first.

            ---
            *Opened as Draft. Mark as Ready for Review when you've vetted the content.*
          branch: forum-digest/${{ steps.week.outputs.iso_week }}
          base: main
          draft: true
          delete-branch: true
          labels: |
            forum-digest
            weekly-content
            automated
```

---

## Testing the Updated Workflow

### Option 1: Manual workflow dispatch (recommended)
1. Apply the changes above to `.github/workflows/forum-weekly.yml`
2. Commit and push
3. Go to Actions tab → "Forum Weekly Curation" → "Run workflow"
4. Check that:
   - ✅ Script runs successfully
   - ✅ `forum-archive/YYYY-W##.json` is created
   - ✅ `forum-archive/index.json` is updated
   - ✅ `forum-daily.json` is overwritten (but only AFTER archive is written)
   - ✅ Draft PR is opened with correct ISO week in title

### Option 2: Wait for Monday cron
- Next automatic run: Monday 02:00 UTC (09:00 Bangkok time)
- Same checks as above

---

## What Happens on First Run

On the first run after these changes are deployed:

1. Script creates `forum-archive/` directory (if it doesn't exist)
2. Writes `forum-archive/2026-W##.json` (current week)
3. Updates `forum-archive/index.json` manifest with first entry
4. Overwrites `forum-daily.json` as usual
5. PR is opened with all three files changed

The week picker in `index.html` will initially show only "CURRENT" (graceful fallback). After the first weekly run, past weeks become selectable.

---

## Questions?

If anything is unclear or the workflow changes don't work as expected, please comment on the PR and tag @claude.
