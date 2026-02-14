# Java Interview Preparation & Revision

## 1. Core Java Concepts

### OOPS Concepts (Real-world Analogies)
- **Polymorphism**: A person acting as a *Employee* in office, *Father* at home, and *Customer* in a mall. (One entity, many forms).
- **Inheritance**: A child acquiring properties (surname, assets) from parents.
- **Encapsulation**: A Capsule wrapping medicine. We hide the internal composition (variables) and expose functionality via outer shell (getters/setters).
- **Abstraction**: A Car Dashboard. You drive using steering/pedals without knowing internal engine combustion details.

### Class Loaders
- **Bootstrap ClassLoader**: Loads JDK internal classes (`rt.jar` - `java.lang`, `java.util` etc.) - Written in C/C++.
- **Extension ClassLoader**: Loads classes from `lib/ext`.
- **System/Application ClassLoader**: Loads classes from your classpath (your code + libs).

### String Immutability
- **Why Immutable?**
  1.  **String Pool**: Saves memory by sharing existing strings. Modifying one would affect all references.
  2.  **Security**: Strings used for DB Passwords, Network URLs. Mutability affects security.
  3.  **Thread Safety**: Inherently safe, multiple threads can access without locking.
  4.  **HashCode Caching**: Hash is calculated once and cached (great for HashMap keys).

### StringBuffer vs StringBuilder
| Feature | StringBuffer | StringBuilder |
| :--- | :--- | :--- |
| Thread Safety | Synchronized (Safe) | Not Synchronized (Unsafe) |
| Performance | Slower | Faster |
| Since | Java 1.0 | Java 1.5 |

### Exception Handling
- **Checked vs Unchecked**:
    - **Checked (Compile-time)**: `IOException`, `SQLException`. Must be handled via try-catch or throws.
    - **Unchecked (Runtime)**: `NullPointerException`, `IndexOutOfBoundsException`. Logic errors.
- **Finally Block**: Executed *always* (cleanup code), except when `System.exit(0)` is called or JVM crashes.

### Copying Objects
- **Shallow Copy**: Copies the *references* of nested objects. Changes to nested objects affect the original. (`clone()` default).
- **Deep Copy**: Recursively copies *everything*. New memory allocated for all nested objects.

---

## 2. Collections Framework

### List
- **ArrayList**: Dynamic array. Slow manipulation (shifting), Fast access `O(1)`. Not synchronized.
- **LinkedList**: Doubly linked list. Fast manipulation `O(1)`, Slow access `O(n)`. implements `Deque` too.
- **Vector**: Synchronized ArrayList (Legacy).

### Set (Unique Elements)
- **HashSet**: Backed by HashMap. No order guarantee. `O(1)` add/remove/contains.
- **LinkedHashSet**: Maintains insertion order (Doubly linked list + HashMap).
- **TreeSet**: Sorted order (Red-Black tree). `O(log n)`.

### Map (Key-Value)
- **HashMap**:
    - Uses `hashing`. `Key.hashCode()` determines bucket index.
    - **Java 8+**: When bucket size > 8, Linked List -> Balanced Tree (`O(n)` to `O(log n)`).
    - Allows 1 null key.
- **LinkedHashMap**: Insertion order maintained.
- **TreeMap**: Sorted keys.
- **Hashtable**: Synchronized, No nulls allowed (Legacy).
- **ConcurrentHashMap**:
    - Segments locking (Bucket level locking) instead of locking whole map.
    - Much faster than Hashtable/SynchronizedMap in parallel environment.

### Fail-Fast vs Fail-Safe
- **Fail-Fast**: Throws `ConcurrentModificationException` if collection modified while iterating (ArrayList, HashMap iterators).
- **Fail-Safe**: Iterates on a clone. No exception, but might not reflect latest data (CopyOnWriteArrayList, ConcurrentHashMap iterator).

---

## 3. Multithreading & Concurrency

### Creating Threads
1. Extending `Thread` class.
2. Implementing `Runnable` interface.
3. Implementing `Callable` (returns Future).

### Volatile Keyword
- Guarantees visibility of changes to variables across threads.
- READs and WRITEs bypass cache and go directly to/from Main Memory.
- Does *not* guarantee atomicity (use `AtomicInteger` or `synchronized` for that).

### Synchronization
- **Method Level**: Locks the object instance (`this`).
- **Block Level**: Locks a specific object. Better performance (Critical Section).
- **Class Level**: `static synchronized`. Locks the `Class` object.

### Executor Framework (Java 5+)
- Replaces manual `new Thread()`.
- **Types**:
    - `FixedThreadPool(n)`: Reuses n threads.
    - `CachedThreadPool()`: Creates threads as needed, kills idle ones.
    - `SingleThreadExecutor()`: Sequential execution.
    - `ScheduledThreadPool`: For periodic tasks.

### CompletableFuture (Java 8+)
- For asynchronous programming (Promise-like).
```java
CompletableFuture.supplyAsync(() -> fetchOrder())
    .thenApply(order -> enrichOrder(order))
    .thenAccept(order -> sendEmail(order));
```

---

## 4. Java 8 Features (Crucial for Interviews)

### Lambda Expressions
- Anonymous function (No name, return type, modifiers).
- Used with Functional Interfaces. `(a, b) -> a + b`

### Functional Interfaces
- Interface with **exactly one** abstract method.
- Can have static/default methods.
- **Common Ones**:
    - `Predicate<T>`: `test(T t) -> boolean` (Filters)
    - `Function<T,R>`: `apply(T t) -> R` (Maps types)
    - `Consumer<T>`: `accept(T t) -> void` (Printing/Side-effects)
    - `Supplier<T>`: `get() -> T` (Factory)

### Stream API
- Process collections of objects.
- **Key Operations**:
    - **Intermediate (Lazy)**: `filter`, `map`, `sorted`, `distinct`.
    - **Terminal (Eager)**: `collect`, `forEach`, `count`, `reduce`.
```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");
List<String> filtered = names.stream()
    .filter(name -> name.startsWith("C"))
    .map(String::toUpperCase)
    .collect(Collectors.toList());
```

### Method References (`::`)
- Shorthand for Lambdas calling a specific method.
- `System.out::println` instead of `x -> System.out.println(x)`.

### Optional Class
- Container to handle `null` gracefully. Avoids `NullPointerException`.
```java
Optional<String> name = Optional.ofNullable(maybeNullString);
name.ifPresent(n -> System.out.println(n));
String val = name.orElse("Default");
```

---

## 5. Memory Management

### Stack vs Heap
- **Stack**: Method frames, local primitives, reference variables. Thread-safe (each thread has own stack). fast access.
- **Heap**: Objects (`new ...`). Shared by all threads. Subject to Garbage Collection.

### Garbage Collection (GC)
- **Mark and Sweep**: Mark live objects, sweep dead ones.
- **Generational Strategy**:
    - **Young Gen**: Eden space, Survivor spaces (S0, S1). Minor GC.
    - **Old Gen**: Long-lived objects. Major GC (Stop-the-world).
- **Types**: Serial, Parallel (Throughput), CMS (Low latency), G1 (Balanced).

---

## 6. Design Patterns (Quick Revise)

### Creational
- **Singleton**: One instance per application (DbConnection, Config).
- **Factory**: Create object without exposing creation logic.
- **Builder**: Construct complex objects step-by-step (`lombok @Builder`).

### Structural
- **Adapter**: Bridge two incompatible interfaces.
- **Decorator**: Add responsibilities dynamically (Java IO Wrappers).

### Behavioral
- **Observer**: One-to-many dependency (Events/Listeners).
- **Strategy**: Strategy pattern defines a family of algorithms (PaymentStrategy: Card/UPI).

---

## 7. Common Snippets

### Comparator (Custom Sort)
```java
// Sort List<Employee> by Salary
Collections.sort(employees, (e1, e2) -> e1.getSalary() - e2.getSalary());

// Java 8 Style
employees.sort(Comparator.comparingInt(Employee::getSalary));
```

### Remove Duplicates from List
```java
List<Integer> list = Arrays.asList(1, 2, 2, 3);
List<Integer> unique = list.stream().distinct().collect(Collectors.toList());
// OR
Set<Integer> set = new HashSet<>(list);
```

---

## 8. Advanced Java Concepts (Senior Level)

### JVM Deep Dive
- **Memory Model (JMM)**: Defines how threads interact through memory. **Happens-Before** relationship guarantees visibility.
- **JIT Compiler (Just-In-Time)**:
    - **C1 Compiler (Client)**: Fast startup, basic optimizations.
    - **C2 Compiler (Server)**: Aggressive optimizations (inlining, loop unrolling) for long-running apps.
    - **HotSpot**: Identifies "hot" methods calling frequently and compiles them to native code.
- **Class Loading Mechanism**:
    - Loading -> Linking (Verify, Prepare, Resolve) -> Initialization.

### Advanced Garbage Collection (GC)
- **G1 GC (Garbage First)**: Default in Java 9+. Splits heap into regions. Prioritizes regions with most garbage.
- **ZGC (Z Garbage Collector)**: Low latency (sub-millisecond pauses). Scalable to TBs of heap.
- **Performance Tuning**:
    - `-Xms` / `-Xmx`: Initial/Max heap size (Set equal to avoid resizing overhead).
    - `-XX:+UseG1GC`: Explicitly enable G1.

### Concurrency Advanced
- **ForkJoinPool**: Work-stealing algorithm. Optimizes recursive tasks (used by Parallel Streams).
- **StampedLock**: Faster than `ReadWriteLock` (tryOptimisticRead).
- **Atomic Variables**: Use **CAS (Compare-And-Swap)** instructions (CPU level) instead of locks. High performance.
- **Virtual Threads (Java 21)**: Lightweight threads (Project Loom). scales to millions of threads unlike OS threads. `Thread.ofVirtual().start(...)`.

### Modern Java Features (Java 11 - 21)
- **Var Keyword (Java 10)**: Local variable type inference. `var list = new ArrayList<String>();`.
- **Records (Java 14)**: Data-classes (immutable, auto getters/hashcode/equals). `public record Point(int x, int y) {}`.
- **Sealed Classes (Java 17)**: Restrict which classes can extend them. `public sealed class Shape permits Circle, Square {}`.
- **Pattern Matching for switch (Java 21)**:
  ```java
  String result = switch(obj) {
      case Integer i -> "It is an integer: " + i;
      case String s when s.length() > 5 -> "Long string: " + s;
      default -> "Unknown";
  };
  ```

### Advanced Collections
- **BlockingQueue**: `ArrayBlockingQueue`, `LinkedBlockingQueue` (Producer-Consumer pattern).
- **IdentityHashMap**: Uses reference equality (`==`) instead of `equals()`.
- **WeakHashMap**: Keys are WeakReferences. If key has no other references, entry is GC'd (Cache implementation).

### System Design & Performance
- **Connection Pooling**: HikariCP (Fast, lightweight). Reuses expensive DB connections.
- **Caching**:
    - **L1 Cache (Heap)**: Fast, limited size (Caffeine, Guava).
    - **L2 Cache (Distributed)**: Redis, Memcached.
- **Distributed Systems**:
    - **CAP Theorem**: Consistency, Availability, Partition Tolerance.
    - **Consistent Hashing**: Distributing data across nodes evenly.

### Senior Interview Questions
#### Q: Explain the internal working of HashMap.
**Ans**: Array of Nodes (Buckets). `hashCode()` -> Index. Collision handled by LinkedList (Java 8+ converts to Red-Black Tree if processing > 8). `equals()` checks key equality.

#### Q: How does G1 GC work differently from CMS?
**Ans**: CMS (Concurrent Mark Sweep) works on Old Gen (fragmentation issues). G1 works on Regions (both Young/Old), compacts memory on the fly (no fragmentation), and allows setting "Pause Time Goal".

#### Q: What is the Diamond Problem and how does Java handle it?
**Ans**: Multiple inheritance ambiguity. Java classes don't support it. Interfaces do (Default Methods), but compiler forces overriding if conflict exists.

#### Q: ThreadLocal vs Volatile?
**Ans**:
- **Volatile**: Shared variable, creates visibility across threads (no atomicity).
- **ThreadLocal**: Private variable per thread (no sharing).
