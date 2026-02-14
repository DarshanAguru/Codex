# Spring Boot Interview Preparation

## 1. Fundamentals

### What is Spring Boot?
It is an opinionated framework built on top of the Spring ecosystem that simplifies developing production-ready applications.
- **Auto-configuration**: Intelligent defaults based on classpath dependencies.
- **Embedded Servers**: Tomcat/Jetty included (no external WAR deployment needed).
- **Starter Dependencies**: Curated `pom.xml` dependencies (`spring-boot-starter-web`).
- **Actuator**: Production-ready features like health checks and metrics.

### @SpringBootApplication
It is a meta-annotation comprising of 3 annotations:
1.  **@SpringBootConfiguration**: Marks class as a configuration source.
2.  **@EnableAutoConfiguration**: Tells Spring Boot to start adding beans based on classpath settings.
3.  **@ComponentScan**: Tells Spring to look for other components/configurations in the current package and sub-packages.

---

## 2. Important Annotations

### Stereotype Annotations
- **@Component**: General purpose bean.
- **@Service**: Business logic layer.
- **@Repository**: Data Access layer (Translates DB exceptions to Spring exceptions).
- **@Controller**: Web MVC controller (returns views).
- **@RestController**: `@Controller` + `@ResponseBody`. Returns JSON/XML directly.

### Dependency Injection
- **@Autowired**: Automatic dependency injection (by type).
- **@Qualifier**: Used with `@Autowired` to resolve ambiguity when multiple beans of same type exist.
- **@Primary**: Sets a default bean preference when multiple candidates exist.
- **@Bean**: Explicitly declares a single bean (used in `@Configuration` classes).

### Request Mapping
- **@RequestMapping**: General mapping (GET, POST etc).
- **@GetMapping**, **@PostMapping**, **@PutMapping**, **@DeleteMapping**: Specific HTTP verb shortcuts.
- **@PathVariable**: Extract values from URL path (`/users/{id}`).
- **@RequestParam**: Extract query parameters (`/users?id=123`).
- **@RequestBody**: Map request body (JSON) to Java Object.

---

## 3. Spring Concepts Deep Dive

### Spring Bean Lifecycle
1.  **Instantiate**: Bean instance created.
2.  **Populate Properties**: Dependencies injected (DI).
3.  **setBeanName/setFactory**: Aware interfaces called.
4.  **Pre-Initialization**: `BeanPostProcessor.postProcessBeforeInitialization()`.
5.  **Initialize**: `@PostConstruct` / `afterPropertiesSet()`.
6.  **Post-Initialization**: `BeanPostProcessor.postProcessAfterInitialization()` (AOP proxies created here).
7.  **Ready**: Bean is ready to use.
8.  **Destroy**: `@PreDestroy` called on shutdown.

### Dependency Injection Types
1.  **Constructor Injection** (Recommended):
    - Mandatory dependencies.
    - Immutable objects.
    - Easy to test.
2.  **Setter Injection**:
    - Optional dependencies.
3.  **Field Injection** (`@Autowired` on field):
    - Not recommended (Hard to test, hides dependencies).

### Spring AOP (Aspect Oriented Programming)
- Separates **Cross-Cutting Concerns** (Logging, Security, Transaction Mgmt) from Business Logic.
- **Internal Working**: Uses **Proxy Pattern**. Creates a proxy object around the actual bean to intercept method calls.
- **Annotations**: `@Aspect`, `@Before`, `@After`, `@Around` (Most powerful).

---

## 4. Database & JPA

### JPA vs Hibernate
- **JPA**: Specification (Interface).
- **Hibernate**: Implementation.

### N+1 Problem
- Fetching a list of Parents (1 query), then for `each` parent, fetching Children (N queries).
- **Fix**: Use `JOIN FETCH` in JPQL or Entity Graphs.

### Fetch Types
- **LAZY**: Fetch related entities only when accessed (Recommended for collections).
- **EAGER**: Fetch related entities immediately with main entity.

---

## 5. Standard Architecture Snippet

### 1. Controller Layer
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired // Or Constructor Injection
    private UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
}
```

### 2. Service Layer (Business Logic)
```java
@Service
public class UserService {

    @Autowired
    private UserRepository userRepo;

    public UserDTO getUserById(Long id) {
        User user = userRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // Convert to DTO logic...
        return new UserDTO(user);
    }
}
```

### 3. Application Properties (`application.properties`)
```properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/mydb
spring.datasource.username=root
spring.datasource.password=secret
spring.jpa.hibernate.ddl-auto=update
```

---

## 6. Common Interview Questions

#### Q: How does Spring Boot handle configuration?
**Ans**: It uses `application.properties` or `application.yml`. Values are injected using `@Value("${key}")` or `@ConfigurationProperties` for type-safe config.

#### Q: Difference between @Controller and @RestController?
**Ans**: `@Controller` returns a View (html/jsp). `@RestController` returns data (typically JSON) directly to response body (equivalent to `@Controller` + `@ResponseBody`).

#### Q: What is Actuator?
**Ans**: Provides production-ready endpoints (`/actuator/health`, `/actuator/metrics`) to monitor and manage the application.

#### Q: How to handle Exceptions globally?
**Ans**: Use `@ControllerAdvice` with `@ExceptionHandler`.
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<String> handleNotFound(Exception e) {
        return ResponseEntity.status(404).body(e.getMessage());
    }
}
```

---

## 7. Advanced Spring Boot Concepts (Senior Level)

### Spring Boot Internals
- **Auto Configuration Deep Dive**: `@ConditionalOnClass`, `@ConditionalOnMissingBean`. `META-INF/spring.factories` (pre-2.7) vs `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`.
- **Startup Optimization**: Lazy Initialization, Spring AOT, CDS (Class Data Sharing).

### Advanced Bean Scopes
- **Request**: Created once per HTTP request.
- **Session**: Created once per HTTP session.
- **Application**: Created once per ServletContext.
- **WebSocket**: Created once per WebSocket session.

### Transaction Management (Deep Dive)
- **@Transactional**:
    - **Propagation**:
        - `REQUIRED`: Join existing or create new.
        - `REQUIRES_NEW`: Suspend existing, create new.
        - `NESTED`: Savepoint within existing transaction.
    - **Isolation**: READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE.
    - **Rollback Rules**: By default rolls back on `RuntimeException`, not `CheckedException` (unless `rollbackFor` specified).

### Spring Security (OAuth2 & JWT)
- **Security Filter Chain**: The heart of Spring Security.
- **AuthenticationProvider**: Logic to verify credentials.
- **UserDetailsService**: Loading user data.
- **OAuth2**:
    - **Resource Server**: Validates tokens (JWT/Opaque).
    - **Client**: Initiates login.

### Microservices Patterns with Spring Cloud
- **Circuit Breaker** (Resilience4j): Fail fast, fallback methods.
- **Service Discovery** (Eureka/Consul): Dynamic IP resolution.
- **API Gateway** (Spring Cloud Gateway): Routing, Rate Limiting, Auth-offloading.
- **Distributed Tracing**: Micrometer Tracing + Zipkin/Jaeger.

### Testing Strategies (Senior Level)
- **Slice Testing**:
    - `@WebMvcTest`: Only Controller layer.
    - `@DataJpaTest`: Only Repository layer.
- **Integration Testing**:
    - `@SpringBootTest`: Full context.
    - **Testcontainers**: Spin up real Docker containers (DB, Kafka) for reliable integration tests.

### Performance Tuning & Best Practices
- **Connection Pooling**: HikariCP config (minimumIdle, maximumPoolSize).
- **Caching**: `@Cacheable`, Caffeine (local), Redis (distributed).
- **Asynchronous Processing**: `@Async` (requires separate ThreadPoolTaskExecutor config).
- **Profile Management**: keeping `application-prod.yml` separate.

### Senior Interview Questions
#### Q: How does @Transactional work internally?
**Ans**: Uses AOP (CGLIB/JDK Proxy). Creates a proxy that wraps the method. Opens transaction `before()` method, commits `afterReturning()`, rollbacks `afterThrowing()`. *Self-invocation issue*: Calling `@Transactional` method from same class bypasses proxy (transaction won't work).

#### Q: Difference between BeanFactory and ApplicationContext?
**Ans**: `BeanFactory` is the root interface (lazy loading). `ApplicationContext` extends it (eager loading, supports AOP, events, i18n). Always use `ApplicationContext` unless memory is strictly limited.

#### Q: How to handle Distributed Transactions?
**Ans**:
1.  **Saga Pattern**: Choreography (Events) or Orchestration.
2.  **Two-Phase Commit (2PC)**: Using XA Transactions (Performance heavy).
3.  **Best Practice**: Avoid strict distributed transactions; use eventual consistency.
