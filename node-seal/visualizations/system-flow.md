# System Flow - Node-SEAL Implementation

```mermaid
flowchart TD
    %% Main actors
    User([Healthcare Professional])
    NextJSApp[Next.js Frontend]
    ExpressAPI[Express.js API Server]
    NodeSealEngine[Node-SEAL Engine]
    HealthcareDB[(Healthcare CSV Data)]

    %% User interactions
    User -->|Navigate to application| NextJSApp
    User -->|Input patient data| DataInput[Data Input Form]
    User -->|Select operations| OperationSelector[Operation Selector]
    User -->|Configure parameters| ParameterConfig[Parameter Configuration]

    %% Frontend routing and components
    subgraph "Next.js Frontend Processing"
        NextJSApp -->|App Router| AppRouter[App Router]
        AppRouter -->|Route to pages| PageComponents[Page Components]
        PageComponents -->|Render UI| UIComponents[UI Components]
        
        UIComponents -->|Benchmark page| BenchmarkViz[Benchmark Visualization]
        UIComponents -->|Analysis page| DatasetAnalysis[Dataset Analysis]
        UIComponents -->|Demo page| SimpleAddition[Simple Addition Demo]
        UIComponents -->|Metrics page| PerformanceMetrics[Performance Metrics]
        
        UIComponents -->|User interactions| StateManager[State Management]
        StateManager -->|API calls| APIClient[API Client]
    end

    %% API Communication
    APIClient -->|POST /api/encrypt| ExpressAPI
    APIClient -->|POST /api/add| ExpressAPI
    APIClient -->|POST /api/multiply| ExpressAPI
    APIClient -->|POST /api/csv/process| ExpressAPI
    APIClient -->|GET /api/benchmark| ExpressAPI
    APIClient -->|GET /api/health| ExpressAPI

    %% Backend processing
    subgraph "Express.js Backend Processing"
        ExpressAPI -->|Route handling| RouteHandlers[Route Handlers]
        RouteHandlers -->|Middleware stack| MiddlewareChain[Middleware Chain]
        
        subgraph "Middleware Chain"
            CORSMiddleware[CORS Middleware]
            LoggingMiddleware[Logging Middleware]
            ValidationMiddleware[Validation Middleware]
            ErrorMiddleware[Error Middleware]
        end
        
        MiddlewareChain -->|Process requests| RequestProcessor[Request Processor]
        RequestProcessor -->|Delegate operations| OperationHandler[Operation Handler]
    end

    %% Node-SEAL operations
    subgraph "Node-SEAL Processing"
        OperationHandler -->|Initialize SEAL| SealInitializer[SEAL Initializer]
        SealInitializer -->|Setup context| NodeSealEngine
        
        NodeSealEngine -->|Load node-seal library| SealLoader[SEAL Library Loader]
        SealLoader -->|Create encryption context| EncryptionContext[Encryption Context]
        EncryptionContext -->|Generate keys| KeyManagement[Key Management]
        
        NodeSealEngine -->|Encrypt data| EncryptionOps[Encryption Operations]
        NodeSealEngine -->|Homomorphic add/multiply| HomomorphicOps[Homomorphic Operations]
        NodeSealEngine -->|Decrypt results| DecryptionOps[Decryption Operations]
    end

    %% Data processing
    subgraph "Healthcare Data Processing"
        OperationHandler -->|Load CSV data| CSVLoader[CSV Data Loader]
        CSVLoader -->|Read healthcare records| HealthcareDB
        CSVLoader -->|Parse and validate| DataValidator[Data Validator]
        DataValidator -->|Extract columns| ColumnExtractor[Column Extractor]
        ColumnExtractor -->|Process with SEAL| NodeSealEngine
    end

    %% Results flow
    subgraph "Results Processing"
        HomomorphicOps -->|Generate encrypted results| EncryptedResults[Encrypted Results]
        DecryptionOps -->|Generate plain results| PlainResults[Plain Results]
        
        EncryptedResults -->|Serialize for transmission| ResultSerializer[Result Serializer]
        PlainResults -->|Format for display| ResultFormatter[Result Formatter]
        
        ResultSerializer -->|JSON response| ResponseBuilder[Response Builder]
        ResultFormatter -->|JSON response| ResponseBuilder
    end

    %% Return path
    ResponseBuilder -->|HTTP response| ExpressAPI
    ExpressAPI -->|API response| APIClient
    APIClient -->|Update state| StateManager
    StateManager -->|Re-render components| UIComponents
    UIComponents -->|Display results| User

    %% Real-time features
    subgraph "Real-time Features"
        WebSocketServer[WebSocket Server]
        ProgressUpdates[Progress Updates]
        LiveMetrics[Live Performance Metrics]
        
        NodeSealEngine -.->|Performance data| LiveMetrics
        LiveMetrics -.->|WebSocket| WebSocketServer
        WebSocketServer -.->|Real-time updates| NextJSApp
    end

    %% Error handling and logging
    subgraph "Error Handling & Monitoring"
        ErrorHandler[Error Handler]
        Logger[Application Logger]
        HealthMonitor[Health Monitor]
        
        ExpressAPI -.->|Server errors| ErrorHandler
        NodeSealEngine -.->|SEAL errors| ErrorHandler
        CSVLoader -.->|Data errors| ErrorHandler
        
        ErrorHandler -.->|Log errors| Logger
        HealthMonitor -.->|Monitor status| ExpressAPI
        HealthMonitor -.->|Health metrics| LiveMetrics
    end

    %% Styling
    classDef user fill:#e8f4fd,stroke:#0969da,stroke-width:2px
    classDef frontend fill:#f6f8fa,stroke:#7c3aed,stroke-width:2px
    classDef backend fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    classDef seal fill:#fefce8,stroke:#ca8a04,stroke-width:2px
    classDef data fill:#fdf2f8,stroke:#be185d,stroke-width:2px
    classDef realtime fill:#eff6ff,stroke:#2563eb,stroke-width:2px
    classDef error fill:#fef2f2,stroke:#dc2626,stroke-width:2px

    class User user
    class NextJSApp,AppRouter,PageComponents,UIComponents,BenchmarkViz,DatasetAnalysis,SimpleAddition,PerformanceMetrics,StateManager,APIClient,DataInput,OperationSelector,ParameterConfig frontend
    class ExpressAPI,RouteHandlers,MiddlewareChain,CORSMiddleware,LoggingMiddleware,ValidationMiddleware,ErrorMiddleware,RequestProcessor,OperationHandler,ResponseBuilder backend
    class NodeSealEngine,SealInitializer,SealLoader,EncryptionContext,KeyManagement,EncryptionOps,HomomorphicOps,DecryptionOps,EncryptedResults,PlainResults,ResultSerializer,ResultFormatter seal
    class CSVLoader,HealthcareDB,DataValidator,ColumnExtractor data
    class WebSocketServer,ProgressUpdates,LiveMetrics realtime
    class ErrorHandler,Logger,HealthMonitor error
```

## Process Flow Description

### 1. User Interface Layer (Next.js)
Healthcare professionals interact with a modern web application featuring:
- **App Router**: Next.js 13+ app directory structure with file-based routing
- **Component Hierarchy**: Specialized components for benchmarks, analysis, and demos
- **State Management**: React hooks and context for application state
- **TypeScript**: Full type safety throughout the frontend

### 2. API Communication Layer
- **API Client**: Fetch-based HTTP client with TypeScript interfaces
- **RESTful Design**: Clean API endpoints following REST principles
- **Real-time Updates**: WebSocket integration for live performance metrics
- **Error Handling**: Comprehensive error boundaries and retry logic

### 3. Backend Processing (Express.js)
The Node.js server provides:
- **Express Framework**: Robust HTTP server with middleware support
- **Route Handlers**: Organized endpoint handlers for different operations
- **Middleware Stack**: CORS, logging, validation, and error handling
- **Request Processing**: Structured request validation and response formatting

### 4. Node-SEAL Integration
JavaScript bindings to Microsoft SEAL:
- **Library Loading**: Dynamic loading of node-seal WASM module
- **Context Management**: SEAL context initialization and configuration
- **Key Management**: Automatic key generation and management
- **Operations**: Homomorphic encryption, addition, multiplication, and decryption

### 5. Healthcare Data Processing
Specialized healthcare data handling:
- **CSV Processing**: Robust CSV parsing and validation
- **Data Sanitization**: Healthcare data cleaning and standardization
- **Column Operations**: Statistical operations on encrypted healthcare columns
- **Privacy Preservation**: End-to-end encryption of sensitive medical data

### 6. Real-time Features
Advanced monitoring and feedback:
- **Performance Metrics**: Real-time encryption/decryption performance tracking
- **Progress Updates**: Live updates during long-running operations
- **Health Monitoring**: Server and SEAL engine health status
- **WebSocket Communication**: Bi-directional real-time communication

### Key Advantages of Node-SEAL Implementation
1. **Rapid Development**: JavaScript ecosystem enables faster iteration
2. **Modern UI**: Next.js with advanced React patterns and TypeScript
3. **Component Library**: Radix UI for accessibility and modern design
4. **Developer Experience**: Hot reload, TypeScript IntelliSense, and modern tooling
5. **Deployment Flexibility**: Easy containerization and cloud deployment
