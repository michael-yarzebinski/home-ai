---
name: todos
description: >-
  Add, update, or list project TODO items in docs/TODOS.md. Use when the user
  asks to add a TODO, log backlog work, update TODO status or priority, or
  manage the project todos file.
---

# Todos

Maintain the project TODO list at `docs/TODOS.md`.

## When to use

- User wants to record a TODO, backlog item, follow-up, or deferred work
- User asks to update status/priority or list open todos
- User says "add a TODO", "log this", or similar

## Item fields

| Field | Values / format |
| --- | --- |
| Title | Short, specific name |
| Priority | `High`, `Medium`, or `Low` |
| Created | `YYYY-MM-DD` (use today's date from user context) |
| Status | `To Do`, `In Progress`, or `Complete` |
| Details | Freeform notes; stored inside a collapsible `<details>` block |

Default status for new items: `To Do`.

## File structure

The file is grouped by priority sections, in this order:

1. `## High`
2. `## Medium`
3. `## Low`

Inside each section, items appear newest-first.

Each item uses this exact template:

```markdown
### {Title}

- **Created:** {YYYY-MM-DD}
- **Status:** {To Do | In Progress | Complete}

<details>
<summary>Details</summary>

{Details body}

</details>
```

Blank line before/after each item. Keep one blank line after a section heading before the first item.

## Workflows

### Add an item

1. Read `docs/TODOS.md`. If missing, create it from the scaffold below.
2. Collect from the user (ask only for what is missing):
   - Title (required)
   - Priority (required): High / Medium / Low
   - Details (required): context, notes, related paths, acceptance criteria
   - Status (optional; default `To Do`)
3. Insert the new item at the **top** of the matching priority section (newest-first).
4. Do not renumber or rewrite unrelated items.
5. Confirm briefly: title, priority, status, and that it was written to `docs/TODOS.md`.

### Update an item

1. Find the item by title (case-insensitive match; ask if ambiguous).
2. Allowed updates: Status, Priority, Title, Details.
3. If Priority changes, **move** the whole item block to the top of the new priority section.
4. Preserve Created unless the user explicitly asks to change it.

### List / summarize

When asked what todos exist:

- Summarize open items (`To Do` and `In Progress`) grouped by priority
- Mention `Complete` items only if the user asks for history or everything

## Scaffold (create file if missing)

```markdown
# Todos

Project backlog and deferred work. Items are grouped by priority.

## High

## Medium

## Low
```

## Rules

- Only edit `docs/TODOS.md` for this skill unless the user asks otherwise.
- Do not invent titles or priorities; ask when unclear.
- Keep titles unique within the file; if a duplicate title exists, ask before adding.
- Use GitHub-flavored Markdown `<details>` / `<summary>` for expandable details (never omit the collapsible wrapper).
- Do not commit unless the user asks.
