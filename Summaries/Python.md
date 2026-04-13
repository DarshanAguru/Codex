# Python Interview Preparation & Revision (Senior Level)

## 1. Core Python Concepts & At A Glance

### Python Philosophy & Execution
- **Interpreted & Compiled**: Python source code is compiled to bytecode (`.pyc`), which is then interpreted by the Python Virtual Machine (PVM/CPython).
- **Everything is an Object**: Functions, classes, modules, and primitive types are all objects. They all inherit from the base `object` class.
- **Dynamic Typing vs Duck Typing**:
    - *Dynamic Typing*: Variable types are checked at runtime, not compile time.
    - *Duck Typing*: "If it walks like a duck and quacks like a duck, it's a duck." We care about the object's behavior (methods/properties) rather than its explicit class.

### Memory Management & Garbage Collection
- **Reference Counting**: Primary memory management. Every object has a count of references pointing to it. When it drops to 0, memory is immediately deallocated.
- **Cyclic Garbage Collector (GC)**: Runs periodically to find reference cycles (e.g., Object A points to Object B, and Object B points to Object A) which reference counting cannot resolve.
- **`__slots__`**: By default, classes store instance attributes in a dynamic `__dict__`. Using `__slots__ = ['attr1', 'attr2']` allocates static memory for instances, significantly reducing memory footprint and speeding up attribute access.

---

## 2. Functions, Closures, and Decorators

### First-Class Functions & Closures
- **First-Class**: Functions can be passed as arguments, returned from functions, and assigned to variables.
- **Closures**: A dynamically generated function that remembers the variables from the enclosing lexical scope even after that scope has finished execution.
    - Caused by late-binding (variables used in closures are looked up when the inner function is *called*, not when it's defined).

### Decorators
- Wrappers that alter the functionality of a function or class without modifying its source code.
- Always use `@functools.wraps(func)` inside your decorator to preserve the original function's metadata (`__name__`, `__doc__`).
```python
from functools import wraps

def timeit(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time() - start}s")
        return result
    return wrapper
```

### Context Managers (`with` statement)
- Used for resource management (files, network connections, locks). Ensures proper acquisition and release.
- **Class-based**: Implement `__enter__` and `__exit__`.
- **Function-based**: Use the `@contextlib.contextmanager` decorator and a `yield` statement.

### Generators & Iterators
- **Iterable**: An object with an `__iter__()` method that returns an iterator.
- **Iterator**: An object with `__iter__()` and `__next__()` that remembers its state during iteration. raises `StopIteration` when exhausted.
- **Generators**: Functions that use `yield`. They pause execution, save their state, and produce a sequence of values lazily. Highly memory efficient.

---

## 3. Concurrency, Parallelism & The GIL (Critical for Seniors)

### The GIL (Global Interpreter Lock)
- **What is it?** A mutex (lock) in CPython that allows only ONE thread to execute Python bytecode at a time, protecting Python objects from race conditions due to non-thread-safe C memory management (reference counting).
- **The Implication**: Multithreading does *not* result in true parallelism for CPU-bound tasks in Python. 

### Threading (`threading` / `concurrent.futures.ThreadPoolExecutor`)
- Useful ONLY for **I/O-Bound Tasks** (Network requests, Database queries, Disk I/O). 
- When a thread waits for I/O, it releases the GIL, allowing other threads to run concurrently.

### Multiprocessing (`multiprocessing` / `concurrent.futures.ProcessPoolExecutor`)
- Useful for **CPU-Bound Tasks** (Heavy math, image processing, data crunching).
- Bypasses the GIL by creating entirely new OS processes. Each process has its own memory space, its own Python Interpreter, and its own GIL.
- **Overhead**: Spawning processes is computationally expensive and memory heavy; IPC (Inter-Process Communication) is slower than shared thread memory.

### Asyncio (`async` / `await`)
- **Event Loop Driven**: Single-threaded, single-process concurrency.
- Excellent for massive I/O bound concurrency (e.g., handling 10,000 active WebSockets).
- Functions are defined with `async def` (Coroutines) and execution control is yielded back to the event loop using `await`.

---

## 4. Object-Oriented Deep Dive & Metaprogramming

### Dunder (Magic) Methods
- `__new__(cls)`: True constructor. Responsible for *creating* the object instance.
- `__init__(self)`: Initializer. Called *after* `__new__` to setup state.
- `__call__(self)`: Makes an instance callable like a function (`obj()`).
- `__getattr__(self, name)`: Called only when an attribute is *not found* via normal lookup.
- `__getattribute__(self, name)`: Called *every single time* an attribute is accessed (dangerous, can cause infinite recursion).

### MRO (Method Resolution Order) & `super()`
- Uses **C3 Linearization** algorithm.
- Python supports multiple inheritance. The MRO determines the order classes are checked for a method. View using `ClassName.mro()` or `ClassName.__mro__`.

### Abstract Base Classes (ABC)
- Use `abc.ABC` and `@abstractmethod` to define interfaces. Prevents instantiation of the base class and enforces method overriding in subclasses.

### Metaclasses
- A metaclass is a "class of a class". Just as an object is an instance of a class, a class is an instance of a metaclass (by default, `type`).
- Used to intercept and modify class creation automatically (e.g., singletons, auto-registering plugins, ORM models).

### Descriptor Protocol
- Under the hood mechanism for `@property`, `@classmethod`, `@staticmethod`.
- Any custom class that implements `__get__`, `__set__`, or `__delete__` is a descriptor.

---

## 5. Type Hinting & Validation (Modern Python)

### Typing Module (PEP 484)
Static type checkers (like `mypy`) use these hints to find bugs before runtime.
- **Basic**: `int`, `str`, `dict`, `list` (in 3.9+, use built-ins directly instead of `typing.List`).
- **Advanced**:
    - `Optional[T]`: Same as `Union[T, None]` or `T | None` (in 3.10+).
    - `Union[X, Y]`: Can be X or Y (`X | Y`).
    - `Any`: Disables type checking.
    - `Callable[[Arg1Type, Arg2Type], ReturnType]`: For functions.
    - `TypeVar` & `Generic`: For creating reusable, type-safe structures (like a Custom Stack holding generic type T).
    - `Protocol` (PEP 544): Structural subtyping (Static Duck Typing). Defines methods an object must have, rather than a class it must inherit from.

### Data Classes (`@dataclass`)
- Auto-generates `__init__`, `__repr__`, `__eq__`, and more.
- Built-in to Python (`dataclasses` module).
- Extensively used for standard data containers.

### Pydantic Models (Industry Standard)
- Fast data validation and settings management using python type annotations.
- Built via `pydantic.BaseModel`.
- Validates data at **runtime** (unlike `mypy` which is static).
- **Features**:
    - Automatic type coercion (e.g., string `"123"` becomes integer `123`).
    - `@field_validator("field_name")`: Custom validation logic for specific fields.
    - `@model_validator(mode='before'|'after')`: Validate across multiple fields or entire object structures.
    - Seamlessly nested models.
    - Foundation for frameworks like `FastAPI`.

---

## 6. Packages, Modules & Packaging

### Creating a Package
- A directory becomes a Python package when it contains an `__init__.py` file (though implicitly optional in 3.3+, still best practice).
- `__init__.py` executes when the package is imported. Used to initialize package state or expose specific inner modules at the top level.
- `__all__ = ['ClassA', 'function_b']` inside `__init__.py` dictates what gets imported when someone uses `from my_package import *`.

### Modern Packaging (`pyproject.toml`)
- Replaces legacy `setup.py` and `setup.cfg`.
- Adopted by modern tools like **Poetry**, **Flit**, and **Hatch**.
- Manages dependencies, build systems, meta-data, and virtual environments efficiently.

---

## 7. Data Science Ecosystem (NumPy, Pandas, Plotting)

### NumPy (`numpy`)
- Core library for numerical computing. Written largely in C.
- **`ndarray`**: N-dimensional array. Much faster/denser than standard Python lists.
- **Vectorization**: Performing operations on entire arrays at once without writing explicit loops. Bypasses Python interpreter overhead.
- **Broadcasting**: Allows arithmetic operations between arrays of different (but compatible) shapes.

### Pandas (`pandas`)
- Built on top of NumPy. Used for tabular data manipulation.
- **DataStructures**: `Series` (1D), `DataFrame` (2D table).
- **Core Operations**:
    - `df.groupby()`, `df.merge()`, `df.join()`.
    - Handling Missing Data: `df.dropna()`, `df.fillna()`.
    - `df.apply()`: Run a function across rows/columns. (Note: Often slower than built-in vectorized operations).
    - `iloc` (integer location) vs `loc` (label-based location).

### Visualization (Matplotlib & Ecosystem)
- **Matplotlib**: The underlying foundation. Highly customizable but verbose. Concepts of `Figure` (the window) and `Axes` (the actual plots/subplots).
- **Seaborn**: Built over Matplotlib. Provides beautiful default styles and high-level interfaces for statistical plotting (e.g., violin plots, heatmaps).
- **Plotly**: Interactive, D3.js based graphing accessible via Python.

---

## 8. Senior Interview "Gotchas" & Common Questions

#### 1. Mutable Default Arguments
**Problem**: 
```python
def addItem(item, lst=[]):
    lst.append(item)
    return lst
# addItem(1) -> [1]
# addItem(2) -> [1, 2] // The default list is evaluated ONCE at function definition!
```
**Fix**: Always use `None` and initialize inside the block.
```python
def addItem(item, lst=None):
    lst = lst or []
    lst.append(item)
    return lst
```

#### 2. Dictionaries Lookup Speed
**Q: How does `dict` search so fast?**
**A**: Dictionaries are Hash Tables. Lookup average time is O(1). Since Python 3.7, dictionaries also **maintain insertion order** by keeping a separate dense array of indices alongside a sparse hash table array.

#### 3. Deep Copy vs Shallow Copy
- **Shallow (`copy.copy`)**: Constructs a new collection, but populates it with *references* to the child objects found in the original.
- **Deep (`copy.deepcopy`)**: Constructs a new collection, and recursively constructs completely *new copies* of the child objects found in the original.

#### 4. `is` vs `==`
- `==` checks for **Equality** (Do they have the same value? Uses `__eq__`).
- `is` checks for **Identity** (Are they literally the same object in memory? Uses `id()`). `a is b` translates to `id(a) == id(b)`.

#### 5. Late Binding in Closures
**Problem**:
```python
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs]) # Output: [2, 2, 2]
```
Variables inside lambda are bound when the function is *called*, where `i` has already iterated to `2`.
**Fix**: Bind early using default arguments.
```python
funcs = [lambda i=i: i for i in range(3)]
print([f() for f in funcs]) # Output: [0, 1, 2]
```

---

## 9. Algorithms, Data Structures & Built-in Modules

### Specialized Collections (`collections`)
- **`deque`**: Double-ended queue. `O(1)` thread-safe appends and pops from both sides. *Never use a standard list (`list.pop(0)`) as a queue since it operates in `O(N)` time.*
- **`Counter`**: A subclass of dict for counting hashable objects. Very useful for frequencies. `Counter(['a', 'b', 'a']).most_common(1)` returns `[('a', 2)]`.
- **`defaultdict`**: Automatically yields a default value (e.g., `list`, `int`) for missing keys instead of raising a `KeyError`. Great for building adjacency lists in graphs.
- **`namedtuple`**: Generates memory-efficient tuple subclasses with accessible named fields. Readable like objects but immutable.

### Heap Queue (`heapq` - Priority Queue)
- Python's `heapq` module provides an implementation of a **Min-Heap**.
- **Crucial Operations**:
    - `heapify(lst)`: Transforms a standard list into a heap in `O(N)` time, in-place.
    - `heappush(heap, item)`: O(log N) insertion.
    - `heappop(heap)`: O(log N) removal, popping out the smallest numeric item.
    - **Max-Heap Hack**: To simulate a Max-Heap, multiply the sorting values by `-1` (e.g., `(-priority, item)`).
- **Pro Tip**: To compute top-tier elements efficiently without a full sort, use `heapq.nlargest(k, iterable)` or `heapq.nsmallest(k, iterable)`.

### Binary Search (`bisect`)
- Used for finding boundaries or inserting items into a **pre-sorted** array while preserving total order. Time complexity is `O(log N)`.
- **Core Functions**:
    - `bisect_left(arr, x)`: Returns the earliest/leftmost index where `x` resides.
    - `bisect_right(arr, x)` (or `bisect`): Returns the insertion index immediately *after* the rightmost occurrence of `x`.
    - `insort(arr, x)`: Inserts `x` directly. *(Note: Finding the spot is O(log N), but modifying the underlying array remains O(N)).*

### Regular Expressions (`re`)
- Pattern matching over strings using a C-optimized engine.
- **Main Methods**:
    - `re.search()`: Scans the entire string to return the first matching `Match` object.
    - `re.match()`: Attempts a match *strictly at the beginning* of the string.
    - `re.findall()`: Extracts all non-overlapping matches into a list.
    - `re.sub(pattern, repl, string)`: Replaces occurrences.
- **Optimization Strategy**: For recurring usage, cache the compiled regex via `cached_pattern = re.compile(r'\d{3}-\d{4}')`.
- **Raw Strings**: Always define regex patterns with `r"..."` (Raw String) so backslashes (like `\d`) aren't processed as literal escape characters by Python.

### Essential Standard Library Gems
- **`itertools`**: Highly memory-efficient iterators (`combinations`, `permutations`, `chain`, `groupby`).
- **`functools.lru_cache`** (or `@cache` in 3.9+): Memoizes the return values of a function mapping based on deterministic argument states. Exponential recursive bottlenecks (like Dynamic Programming) are reduced to linear easily.
- **`math.inf`** / **`float('inf')`**: The primary method for establishing initial baseline Max/Min boundary values in graph theory algorithms.
