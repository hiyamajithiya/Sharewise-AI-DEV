# ShareWise AI - Visual Flow Diagrams

## Mermaid Diagrams for Process Visualization

### 1. User Authentication Flow

```mermaid
graph TD
    A[User] -->|Enter Credentials| B[Login Page]
    B --> C{Frontend Validation}
    C -->|Valid| D[Send to Backend API]
    C -->|Invalid| E[Show Error]
    
    D --> F{Rate Limit Check}
    F -->|Exceeded| G[Block Request]
    F -->|OK| H[Validate Credentials]
    
    H --> I{Credentials Valid?}
    I -->|No| J[Log Failed Attempt]
    J --> K[Return Error]
    I -->|Yes| L{Email Verified?}
    
    L -->|No| M[Send Verification Email]
    L -->|Yes| N[Generate JWT Tokens]
    
    N --> O[Create Session]
    O --> P[Log Audit Event]
    P --> Q[Return Success Response]
    
    Q --> R[Store Tokens in Frontend]
    R --> S[Update Redux State]
    S --> T[Redirect to Dashboard]
```

### 2. Trading Signal Generation Flow

```mermaid
graph LR
    A[Market Data Feed] --> B[Data Validation]
    B --> C[Technical Indicators]
    
    C --> D[RSI Calculation]
    C --> E[MACD Calculation]
    C --> F[Moving Averages]
    C --> G[Bollinger Bands]
    
    D --> H[Pattern Recognition]
    E --> H
    F --> H
    G --> H
    
    H --> I{AI Model Enabled?}
    I -->|Yes| J[AI Prediction]
    I -->|No| K[Rule-Based Analysis]
    
    J --> L[Signal Generation]
    K --> L
    
    L --> M[Risk Assessment]
    M --> N{Risk Acceptable?}
    
    N -->|Yes| O[Create Signal]
    N -->|No| P[Reject Signal]
    
    O --> Q[Store in Database]
    Q --> R[Send Notifications]
    R --> S[WebSocket Broadcast]
    R --> T[Email Alert]
    R --> U[Push Notification]
```

### 3. Order Execution Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Broker
    participant Database
    
    User->>Frontend: Place Order
    Frontend->>Frontend: Validate Input
    Frontend->>Backend: Submit Order Request
    
    Backend->>Backend: Authenticate User
    Backend->>Backend: Risk Management Check
    Backend->>Database: Check Portfolio Limits
    Database-->>Backend: Current Positions
    
    Backend->>Backend: Calculate Order Size
    Backend->>Broker: Send Order via API
    
    Broker->>Broker: Validate Order
    Broker-->>Backend: Order Confirmation
    
    Backend->>Database: Store Order Details
    Backend->>Backend: Update Portfolio
    Backend-->>Frontend: Order Success Response
    
    Frontend->>User: Show Confirmation
    
    Note over Broker: Order Execution
    
    Broker-->>Backend: Execution Update
    Backend->>Database: Update Trade Record
    Backend->>Frontend: WebSocket Update
    Frontend->>User: Show Execution Status
```

### 4. AI Model Training Pipeline

```mermaid
graph TB
    A[Historical Data] --> B[Data Collection]
    B --> C[Data Preprocessing]
    
    C --> D[Handle Missing Values]
    C --> E[Normalize Features]
    C --> F[Create Time Windows]
    
    D --> G[Feature Engineering]
    E --> G
    F --> G
    
    G --> H[Split Train/Test]
    H --> I[Model Initialization]
    
    I --> J[Training Loop]
    J --> K{Epoch Complete?}
    K -->|No| J
    K -->|Yes| L[Validation]
    
    L --> M{Performance Good?}
    M -->|No| N[Adjust Hyperparameters]
    N --> J
    M -->|Yes| O[Backtesting]
    
    O --> P{Metrics Acceptable?}
    P -->|No| N
    P -->|Yes| Q[Save Model]
    
    Q --> R[Deploy to Production]
    R --> S[Monitor Performance]
```

### 5. Role-Based Access Control

```mermaid
graph TD
    A[User Request] --> B[Extract JWT Token]
    B --> C{Token Valid?}
    C -->|No| D[Return 401 Unauthorized]
    C -->|Yes| E[Load User Object]
    
    E --> F[Get User Role]
    F --> G{Role Check}
    
    G -->|SUPER_ADMIN| H[Full Access]
    G -->|SUPPORT| I[Support Access]
    G -->|SALES| J[Sales Access]
    G -->|USER| K[Check Subscription]
    
    K --> L{Subscription Tier}
    L -->|BASIC| M[Basic Features]
    L -->|PRO| N[Pro Features]
    L -->|ELITE| O[Elite Features]
    
    H --> P[Process Request]
    I --> P
    J --> P
    M --> P
    N --> P
    O --> P
    
    P --> Q[Return Response]
```

### 6. WebSocket Real-time Communication

```mermaid
sequenceDiagram
    participant Client
    participant WebSocket Server
    participant Redis PubSub
    participant Backend Services
    
    Client->>WebSocket Server: Connect (WS Handshake)
    WebSocket Server->>Client: Connection Established
    
    Client->>WebSocket Server: Authenticate (JWT)
    WebSocket Server->>WebSocket Server: Validate Token
    WebSocket Server->>Client: Authentication Success
    
    Client->>WebSocket Server: Subscribe to Channels
    WebSocket Server->>Redis PubSub: Register Subscriptions
    
    loop Market Data Updates
        Backend Services->>Redis PubSub: Publish Update
        Redis PubSub->>WebSocket Server: Notify Subscribers
        WebSocket Server->>Client: Send Update
    end
    
    Client->>WebSocket Server: Send Order
    WebSocket Server->>Backend Services: Process Order
    Backend Services-->>WebSocket Server: Order Status
    WebSocket Server-->>Client: Order Update
    
    Client->>WebSocket Server: Disconnect
    WebSocket Server->>Redis PubSub: Unsubscribe
    WebSocket Server->>Client: Connection Closed
```

### 7. Broker Integration OAuth Flow

```mermaid
sequenceDiagram
    participant User
    participant ShareWise
    participant Broker
    participant Database
    
    User->>ShareWise: Click "Connect Broker"
    ShareWise->>User: Redirect to Broker Login
    
    User->>Broker: Enter Credentials
    Broker->>Broker: Authenticate User
    Broker->>User: Show Authorization Page
    
    User->>Broker: Approve Access
    Broker->>ShareWise: Redirect with Auth Code
    
    ShareWise->>Broker: Exchange Code for Token
    Broker->>Broker: Validate Code
    Broker-->>ShareWise: Access Token + Refresh Token
    
    ShareWise->>Database: Store Encrypted Tokens
    ShareWise->>Broker: Fetch Account Details
    Broker-->>ShareWise: Account Information
    
    ShareWise->>Database: Store Account Info
    ShareWise->>User: Connection Successful
```

### 8. Portfolio Management State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: User Login
    
    Idle --> FetchingData: Load Portfolio
    FetchingData --> CalculatingMetrics: Data Received
    
    CalculatingMetrics --> DisplayingPortfolio: Metrics Ready
    DisplayingPortfolio --> Idle: View Complete
    
    DisplayingPortfolio --> UpdatingPosition: New Trade
    UpdatingPosition --> RecalculatingPnL: Position Changed
    RecalculatingPnL --> DisplayingPortfolio: Update Complete
    
    DisplayingPortfolio --> ExecutingOrder: Place Order
    ExecutingOrder --> WaitingConfirmation: Order Sent
    WaitingConfirmation --> UpdatingPosition: Order Filled
    WaitingConfirmation --> DisplayingPortfolio: Order Failed
    
    DisplayingPortfolio --> GeneratingReport: Export Request
    GeneratingReport --> DisplayingPortfolio: Report Ready
    
    DisplayingPortfolio --> [*]: Logout
```

### 9. Subscription Lifecycle

```mermaid
graph LR
    A[New User] --> B[Free Trial]
    B --> C{Trial Expired?}
    C -->|No| B
    C -->|Yes| D[Choose Plan]
    
    D --> E[BASIC Plan]
    D --> F[PRO Plan]
    D --> G[ELITE Plan]
    
    E --> H[Payment]
    F --> H
    G --> H
    
    H --> I{Payment Success?}
    I -->|No| D
    I -->|Yes| J[Active Subscription]
    
    J --> K{Renewal Due?}
    K -->|No| J
    K -->|Yes| L[Auto-Renewal]
    
    L --> M{Payment Success?}
    M -->|Yes| J
    M -->|No| N[Grace Period]
    
    N --> O{Payment Made?}
    O -->|Yes| J
    O -->|No| P[Downgrade to Free]
    
    P --> D
```

### 10. Error Handling and Recovery

```mermaid
graph TD
    A[Error Occurs] --> B{Error Type}
    
    B -->|Network| C[Retry with Backoff]
    B -->|Database| D[Use Cache/Queue]
    B -->|Authentication| E[Refresh Token]
    B -->|Rate Limit| F[Apply Throttling]
    B -->|System| G[Circuit Breaker]
    
    C --> H{Retry Success?}
    H -->|Yes| I[Resume Operation]
    H -->|No| J[Fallback Mode]
    
    D --> K[Queue Writes]
    K --> L[Process When Available]
    
    E --> M{Token Valid?}
    M -->|Yes| I
    M -->|No| N[Re-authenticate]
    
    F --> O[Wait Period]
    O --> I
    
    G --> P[Open Circuit]
    P --> Q[Health Check]
    Q --> R{Service Healthy?}
    R -->|Yes| S[Close Circuit]
    R -->|No| Q
    
    S --> I
    J --> T[Log Error]
    T --> U[Alert Admin]
    U --> V[Manual Intervention]
```

### 11. Data Flow Architecture

```mermaid
graph TB
    subgraph "Data Sources"
        A1[Market Data API]
        A2[News API]
        A3[Economic Data]
    end
    
    subgraph "Ingestion Layer"
        B1[Data Collectors]
        B2[Data Validators]
        B3[Data Transformers]
    end
    
    subgraph "Processing Layer"
        C1[Stream Processing]
        C2[Batch Processing]
        C3[ML Pipeline]
    end
    
    subgraph "Storage Layer"
        D1[(PostgreSQL)]
        D2[(Redis Cache)]
        D3[(Time Series DB)]
    end
    
    subgraph "Service Layer"
        E1[Trading Service]
        E2[Analytics Service]
        E3[AI Service]
    end
    
    subgraph "API Layer"
        F1[REST API]
        F2[WebSocket]
        F3[GraphQL]
    end
    
    subgraph "Client Layer"
        G1[Web App]
        G2[Mobile App]
        G3[Admin Portal]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    
    B1 --> B2
    B2 --> B3
    
    B3 --> C1
    B3 --> C2
    C1 --> C3
    C2 --> C3
    
    C1 --> D2
    C2 --> D1
    C3 --> D3
    
    D1 --> E1
    D2 --> E1
    D3 --> E2
    D1 --> E3
    
    E1 --> F1
    E1 --> F2
    E2 --> F1
    E3 --> F3
    
    F1 --> G1
    F2 --> G1
    F1 --> G2
    F3 --> G3
```

### 12. Microservices Communication

```mermaid
graph TD
    subgraph "API Gateway"
        GW[Kong/Nginx]
    end
    
    subgraph "Core Services"
        AUTH[Auth Service]
        USER[User Service]
        TRADE[Trading Service]
    end
    
    subgraph "Analytics Services"
        MARKET[Market Analysis]
        PORTFOLIO[Portfolio Service]
        REPORT[Reporting Service]
    end
    
    subgraph "AI Services"
        MODEL[Model Service]
        PREDICT[Prediction Service]
        TRAIN[Training Service]
    end
    
    subgraph "Infrastructure"
        MQ[Message Queue]
        CACHE[Redis Cache]
        DB[(Database)]
    end
    
    Client --> GW
    GW --> AUTH
    GW --> USER
    GW --> TRADE
    
    AUTH --> CACHE
    USER --> DB
    TRADE --> MQ
    
    MQ --> MARKET
    MQ --> PORTFOLIO
    MQ --> MODEL
    
    MARKET --> REPORT
    PORTFOLIO --> REPORT
    
    MODEL --> PREDICT
    MODEL --> TRAIN
    
    PREDICT --> MQ
    TRAIN --> DB
```

### 13. CI/CD Pipeline

```mermaid
graph LR
    A[Developer Push] --> B[GitHub]
    B --> C[GitHub Actions]
    
    C --> D[Code Quality]
    D --> D1[Linting]
    D --> D2[Unit Tests]
    D --> D3[Security Scan]
    
    D1 --> E{Pass?}
    D2 --> E
    D3 --> E
    
    E -->|No| F[Notify Developer]
    E -->|Yes| G[Build Docker Image]
    
    G --> H[Push to Registry]
    H --> I[Deploy to Staging]
    
    I --> J[Integration Tests]
    J --> K[Performance Tests]
    K --> L[Manual QA]
    
    L --> M{Approved?}
    M -->|No| F
    M -->|Yes| N[Deploy to Production]
    
    N --> O[Health Checks]
    O --> P{Healthy?}
    P -->|No| Q[Rollback]
    P -->|Yes| R[Monitor]
    
    Q --> F
    R --> S[Complete]
```

### 14. Database Schema Relationships

```mermaid
erDiagram
    USER ||--o{ PORTFOLIO : owns
    USER ||--o{ SUBSCRIPTION : has
    USER ||--o{ AUDIT_LOG : generates
    
    PORTFOLIO ||--o{ POSITION : contains
    PORTFOLIO ||--o{ TRANSACTION : records
    
    POSITION ||--|| STOCK : tracks
    TRANSACTION ||--|| STOCK : involves
    
    SUBSCRIPTION ||--|| PLAN : subscribes_to
    PLAN ||--o{ FEATURE : includes
    
    USER ||--o{ TRADING_SIGNAL : receives
    TRADING_SIGNAL ||--|| STRATEGY : generated_by
    STRATEGY ||--|| AI_MODEL : uses
    
    USER ||--o{ BROKER_ACCOUNT : connects
    BROKER_ACCOUNT ||--o{ ORDER : places
    ORDER ||--o{ EXECUTION : results_in
    
    AI_MODEL ||--o{ TRAINING_JOB : trained_by
    TRAINING_JOB ||--o{ BACKTEST : validates
```

### 15. Security Layer Flow

```mermaid
graph TD
    A[Incoming Request] --> B[WAF/Firewall]
    B --> C{IP Whitelist?}
    C -->|No| D[Check Blacklist]
    C -->|Yes| E[Rate Limiter]
    
    D --> F{Blacklisted?}
    F -->|Yes| G[Block Request]
    F -->|No| E
    
    E --> H{Rate Limit OK?}
    H -->|No| G
    H -->|Yes| I[SSL/TLS Termination]
    
    I --> J[Input Validation]
    J --> K{Valid Input?}
    K -->|No| L[Reject with Error]
    K -->|Yes| M[Authentication]
    
    M --> N{Authenticated?}
    N -->|No| O[Return 401]
    N -->|Yes| P[Authorization]
    
    P --> Q{Authorized?}
    Q -->|No| R[Return 403]
    Q -->|Yes| S[Process Request]
    
    S --> T[Audit Logging]
    T --> U[Return Response]
```

---

## How to Read These Diagrams

### Diagram Types Used:

1. **Flow Charts (graph TD/LR)**: Show the flow of processes from start to end
2. **Sequence Diagrams**: Show interactions between different components over time
3. **State Diagrams**: Show different states and transitions in a system
4. **ER Diagrams**: Show database relationships between entities

### Symbol Meanings:

- **Rectangles**: Process or action steps
- **Diamonds**: Decision points
- **Circles**: Start/End points
- **Arrows**: Flow direction
- **Parallel lines**: Parallel processes

### Color Coding (when rendered):

- **Green**: Success paths
- **Red**: Error paths
- **Blue**: Normal processes
- **Yellow**: Warning or caution states

---

## Using These Diagrams

### For Developers:
- Use these diagrams to understand system flow
- Reference during implementation
- Update when making changes

### For Product Managers:
- Understand feature workflows
- Identify optimization opportunities
- Plan new features

### For QA Teams:
- Design test cases
- Understand edge cases
- Verify system behavior

### For Support Teams:
- Troubleshoot issues
- Understand user journeys
- Provide better assistance

---

*Note: These diagrams can be rendered using any Mermaid-compatible viewer or documentation tool.*

*Last Updated: August 2025*
*Version: 1.0.0*