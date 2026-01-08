# Java Important Concepts

- Class Loader:
    - Its a subsystem in JVM, used for loading classes.
    - Built-in class loaders:
        - Bootstrap Classloader:
            - First In JVM.
            - Loads rt.jar that constitutes all class files of Java Standard Edition. (lang, net, util,sql,io etc.).
        - Extention ClassLoader:
            - Child of Bootstrap classloader.
            - loads class present in $JAVA_HOME/jre/lib/ext
        - System Application Classloader:
            - Child of extention classloader.
            - loads class files of application, by default classpath is set to current directory.

- Why we cannot override static method?
    - Its class level.
    - Determined at compile-time.
    - Type reference decides which method to call withour referencing it to object.

- Dynamic method dispatch:
    - Process through which a call towards an overridden method is resolved at runtime.

- Volatile keyword in java:
    - Variable that is marked as volatile can be read directly from main memory insted of cache memory.
    - Changes to that variable are visible to all threads.

- When does finally block doesnot execute:
    - Where we use `System.exit(0)` in main try/catch block.

- StringBuffer vs StringBuilder:
    - StringBuffer is thread safe -- less efficient.
    - StringBuilde is not thread safe -- more efficient.

- Vector vs ArrayList:
    - Vector is thread safe (synchronized) -- slower.
    - ArrayList is not thread safe -- faster.

- String is immutable in java:
    - String Pool:
        - If we assign a value to a String (like `"Hello"`). It get stored in string literal pool area, which can be referenced by several reference variables. This we need to make it immutable to provide consistancy.
        - Stored in stack memory.
    - Classloading:
        - String is used for the mechanism of classloading, thus for security we need it to be immutable.
    - Cache hash value:
        - String is used as key in hashmap as we can cache the hash of string and since it is immutable it will always be constant.

- HashMap vs HashSet:
    - HashMap:
        - Uses Map interface.
        - Not thread safe.
        - Null keys and values are allowed.
        - Duplicate keys are not allowed.
    - HashSet:
        - Uses Set interface.
        - Not thread safe.
        - Duplicate values are not allowed.

- Producer-Consumer pattern:
    - Used while writing concurrent code or multihtreaded code.
    - Implemented using wait and notify method.
    - Producer waits if the bucket is full and consumer waits if bucket is empty.
    - Advantages:
        - Producer not need to know no. of consumers.
        - Producer and consumer can work on separate speeds. We can increase consumers for better utilisation.
        - Functionally separate Producer and Consumer leads to cleaner and managable code.

- Make Immutable classes in java:
    - making class final.
    - make instance variable private.
    - not create setter method for variable.
    - handle variables in constructor only.
    - return clone of object in getter thus not returning the original object.

- Fail-safe and Fail-fast iterator:
    - Fail-fast:
        - It fails as soon as the structure of collection is changed since beginning of the iteration.
        - Structural changes are removing, adding or updating any element from collection when one thread is iterating over that collection.
        - Uses modification count -- when change in count it throws `ConcurrentModificationException`.
    - Fail-safe:
        - Does not throw exception if collection is modified.
        - It works on clone instead of original collection.

- SOLID design Principle:
    - S - Single Responsibility Principle (SRP):
        - A class should have only one reason to change, thus it should have only one responsibility.
    - O - Open/Closed Principle (OCP):
        - Entities should be open for extension but closed for modification. promotes use of interface and abstract class.
    - L - Liskov Substitution Principle (LSP):
        - Objects of superclass should be replaceable with objects of subclass without affecting the correctness of program.
    - I - Interface Segregation Principle (ISP):
        - Clients should not be forced to depend on interfaces they do not use.
    - D - Dependency Inversion Principle (DIP):
        - High-level modules should not depend on low level module.
        - Both should depend on Abstraction.
        - Abstraction should not depend on detail vice-versa.

- Funcational Interface:
    - An interface that contains only one abstract method and can have mutiple default or static method.
    - It can be used as assignment target for lambda expressions or method references.
    - Ex. Runnable

- HashMap vs HashTable:
    - HashMap:
        - Allows null keys and values.
        - not thread safe.
        - better performance.
    - HashTable:
        - not allow null keys or values.
        - thread-safe.
        - less performance as compared to HashMap.

- Types on inner classes in Java:
    - Non-static inner class:
        - Associated with an instance of outer class.
        - Can access members of outerclass directly.
    - Static nested class:
        - Does not require instance of outer class.
        - can only access the static members.
    - Method-local inner class:
        - Defined within a method.
        - Can access local veriables and parameters if they are final or effectively final.
    - Anonymous Inner Class:
        - class defined without name at time of instantiation.
        - for one time implementation of an interface or subclass.

- Method refenrences in java:
    - Shorthand notation of lambda expression to call a method.
    - Way to refer method without invoking them.
    - Four types:
        - Static Method Reference:
            - `ClassName::staticMethodName`
        - Instance Method Reference for particular object:
            - `instance::instanceMethodName`
        - Instance Method Reference for Arbitary Object of particular type:
            - `ClassName::instanceMethodName`
        - Constructor Reference:
            - `ClassName::new`

- Java 8 features:
    - Lambda Expressions.
    - Streams API.
    - Default methods in interfaces.
    - Optional Class.
    - New Date and Time API.

- Try-with-resources:
    - Introduced in Java 7.
    - Used to manage resources that need tobe closed after use. (ex. sockets, files, etc.)
    - Implements `AutoClosable` interface.
    - usage: 
        ```java
        try (
            BufferedReader br = new BufferedReader(
                new FileReader("file.txt")
                )
            ){
            //some code
            } catch(IOException e)
            {
            //some code
            }
        ```

- Comparable vs Comparator:
    - Comparable:
        - Interface -- defines natural ordering of objects.
        - Requires implementation of `compareTo` method within class itself.
    - Comparator:
        - Interface -- defines external ordering of objects.
        - Requires implementation of `compare` method in separate class or lambda expression.

- InstanceOf operator:
    - Used to check if instance is of specific class.
    - used to avoid `ClassCastException`.

- Shallow copy vs Deep copy:
    - Shallow Copy:
        - Creates new object.
        - Does not create copies of the objects contained in original object.
        - It copies the references to original objects.
        - Changes to original affects the copy.
    - Deep Copy:
        -   Creates a new object.
        - Recursively copies all objects contained in original object.
        - Changes to original does not affect the copy.

- Stream API benefits:
    - Conciseness:
        Allows writing readable and concise code using a functional style.
    - Lazy Evaluation:
        Process elements only when necessary.
    - Parallel procesing:
        Can be processed in parallel.
    - Declarative Approach:
        Focuses on what to do rather than how to do.

- Wrapper Class:
    - Larger entity encapsulates the smaller entity.
    - In java wrapper class is that object that encapsulates the primitive data types.
    - ex. Interger, Character, Byte, Long, Double, Float, etc.

- Default values assigned to variables and instances:
    - Numeric type (int, byte, short, etc.) is `0`.
    - Boolean type (boolean) is `false`.
    - Object type is `null`.
    - Char type (char) is `"u0000"` (null character).

- InputStream/OutputStream vs Reader/Writer:
    - InputStream/OutputStream:
        - uses byte stream.
        - accepts byte arrays.
        - usecases for binary data (pictures etc.)
    - Reader/Writer:
        - uses character stream.
        - accepts characeter array.
        - usecases for textual data (unicode characters etc.)

- Ways to take input from console:
    - Command line args.
        ```java
            for(String val : args)
            {
                System.out.println(val);
            }
        ```
    - Buffered Reader Class.
        ```java
            BufferedReader read = new BufferedReader(
                new InputStreamReader(System.in)
            );
            String x = read.readLine();
        ```
    - Console class.
        ```java
            String x = System.console().readLine();
        ```
    - Scanner class.
        ```java
            Scanner in = new Scanner(System.in);
            String x = in.nextLine();
        ```

- transient keyword:
    - Used in serialization if we don't want to save the value of particular variable in file.

- Copies of arrays:
    - arr.clone():
        - `arr.clone()` creates a shallow copy for non-primitive objects in array.
        - for primitive types it behaves as deep copy as primitive values are directly copied.
    - System.arrayCopy():
        - `System.arrayCopy(originalArr,originStartingpos, copyArr, destStartingPos,length)` creates a deep copy.
    - Arrays.copyOf():
        - `Arrays.copyOf(arr, arr.length)` creates deep copy.
        - If length is more than the original array length, extra elements are initialized with default values.
    - Arrays.copyOfRange():
        - `Arrays.copyOfRange(arr,0,arr.length)` create deep copy.
        - Can specify range of elements.

- Jagged array:
    - Its a 2D array where each row has different length.
        ```java
            int[][] arr = {
                {1,2,3},
                {4,5},
                {6,7,8,9}
            };
        ```

- Marker Interface:
    - An interface is called marker interface if it is recognized as empty interface  (no fields or methods).
    - Ex. Serializable, Cloneable etc.
