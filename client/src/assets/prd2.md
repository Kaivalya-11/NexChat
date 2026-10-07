# PRD 2: Profile Control Card Redesign

## 1. Overview

Implement the new profile/control card design shown in the provided reference image inside the existing Real-Time Chat System.

This is a **frontend-only visual and interaction enhancement** to the existing profile card in the sidebar.

The existing application functionality must remain intact. Reuse the current authentication, profile, presence, theme, logout, search, and navigation logic wherever it already exists.

### Primary objective

Replace the current sparse profile card with a compact futuristic control panel that feels consistent with the existing Emerald / Doom-inspired chat interface.

The card should feel useful rather than decorative, while remaining visually clean and not overcrowded.

---

# 2. Existing Application Context

The application is an existing real-time chat system built with:

- Next.js
- React
- Tailwind CSS
- Node.js
- Express
- MongoDB / Mongoose
- Socket.IO / WebSockets
- JWT authentication

The current profile card already contains:

- User avatar
- User name
- Presence/status
- Settings button
- Appearance/theme control
- Logout control

The application also already has an **Edit Profile** modal containing:

- Profile photo change
- Status text
- Presence selector
- Cancel
- Save Changes

Therefore, this redesign must **not duplicate profile-editing functionality** inside the card.

---

# 3. Design Reference

The target visual direction is the provided profile-card reference:

- Near-black background
- Deep emerald/green surfaces
- Thin emerald borders
- Subtle green glow
- Rounded corners
- Futuristic desktop-chat aesthetic
- Clean typography
- Minimal neon accents
- Dark translucent surfaces
- Strong visual hierarchy
- Compact controls

The reference contains:

1. Large circular user avatar
2. Online status indicator
3. User name
4. "Active now" presence indicator
5. Settings icon
6. Profile shortcut
7. Saved Messages shortcut
8. Ctrl + K Quick Search shortcut
9. Appearance control
10. Logout control

---

# 4. Important Clarification

The **N / Next.js logo currently visible at the bottom-left of the existing card is NOT an application feature**.

It is a Next.js development overlay/configuration indicator.

DO NOT recreate it.

DO NOT add an N logo.

DO NOT create a replacement for it.

The final application card should not contain that element.

---

# 5. Design Goals

The redesigned card should:

- Make better use of the available space
- Keep the user identity as the primary visual focus
- Provide useful shortcuts
- Preserve the existing profile functionality
- Fit naturally into the existing sidebar
- Match the Emerald/Doom visual language
- Avoid excessive decoration
- Remain compact enough for a desktop chat sidebar

The card should NOT become a dashboard.

---

# 6. User Identity Section

At the top of the card:

### Avatar

Display the authenticated user's existing avatar.

Requirements:

- Circular shape
- Large enough to be the primary visual element
- Emerald border or subtle emerald glow
- Existing online/presence indicator positioned around the lower-right edge
- Use the actual user's avatar from the application

Do not hardcode the reference person's image.

Do not replace the existing avatar data source.

### Settings

Place the existing settings/profile configuration button in the top-right corner.

Clicking it should continue to use the application's existing settings/profile behavior.

Do not create a second settings system.

### Name

Display the currently authenticated user's real display name.

Do not hardcode "Kaivalya".

The reference uses Kaivalya only as visual content.

---

# 7. Presence Display

Remove the standalone green text:

> Available

The redesigned card should NOT display the current status as a large green "Available" label.

Instead, use a smaller presence treatment such as:

- green status dot
- "Active now"

The exact presence text should be driven by the application's actual presence state where available.

The user's existing presence functionality must remain intact.

Do not create a second presence system.

### Important

The Edit Profile modal already handles:

- Status Text
- Presence selection

The card should simply DISPLAY the current state rather than duplicating those controls.

---

# 8. Profile Shortcut

Add a compact shortcut card/button:

### Icon

Use a simple profile/user icon.

### Label

`Profile`

### Supporting text

`View & edit profile`

### Interaction

Clicking the control should open the existing Edit Profile / profile panel functionality.

Do not create another profile editor.

Use the existing modal/component if available.

---

# 9. Saved Messages Shortcut

Add a second compact shortcut:

### Icon

Bookmark / saved-message icon.

### Label

`Saved Messages`

### Supporting text

Display a real count only if the application already has saved-message/bookmark functionality and data.

If saved messages are NOT currently implemented:

- Do not fabricate a number such as "12 saved items"
- Do not create fake data
- Either display the shortcut without a fake count or keep this feature disabled/clearly marked for future implementation

### Interaction

If the existing application has saved-message functionality, navigate/open it using the existing implementation.

Do not create an unrelated new data system solely for this visual card.

---

# 10. Quick Search

Add a wide shortcut/control below Profile and Saved Messages.

### Visual structure

The reference uses:

`Ctrl` + `K`

followed by:

Search icon

`Quick Search`

Supporting text:

`Search channels, users, messages...`

### Interaction

Clicking the Quick Search control should open the application's existing SearchModal/Search functionality.

The keyboard shortcut should use the existing search functionality if it already exists.

If Ctrl+K is not currently implemented, add the keyboard shortcut only if it can be integrated cleanly with the existing SearchModal without changing unrelated behavior.

### Platform consideration

On macOS, display:

`⌘ K`

On Windows/Linux, display:

`Ctrl K`

Use the appropriate platform detection only if the project already has a suitable mechanism. Otherwise, `Ctrl K` is acceptable.

---

# 11. Appearance Control

The bottom section should contain the existing appearance/theme control.

Use the existing application theme functionality.

The reference uses:

- Sun icon
- `Appearance`
- Chevron

Do not create a separate theme manager.

Do not change the existing light/dark theme implementation.

The control should continue changing the application's existing appearance.

---

# 12. Logout Control

Place the existing logout action in the bottom-right section.

Visual direction:

- Red/coral accent
- Logout/arrow icon
- Clear affordance
- Compact presentation

The logout action must call the existing authentication logout function.

Do not implement a second logout flow.

Do not change JWT/session behavior.

---

# 13. Layout

Recommended structure:

```text
Profile Card
│
├── Top / Identity
│   ├── Avatar
│   ├── Online indicator
│   ├── User name
│   ├── Active now
│   └── Settings
│
├── Divider
│
├── Quick Actions
│   ├── Profile
│   └── Saved Messages
│
├── Quick Search
│   └── Ctrl + K
│
├── Divider
│
└── Footer
    ├── Appearance
    └── Logout
```

Maintain generous but controlled spacing.

Do not allow the card to become excessively tall if the existing sidebar has limited vertical space.

---

# 14. Visual Styling

## Background

Use the existing application dark theme.

Target:

- near-black / very dark green
- subtle emerald tint
- no bright solid green background

## Border

Use a thin emerald border.

Avoid thick borders.

## Glow

Use a restrained emerald glow around:

- avatar
- active state
- selected/hovered controls

Avoid excessive neon glow.

## Corners

Use rounded corners consistent with the existing sidebar.

Do not introduce a completely different radius system.

## Typography

Follow the application's existing typography where possible.

Suggested hierarchy:

- User name: prominent
- Active now: small muted text
- Shortcut titles: medium emphasis
- Supporting descriptions: smaller muted text
- Keyboard keys: compact monospace/technical style if consistent with the existing design

---

# 15. Interaction States

Every interactive control must have clear states.

### Default

Dark surface with subtle border.

### Hover

- Slight emerald border increase
- Slight background lift
- Subtle glow

### Active / pressed

Slightly darker or inset appearance.

### Focus

Accessible visible focus ring.

Do not rely exclusively on color for focus.

---

# 16. Responsive Behavior

The existing sidebar must continue working on:

- Desktop
- Tablet
- Smaller screens

Do not force the profile card to maintain a desktop-only fixed width.

On narrower layouts:

- reduce supporting text if necessary
- maintain readable labels
- preserve avatar and name
- keep buttons usable
- prevent horizontal overflow

Do not remove functionality on mobile.

---

# 17. Accessibility

Maintain:

- semantic buttons
- accessible labels
- keyboard navigation
- visible focus states
- meaningful aria-labels for icon-only controls
- sufficient text contrast

Examples:

Settings button:

`aria-label="Settings"`

Close/other icon-only controls should follow the same pattern.

Do not replace real buttons with clickable `<div>` elements.

---

# 18. Existing Component Reuse

Before creating new components, inspect the existing project.

Reuse existing components/utilities for:

- Edit Profile
- Search Modal
- theme/appearance
- logout
- avatar
- icons
- tooltips
- buttons

Do not duplicate existing functionality.

If the existing profile card is already implemented inside `UserProfilePanel.jsx`, modify it directly or extract only genuinely reusable pieces.

Do not create unnecessary files.

---

# 19. Functional Mapping

The visual controls must map to existing functionality:

| UI Element | Existing Functionality |
|---|---|
| Avatar | Current authenticated user avatar |
| Name | Current authenticated user |
| Active now | Existing presence/status |
| Settings | Existing settings/profile action |
| Profile | Existing Edit Profile/Profile Panel |
| Saved Messages | Existing saved-message feature if available |
| Quick Search | Existing SearchModal/search |
| Ctrl+K | Existing search, if supported |
| Appearance | Existing theme control |
| Logout | Existing AuthContext logout |

No fake data should be introduced.

---

# 20. Do Not Change

This task must NOT modify:

- MongoDB schemas
- MongoDB queries
- Express routes
- Socket.IO events
- WebSocket behavior
- JWT authentication
- authentication storage
- message logic
- channel logic
- presence backend
- WebRTC
- API contracts
- message rendering
- chat behavior
- notification logic
- pagination
- file uploads

Only frontend profile-card presentation and its direct UI interactions should be affected.

---

# 21. Next.js Considerations

Do not introduce:

- new Next.js architecture
- new server components
- new API routes
- new data-fetching architecture

Keep the existing application architecture.

The profile card is an existing interactive client-side feature.

Use the existing client component structure.

---

# 22. Implementation Process

Before editing:

1. Locate the current profile card.
2. Locate its parent/sidebar component.
3. Locate existing profile/settings logic.
4. Locate existing search modal.
5. Locate existing theme control.
6. Locate existing logout function.
7. Locate saved-message functionality, if present.
8. Inspect existing styles/design tokens.
9. Reuse existing icons/components where possible.

Then implement the redesign.

Do not rewrite unrelated components.

---

# 23. Code Quality

Keep the implementation straightforward.

Avoid:

- unnecessary abstraction
- unnecessary custom hooks
- unnecessary state
- unnecessary context changes
- unnecessary memoization
- duplicate components
- hardcoded user data
- fake counters
- excessive configuration
- large new dependencies

The card should be simple enough for a developer to understand quickly.

---

# 24. Acceptance Criteria

The implementation is complete when:

- [ ] Current user avatar appears correctly
- [ ] Current user name appears dynamically
- [ ] Presence indicator appears correctly
- [ ] Large "Available" text is removed
- [ ] Settings action still works
- [ ] Profile shortcut opens existing profile/edit functionality
- [ ] Saved Messages shortcut behaves correctly if the feature exists
- [ ] No fake saved-message count is introduced
- [ ] Quick Search opens the existing search functionality
- [ ] Ctrl+K works if supported/implemented
- [ ] Appearance control continues to work
- [ ] Logout continues to work
- [ ] Next.js development overlay/N logo is NOT recreated
- [ ] No backend functionality is changed
- [ ] No API contracts are changed
- [ ] No Socket.IO behavior is changed
- [ ] Responsive layout works
- [ ] Keyboard navigation works
- [ ] Hover/focus states work
- [ ] Existing application styling remains consistent
- [ ] No unnecessary new files are introduced

---

# 25. Verification

After implementation:

1. Run the existing build.
2. Run lint.
3. Check the sidebar at desktop width.
4. Check the sidebar at a narrow viewport.
5. Verify the profile button.
6. Verify settings.
7. Verify search.
8. Verify appearance/theme.
9. Verify logout.
10. Verify avatar and presence.
11. Confirm the Next.js development overlay is not part of the implementation.
12. Confirm no backend files were unnecessarily modified.

If anything unrelated breaks, fix it before finishing.

---

# 26. Final Instruction to Antigravity

Implement this design in the CURRENT application.

Do not rebuild the application.

Do not replace existing functionality with mock behavior.

Do not hardcode the reference user's name, avatar, status, or saved-message count.

Use the reference image as the visual target, while using the application's real data and existing functionality.

The final result should feel like a polished Emerald/Doom-inspired profile control card that naturally belongs to the existing real-time chat application.

Preserve the existing application architecture and functionality completely.
