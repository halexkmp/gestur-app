# Project Guidelines

This document defines the strict standards and patterns for building features in the **Gestur App**. All contributions must adhere to these guidelines to ensure consistency, maintainability, and quality.

## 1. PROJECT TECH STACK & ARCHITECTURE

### Foundational Tools
- **Framework**: React 18+ with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescript.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **API Client**: Native `fetch` wrapper (found in `src/lib/api.ts`)

### Folder Structure Rules
All files must be organized according to their responsibility:
- `src/components/`: Functional UI components. Large components should be split into sub-folders.
- `src/contexts/`: React Context providers for global or shared state (e.g., `AuthContext`).
- `src/hooks/`: Custom React hooks for isolated logic (create this folder if missing).
- `src/services/`: API communication logic organized by domain (e.g., `userService.ts`).
- `src/types/`: TypeScript interfaces and types. Use `index.ts` barrel files for clean exports.
- `src/lib/`: Shared utilities, configurations, and core libraries (e.g., `api.ts`).
- `src/assets/`: Static assets like images and fonts.

---

## 2. CODE STYLE & PATTERNS

### TypeScript Strictness
- **Explicit Typing**: Always define types for function parameters and return values.
- **Ban `any`**: Strictly forbid the use of `any`. Use `unknown` if the type is truly dynamic or unknown, then narrow it down.
- **Interfaces vs. Types**: Use `interface` for object structures that might be extended, and `type` for unions or aliases.

### Component Guidelines
- **Functional Components**: Use arrow functions for all components.
- **Explicit Return Types**: Use `React.FC<Props>` or `JSX.Element` for component return types.
- **File Size Limit**: Keep component files under **~150 lines**. If a component exceeds this, extract sub-components or logic into hooks.
- **Logic Extraction**: Keep component bodies clean; move complex logic to custom hooks or helper functions.

### Clean Code Practices
- **Early Returns**: Prefer early returns to reduce nesting and improve readability.
- **Conditionals**: Avoid deep ternary operators. Use early returns or logical `&&` when appropriate.
- **Naming**: Use PascalCase for components and camelCase for functions, variables, and hooks.

---

## 3. STATE MANAGEMENT & HOOKS

### State Strategy
- **Local State**: Use `useState` for UI-specific state that doesn't need to be shared.
- **Shared State**: Use React Context API for global state (Auth, Theme, etc.).
- **Complex Logic**: Mandate extracting complex state logic or side effects into isolated, well-named custom hooks in `src/hooks/`.

---

## 4. STYLING & UI CONVENTIONS

### Tailwind CSS
- **Consistent Application**: Use Tailwind CSS utility classes exclusively for styling.
- **No Inline Styles**: Forbid `style={{ ... }}` tags unless explicitly required for dynamic calculations (e.g., positioning based on mouse coordinates).
- **Organization**: Group classes logically (layout -> spacing -> typography -> colors -> effects).

---

## 5. QUALITY CONTROL & ERROR HANDLING

### Clean Production Code
- **No Debugging Statements**: Forbid `console.log`, `debugger`, or `alert` in production-ready code. Use a logging utility if needed.
- **Comments**: Keep comments meaningful. Avoid commenting out code; delete it instead.

### Error Handling
- **Descriptive Errors**: Throw and catch `Error` objects with descriptive messages. Avoid throwing raw strings.
- **Try/Catch**: Use try/catch blocks in services and handlers to manage failures gracefully.

### Testing
- **Automated Tests**: Automatically check for matching unit/integration test folders (e.g., `__tests__` or `.test.ts(x)` files).
- **Implementation**: Write corresponding tests using the project's testing library (e.g., Vitest/Jest if configured) when adding new features or modifying logic.

---

## 6. JUNIE SPECIFIC INSTRUCTIONS
- When implementing a new feature, first check the relevant `service` and `type` files.
- If a component grows too large during development, proactively suggest a split.
- Always ensure new files follow the established directory structure.

# 7. Task Management Guidelines

### Working with `docs/tasks.md`
- Mark tasks as `[x]` when completed.
- Maintain the existing structure and phases.
- When adding new tasks, ensure they are linked to a requirement and a plan item:
    - Format: `- [ ] T{phase}.{task_id}: Description (Plan: {plan_id}, Req: {req_id})`
- Every modification to the task list must be reflected in the project progress.
- Tasks should be as granular as possible, especially for vertical slices (splitting UI, Application, and Infra).
