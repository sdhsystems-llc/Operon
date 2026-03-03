# Operon - AI-Powered SRE Platform

Operon is an intelligent Site Reliability Engineering platform that uses AI to monitor, investigate, and resolve incidents across your infrastructure.

## Database Setup Complete

All Supabase tables have been created with the following schema:

### Tables Created

1. **user_profiles** - User information and organization details
2. **projects** - Projects to organize investigations
3. **investigations** - Incident investigations with severity, status, and resolution tracking
4. **investigation_events** - Events and alerts correlated to investigations
5. **chat_sessions** - AI assistant chat history
6. **chat_messages** - Individual chat messages
7. **integrations** - Connected external services (AWS, Splunk, Grafana, etc.)
8. **knowledge_documents** - Runbooks, postmortems, and documentation

### Auto-Seeding

When you sign up for a new account, the system automatically seeds your account with:
- 3 sample projects
- 12 investigations with mixed severities (P1-P4)
- 25 investigation events
- 3 chat sessions with 10 messages each
- 11 integrations (AWS, Azure, Splunk, Grafana, LaunchDarkly, PagerDuty, GitHub, Datadog, Jira, Slack, Teams)
- 9 knowledge documents

### Getting Started

1. Sign up for a new account
2. Your account will be automatically populated with sample data
3. Explore the dashboard, investigations, chat, and integrations

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
