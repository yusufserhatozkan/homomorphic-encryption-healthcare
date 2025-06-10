# Class Diagram - Node-SEAL Implementation

```mermaid
classDiagram
    class NextJSApp {
        +page.tsx: ReactNode
        +layout.tsx: ReactNode
        +globals.css: Styles
        +middleware.ts: NextMiddleware
        +api/: APIRoutes
        +useRouter(): NextRouter
        +useSearchParams(): URLSearchParams
        -_app: AppProps
        -_document: DocumentProps
    }

    class UIComponents {
        +BenchmarkVisualization: React.FC
        +DatasetAnalysis: React.FC
        +PerformanceMetrics: React.FC
        +SchemeParameters: React.FC
        +SimpleAddition: React.FC
        +ThemeProvider: React.FC
        +Navbar: React.FC
        -props: ComponentProps
        -state: ComponentState
    }

    class RadixUIComponents {
        +Button: RadixButton
        +Card: RadixCard
        +Dropdown: RadixDropdown
        +Label: RadixLabel
        +Progress: RadixProgress
        +Select: RadixSelect
        +Separator: RadixSeparator
        +Tabs: RadixTabs
        +Slot: RadixSlot
        -theme: ThemeConfig
        -variants: VariantConfig
    }

    class ExpressServer {
        +app: Express
        +listen(port): Server
        +use(middleware): void
        +get(path, handler): void
        +post(path, handler): void
        -port: 3001
        -cors: CORSOptions
        -logger: Logger
    }

    class NodeSealEngine {
        +SEAL: NodeSeal
        +context: Context
        +keyGenerator: KeyGenerator
        +encoder: IntegerEncoder
        +encryptor: Encryptor
        +evaluator: Evaluator
        +decryptor: Decryptor
        +encrypt(value): Ciphertext
        +decrypt(ciphertext): number
        +add(cipher1, cipher2): Ciphertext
        +multiply(cipher1, cipher2): Ciphertext
        +initializeSEAL(): Promise<boolean>
    }

    class APIController {
        +handleEncrypt(req, res): Promise<void>
        +handleDecrypt(req, res): Promise<void>
        +handleAdd(req, res): Promise<void>
        +handleMultiply(req, res): Promise<void>
        +handleCSVSum(req, res): Promise<void>
        +handleCSVAverage(req, res): Promise<void>
        +handleBenchmark(req, res): Promise<void>
        +handleHealth(req, res): Promise<void>
        -validateRequest(req): boolean
        -formatResponse(data): ResponseFormat
    }

    class CSVProcessor {
        +loadHealthcareData(filename): Promise<Data[]>
        +processColumn(data, index): number[]
        +calculateSum(column): Promise<number>
        +calculateAverage(column): Promise<number>
        +encryptColumn(column): Promise<Ciphertext[]>
        +validateCSVFormat(data): boolean
        -parseCSV(content): Promise<Data[]>
        -sanitizeData(row): Data
    }

    class MiddlewareStack {
        +corsMiddleware: CORSMiddleware
        +loggingMiddleware: LoggingMiddleware
        +errorMiddleware: ErrorMiddleware
        +validationMiddleware: ValidationMiddleware
        +rateLimitMiddleware: RateLimitMiddleware
        -setupMiddleware(): void
    }

    class ConfigManager {
        +apiConfig: APIConfig
        +sealConfig: SEALConfig
        +serverConfig: ServerConfig
        +loadConfig(): Config
        +validateConfig(): boolean
        -defaultConfig: DefaultConfig
        -envConfig: EnvironmentConfig
    }

    class TypeDefinitions {
        +ComponentProps: interface
        +APIRequest: interface
        +APIResponse: interface
        +SEALContext: interface
        +HealthcareData: interface
        +BenchmarkResult: interface
        +ErrorResponse: interface
    }

    class UtilityLibrary {
        +classVarianceAuthority: CVA
        +clsx: ClassNameUtil
        +lucideReact: IconLibrary
        +next: NextFramework
        +react: ReactLibrary
        +tailwindCSS: StylingFramework
        -helperFunctions: Utilities
    }

    %% Relationships - Frontend
    NextJSApp *-- UIComponents : contains
    UIComponents *-- RadixUIComponents : uses
    NextJSApp --> TypeDefinitions : implements
    UIComponents --> UtilityLibrary : utilizes

    %% Relationships - Backend
    ExpressServer *-- APIController : routes to
    ExpressServer *-- MiddlewareStack : uses
    APIController *-- NodeSealEngine : orchestrates
    APIController *-- CSVProcessor : delegates to
    
    %% Cross-layer relationships
    NodeSealEngine --> "node-seal library" : imports
    CSVProcessor --> NodeSealEngine : encrypts with
    ConfigManager --> ExpressServer : configures
    ConfigManager --> NodeSealEngine : configures

    %% API Communication
    NextJSApp ..> APIController : HTTP requests
    UIComponents ..> APIController : fetch data

    %% External dependencies
    RadixUIComponents --> "Radix UI Library" : extends
    UtilityLibrary --> "External Libraries" : imports
    NodeSealEngine --> "Microsoft SEAL (WASM)" : binds to

    %% Styling
    classDef frontend fill:#0070f3,stroke:#0051bb,stroke-width:2px,color:white
    classDef ui fill:#7c3aed,stroke:#5b21b6,stroke-width:2px,color:white
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:white
    classDef seal fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:white
    classDef middleware fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:white
    classDef utility fill:#6b7280,stroke:#4b5563,stroke-width:2px,color:white

    class NextJSApp,UIComponents frontend
    class RadixUIComponents ui
    class ExpressServer,APIController,CSVProcessor backend
    class NodeSealEngine seal
    class MiddlewareStack,ConfigManager middleware
    class TypeDefinitions,UtilityLibrary utility
```

## Component Descriptions

### Frontend Components (Next.js + TypeScript)
- **NextJSApp**: Main Next.js application with app router structure
- **UIComponents**: React components for different features (benchmarks, analysis, etc.)
- **RadixUIComponents**: Modern UI primitives for accessibility and design

### Backend Components (Node.js + Express)
- **ExpressServer**: Main HTTP server handling API requests
- **APIController**: Route handlers for encryption and data operations
- **NodeSealEngine**: JavaScript interface to Microsoft SEAL library
- **CSVProcessor**: Healthcare data processing and encryption utilities

### Middleware & Configuration
- **MiddlewareStack**: Express middleware for CORS, logging, validation, etc.
- **ConfigManager**: Configuration management for server and SEAL parameters

### Type Safety & Utilities
- **TypeDefinitions**: TypeScript interfaces and type definitions
- **UtilityLibrary**: External libraries and helper functions

### Key Differences from Microsoft SEAL Implementation
1. **Language**: JavaScript/TypeScript vs C++
2. **Frontend**: Next.js with advanced UI components vs React with Vite
3. **Backend**: Express.js vs Crow framework
4. **SEAL Integration**: node-seal JavaScript bindings vs native SEAL library
5. **Type Safety**: Full TypeScript support throughout the stack
