---
name: react-ui
description: Apply React/UI development principles when authoring or refactoring components in the dashboard app. Enforces single responsibility, decoupling, primitive-only UI (no raw HTML in pages), Vanilla Extract styling, and minimal side effects.
allowed-tools: Read, Edit, Write, Bash, Glob, Grep
---

# React / UI Development

When authoring or refactoring components under `apps/dashboard/src/`, follow these principles. They exist to keep the UI predictable, testable, and easy to change without surprising side effects.

This skill applies to:
- Creating a new component or page.
- Refactoring an existing component that has grown too large or mixes concerns.
- Adding interactions, state, or styles to existing components.
- Reviewing UI code in a PR before commit.

## 1. Single responsibility per component

A component should do **one thing**. If you find yourself writing "and" to describe what it does ("renders a form **and** fetches the list **and** handles delete"), it should be split.

- A **page** orchestrates: it holds the coordinating state and composes child components. It should not render forms, lists, or low-level chrome itself.
- A **form** owns its inputs, validation, and its save mutation. Nothing else.
- A **list** owns its query and its delete/mutation actions. Nothing else.
- A **primitive** (Button, Input, ListRow, Section, …) renders one visual unit. Primitives live under `apps/dashboard/src/components/<Area>/primitives/<Name>/` (e.g. `Admin/primitives/Button/Button.tsx`). The term "widget" is reserved for self-contained application features (a clock, a weather panel) — do not use it for single-purpose components.

When two siblings need to coordinate, lift the coordinating state into a thin container component above them. Pass narrow props down (`initial`, `onDone`, `onEdit`) — do not share mutable state between siblings.

To reset a stateful child when its identity changes, pass a `key` prop derived from the identity. Forcing a remount is cleaner than synchronizing with `useEffect`:

```tsx
<TodosForm key={editing?.id ?? 'new'} initial={editing} onDone={() => setEditing(null)} />
```

## 2. Decouple components from their container

A component must not know about its parent's chrome, layout, or sibling components.

- **Never toggle a class on `document.documentElement`, `document.body`, `#root`, or any DOM node above the component itself.** If you find yourself reaching for `classList.add` in a `useEffect`, the responsibility is upside-down: invert it so the container (e.g. the kiosk root) constrains *itself* instead of every sibling having to opt out.
- **No global CSS rules** (no `globalStyle('html, body, …')` selectors that reach outside the component). The one acceptable use of `globalStyle` is when scoping a child selector that vanilla-extract cannot express otherwise (e.g. `${someStyle} > *`), and even then, scope it to the component's own style class — never to bare element selectors.
- A component owns its own sizing/scrolling. If it needs viewport-fixed behavior, `position: fixed; inset: 0` on its own root is correct. Don't lock ancestor elements and then have other routes "escape" the lock.
- A component should not import styles from another component's `.css.ts` file just to read a shared value. If a value is shared, it belongs in `src/styles/theme.css.ts` (design tokens) or in a small base style that both components compose. Reaching across components creates coupling that breaks when either side changes.

## 3. Compose UI from components, not raw HTML

Page-level and feature-level code should describe the UI in terms of components, not raw HTML. Raw `<input>`, `<button>`, `<p>`, `<h2>`, `<div className="…">` belong inside the primitive layer, not in pages.

When you see this in a page or feature component:

```tsx
<button type="button" className={styles.buttonPrimary}>Save</button>
<input className={styles.input} value={x} onChange={…} />
<p className={styles.errorMessage}>{err}</p>
```

…it should be:

```tsx
<Button variant="primary">Save</Button>
<Input value={x} onChange={…} />
<FormMessage tone="error">{err}</FormMessage>
```

The primitive defines the visual contract; the consumer just picks an API. This gives you:

- **Explicit props as API.** A `Button` with `variant: 'primary' | 'subtle' | 'danger'` documents what's available; a className string does not.
- **One place to change the look.** A design tweak edits one primitive instead of every page.
- **No drift.** Two pages can't accidentally render slightly different versions of the same control.

If you find a page that mixes raw HTML elements with primitives, extract the missing primitive rather than continuing the pattern.

### Typography is a component

Text styling should not be ad-hoc. If you reach for inline `fontSize`, `fontWeight`, or a one-off heading class, that's a signal to introduce or extend a typography component (`Heading`, `Text`, etc.). Body copy, labels, and headings should all flow through components with a small, explicit set of variants.

### Default safety in primitive APIs

When wrapping a native element in a primitive, set defaults that prevent foot-guns:
- `<Button>` defaults `type="button"` so a stray button inside a form doesn't accidentally submit. Callers pass `type="submit"` explicitly when they mean it.
- A primitive should accept only the props it actually uses. Don't spread `{...rest}` carelessly — that re-introduces the "anything goes" problem the primitive exists to prevent.

## 4. Minimal side effects

`useEffect` is the **last resort**, not the first tool. Most needs have a better answer:

| Reach for `useEffect` to… | Use instead |
| --- | --- |
| Reset state when a prop changes | A `key` prop that forces remount |
| Sync derived state | Compute it inline during render; or `useMemo` if expensive |
| Fetch data | TanStack Query (`useQuery`) |
| Read/write DOM | The component's JSX and `className` — almost never imperative DOM |
| Trigger on mount only | A query, an event handler, or move the work to module scope if it's truly static |

**Never** call `document.querySelector`, `classList.add/remove`, or other imperative DOM APIs from a component. The render output is the source of truth. If you need a class conditional on state, render it conditionally:

```tsx
<div className={isActive ? `${root} ${active}` : root}>
```

If you genuinely need imperative DOM access (focus management, scrolling into view, third-party canvas libraries), use a `ref` callback and keep the imperative code as narrow as possible — but treat every such case as an explicit, justified exception.

When `useEffect` is genuinely the right tool (subscribing to an external system, syncing with a non-React API), make sure the dependency array is honest and the cleanup function actually undoes what the effect did.

## 5. Styles colocated with components

Each component owns a folder containing its `.tsx` and (if styled) its `.css.ts`:

```
ComponentName/
  ComponentName.tsx
  ComponentName.css.ts
```

- No central "everything.css.ts" file holding styles for many components.
- No inline `style={{ … }}` props. If a style is one-off, it still goes in the `.css.ts` — either as the component's `root` style or as a `styleVariants` entry.
- Design tokens (colors, spacing, font sizes, breakpoints) live in `src/styles/theme.css.ts`. Components read from `vars.*` — never hardcode hex, px, or rem values.
- Variants belong in `styleVariants`, not in conditional className concatenation littered through the component. The component picks the variant; the stylesheet defines what each variant looks like.

## 6. Container vs. presentational

When a piece of UI needs both data and presentation, split it:

- A **container** runs the queries/mutations and decides what to render. It is small — mostly hook calls and a return statement that picks a child.
- A **presentational** component takes props and renders. It has no `useQuery`, no `useMutation`, no `fetch`. It can be reasoned about in isolation and tested by passing props.

For sibling coordination (form ↔ list), prefer composition through a parent container over context, refs, or events. Context is for app-wide concerns (auth, theme, i18n), not for two components on the same screen.

## How to run this skill

When invoked, do the following:

### Step 1 — Identify the target

If the user named a file or component, work on that. Otherwise look at recently changed files under `apps/dashboard/src/components/` (use `git diff --name-only HEAD` or `git status`).

### Step 2 — Audit against the principles

Read each target component and check for violations:

1. **SRP**: Does the component do more than one thing? Does it mix data fetching, form state, list rendering, and chrome?
2. **Decoupling**: Does it toggle classes on ancestor DOM nodes? Does it depend on a global CSS rule from `theme.css.ts` or anywhere else? Does it import from a sibling's `.css.ts`?
3. **Composition**: Does the JSX contain raw `<input>`, `<button>`, `<select>`, `<textarea>`, `<p className=…>`, `<h*>` with styling, or inline `style={…}`? Could those be replaced with primitives?
4. **Side effects**: Are there `useEffect` calls? For each, is it justified (subscription/external sync), or can it become a `key`, a derived value, or a TanStack Query?
5. **DOM APIs**: Any `document.*`, `window.*` (apart from `window.confirm`-style intentional usage), or `ref` manipulation that isn't strictly necessary?
6. **Styles**: Inline `style={…}`? Hardcoded colors/sizes? Styles living outside the component's folder? Global selectors?

### Step 3 — Propose changes before editing

For non-trivial refactors, list the violations and the proposed fix in plain text first, then ask the user before making large changes. For small fixes (a single inline style, an unused effect), just make the edit.

When extracting a primitive that doesn't exist yet, follow the existing layout (`Admin/primitives/<Name>/<Name>.tsx` + `<Name>.css.ts`) or create the analogous folder in the relevant feature area.

### Step 4 — Verify

After edits, run from the dashboard package:

```bash
npx tsc --noEmit
```

And from the repo root:

```bash
pnpm lint
```

Both must pass. If the change affects user-visible behavior, mention that the user should verify in the browser — type-checking proves correctness, not feature correctness.

## Anti-patterns to flag immediately

These are red flags that should be called out as soon as you see them, even when you weren't asked to refactor:

- `document.documentElement.classList.add(…)` or any `classList` mutation on an ancestor of the component
- `globalStyle('html, body, …', …)` or any global selector that targets bare elements
- A `useEffect` whose only job is `setState` based on a prop (use `key` or derive instead)
- Inline `style={{ … }}` with anything beyond truly dynamic values (a computed `transform`, a `--var`)
- A page file longer than ~200 lines that contains both a form and a list
- A component that imports `styles.foo` from another component's folder
- A `<button>` without an explicit `type` inside a `<form>`
- Hardcoded colors, pixel values, or breakpoint queries (should reference `vars.*` / `mq.*`)
- Any `as any`, `@ts-ignore`, or `@ts-expect-error` in a UI component (these usually mean the abstraction is wrong)
