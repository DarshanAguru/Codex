# FastAPI Architecture & Engineering Manual (Senior/Architect Level)

## 1. Core Architecture & Fundamentals

### ASGI vs WSGI
- Traditional Python web frameworks (Django, Flask) use **WSGI** (Web Server Gateway Interface), which is synchronous. Each request blocks a worker thread until it completes.
- FastAPI is built on **ASGI** (Asynchronous Server Gateway Interface) via the `Starlette` framework. This allows non-blocking I/O (`async`/`await`), enabling tens of thousands of concurrent connections efficiently (ideal for WebSockets, Microservices, AI Streaming).
- **Pydantic** powers the data validation and serialization under the hood algorithmically using Rust (V2+).

### Basic Application & Uvicorn Configuration
```python
from fastapi import FastAPI
app = FastAPI(
    title="Core Gateway API",
    version="1.0.0",
    docs_url="/swagger" # Can disable in prod via docs_url=None
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "uptime": 99.99}
```
**Running the Server:** 
```bash
# Development (Auto-reload on file change)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production (Using Gunicorn to manage Uvicorn ASGI workers)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```
*Architect Note*: `uvicorn` acts as the server handling network connections, but `gunicorn` acts as the master process manager. If a worker dies/crashes due to a memory leak, Gunicorn instantly spins up a new one. `w=4` typically maps to `(2 x CPU Cores) + 1`.

---

## 2. Advanced Routing, Parameters & Validation

### Request Components
- **Path Parameters**: Extracted from the URL `/users/{user_id}`.
- **Query Parameters**: Inferred from the function signature if not in the path `?search=hello&limit=10`.
- **Body Parameters**: Handled natively when you type-hint a Pydantic model.

### Boundaries: Pydantic Schemas vs DB ORM Models
*A classic architectural anti-pattern is leaking Database Models directly out as API Responses.*
- **DB Models (SQLAlchemy/Tortoise)**: Represent the explicit layout of the SQL Table.
- **Pydantic Schemas (DTOs)**: The Data Transfer Object. Represents the exact JSON you want to Accept/Return. 

```python
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional

# Input Schema (What the client sends)
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# Output Schema (What the client receives)
class UserRead(BaseModel):
    id: int
    email: EmailStr
    
    # Allows Pydantic to read 'user.id' instead of requiring a dict 'user["id"]'
    model_config = ConfigDict(from_attributes=True) 
```

---

## 3. The Power of Dependency Injection (DI)

FastAPI's DI system (`Depends`) is its most distinguishing architectural feature. It allows sharing logic, enforcing authentication, and managing connections without tightly coupled, repetitive code.

### Database Sessions Strategy
Instead of opening/closing database connections manually in every route, inject them using a generator mapping.
```python
def get_db_session():
    db = SessionLocal() # ORM sync/async session
    try:
        yield db  # App yields control to the endpoint processing
    finally:
        db.close() # Guaranteed cleanup after HTTP Response is sent

@app.post("/users", response_model=UserRead)
async def create_user(user: UserCreate, db: Session = Depends(get_db_session)):
    # db is perfectly managed here
    pass
```

### Chaining Dependencies (The Auth Pipeline)
Dependencies can depend on other dependencies. This builds security pipelines.
```python
# 1. Extract Token -> 2. Verify Token -> 3. Get User from DB
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db_session)):
    user = verify_jwt_and_fetch_user(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid auth credentials")
    return user

@app.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user
```

---

## 4. Middleware, Interceptors & Compression

Middlewares intercept requests *before* routing occurs and responses *after* generation.

### Crucial Built-in Middlewares
- **CORS (Cross-Origin Resource Sharing)**: Necessary if the UI runs on a different domain/port.
- **GZip Compression**: Drastically reduces network payload size overhead. Let the server compress it rather than doing it manually.

```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://myapp.com"], # Lock this down in prod!
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
# Automatically gzip responses above 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000) 
```

### Custom Middleware (Metrics, Logging & State Injection)
```python
from starlette.middleware.base import BaseHTTPMiddleware
from uuid import uuid4
import time

class ArchitectureMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()
        
        # 1. State Injection: Attach temporary context per-request
        request.state.correlation_id = str(uuid4())
        
        # 2. Yield control to routing
        response = await call_next(request)
        
        # 3. Post-processing Metrics
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f} sec"
        response.headers["X-Correlation-ID"] = request.state.correlation_id
        
        return response

app.add_middleware(ArchitectureMiddleware)
```

---

## 5. Streaming, File Handling & Background Tasks

### High-Performance `StreamingResponse`
When returning massive files or continuously streamed data (like GenAI chunked text or video protocols), returning a generic dictionary loads the entirety of the payload into memory, killing the server. Streams send data via TCP chunks dynamically.
```python
from fastapi.responses import StreamingResponse
import asyncio

async def data_generator():
    for i in range(100):
        yield f"Chunk {i}\n"
        await asyncio.sleep(0.1)

@app.get("/stream-data")
async def stream():
    # Pushes data to the client constantly over 10 seconds without buffering RAM
    return StreamingResponse(data_generator(), media_type="text/plain")
```

### Background Tasks (Fire and Forget)
Ideal for light asynchronous side-effects where you don't want to make the user wait (e.g., sending an activation email after registration). *(Note: For intense distributed queues, use Celery/RabbitMQ. This is strictly lightweight).*
```python
from fastapi import BackgroundTasks

def send_welcome_email(email: str):
    time.sleep(3) # Simulate slow SMTP transaction
    print(f"Sent to {email}")

@app.post("/register")
async def register(email: str, background_tasks: BackgroundTasks):
    # Triggers immediately after HTTP 200 payload fires
    background_tasks.add_task(send_welcome_email, email)
    return {"message": "User created. Check your email."}
```

---

## 6. Architecture Mapping: Monolith vs Microservices

### The Modular Monolith (Scaling with APIRouter)
Premature optimization to microservices traps teams in operational nightmare. A tightly bonded modular monolith is the ultimate standard for 90% of business setups. Isolate domains via routers.
```text
app/
├── main.py        # Central mount point, configures app.include_router()
├── core/          # Settings, exceptions, security primitives
├── users/         # Domain 1
│   ├── router.py  # Entrypoints
│   ├── schemas.py # DTO Validation (Pydantic)
│   ├── models.py  # SQLAlchemy Mapping
│   └── service.py # Pure Python Business Logic abstracted from routing!
├── payments/      # Domain 2
```
```python
# main.py
from users.router import router as user_router
app.include_router(user_router, prefix="/api/v1/users", tags=["Users"])
```

### Transitioning to Microservices
When boundaries demand strict infrastructure isolation (e.g., the Image Processing module needs GPU machines, but the User DB runs on basic CPU):
- **API Gateway**: Use an edge router (Traefik, NGINX, AWS API Gateway) to direct `/api/users` -> Service A and `/api/ai` -> Service B.
- **Inter-service Communication (Crucial)**: 
    - *Synchronous Setup*: `gRPC` over protobuf is substantially faster than generic REST HTTP calls laterally between your own services.
    - *Asynchronous Event-Driven Setup*: Empley Pub/Sub (Kafka, EventBridge). If `Service-A` creates a user, it publishes a message `user_created`. `Service-B` consumes this queue at its own leisure to build analytical dashboards. Loose coupling saves systems from cascade failures.

---

## 7. Deep Senior "Gotchas" & Best Practices

#### 1. The `async def` vs `def` Pitfall (Thread Starvation)
FastAPI routes defined with `async def` run strictly on the **single central Event Loop**. If you run an operation inside it that blocks internally (like `time.sleep()`, synchronous `requests.get()`, heavy `pandas` crunching, or a synchronous db commit) **the entire server freezes** for all incoming requests.
- **Solution**: If a mechanism natively blocks and is not an `await`-able library, you *must* define the route as a standard `def`. FastAPI detects this, and runs standard `def` routes inside an external thread-pool (like classic Threading), bypassing event-loop starvation completely.

#### 2. Synchronous Database Drivers mapped in Async Contexts
Libraries like standard `SQLAlchemy` or `psycopg2` are synchronous! Do not use them lazily inside an `async def` route. To safely use SQLAlchemy in FastAPI natively, you must utilize the `ext.asyncio` engine with `asyncpg` bindings, and `await session.commit()`.

#### 3. Configuration Management via `pydantic-settings`
Never use `os.environ.get()` scattered across files. Abstract environment variables into a typed `BaseSettings` class. This causes the API to crash violently exactly at boot time if critical environment secrets are missing, rather than crashing silently at runtime during an end-user request later on.

#### 4. Server-Sent Events (SSE)
When generating one-directional data streams (like typing out ChatGPT tokens dynamically), do not over-engineer with WebSockets. Utilize Server-Sent Events (via `sse-starlette` wrapping a `StreamingResponse`). WebSockets are inherently stateful, heavy, and require bi-directional connections, which is overkill for 80% of streaming scenarios.
