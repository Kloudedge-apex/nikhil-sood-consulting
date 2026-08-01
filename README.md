# nikhil-sood-consulting

Consulting site for Nikhil Sood. Live at
<https://kloudedge-apex.github.io/nikhil-sood-consulting/>.

## What it is

A single self-contained `index.html`. No build step, no dependencies, no lockfile.
Open the file, edit it, push. GitHub Pages serves it from the repo root.

This is deliberate. The engineering portfolio next door runs on Vite with a
linux-only lockfile and hand-placed darwin binaries, which is a lot of moving
parts for a page that is mostly text.

## The idea

Every system in the underlying work refuses when it cannot cite: Sentinel
declines unsourced AML claims, the credit-rating agents will not assert what they
cannot link, the radiology triage routes uncertainty to a human. The site is
built as that thesis rather than as a list of services.

- **The gate** is the centrepiece. Pick a situation, it resolves to a scoped
  engagement or plainly declines. Refusals are first-class, not hidden.
- **Amber `#A05407` is reserved for refusal and nothing else.** Blue `#0033FF` is
  reserved for pass. The palette carries the meaning, so do not spend either
  colour on decoration.
- Every engagement cites the project that backs it. The hero ledger applies the
  same check to the page's own marketing claims, including one that fails it.

## Editing

Everything lives in `index.html`.

| What | Where |
| --- | --- |
| Gate situations and resolutions | `SITUATIONS` array in the script |
| Hero claim ledger | `CLAIMS` array |
| Capability index (49 rows) | `S` array, `[id, service, evidence, band]` |
| Filter bands | `BANDS` array |
| Colours and type | `:root` custom properties |

Gate resolutions are linkable as `#fit-<n>`, so a specific engagement can be sent
straight to a prospect.

## Design tokens

Inherited from the portfolio so the two read as siblings: paper `#FAFAF8`, ink
`#1B1B21`, hairline `#DEDEE2`, zero border radius. Bricolage Grotesque for
display, Inter for body, Space Mono for data. The portfolio declares those three
faces but only loads Inter; this one loads all three.

## Checks before pushing

Verified with a real browser, not curl, because the gate is client-rendered:

- `document.scrollWidth === clientWidth` at 390px, zero overflowing elements
- Gate resolves on click, sets `aria-pressed`, updates the hash
- Filters return 9 / 3 / 49 across bands
- Amber computes on refusal surfaces only
- Reduced motion respected, keyboard focus visible
