#!/bin/bash

PR_TITLE="Migrate UI components to @telegram-apps/telegram-ui (Vibe Kanban)"

PR_BODY="## Changes Made

This PR migrates all UI components from custom Tailwind CSS implementations to use the official Telegram UI components from \`@telegram-apps/telegram-ui\` library.

### Updated Components

1. **AuthGate.tsx**
   - Replaced custom div/button elements with \`Panel\`, \`PanelHeader\`, and \`Button\` components
   - Replaced custom textarea with \`Textarea\` component
   - Replaced custom error divs with \`Banner\` components
   - Replaced loading state with \`Placeholder\` component

2. **OrderForm.tsx**
   - Replaced custom modal overlay with \`Modal\` component
   - Replaced custom tab buttons with \`Tabs\` component
   - Replaced custom input fields with \`Input\` component
   - Replaced custom buttons with \`Button\` component
   - Added \`Spinner\` for loading states
   - Used \`Cell\` component for instrument information display

3. **Portfolio.tsx**
   - Wrapped content in \`Panel\` component
   - Replaced custom position cards with \`Cell\` components
   - Replaced custom error/warning messages with \`Banner\` components
   - Replaced empty state with \`Placeholder\` component

### Why These Changes Were Made

The application was using custom Tailwind CSS styling which didn't match the native Telegram Mini App design language. By migrating to \`@telegram-apps/telegram-ui\`, the app now:

- Provides a consistent, native Telegram look and feel
- Automatically adapts to Telegram's theme (light/dark mode)
- Improves user experience with familiar Telegram UI patterns
- Reduces maintenance burden by using official, maintained components

### Implementation Details

- All components now use Telegram UI design tokens (CSS variables like \`--tgui--text_color\`, \`--tgui--section_bg_color\`, etc.)
- The \`AppRoot\` provider was already configured in \`providers.tsx\`, so components work correctly
- Modal dialogs now use the proper Telegram UI modal component
- Form inputs and buttons follow Telegram's design guidelines
- Error and warning messages use the standard \`Banner\` component with appropriate types

This PR was written using [Vibe Kanban](https://vibekanban.com)"

gh pr edit 31 --title "$PR_TITLE" --body "$PR_BODY"
