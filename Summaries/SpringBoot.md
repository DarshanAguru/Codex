# SpringBoot Important Concepts

- What is SpringBoot?
    - Built on top of Spring framework.
    - Create stand-alone RESTful web applications.
    - Servers are built-in (jetty and tomcat).

- Features of SpringBoot:
    - Auto-configuration:
        - Automatically configures dependencies using `@EnableAutoConfiguration` annotation.
    - SpringBoot starter POM:
        - Starter POMs are pre-configured dependencies for functions like managing dependencies, creating projects and running applications.
    - Actuator:
        - Provides health-check, metrics and monitors the endpoints of applicaiton.
    - Embedded servers:
        - Contains embedded servers like jetty and tomcat.

- Internal working of spring boot:
    - When called `SpringApplication.run()` method.
    - Application context of `Inversion of Control` searches the class annotated with `@Configuration` which calls all beans in classpath and initializes those classes.
    - Beans are stored in `IOC container`.
    - After beans are created the request then goes to `dispatcher servlet`.
    - SpringBoot Layered architeture:
        - Presentation Layer:
            Handles all HTTP requests made by client, translates JSON parameter to object and authenticates and transfers to business logic.
        - Business Layer:
            Also known as service layer, handles all the business logic of an application.
        - Persistance Layer:
            Consists all storage logic which are required and translates business objects to database rows.
        - Database Layer:
            All CRUD opeartions are performed.
    - Application flow:
        ![Spring application flow](image.png)

- What does @SpringBootApplication Annotation internally do?
    - Combines 3 annotations:
        - `@AutoConfiguration` automatically configures beans in the classpath and scans dependencies according to the need.
        - `@componentScan` scans the components in package of annotated class and its sub-packages.
        - `@Configuration` configures beans and packages in classpath.

- Basic SpringBoot annotations:
    - `@SpringBootApplication` this is main annotation used to bootstrap a SpringBoot application.
    - `@Configuration` used to indicate that a class contains configurations methods for application context. Typically used in combination with @Bean annotation to define beans and their dependencies.
    - `@Component` most generic component for most spring-managed components. Used to mark as spring bean that will be maneged by spring container.
    - `@RestController` used to define RESTful web service controller. It is specialised version of the `@Controller` annotation that includes `@ResponseBody` annotation by default.
    - `@RequestMapping` used to map HTTP requests to specific method in controller.

- What is dependency injection and its types:
    - It is a design pattern that enables us to produce loosely coupled components.
    - Three type:
        - Constructor Injection.
        - Setter Injection.
        - Field Injection.

- What is IOC container?
    - It is a central manager for appliaction for the application objects that controles the creation, configuration and management of dependency injection of objects.

- Bean Wiring:
    - Mechanism that is used to manage dependencies between the beans.
    - Two types:
        - Autowiring
        - Manual Wiring