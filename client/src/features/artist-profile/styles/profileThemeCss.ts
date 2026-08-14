// Profile light/dark theme and content-card color boundaries ----
export const PROFILE_THEME_CSS = `
                        [data-artist-profile-theme] {
                            font-family: var(--profile-font-family);
                            color: var(--profile-text-color);
                            font-size: var(--profile-base-font-size);
                        }

                        .dark [data-artist-profile-theme] {
                            --profile-text-color: var(--profile-dark-text-color);
                            --profile-muted-text-color: var(--profile-dark-muted-text-color);
                            --profile-heading-text-color: var(--profile-dark-heading-text-color);
                            --profile-label-text-color: var(--profile-dark-label-text-color);
                            --profile-button-text-color: var(--profile-dark-button-text-color);
                            --profile-link-text-color: var(--profile-dark-link-text-color);
                            --profile-accent-color: var(--profile-dark-accent-color);
                            --profile-cards-color: var(--profile-dark-cards-color);
                        }

                        [data-artist-profile-theme] [data-slot='tabs-trigger'][data-active],
                        [data-artist-profile-theme] [role='tab'][data-state='active'] {
                            background: var(--comix-badge-type) !important;
                            color: #ffffff !important;
                            border-color: var(--comix-badge-type) !important;
                        }

                        [data-artist-profile-theme] :where(
                            div, section, article, header, main, aside,
                            h1, h2, h3, h4, h5, h6,
                            p, span, strong, small, label, li, td, th, figcaption,
                            a, button, input, textarea, select, option
                        ):not(
                            [data-profile-content], [data-profile-content] *,
                            [data-profile-system-control], [data-profile-system-control] *,
                            [data-canvas-control], [data-canvas-control] *
                        ) {
                            font-family: var(--profile-font-family) !important;
                            color: inherit;
                        }

                        [data-artist-profile-theme] > header :where(
                            div, p, span, strong, small, li, td, th, figcaption
                        ) {
                            font-size: var(--profile-base-font-size) !important;
                            color: var(--profile-text-color) !important;
                        }

                        [data-artist-profile-theme] [data-profile-details] { color: var(--profile-details-color) !important; font-size: var(--profile-details-size) !important; }
                        [data-artist-profile-theme] [data-profile-links] a,
                        [data-artist-profile-theme] [data-profile-links] a span { color: var(--profile-links-color) !important; font-size: var(--profile-links-size) !important; }
                        [data-artist-profile-theme] [data-profile-card] :where(p, span):not([data-profile-content] *) { color: var(--profile-cards-color) !important; font-size: var(--profile-cards-size) !important; }
                        .dark [data-artist-profile-theme] [data-profile-card] :where(p, span):not([data-profile-content] *) { color: var(--profile-dark-cards-color) !important; }

                        [data-artist-profile-theme] :where(h1, h2, h3, h4, h5, h6):not([data-profile-content] *) {
                            color: var(--profile-heading-text-color) !important;
                            font-size: var(--profile-heading-font-size) !important;
                        }

                        [data-artist-profile-theme] :where(label, [data-profile-label]):not([data-profile-content] *) {
                            color: var(--profile-label-text-color) !important;
                            font-size: var(--profile-label-font-size) !important;
                        }

                        /* Specific profile text scopes come after broad heading/label rules. */
                        [data-artist-profile-theme] [data-profile-name] {
                            color: var(--profile-name-color) !important;
                            font-size: var(--profile-name-size) !important;
                        }

                        [data-artist-profile-theme] [data-profile-username] {
                            color: var(--profile-name-color) !important;
                            font-size: calc(var(--profile-name-size) * 0.72) !important;
                        }

                        [data-artist-profile-theme][data-profile-cards-background='off'] [data-profile-card] {
                            background: transparent !important;
                        }

                        [data-artist-profile-theme] [data-profile-card] {
                            background: var(--profile-cards-background, var(--card));
                            border: var(--profile-cards-border, 1px solid var(--border));
                            border-radius: var(--profile-cards-radius, 8px);
                        }

                        [data-artist-profile-theme] :where(button, [role='button'], [role='tab']):not([data-profile-system-control], [data-canvas-control], [data-profile-content] *) {
                            background: var(--profile-buttons-background, revert-layer);
                            border: var(--profile-buttons-border, revert-layer);
                            border-radius: var(--profile-buttons-radius, revert-layer);
                        }

                        [data-artist-profile-theme] [data-profile-content] {
                            background: var(--profile-content-background, transparent);
                            border: var(--profile-content-border, 0 solid transparent);
                            border-radius: var(--profile-content-radius, 8px);
                            box-sizing: border-box;
                        }

                        [data-artist-profile-theme] [data-profile-content][data-profile-empty='true'] {
                            background: transparent !important;
                            border-color: transparent !important;
                            box-shadow: none !important;
                        }

                        [data-profile-background-tone='dark'] [data-profile-empty-state],
                        [data-profile-background-tone='dark'] [data-profile-empty-state] * {
                            color: #f4f4f5 !important;
                        }

                        [data-profile-background-tone='dark'] [data-profile-empty-state] :where(p, svg) {
                            color: #d4d4d8 !important;
                        }

                        [data-profile-background-tone='light'] [data-profile-empty-state],
                        [data-profile-background-tone='light'] [data-profile-empty-state] * {
                            color: #18181b !important;
                        }

                        [data-profile-background-tone='light'] [data-profile-empty-state] :where(p, svg) {
                            color: #52525b !important;
                        }

                        [data-artist-profile-theme][data-profile-buttons-background='off'] :where(button, [role='button'], [role='tab']):not([data-profile-system-control], [data-canvas-control], [data-profile-content] *) {
                            background: transparent !important;
                        }

                        [data-artist-profile-theme] [data-profile-label]:not([data-profile-system-control] *) {
                            color: var(--profile-label-text-color) !important;
                            font-size: var(--profile-label-font-size) !important;
                        }

                        [data-artist-profile-theme] :where(button, [role='button'], [role='tab']):not(
                            [data-profile-content] *,
                            [data-profile-system-control],
                            [data-profile-system-control] *,
                            [data-canvas-control],
                            [data-canvas-control] *
                        ),
                        [data-artist-profile-theme] :where(button, [role='button'], [role='tab']):not(
                            [data-profile-content] *,
                            [data-profile-system-control],
                            [data-canvas-control]
                        ) *:not([data-profile-system-control] *, [data-canvas-control] *) {
                            font-family: var(--profile-font-family) !important;
                            font-size: var(--profile-button-font-size) !important;
                            color: var(--profile-button-text-color) !important;
                        }

                        [data-artist-profile-theme] a:not([data-profile-content] *, [data-profile-system-control] *),
                        [data-artist-profile-theme] a:not([data-profile-content] *, [data-profile-system-control] *) * {
                            color: var(--profile-link-text-color) !important;
                            font-family: var(--profile-font-family) !important;
                            font-size: var(--profile-link-font-size) !important;
                        }

                        [data-artist-profile-theme] :where(.text-foreground):not([data-profile-content] *) {
                            color: var(--profile-text-color) !important;
                        }

                        [data-artist-profile-theme] [data-profile-system-control],
                        [data-artist-profile-theme] [data-profile-system-control] *,
                        [data-artist-profile-theme] [data-canvas-control],
                        [data-artist-profile-theme] [data-canvas-control] * {
                            font-family: var(--comix-font-family) !important;
                            font-size: revert;
                            color: var(--foreground) !important;
                        }

                        /* System controls never inherit profile-editor colors. */
                        [data-artist-profile-theme] button[data-profile-system-control][data-variant='outline'],
                        [data-artist-profile-theme] button[data-profile-system-control][data-variant='ghost'] {
                            color: var(--foreground) !important;
                        }

                        [data-artist-profile-theme] button[data-profile-system-control][data-variant='default'] {
                            color: var(--primary-foreground) !important;
                        }

                        [data-artist-profile-theme] button[data-profile-system-control] * {
                            color: inherit !important;
                        }

                        [data-profile-background-tone='dark'] [data-profile-content] {
                            --background: #18181b;
                            --foreground: #f4f4f5;
                            --card: #202023;
                            --card-foreground: #f4f4f5;
                            --muted: #2b2b30;
                            --muted-foreground: #b8b8c2;
                            --border: #45454d;
                            --primary: #f97316;
                            --primary-foreground: #ffffff;
                            color: var(--foreground);
                            font-family: var(--font-content, Lexend, sans-serif) !important;
                            font-size: 1rem !important;
                        }

                        [data-profile-background-tone='dark'] [data-profile-content] * {
                            font-family: inherit;
                        }

                        [data-profile-background-tone='light'] [data-profile-content] {
                            --background: #ffffff;
                            --foreground: #18181b;
                            --card: #ffffff;
                            --card-foreground: #18181b;
                            --muted: #f4f4f5;
                            --muted-foreground: #62626d;
                            --border: #d9d9df;
                            --primary: #ea580c;
                            --primary-foreground: #ffffff;
                            color: var(--foreground);
                            font-family: var(--font-content, Lexend, sans-serif) !important;
                            font-size: 1rem !important;
                        }`;
