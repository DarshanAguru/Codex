# React Native

- Topics covered:
    - ScrollView
    - KeyboardAvoidingView
    - TouchableOpacity
    - FlatList
    - Stack Screen
    - Navigation Container
    - UseRef
    - UseMemo
    - UseCallBack
    - Context API
    - Redux

## React native functional component

1. ScollView
```jsx
    const DemoScrollView = ():React.JSX.Element => {
        return (
            <ScrollView horizontal={true}>
                <Text> Hello World </Text>
                <Text> Hello World </Text>
                <Text> Hello World </Text>
                <Text> Hello World </Text>
                <Text> Hello World </Text>
                <Text> Hello World </Text>
                <Text> Hello World </Text>
                <Text> Hello World </Text>
            </ScrollView>
        )
    }

    // ... Some styles
```

2. FlatListView
```jsx

    const DemoFlatListView = ():React.JSX.Element =>{
        const data = [
            {
                id: 1,
                name:'name1',
            },
            {
                id: 2,
                name: 'name2',
            },
            {
                id: 3,
                name:'name3',
            },
        ]

        return(
            <FlatList data={data} renderItem={
                ({item})=> (
                <View><Text>{item.name}</Text></View>
            )}>
            </FlatList>
        )
    }

    //some styles
```

3. TouchableOpacity
```jsx
    const DemoTouchableOpacity = ():React.JSX.Element=>{
        return (
            <View>
                <TouchableOpacity onPress={()=>{console.log("Pressed!"); Alert.alert('Pressed')}}>
                    <Text>
                        Touch Here!
                    </Text>
                </TouchableOpacity>
            </View>
        )
    }

    // some styles
```

4. KeyboardAvoidingView
```jsx
    const KeyboardAvoidingViewDemo = ():React.JSX.Element => {
        return(
            <KeyboardAvoidingView>
                <View>
                    <TextInput placeholder="Enter text here"/>
                </View>
            </KeyboardAvoidingView>
        )
    }
// some styles
```

## Tabs bar

1. createBottomTabNavigator
```jsx
    import ....

    //RootStackParam some custom type exported

    const Tab =    createBottomTabNavigator<RootStackParam>();
    const BottomNavigator = () => {
        return (
            <NavigationContainer>
                <Tab.Screen name="home" component={HomeComponent}/>
            </NavigationContainer>
        )
    }
```

## Context API

1. createContext
```jsx
    import ...

    interface Prod {
        id: number,
        name: string,
        price: string
    };

    interface ContextType {
        cartItems: Prod[],
        addToCart: (product: Prod) => void,
        removeFromCart: (id: number) => void
    }

    const ctxt = createContext<ContextType | undefined>(undefined);

    interface ProviderProps {
        children: ReactNode
    }

    const provider:React.FC<ProviderProps> = ({children}) => {

        const [cartItems, setCartItems] = useState<Prod[]>([])

        const addToCart = (product:Prod) => {
                setCartItems(prev => [...prev, product]);
        }

        const removeFromCart = (id:number) => {
            setCartItems(prev => prev.filter((prod:Prod)=> prod.id !== id));
        }

        return (
            <ctxt.Provider value={{cartItems, addToCart, removeFromCart}}>
                {children}
            </ctxt.Provider>
        )
    }

    export const useCart = () => {
        const ctx = useContext(ctxt);
        if(!ctx)
        {
            throw new Error('useCart must be used within Cart Provider');
        }
        return ctx;
    }
```

## Redux toolkit

1. ProductType.ts
    ```ts
        export interface ProductItem
        {
            id: number,
            name: string,
            price: string
        }
    ```

2. CartSlice.ts
    ```ts
        import ...

        interface cartState{
            items: ProductItem[]
        }

        const initialState:CartState = {
            items: []
        }

        const cartSlice = createSlice({
            name: 'cart',
            initialState: initialState
            reducers: {
                addToCart: (state, action:PayloadAction<ProductItem>) => {
                    
                },
                removeFromCart: (state, action:PayloadAction<number>) => {

                }
            }
        })

        export const cartReducer = cartSlice.reducer

        export const { addToCart, removeFromCart } = cartSlice.actions

    ```

3. Store.ts
    ```ts
        import ...
        export const store = configureStore({
            reducer:{
                cart: cartReducer
            }
        })

        export type RootState = ReturnType<typeof store.getState>
    ```

4. anyfile.tsx
    ```jsx
        import ...
        
        const dispatch = useDispatch()
        
        //using the slice function
        const handleItem = (item:ProductItem) => {
            dispatch(addToCart(item))
        }
    ```

5. App.tsx
    ```jsx
        // wrap the component in provider
        // some code
        <Provider store={store}>
        </Provider>
        //some code
    ```

6. somefile.tsx
    ```jsx
        import ...
        //some code
        const items = useSelector((state: RootState) => state.cart.items)
        //some code
    ```

## API calling in react native

Install `axios`
```
> npm install axios
```

1. apiClient.ts
```jsx
import axios from 'axios'

// ex base url: https://jsonplaceholder.typicode.com subpath /user

const api = axios.create({
    baseURL: '',
    headers: {'Content-Type':'application/json'},
    withCredentials: true,
})

export async function get<T>(url:string):Promise<T>
{
    const res = await api.get(url)
    return res.data
}
```

2. useGet.ts
```jsx
    function useGet<T>(){
        const  [loading, setLoading] = useState<boolean>(false);
        const  [data, setData] = useState<T | null>(null);
        const  [error, SetError] = useState<string | null >(null);

        const execute = async (url:string):Promise<T> => {
            try{
                setLoading(true);
                const response = await get<T>(url);
                setData(response);
                setLoading(false);
                return response;
            }catch(err)
            {
                setError(err.response.data);
            }
        }

        return {
            loading, error, data, execute
        }

    }
```

3. UserListScreen.tsx
```jsx

    const {loading, data, execute} = useGet<User[]>();

    const fetchUsers = async() => {
        await execute('/user')
    }

```


## Async Storage

To install:
```bash
> npm i @react-native-async-storage/async-storage
```

AsyncStorage class for ease of navigation
```jsx
import AsyncStorage from "@react-native-async-storage/async-storage";


class AbstractStorage<T> {

    key;

    constructor(key:string){

        this.key=key;

    };

    async addData(data:T):Promise<boolean>
    {

        try{

            const stringData:string = JSON.stringify(data);
            await AsyncStorage.setItem(
                this.key,
                stringData
            );
            return true;

        }
        catch(err){

            console.log(err);
            return false;

        }

    };

    async getData():Promise<T | null>{

        try{

            const res = await AsyncStorage.getItem(this.key);
            const data = res === null? null: JSON.parse(res);
            return data;

        }
        catch(err){

            console.log(err);
            return null;

        }

    };

    async removeData():Promise<boolean>{

        try{

            await AsyncStorage.removeItem(this.key);
            return true;

        }
        catch(err){

            console.log(err);
            return false;

        }

    };

    static async clearStorage():Promise<boolean>{

        try{

            await AsyncStorage.clear();
            return true;

        }
        catch(err){

            console.log(err);
            return false;

        }

    };

};

export default AbstractStorage;
```

---
### React native vector icons
To apply `react-native-vector-icons` install:
```
> npm install react-native-vector-icons @types/react-native-vector-icons
```
Add this line ` apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"` 
in build.gradle file in `react {...}` section in `android>app`

---

