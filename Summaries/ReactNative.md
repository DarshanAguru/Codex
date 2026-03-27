# React Native Interview Preparation

## 1. Core Architecture

### Old Architecture (The Bridge)
- **JS Thread**: Runs JavaScript logic (React).
- **Native Thread**: Runs UI rendering (Android/iOS).
- **The Bridge**: Asynchronous JSON messaging queue between JS and Native.
- **Bottleneck**: Fast scrolling or animations can clog the bridge -> White screens or frame drops.

### New Architecture (Fabric & TurboModules)
- **JSI (JavaScript Interface)**: Allows JS to call C++ (Native) methods *directly* and synchronously (No Bridge).
- **Fabric**: New UI Rendering engine. Renders UI synchronously on the Shadow Thread.
- **TurboModules**: Lazy loads native modules (only when needed), speeding up startup time.

---

## 2. Performance Optimization

### FlatList Optimization
```jsx
<FlatList
  data={bigData}
  renderItem={renderItem} // Use memoized component
  keyExtractor={item => item.id}
  initialNumToRender={10} // First screen items
  maxToRenderPerBatch={10} // Batch size
  windowSize={5} // Viewport height units to keep in memory (Default 21)
  removeClippedSubviews={true} // Unmount off-screen views
  getItemLayout={(data, index) => ( // Skip measurement calculation
    {length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
  )}
/>
```

### Memoization
- **React.memo**: Memoize functional components to prevent re-renders if props haven't changed.
- **useMemo**: Memoize expensive calculations.
- **useCallback**: Memoize functions references to prevent child re-renders.

### Image Optimization
- Use `FastImage` (from `react-native-fast-image`) for aggressive caching.
- Resize images on server (CDN) before fetching.

---

## 3. Essential Hooks Checklist

- **useState**: Manage local state.
- **useEffect**: Side effects (API calls, subscriptions). `[]` for mount, `[prop]` for changes, `return () => {}` for cleanup.
- **useLayoutEffect**: Fires *before* browser paints. Good for blocking UI updates (rare).
- **useRef**: Persist value without re-render (Timers, TextInput focus).

---

## 4. Navigation (React Navigation 6+)

### Stack Navigator
```jsx
const Stack = createNativeStackNavigator();
<NavigationContainer>
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
</NavigationContainer>
```

### Passing Data
```jsx
// Navigate
navigation.navigate('Profile', { userId: 123 });

// Receive
const { userId } = route.params;
```

---

## 5. State Management snippets

### Redux Toolkit (Modern)
**1. Slice (Logic)**
```ts
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    addToCart: (state, action) => {
      state.items.push(action.payload); // Immer handles immutability
    }
  }
});
export const { addToCart } = cartSlice.actions;
export default cartSlice.reducer;
```

**2. Store (Config)**
```ts
export const store = configureStore({
  reducer: { cart: cartReducer }
});
```

**3. Usage (Component)**
```tsx
const dispatch = useDispatch();
const items = useSelector(state => state.cart.items);
```

### Context API (Simpler global state)
Good for themes, user auth, language settings. Avoid for high-frequency updates (causes massive re-renders).

---

## 6. Common Interview Questions

#### Q: Flexbox in React Native vs Web?
- **Direction**: RN default is `column`, Web is `row`.
- **Units**: RN uses unitless numbers (logical pixels), Web uses `px`, `rem`, `%`.
- **Background**: RN doesn't support complex CSS `background` shorthand (use specific props).

#### Q: How to handle offline mode?
- Use `NetInfo` to detect state.
- Cache data using `AsyncStorage` or `Realm`/`WatermelonDB`.
- Queue actions using `redux-persist` or custom queue.

#### Q: Difference between `useEffect` and `useLayoutEffect`?
- `useEffect` is asynchronous (after paint).
- `useLayoutEffect` is synchronous (before paint). Use it if you need to measure DOM/View layout before showing it to avoid flicker.

#### Q: What is the "Shadow Tree"?
- React Native generates a Shadow Tree (internal representation) in C++ which Yoga (layout engine) uses to calculate layout (x, y, width, height) before converting it to native Views.

---

## Code Snippet: Custom Hook for API
```ts
function useGet<T>(url: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        api.get(url).then(res => {
            if(mounted) setData(res);
        }).finally(() => {
            if(mounted) setLoading(false);
        });
        
        return () => { mounted = false; }; // Cleanup
    }, [url]);

    return { data, loading };
}
```

---

## 7. Advanced React Native Concepts (Senior Level)

### New Architecture Deep Dive
- **Fabric Renderer**:
    - **UI Manager (Pure C++)**: Creates Shadow Nodes (C++).
    - **Yoga**: Calculates layout.
    - **Mounting**: Host Platform mounts native views (Android Views/UIViews).
    - **Benefits**: Synchronous resizing, multithreading (off-main-thread layout calculation).
- **Codegen**:
    - Generates Native & C++ boilerplate from TypeScript interfaces/specs.
    - Ensures type safety between JS and Native.
- **Hermes Engine**:
    - JavaScript engine optimized for RN.
    - **Bytecode Precompilation**: JS is compiled to bytecode during build, not runtime.
    - **Faster Startup**: No JIT warmth needed.
    - **Smaller APK Size**: Compact bytecode.

### Advanced Performance Optimization
- **Re-renders**:
    - **Why did you render (wdyr)**: Tool to identify unnecessary renders.
    - **React Compiler (Future)**: Auto memoization.
- **FlashList (Shopify)**:
    - Replaces `FlatList`. Uses "Recycling" (views are kept in pool and reused) instead of unmounting/remounting.
    - **5x-10x faster** on low-end devices.
- **Inline Requires**: Delay loading modules until needed (`require('./HeavyScreen').default`). Reduces bundle size at startup.

### Bridging Native Modules
- **Legacy Bridge (Promises/Callbacks)**:
    - `@ReactMethod` (Android) / `RCT_EXPORT_METHOD` (iOS).
    - Async only.
- **JSI (Direct C++ Calls)**:
    - Exposes native functions to global `global` object in JS.
    - `global.myNativeFunction()` runs synchronously.
    - Used by `react-native-mmkv`, `react-native-reanimated`.

### Animations (60 FPS)
- **Animated API (Native Driver)**: `useNativeDriver: true`. Offloads animation to UI thread. LIMITED (transform, opacity only).
- **Reanimated 2/3**:
    - **Worklets**: Tiny JS functions that run on a separate UI thread.
    - **Shared Values**: Reactive values shared between JS thread and UI thread.
    - **Layout Animations**: Auto-animate layout changes (`entering`, `exiting`).
- **Skia**:
    - High-performance 2D graphics (Canvas-like) powered by Skia (same engine as Chrome/Flutter).

### CI/CD & OTA Updates
- **Fastlane**: Ruby scripts to automate screenshots, beta deployment (TestFlight/Play Console).
- **EAS (Expo Application Services)**:
    - **Build**: Cloud builds (no Mac needed for iOS).
    - **Submit**: Auto-submit to stores.
    - **Update**: Deeply integrated OTA updates.
- **CodePush**:
    - Push JS bundle updates directly to users without App Store review.
    - **Limitations**: Cannot update Native Code (Info.plist, Gradle, Native Libraries).

### Senior Interview Questions
#### Q: How does React Native handle threads?
**Ans**:
1.  **Main/UI Thread**: Android/iOS main thread (Rendering, Gestures).
2.  **JS Thread**: Runs React/Business logic.
3.  **Shadow Thread**: Layout calculation (Yoga).
4.  **Native Modules Thread**: (Optional) For native modules like Geolocation/FS.
*New Architecture moves layout to Background Thread and allows JS to sync with Main Thread.*

#### Q: Explain the difference between FlatList and FlashList.
**Ans**: FlatList *unmounts* views when they go off-screen and *creates new ones* when scrolling down (high memory/CPU churn). FlashList *recycles* the views (changes data bound to the existing view) - similar to Android `RecyclerView` or iOS `UICollectionView`.

#### Q: How to debug a React Native crash in production?
**Ans**:
- **Crashlytics (Firebase)**: Native crashes (Java/Kotlin/ObjC).
- **Sentry**: JS errors + Native crashes. Breadcrumbs (user actions leading to crash). Source Maps (to decode minified JS stack trace).
