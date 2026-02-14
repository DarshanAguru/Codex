# ReactJS Interview Preparation & Advanced Concepts

## 1. Core Architecture (Under the Hood)

### Virtual DOM vs Real DOM
- **Virtual DOM**: Lightweight copy of the DOM in memory.
- **Reconciliation (Diffing)**: React compares the new VDOM with the old VDOM to find the minimum number of changes.
- **Fiber (React 16+)**: The core reconciliation engine. Enables **incremental rendering** (splitting work into chunks) to avoid blocking the main thread.
    - **Keys**: Unique identifiers help React identify which items have changed, added, or removed.

### Rendering Phases
1.  **Render Phase**: React calls components, creates VDOM nodes, and calculates changes. Pure and side-effect free.
2.  **Commit Phase**: React applies changes to the Real DOM. Runs `useLayoutEffect` (sync) and `useEffect` (async).

---

## 2. Essential Hooks (Deep Dive)

### useState
- **Batching**: State updates are batched for performance (React 18 batches *all* updates, even in promises/timeouts).
- **Functional Updates**: `setCount(prev => prev + 1)` prevents stale closures.

### useEffect vs useLayoutEffect
- **useEffect**: Runs *after* paint. Non-blocking. Good for API calls, subscriptions.
- **useLayoutEffect**: Runs *synchronously* after DOM mutations but *before* paint. Blocks visual updates. Good for measuring DOM elements (avoiding flicker).

### useMemo vs useCallback
- **useMemo**: Caches a *value* (result of expensive calculation). `const val = useMemo(() => compute(a), [a])`.
- **useCallback**: Caches a *function reference*. `const func = useCallback(() => doSomething(a), [a])`.
    - **When to use?**: Only useful when passing props to memoized children (`React.memo`) or as dependencies in other hooks.

### useReducer
- Alternative to `useState` for complex state logic (state transitions based on actions).
- Similar to Redux reducer pattern: `(state, action) => newState`.

### useRef
- **Mutable container**: Holds values that persist across renders but *do not trigger re-render* when changed.
- **DOM Access**: Used to access DOM elements directly (`inputRef.current.focus()`).

---

## 3. Advanced Patterns

### Higher-Order Components (HOC)
- Function that takes a component and returns a new component.
- Used for cross-cutting concerns (Auth, Logging).
- *Modern approach*: Custom Hooks are preferred.

### Render Props
- Sharing code using a prop whose value is a function.
- `<MouseTracker render={mouse => <Cat mouse={mouse} />} />`

### Compound Components
- Components that work together to form a UI unit (e.g., `<Select>`, `<Select.Option>`).
- Uses `Context` internally to share state between parent and children implicitly.

### Custom Hooks
- Encapsulate reusable logic.
- Must start with `use`.

---

## 4. Performance Optimization

### React.memo
- Higher Order Component for functional components.
- Memoizes the result: only re-renders if props change.
- **Comparator**: Optional second argument `(prevProps, nextProps) => boolean` for custom equality checks.

### Code Splitting (Lazy Loading)
- `React.lazy(() => import('./HeavyComponent'))`.
- Must be wrapped in `<Suspense fallback={<Loading />}>`.

### Virtualization
- Rendering only visible items in a long list (e.g., `react-window`, `react-virtuality`).

---

## 5. State Management

### Context API
- **Best for**: Global state that changes infrequently (Theme, User, Locale).
- **Problem**: Updating context triggers re-render in *all* consumers.
- **Optimization**: Split context into `StateContext` and `DispatchContext`.

### Redux (Toolkit)
- **Best for**: Complex global state, frequent updates, predictable state transitions.
- **Redux Toolkit (RTK)**: Simplifies Redux (less boilerplate, Immer built-in).

### Zustand
- **Best for**: Lightweight, un-opinionated state management. No Provider wrapper needed.

---

## 6. React 18+ Features

### Concurrent Mode
- Allows React to interrupt rendering to handle high-priority events (user input).
- **useTransition**: Marks a state update as non-urgent. `startTransition(() => setSearchQuery(input))`.
- **useDeferredValue**: Defers updating a part of the UI. Similar to debouncing but integrated with React's scheduler.

### Suspense for Data Fetching
- Allows components to "wait" for something (code or data) before rendering.
- Integrates with frameworks like Next.js or React Query.

### Server Components (RSC)
- Components that run *only* on the server.
- **Benefits**: Zero bundle size for those components, direct DB access, improved SEO.

---

## 7. Testing (React Testing Library)

### Philosophy
- Test behavior, not implementation details.
- "The more your tests resemble the way your software is used, the more confidence they can give you."

### Common Queries
- `getByRole('button', { name: /submit/i })`: Best (Accessible).
- `getByText(/hello/i)`: Good for text content.
- `getByTestId('custom-id')`: Last resort.

---

## 8. Senior Interview Questions

#### Q: What is the difference between specific and transitive dependencies in useEffect?
**Ans**: Specific dependencies are values used inside the effect. Transitive dependencies are values used by functions that are called inside the effect. You must include *all* of them (or memos/callbacks) to avoid stale closures.

#### Q: Explain "Prop Drilling" and how to avoid it.
**Ans**: Passing props through multiple levels of components that don't need them. Avoided using:
1.  **Component Composition** (Passing components as children).
2.  **Context API**.
3.  **State Management Libraries** (Redux/Zustand).

#### Q: How does React's Reconciliation algorithm work?
**Ans**: It uses a heuristic O(n) algorithm.
1.  **Different Element Types**: A `<div>` changing to `<span>` tears down the whole subtree.
2.  **Same Element Type**: Updates attributes/props only.
3.  **Keys**: Used to match children in lists to avoid unnecessary re-renders when order changes.

#### Q: What is a "Stale Closure" in React hooks?
**Ans**: When a closure captures an old state variable and tries to use it in a later render (e.g., inside `setInterval`). Fix: Use functional state updates `setCount(c => c + 1)` or add the state variable to dependency array.

#### Q: Server-Side Rendering (SSR) vs Client-Side Rendering (CSR)?
- **SSR (Next.js)**: HTML generated on server. Fast FCP (First Contentful Paint), Good SEO. Slower TTFB (Time To First Byte).
- **CSR (Vite/CRA)**: HTML is empty, JS builds DOM. Slow FCP, bad SEO. Fast interactions after load.
