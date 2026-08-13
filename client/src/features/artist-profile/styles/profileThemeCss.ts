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
                            --foreground: var(--profile-dark-text-color);
                            --muted-foreground: var(--profile-dark-muted-text-color);
                            --primary: var(--profile-dark-accent-color);
                            --ring: var(--profile-dark-accent-color);
                            --link: var(--profile-dark-link-text-color);
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

                        [data-artist-profile-theme] main :where(
                            div, section, article, p, span, strong, small, li, td, th, figcaption
                        ) {
                            font-size: var(--profile-widget-font-size) !important;
                        }

                        [data-artist-profile-theme] :where(h1, h2, h3, h4, h5, h6):not([data-profile-content] *) {
                            color: var(--profile-heading-text-color) !important;
                            font-size: var(--profile-heading-font-size) !important;
                        }

                        [data-artist-profile-theme] :where(label, [data-profile-label]):not([data-profile-content] *) {
                            color: var(--profile-label-text-color) !important;
                            font-size: var(--profile-label-font-size) !important;
                        }

                        [data-artist-profile-theme] :where(button, [role='button'], [role='tab']):not([data-profile-content] *),
                        [data-artist-profile-theme] :where(button, [role='button'], [role='tab']):not([data-profile-content] *) * {
                            font-family: var(--profile-font-family) !important;
                            font-size: var(--profile-button-font-size) !important;
                            color: var(--profile-button-text-color) !important;
                        }

                        [data-artist-profile-theme] a:not([data-profile-content] *),
                        [data-artist-profile-theme] a:not([data-profile-content] *) * {
                            color: var(--profile-link-text-color) !important;
                            font-family: var(--profile-font-family) !important;
                            font-size: var(--profile-link-font-size) !important;
                        }

                        [data-artist-profile-theme] .text-muted-foreground:not([data-profile-content] *),
                        [data-artist-profile-theme] .text-muted-foreground:not([data-profile-content] *) * {
                            color: var(--profile-muted-text-color) !important;
                        }

                        [data-artist-profile-theme] :where(.text-foreground):not([data-profile-content] *) {
                            color: var(--profile-text-color) !important;
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
                        }`;

