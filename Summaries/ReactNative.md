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

