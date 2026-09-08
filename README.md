# Me. Thrive

Act as an expert full-stack engineer and premium UI/UX designer. Build a complete, highly responsive, multi-page web application called "me." (including the period, styled in a lowercase bold accent). The app is a holistic self-improvement ecosystem tailored to a user's life stage across Faith, Mind, Body, Community, and Resources.

Premium UI/UX, Theme Control & Aesthetics (Aesthetic Foundations)

App Name & Branding: Brand the app as me. (representing the ultimate, authentic version of oneself). Use a clean, modern, minimalist aesthetic.

Theme System (Enforce Light and Dark Modes):

Provide a clear global Light/Dark mode switch toggle (with a Sun/Moon icon) in the header.

Dark Mode: Deep Slate/Charcoal background (#0F172A to #1E293B), dark borders (#1E293B), and bright off-white primary text.

Light Mode: Soft Zinc/Off-White background (#F8FAFC), clean white card containers, soft grey borders (#E2E8F0), and dark slate primary text (#0F172A).

Color Accents: different shade of navy blue for Body metrics,  Faith metrics, and  Mind metrics.

Pillar Organization: Keep navigation and headers clean and punchy. Use only "Faith", "Mind", and "Body" as the primary navigation terms rather than attaching spiritual, mental, and physical qualifiers.

Dynamic Motion, Micro-interactions & Transitions (Mandate)

Micro-Interactions & Spring Physics: Ensure every interactive button, checklist tile, and navigation button uses organic spring transitions. Buttons should compress slightly on active press (active:scale-95) and expand/glow gently on hover (hover:scale-[1.02] hover:shadow-md).

Page & Component Transitions: All tab switching, step wizard slides, and page renders must transition smoothly using subtle lateral movements or fade-ins (duration-300 ease-out).

Bento Grid Elevation: Cards in the Bento Grids on the dashboard should float upwards slightly when hovered over, giving a tangible sense of depth and layer height.

Glow & Pulse States: Active indicators, such as the active mood selected, current player state, or active sandbox selectors, must use soft, repeating keyframe animations (like subtle pulsing glows) to draw organic user attention.

Theme Switching Transition: Enforce a global color shift delay (transition-all duration-300) on all background, border, and text elements so changing light/dark mode feels like a smooth fade instead of an abrupt flash.

Mobile-First & Responsiveness Mandate

Mobile Navigation (Thumb-Zone Optimized): Below 768px, hide the sidebar navigation. Implement a fixed sticky bottom tab bar showing the core icons (Dashboard, Faith, Mind, Body, Community) within easy thumb reach. Put secondary options (Resources, Logout, Theme, Phase Switcher) into an elegant full-screen drawer triggered by a "More" button.

Desktop Navigation: Use a permanent vertical sidebar on the left containing the app logo (me.), active user details, and core navigation item links.

Responsive Layouts: Ensure all grids, data widgets, and panels stack beautifully on small viewports and scale up elegantly on desktop.

Onboarding & Personalization State

Implement a global mock state (with a header toggle for sandboxing) that defines the user's active Life Phase:

$$Student, Employee, Business Owner, In-Transition$$

. Changing this phase dynamically customizes the timeline schedules, checklists, budgeting targets, and coaching tips across the entire app.

Page Architecture & Feature Specifications

1. Landing Home Page (/)

Public-facing homepage with a bold, minimal hero layout: "Welcome to me. The blueprint of holistic self-stewardship."

Engaging cards outlining the core pillars (Faith, Mind, Body) utilizing elegant hover-float animations.

A striking, thumb-friendly Call-To-Action (CTA) button: "Start Free" that routes to the Registration page.

2. Onboarding Registration Wizard (/register)

Create a multi-step, clean registration flow with responsive, large touch targets and slide-in transition effects:

Step 1: Core Credentials (Name, Email, Password).

Step 2: Life Phase Selection (Clickable cards representing Student, Employee, Business Owner, or In-Transition).

Step 3: Dynamic Conditional Inputs (Display specific fields with slide-in transition depending on Step 2 selection):

If Student: Input School Name / College and Major of Study.

If Employee: Input Company Name and specific Job Role / Title.

If Business Owner: Input Business Name and Type / Industry of Business.

If In-Transition: Input Transition Goal or next industry target.

Step 4: Primary Focus Selection (e.g., improve my relationship with GOD, Cognitive Renewal, Healthy Lifestyle, Financial Stewardship).

On completion, redirect the user to the Dashboard, pre-populating all metrics with these customized values.

3. Core Dashboard (/dashboard)

Adaptive greeting showing the user's name and details based on their onboarding answers (e.g., "Hi, Sarah 👋 | Marketing Specialist at Google").

Interactive Mood Logger: Touch-friendly buttons (Excellent, Good, Neutral, Stressed) that log and visually map their current emotional alignment.

Daily Timeline Checklists: Custom timeline tasks automatically populated based on their active Life Phase which can be edited by the user.

"Life Happens" Toggle: A burnout-safeguard button that instantly scales down task complexity and switches the daily routine checklist into simplified, stress-free micro-habits.

4. Faith Module (/faith)

Centering daily focus around an active, intimate connection with God:

Guided daily scripture for Creator Connection: A prominent, beautifully styled quote box displaying a daily Bible verse.

Emotional Alignment Filter: A grid of feeling state selectors (Fear, Anxiety, Happy, Love, Peace, Discouraged). Clicking a state displays custom promises, affirmations, and actionable spiritual reflections tailored to that exact feeling with sleek fade-in animations.

Holy Bible Reader: An embedded reading panel where users can select a book (e.g., John, Psalms, Genesis) and a chapter to read full chapters of scripture directly inside the app.

Devotional Notes & Prayer Wall: An interactive reflection canvas to type and save morning insights, alongside a tracker where users can type prayer requests, click "Add", and toggle checkboxes to mark them "Answered".

5. Mind Module (/mind)

Tools designed to renew cognitive patterns, dismantle stress, and build resilience:

Daily Mind Renewal Library: A card grid of 10-minute audio summaries, book digests, and videos. Provide an interactive player with a functional play/pause state indicator and glowing pulse active state.

Feelings Filter: Dynamically matches and filters mind renewal resources based on how the user feels (e.g., Anxious, Stressed, Fatigued, Restless).

Cognitive Restructuring Journal: A distraction-free journaling block with a "Prompt Generator" button that loads therapeutic prompts with a smooth fade effect (e.g., "What toxic cognitive patterns am I replacing with truth today?").

Weekly Mood Graph: A visual, responsive tracker chart displaying historical emotional metrics.

6. Body Module (/body)

Structured with a horizontal sub-tab bar pointing to four high-fidelity pillars:

Health & Lifestyle Tab: Focuses on prevention over prescription. Tracks sleep hygiene, interactive water intake counters, and displays healthy food and exercise templates. Include a mock "Zero Pills" logger advocating for lifestyle medicine.

Positive Relationships Tab: Curated guides and writing spaces centered on establishing emotional boundaries, eliminating codependency, and building healthy, mutual connections.

Financial Stewardship Tab: Practical Make, Manage, and Grow framework. Shows:

Dynamic Make strategies depending on their Life Phase.

An interactive Manage calculator with a slider to adjust savings ratios and compute spendable allowances.

A Grow checklist showing high-yield compounding mechanisms (e.g., Index Funds, cash emergency reserves).

Active Communication Tab: An interactive scenario lab demonstrating how to replace defensive triggers with healthy, constructive dialogue. Provide a step-by-step active communication blueprint (such as mirror validation and using "I" statements).

7. Community Tribes Module (/community)

Swipe-friendly Tribes bar: Join groups aligned with their current focus (e.g., "Holy Spirit Study Group", "Ethical Young Leaders", "Faith & Fitness").

Discussion Feed: A forum timeline showing posts where users can tap heart buttons to Like (using spring heart pops), view comments, and type their own encouraging posts.

8. Resources Library (/resources)

A searchable list of summaries, frameworks, and checkmarks.

Include a sticky search bar at the top with quick filter category chips (Books, Audio, Frameworks, Checklists).

Resource cards should have a working bookmark toggle button to save favorites with a smooth visual active state.

9. Admin Dashboard (/admin)

Provide a powerful administrative master portal designed to live-manage all user app settings:

Content Editor Panel: Directly edit the Scripture of the Day verses, emotional alignment promise quotes, and devotional reflection prompts.

Library Administrator: Add, modify, or remove summaries, books, podcasts, and frameworks from the public Resource Library directory.

Community Moderator Panel: View and moderate active conversation threads in the Tribes forums, with permissions to flag, hide, or delete community comments. Create new custom Tribes.

User Directory Profile Manager: View a simulated database table containing all registered user accounts. Allow administrators to live-edit user roles, schools, transition targets, and view their logged health and emotional historical metrics.

Keep changes linked dynamically so any edit in the /admin portal instantly updates what standard users experience inside /dashboard, /faith, /mind, /body, and /resources.

🛠️ Technical Implementation Requirements

Build as a fast, clean single-page layout utilizing React, Tailwind CSS, and Lucide React Icons.

Ensure all interactive states are fully working in the mock prototype (adding items, ticking checkboxes, logging counters, switching tabs, and typing text should visually update instantly).

Keep code neat, organized, and robust to facilitate rapid, bug-free rendering.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://me-holistic.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a84fca76-a1cb-4a59-a39d-fc8de384e614).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
