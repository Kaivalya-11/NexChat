# PRD 4: Obsidian Mint NexChat Workspace Redesign

## 1. Purpose

This PRD defines the implementation of the newly supplied **Emerald / Obsidian Mint NexChat redesign** in the existing application.

The supplied Stitch package contains four reference screens:

1. `sign_in_nexchat_desktop`
2. `nexchat_desktop_redesigned_workspace`
3. `nexchat_channel_members_redesign`
4. `edit_profile`

Design source:

```text
obsidian_mint/DESIGN.md
```

The goal is to make the current application visually match these screens while preserving all existing functionality.

This is a **frontend redesign and integration task**, not a greenfield application.

---

# 2. Source of Truth

Use the supplied Stitch package as the visual source of truth:

```text
stitch_emerald_chat_redesign/
├── sign_in_nexchat_desktop/
│   ├── screen.png
│   └── code.html
├── nexchat_desktop_redesigned_workspace/
│   ├── screen.png
│   └── code.html
├── nexchat_channel_members_redesign/
│   ├── screen.png
│   └── code.html
├── edit_profile/
│   ├── screen.png
│   └── code.html
└── obsidian_mint/
    └── DESIGN.md
```

Use:

- `screen.png` for visual QA
- `DESIGN.md` for design tokens
- `code.html` for structural reference only

Do not copy the Stitch HTML directly into the production codebase.

---

# 3. Existing Application Preservation

Before making changes, Antigravity MUST audit the current application.

Inspect:

- `package.json`
- frontend framework
- router
- authentication
- user/session context
- workspace/channel state
- message state
- API services
- WebSocket/realtime implementation
- member management
- profile management
- theme/CSS/Tailwind setup
- existing components
- environment configuration
- build/lint/test scripts

## Preserve

- authentication provider
- current user/session
- existing backend
- database
- API endpoints
- WebSocket/realtime functionality
- channels
- direct messages
- messages
- reactions
- members
- roles/permissions
- profile data
- existing routing

## Do not

- create a second authentication system
- replace working backend logic
- hardcode sample users/messages in production
- create fake channel/member data when real data exists
- copy generated Stitch HTML wholesale
- introduce a second state-management system unnecessarily
- replace the current framework merely for styling
- remove working features

---

# 4. Product Direction

The new interface should feel like a polished modern collaboration platform with a distinct:

**Obsidian + Emerald + Mint**

visual identity.

The visual language is:

- atmospheric dark green
- tonal layering
- subtle glassmorphism
- calm high-contrast mint
- rounded but controlled geometry
- dense desktop workspace
- tactile message interactions
- restrained shadows
- soft emerald ambient glow

This design is intentionally different from the more aggressive Doomsday/Latverian interface in previous references.

For this PRD, **Obsidian Mint is the source of truth**.

Do not carry over sharp brutalist Doomsday geometry, gold accents, or purple threat styling unless the existing application explicitly requires them.

---

# 5. Design System

## 5.1 Base palette

```css
--surface: #0A1514;
--surface-dim: #0A1514;
--surface-bright: #303B3A;

--surface-container-lowest: #06100F;
--surface-container-low: #131E1C;
--surface-container: #172220;
--surface-container-high: #212C2B;
--surface-container-highest: #2C3736;

--on-surface: #D9E5E3;
--on-surface-variant: #C0C9C2;

--outline: #8A938D;
--outline-variant: #404944;
```

## 5.2 Primary

```css
--primary: #D3FFEA;
--on-primary: #003828;
--primary-container: #B0E4CC;
--on-primary-container: #376754;

--secondary: #8BD5B9;
--secondary-container: #005C45;
```

## 5.3 Text

```css
--text-primary: #EAF5F1;
--text-secondary: #9BB7AE;
--text-disabled: #557B71;
```

## 5.4 Semantic

```css
--error: #E57373;
--warning: #FFB74D;
--presence-online: #B0E4CC;
```

Do not introduce random saturated colors.

The UI should remain predominantly obsidian/forest with jade and mint accents.

---

# 6. Typography

Use:

### Plus Jakarta Sans

For:

- workspace titles
- channel headers
- navigation
- buttons
- labels
- display text
- structural UI

### Inter

For:

- messages
- conversation content
- descriptions
- longer text

### JetBrains Mono

For:

- code blocks
- technical snippets
- system payloads
- technical metadata

## Scale

```text
Display LG
40px / 48px / 700
Plus Jakarta Sans

Display LG Mobile
30px / 36px / 700
Plus Jakarta Sans

Headline LG
24px / 32px / 600
Plus Jakarta Sans

Headline MD
20px / 28px / 600
Plus Jakarta Sans

Headline SM
16px / 24px / 600
Plus Jakarta Sans

Title MD
15px / 20px / 600
Plus Jakarta Sans

Body LG
15px / 24px / 400
Inter

Body MD
14px / 22px / 400
Inter

Body SM
13px / 18px / 400
Inter

Label LG
13px / 16px / 600
Plus Jakarta Sans

Label MD
12px / 16px / 500
Plus Jakarta Sans

Label SM
10px / 12px / 700
Plus Jakarta Sans

Code SM
12px / 18px / 400
JetBrains Mono
```

---

# 7. Shape System

The Obsidian Mint interface uses moderate rounded geometry.

```text
sm:     4px
default: 8px
md:     12px
lg:     16px
xl:     24px
full:   9999px
```

## Chat bubbles

Incoming:

```text
top-left:     16px
top-right:    16px
bottom-right: 16px
bottom-left:   4px
```

Outgoing:

```text
top-left:      16px
top-right:     16px
bottom-left:   16px
bottom-right:   4px
```

This subtle asymmetric anchor should be preserved.

---

# 8. Spacing

```text
space-xs:       4px
space-sm:       8px
space-md:       16px
space-lg:       24px
space-xl:       32px

mobile gutter:  16px
desktop gutter: 24px

mobile margin:  16px
desktop margin: 32px
```

Do not make the UI unnecessarily dense.

---

# 9. Elevation

The design uses tonal layering instead of heavy shadows.

## Level 0

```text
#091413
```

Used for the application canvas.

## Level 1

```text
#112220
border: rgba(40, 90, 72, 0.35)
```

Used for:

- sidebar
- navigation
- composer
- secondary panels

## Level 2

```text
#18332F
box-shadow:
0 4px 16px -2px rgba(4, 10, 9, 0.45)
```

Used for:

- cards
- chat bubbles
- hover surfaces
- contextual controls

## Level 3

Glass popovers:

```css
background: rgba(24, 51, 47, 0.85);
backdrop-filter: blur(16px);
border: 1px solid rgba(64, 138, 113, 0.40);
box-shadow:
  0 12px 32px -4px rgba(2, 6, 5, 0.70),
  0 0 0 1px rgba(176, 228, 204, 0.05);
```

---

# 10. Responsive Workspace Architecture

## Desktop >= 1200px

Use:

```text
64px     workspace rail
260px    channels + DMs
fluid    main chat
360px    optional context/thread panel
```

The right context panel must be collapsible.

## Tablet 768px - 1199px

Use:

```text
collapsible navigation drawer
fluid chat
right-side overlay for threads/context
```

## Mobile < 768px

Use:

```text
single-column chat
full-width content
16px internal gutter
64px bottom navigation
```

Bottom navigation:

```text
Channels
DMs
Mentions
Profile
```

Active item:

- mint icon
- small glowing mint indicator
- readable label

---

# 11. SCREEN 1: NEXCHAT SIGN IN

Reference:

```text
sign_in_nexchat_desktop/screen.png
```

This screen is the primary authentication experience.

---

# 12. Login Layout

The login page should present:

```text
NexChat branding
End-to-End Secure Channel
workspace/channel preview
credential form
remember session
availability/status
OAuth options
workspace creation
system status footer
```

The page should feel like a calm, secure collaboration product.

Do not use the Doomsday/Latverian aesthetic here unless the existing application explicitly switches themes.

---

# 13. Login Header

Display:

```text
🚀 NexChat
v2.4
```

or equivalent application branding from the reference.

Use:

- product icon/logo
- product name
- version indicator
- subtle dark surface

Do not hardcode a version if the application already has a real version source.

---

# 14. Security Status

The reference contains:

```text
End-to-End Secure Channel
```

with a secure/active indicator.

If the application actually provides end-to-end encryption, connect this to the real state.

If it does not, do not falsely claim E2E encryption.

Use accurate security terminology based on the existing product.

---

# 15. Workspace Preview

The reference includes a workspace/channel preview around the sign-in experience.

Visual elements include:

```text
workspace-1
Dev Team Core
Channels
# test
# general
# announcements
# random
# dev-ops
Direct Messages
```

This is a visual preview and should not replace real post-login workspace navigation.

If the existing app can provide workspace preview data before authentication, use it.

Otherwise treat the preview as static decorative content.

---

# 16. Login Form

Inputs:

```text
Email
Password
```

Example reference:

```text
kaivalya@nexchat.io
••••••••••••
```

Do not hardcode the email in production.

## Password visibility

The eye/visibility control must work.

Requirements:

- keyboard accessible
- accessible label
- toggle input type
- preserve typed value

---

# 17. Remember Session

Reference:

```text
Remember session (30 days)
```

If the existing authentication provider supports persistent sessions:

- connect the checkbox to the actual auth persistence behavior

If it does not:

- do not claim that a 30-day persistent session has been established

Use a normal accessible checkbox/switch.

---

# 18. Presence on Login

Reference includes:

```text
Join as Available
```

This should map to the application's real presence system if available.

Potential options:

```text
Available
Away
Focus Mode
Invisible
```

If the existing application has presence support, persist the selected initial status.

Otherwise keep this as a UI preference until backend support exists.

---

# 19. Primary Sign In Button

Reference:

```text
Sign In
```

Style:

```css
background: #B0E4CC;
color: #091413;
font-weight: 600;
border-radius: 8px;
```

Hover:

```css
background: #C5EFE0;
box-shadow: 0 0 16px rgba(176,228,204,0.35);
```

The button must invoke the existing authentication logic.

States:

```text
default
hover
focus
submitting
success
error
disabled
```

---

# 20. OAuth

Reference:

```text
or sign in with

Google Workspace
GitHub
```

Only show providers actually supported by the current application.

Do not build fake OAuth integrations.

Use existing callback/session logic.

---

# 21. Create Workspace

Reference:

```text
Create workspace
```

Connect to the application's existing workspace creation flow if available.

If workspace creation is not currently supported:

- preserve the visual location
- either hide the action or route to the existing supported onboarding path
- do not create fake functionality

---

# 22. Login Status Footer

Reference:

```text
All NexChat systems normal
Latency: 18ms
256-bit TLS Encrypted
Privacy Policy
Security Audit
Status
```

Important:

These values must be truthful.

Do not hardcode a live latency number or encryption claim unless the application can actually provide it.

For a static design-only status:

- clearly treat it as non-authoritative UI
- do not present fake system telemetry as real monitoring

---

# 23. SCREEN 2: DESKTOP WORKSPACE

Reference:

```text
nexchat_desktop_redesigned_workspace/screen.png
```

This is the main application shell.

---

# 24. Workspace Structure

Desktop layout:

```text
┌──────┬──────────────┬──────────────────────────────┬───────────────┐
│ Rail │ Channels/DMs │          Main Chat            │ Context/Thread│
│ 64px │    260px     │             Fluid            │     360px     │
└──────┴──────────────┴──────────────────────────────┴───────────────┘
```

The right context panel is optional/toggleable.

---

# 25. Workspace Rail

The workspace rail should provide:

- product/workspace icon
- workspace switcher
- navigation icons
- active state
- profile shortcut

Use dark tonal layering.

Active navigation:

```text
background: #18332F
icon: #B0E4CC
```

Do not use bright green everywhere.

---

# 26. Channel Sidebar

Reference workspace:

```text
NexChat
v2.4
workspace-1
Dev Team Core
```

Sections:

```text
Channels
Direct Messages
```

## Channels

Reference:

```text
# test
# general
# announcements
# random
# dev-ops
```

These are examples.

Use real channels from the backend.

Each channel row supports:

- icon
- name
- active state
- unread state
- mute state if available
- optional count

---

# 27. Active Channel

Reference:

```text
# test
Active
12 members
```

The active channel should use:

- elevated surface
- mint text
- subtle green border/accent
- readable member count

Do not overuse strong glow.

---

# 28. Direct Messages

Reference:

```text
Direct Messages
Kaivalya
Sarah Chen
Alex Vance
Elena Rostova
```

Each DM row supports:

- avatar
- presence
- name
- role/status
- unread indicator
- latest activity

Use real application data.

---

# 29. Main Chat Header

Reference:

```text
# test
Active
12 members

Search #test...
⌘K
```

Header should include:

- channel icon
- channel name
- active state
- member count
- search
- keyboard shortcut hint
- invite members
- integrations
- guidelines
- more menu

Only expose actions supported by the current application.

---

# 30. Channel Quick Actions

Reference:

```text
Invite Members
Add Integration
View Guidelines
```

Map to existing application features.

If an integration system does not exist, do not fake an integration workflow.

If guidelines are available, open the existing guidelines/channel information.

---

# 31. Conversation Intro

Reference:

```text
Welcome to #test!

This is the beginning of the #test channel.
```

The intro should only appear when appropriate, such as an empty/new channel.

Do not display an empty-state card above an existing conversation.

---

# 32. Message List

Use:

```text
4px spacing
```

for consecutive messages from the same sender.

Use:

```text
16px
```

between message clusters.

Message group structure:

```text
Avatar
Sender
Role
Timestamp
Message
Reactions
```

---

# 33. Message Styling

## Incoming

```css
background: #112220;
border: 1px solid rgba(40, 90, 72, 0.35);
color: #EAF5F1;
```

## Outgoing

```css
background: #18332F;
border: 1px solid rgba(64, 138, 113, 0.45);
color: #EAF5F1;
```

Use asymmetric message radius from the design system.

---

# 34. Mentions

Mention highlights:

```css
background: rgba(176, 228, 204, 0.10);
border-left: 3px solid #B0E4CC;
```

Support:

- `@username`
- current-user mention
- mention click/navigation if supported

---

# 35. Markdown / Rich Text

The reference demonstrates:

```text
*bold*
_italic_
`code`
```snippet```
```

The existing chat renderer should support its current markdown/rich-text features.

The redesign must style those elements to match Obsidian Mint.

Do not remove existing formatting support.

---

# 36. Code Block

Reference includes:

```text
socket-client.ts
Copy
```

and a technical snippet.

Create/adapt:

```text
CodeMessage
```

Requirements:

- JetBrains Mono
- elevated dark surface
- syntax-friendly contrast
- filename/header
- Copy button
- horizontal scrolling on mobile
- accessible copy action

The copy button must copy the actual code.

---

# 37. Reactions

Reference shows:

```text
👍
🚀
❤️
```

Use:

```css
height: 28px;
background: rgba(17,34,32,0.8);
border: 1px solid #285A48;
border-radius: 9999px;
```

Current-user active:

```css
background: rgba(64,138,113,0.30);
border-color: #B0E4CC;
color: #B0E4CC;
```

Connect to existing reaction state/API.

---

# 38. Joined/System Messages

Reference:

```text
Elena Rostova
joined the channel • Today at 11:42 AM
```

Render system/join events using a compact low-emphasis style.

Do not make system events look like normal user messages.

---

# 39. Message Composer

Reference:

```text
Message #test... (Shift+Enter for new line)
```

Requirements:

- bottom-docked
- elevated dark surface
- 1px structural border
- attachment action
- emoji action
- voice action where supported
- formatting action where supported
- input
- send button

### Send behavior

```text
Enter       -> send
Shift+Enter -> newline
```

Only if this matches existing application behavior.

---

# 40. Composer Styling

Reference:

```css
background: #112220;
border: 1px solid #285A48;
padding: 12px 16px;
```

Focus:

```css
border-color: #408A71;
box-shadow:
  0 0 0 2px rgba(64,138,113,0.25);
```

Primary send action:

```text
mint/jade
```

Do not make the composer excessively bright.

---

# 41. SCREEN 3: CHANNEL MEMBERS

Reference:

```text
nexchat_channel_members_redesign/screen.png
```

This is the channel/workspace member management experience.

---

# 42. Members Modal / Drawer

The reference presents a contextual member-management surface.

Use:

- elevated dark surface
- rounded 16px container
- glass/tonal depth
- close button
- clear header hierarchy

Header:

```text
Channel Members - Obsidian Mint
```

or equivalent channel-specific title.

---

# 43. Invite User

Reference:

```text
Workspace scope
Select user to invite...
```

The invite component must:

- search/select users
- prevent duplicate membership
- respect permissions
- submit through existing API
- show loading
- show success
- show error

Do not hardcode:

```text
Priya Sharma
Liam O'Connor
Zoe Kravitz
Dan Henderson
```

Those are reference examples only.

---

# 44. Member Search

Reference:

```text
Search members by name or role...
```

Support:

- name search
- role search where applicable
- keyboard interaction
- clear search
- no-results state

Use server-side search if the existing application already supports it.

---

# 45. Member Sorting

Reference:

```text
Sort: Hierarchy
```

Support sorting if member-management functionality already has it.

Possible:

```text
Hierarchy
Name
Presence
Recently Active
```

Only expose sort modes that can be implemented correctly.

---

# 46. Member Cards

Reference examples include:

```text
Kaivalya
Admin
Available
Workspace Founder
```

```text
Sarah Chen
Lead Dev
```

```text
Alex Vance
Designer
In a meeting
```

```text
Elena Rostova
Contributor
Away
Seen 2h ago
```

Use actual:

- name
- avatar
- role
- presence
- status
- last-seen
- permissions

---

# 47. Presence

Use:

```text
Online
Away
Focus Mode
Invisible
Offline
```

only if the existing presence system supports them.

Visual:

```text
Online  -> #B0E4CC
Away    -> #FFB74D
Offline -> muted slate
```

Never rely only on color.

---

# 48. Member Actions

Potential actions:

- view profile
- change role
- remove member
- manage permissions
- copy channel invite link

The reference includes:

```text
Copy Channel Invite Link
```

If supported, copy the actual invite link.

Do not create a fake link.

---

# 49. Permissions

The current user must only see actions they are authorized to perform.

Backend authorization remains authoritative.

Frontend role checks are for UX only.

---

# 50. SCREEN 4: EDIT PROFILE

Reference:

```text
edit_profile/screen.png
```

This screen is a profile editing modal/page.

---

# 51. Profile Header

Reference:

```text
Workspace Profile
```

with workspace navigation and top actions.

The profile editor should feel like part of the same Obsidian Mint application shell.

---

# 52. Avatar

Reference includes:

```text
Upload custom avatar image
Avatar Presets
5 styles available
```

Requirements:

- current avatar
- upload custom image
- preview before save if existing app supports it
- preset avatar options
- selected state
- fallback avatar
- validation for image type/size where applicable

The five preset examples are design references.

If the application has existing avatar presets, use them.

Otherwise do not invent a persistent backend avatar system unless required.

---

# 53. Avatar Upload

Requirements:

- file picker
- supported image formats
- size validation
- upload progress where applicable
- error handling
- cancel/revert
- preview
- save

Do not expose raw storage URLs unnecessarily.

---

# 54. Status Text

Reference:

```text
Status Text
Markdown supported

What's your current focus?
```

Implement a status field.

Requirements:

- editable text
- character limit if backend has one
- markdown support only if the current renderer supports it
- clear button
- empty state

Do not claim Markdown support if the actual product does not render Markdown.

---

# 55. Presence Selector

Reference:

```text
Presence
Online
Visible to workspace
```

Options:

```text
Online
Away
Focus Mode
Invisible
```

Use existing presence logic.

Persist the selection through the existing API/state system.

---

# 56. Save Changes

Reference:

```text
Save Changes
```

Requirements:

- disabled if nothing changed
- submitting state
- success state
- error state
- optimistic UI only if safe
- revert on failure where necessary

On success, update the global user/profile state so other screens immediately reflect the change.

---

# 57. Profile Success Feedback

Reference:

```text
Profile updated successfully!
```

Use a toast/inline confirmation consistent with the application.

Do not leave a permanent success banner after navigation.

---

# 58. Mobile Bottom Navigation

The reference uses:

```text
Channels
DMs
Mentions
Profile
```

Requirements:

- fixed bottom
- backdrop blur
- dark green background
- top border
- active mint pip
- safe-area padding

CSS concept:

```css
background: rgba(17,34,32,0.90);
backdrop-filter: blur(20px);
border-top: 1px solid rgba(40,90,72,0.40);
```

The active tab should be derived from the current route/state.

---

# 59. Search

The workspace reference contains:

```text
Search #test...
⌘K
```

Implement the existing search mechanism.

If there is no global keyboard shortcut:

- do not display a misleading shortcut unless one is actually implemented.

Search must support:

- keyboard focus
- clear
- loading
- no results
- result selection
- escape to close where applicable

---

# 60. Data Integration

Map the existing application data:

```text
Workspace
    -> workspace rail/header

Channel
    -> channel sidebar
    -> active channel
    -> channel header

DirectMessage
    -> DM sidebar

User
    -> avatar
    -> name
    -> presence
    -> profile

Message
    -> message stream

Reaction
    -> reaction pills

Member
    -> members panel

Role
    -> member badge

Profile
    -> edit profile

Presence
    -> online/away/focus/invisible
```

Keep backend model names unchanged.

Visual labels may differ from backend terminology.

---

# 61. State Management

Use the application's current state-management approach.

Avoid duplicating:

- auth state
- user state
- message state
- channel state
- presence state
- member state

UI state may include:

```text
isSearchOpen
isMembersOpen
isProfileOpen
isInviteOpen
isContextPanelOpen
composerValue
memberSearch
selectedSort
```

Server state should remain in the existing server-state/data layer.

---

# 62. Routing

Reuse current routes.

Possible conceptual routes:

```text
/login
/workspace
/channel/:channelId
/channel/:channelId/members
/profile
```

These are examples only.

If equivalent routes already exist, keep them.

---

# 63. Accessibility

Requirements:

- semantic navigation
- accessible icon buttons
- keyboard navigation
- visible focus
- accessible dialog/drawer semantics
- labels for form fields
- `aria-expanded`
- `aria-current`
- `aria-live` for relevant realtime events
- accessible reaction buttons
- accessible copy buttons
- screen-reader-friendly presence/status text

Do not use color as the only indication of:

- active state
- online status
- errors
- unread state

---

# 64. Performance

The redesign must not degrade chat performance.

Requirements:

- memoize message rows where useful
- avoid rerendering all messages for a reaction update
- virtualize very large message lists if necessary
- lazy-load profile/member panels where appropriate
- optimize avatars
- avoid repeated expensive blur operations across huge lists
- avoid unnecessary global state updates

Glassmorphism should be used selectively because excessive `backdrop-filter` usage can hurt performance.

---

# 65. Image and Asset Rules

The Stitch package may contain generated/reference assets.

Do not rely on remote design-preview URLs in production.

Use:

1. existing application assets
2. local supplied assets
3. user-uploaded assets
4. application storage/CDN
5. CSS fallbacks

All avatars must have reliable fallbacks.

---

# 66. Loading States

Use Obsidian Mint themed skeletons.

Examples:

```text
workspace loading
channel loading
message loading
members loading
profile loading
```

Skeleton colors should remain within:

```text
#131E1C
#172220
#212C2B
```

Do not use bright neutral gray skeletons.

---

# 67. Empty States

Examples:

### No messages

```text
Welcome to #channel
This is the beginning of the conversation.
```

### No members

```text
No members found.
```

### No search results

```text
No matching channels or people.
```

### No DMs

```text
No direct messages yet.
```

Keep empty states visually calm and concise.

---

# 68. Error States

Use:

```text
#E57373
```

with dark red-tinted surfaces.

Every error should communicate:

- what failed
- whether retry is available
- what the user can do

Example:

```text
Unable to update your profile.
Please try again.

[Retry]
```

Avoid technical stack traces in the UI.

---

# 69. Motion

Use subtle motion:

```text
150-220ms
ease-out
```

Suitable effects:

- drawer opening
- modal opening
- hover surface
- button press
- reaction activation
- presence change
- toast appearance

Avoid excessive animations.

Respect:

```css
prefers-reduced-motion: reduce;
```

---

# 70. Implementation Sequence

## Phase 1: Repository Audit

Identify:

- existing login page
- workspace shell
- sidebar
- channel page
- members UI
- profile UI
- theme system
- state
- API
- realtime

Create a mapping from current components to Stitch components.

## Phase 2: Design Tokens

Implement:

- Obsidian Mint colors
- typography
- spacing
- radius
- elevation
- glass surfaces
- message bubble geometry

## Phase 3: Shared UI

Build/adapt:

```text
Avatar
PresenceIndicator
Badge
IconButton
SearchField
GlassPanel
Tactical/Primary Button
Dialog
Drawer
Toast
```

Do not duplicate existing primitives.

## Phase 4: Authentication

Implement the sign-in reference.

Connect it to the existing auth system.

## Phase 5: Workspace Shell

Implement:

- workspace rail
- channel sidebar
- DMs
- main chat
- context panel
- responsive navigation

## Phase 6: Chat

Implement:

- channel header
- messages
- markdown
- code blocks
- reactions
- system messages
- composer
- typing state

## Phase 7: Members

Implement:

- member drawer/modal
- search
- sort
- invite
- roles
- presence
- actions
- invite link

## Phase 8: Profile

Implement:

- avatar
- avatar presets
- status
- presence
- save flow
- success/error

## Phase 9: Responsive QA

Test:

```text
375x812
390x844
768x1024
1280x720
1440x900
1920x1080
```

## Phase 10: Accessibility QA

Verify:

- keyboard
- focus
- labels
- dialogs
- navigation
- screen reader announcements
- contrast

## Phase 11: Production Validation

Run only existing project scripts:

```text
npm install
npm run lint
npm run build
npm test
```

Use the repository's actual package manager/scripts.

---

# 71. Visual QA Checklist

Compare implementation directly against the four supplied screenshots.

## Sign In

- [ ] branding placement
- [ ] workspace preview
- [ ] form proportions
- [ ] input styling
- [ ] remember-session control
- [ ] primary button
- [ ] OAuth buttons
- [ ] footer/status

## Workspace

- [ ] 64px rail
- [ ] 260px channel sidebar
- [ ] main chat proportions
- [ ] optional 360px context panel
- [ ] channel hierarchy
- [ ] DM hierarchy
- [ ] active state
- [ ] message density
- [ ] composer

## Members

- [ ] modal/drawer dimensions
- [ ] invite selector
- [ ] search
- [ ] sorting
- [ ] member cards
- [ ] roles
- [ ] presence
- [ ] actions
- [ ] invite-link control

## Profile

- [ ] profile header
- [ ] avatar
- [ ] avatar presets
- [ ] status input
- [ ] presence selector
- [ ] save button
- [ ] success feedback
- [ ] bottom navigation

---

# 72. Acceptance Criteria

## Design

- [ ] Obsidian Mint palette is implemented.
- [ ] Plus Jakarta Sans is used for structural UI.
- [ ] Inter is used for conversational content.
- [ ] JetBrains Mono is used for code/technical content.
- [ ] Tonal layering is consistent.
- [ ] Glassmorphism is subtle.
- [ ] Rounded geometry matches the design.
- [ ] Message bubble corners match the reference.
- [ ] Mint highlights are used selectively.

## Authentication

- [ ] Existing login still works.
- [ ] Password visibility works.
- [ ] Remember session works if supported.
- [ ] Presence selection works if supported.
- [ ] OAuth providers remain functional.
- [ ] Create-workspace action maps to existing functionality.
- [ ] Login errors are handled.
- [ ] Loading state is handled.

## Workspace

- [ ] Channels load from real data.
- [ ] DMs load from real data.
- [ ] Active channel works.
- [ ] Search works.
- [ ] Messages load.
- [ ] Messages send.
- [ ] Reactions work.
- [ ] Markdown works where previously supported.
- [ ] Code copy works.
- [ ] Composer works.
- [ ] Existing realtime behavior remains intact.

## Members

- [ ] Real members render.
- [ ] Member search works.
- [ ] Sorting works where supported.
- [ ] Invite flow works where supported.
- [ ] Permissions are respected.
- [ ] Presence is accurate.
- [ ] Copy invite link copies the actual link.

## Profile

- [ ] Existing profile data loads.
- [ ] Avatar changes work where supported.
- [ ] Presets work where supported.
- [ ] Status text saves.
- [ ] Presence saves.
- [ ] Save state works.
- [ ] Success/error feedback works.
- [ ] Global user state updates after save.

## Responsive

- [ ] 375px works.
- [ ] 390px works.
- [ ] Tablet works.
- [ ] 1280px works.
- [ ] 1440px works.
- [ ] 1920px works.
- [ ] No horizontal overflow.
- [ ] Composer remains accessible.
- [ ] Bottom navigation works on mobile.
- [ ] Context panels become drawers/overlays appropriately.

## Accessibility

- [ ] Keyboard navigation works.
- [ ] Focus is visible.
- [ ] Forms have labels.
- [ ] Icon-only controls have accessible names.
- [ ] Dialogs have proper semantics.
- [ ] Status is not conveyed only by color.
- [ ] Realtime updates are accessible where appropriate.

## Quality

- [ ] No duplicate backend systems.
- [ ] No fake production data.
- [ ] No unnecessary dependency additions.
- [ ] No remote Stitch-hosted asset dependency.
- [ ] No critical console errors.
- [ ] Existing routes work.
- [ ] Existing APIs work.
- [ ] Build succeeds.
- [ ] Lint succeeds where configured.
- [ ] Tests succeed where configured.

---

# 73. Definition of Done

The implementation is complete when:

1. The four Stitch screens have been integrated into the existing application.
2. Obsidian Mint is implemented as a reusable design system.
3. Authentication remains functional.
4. Workspace/channel navigation remains functional.
5. Chat remains functional.
6. Members management remains functional.
7. Profile editing remains functional.
8. Real application data drives the interface.
9. Responsive behavior works across mobile/tablet/desktop.
10. Accessibility requirements are satisfied.
11. No production dependency remains on Stitch preview assets.
12. Build/lint/tests pass where configured.
13. Visual QA has been performed against all four Stitch screenshots.

---

# 74. Final Antigravity Instruction

Treat this Stitch package as a **frontend redesign of the existing NexChat application**.

Do not build a standalone demo.

Do not copy the generated HTML architecture.

Instead:

```text
Existing NexChat
      ↓
Audit Current Architecture
      ↓
Implement Obsidian Mint Tokens
      ↓
Redesign Authentication
      ↓
Redesign Workspace Shell
      ↓
Redesign Chat
      ↓
Redesign Members
      ↓
Redesign Profile
      ↓
Connect Existing APIs/State
      ↓
Responsive + Accessibility QA
      ↓
Production Validation
```

The final result should look and feel like the supplied **Obsidian Mint NexChat** design while remaining the same real application underneath.

Priority order:

```text
1. Existing functionality
2. Data correctness
3. Authentication and permissions
4. Responsive behavior
5. Accessibility
6. Visual fidelity
7. Performance
8. Maintainability
```
