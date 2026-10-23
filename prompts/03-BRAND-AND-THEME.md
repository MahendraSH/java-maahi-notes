# Phase 3 — Brand, SVG Assets, Metadata and Theme

Create a cohesive original Vibe Notes identity using the supplied assets in this kit.

Requirements:
- Inspect existing `globals.css` and preserve any required Tailwind CSS v4 imports/configuration.
- Use semantic CSS custom properties compatible with the existing shadcn/ui setup.
- Dark theme: graphite surfaces, soft white text, Java orange primary accent, terminal green for success, developer blue for links/info, restrained amber/red semantic states.
- Light theme must be intentionally designed, readable, and not simply an inverted dark theme.
- Keep accent colors restrained. Avoid gradients and visual noise.
- Apply shared tokens consistently to buttons, inputs, dialogs, popovers, navigation, editor surfaces, borders, focus rings and status indicators.
- Use system sans-serif for body text and system monospace for code/keyboard shortcuts.
- Ensure keyboard focus is visible and color contrast is reasonable.
- Use the SVG assets from `assets/brand/` and `assets/icons/`. Copy to the correct app icon locations as needed; don't leave duplicate unused assets.
- Add sensible metadata for both apps: product title, description, theme color and icons.
- Do not add external fonts or dependencies without a clear reason.
- Ensure both app layouts handle the chosen theme class consistently.

Verify SVG validity, build both apps, and inspect for missing CSS variables. Report any theme-switching limitation rather than claiming it works if it does not.

Checkpoint: stop after implementation and verification.
