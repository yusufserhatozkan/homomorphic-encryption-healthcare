# Component Structure - Node-SEAL Implementation

```mermaid
graph TB
    %% Frontend Layer
    subgraph "Frontend Layer (Next.js + TypeScript)"
        NextApp[Next.js Application]
        
        subgraph "App Router Structure"
            AppLayout[app/layout.tsx]
            RootPage[app/page.tsx]
            BenchmarkPage[app/benchmark/page.tsx]
            APIRoutes[app/api/route.ts]
        end
        
        subgraph "UI Components"
            BenchmarkViz[benchmark-visualization.tsx]
            DatasetAnalysis[dataset-analysis.tsx]
            PerformanceMetrics[performance-metrics-display.tsx]
            SchemeParams[scheme-parameters.tsx]
            SimpleAddition[simple-addition.tsx]
            AboutSection[about-section.tsx]
            Navbar[navbar.tsx]
            ThemeProvider[theme-provider.tsx]
            ThemeToggle[theme-toggle.tsx]
        end
        
        subgraph "UI Foundation"
            RadixButton[ui/button.tsx]
            RadixCard[ui/card.tsx]
            RadixInput[ui/input.tsx]
            RadixLabel[ui/label.tsx]
            RadixProgress[ui/progress.tsx]
            RadixSelect[ui/select.tsx]
            RadixSeparator[ui/separator.tsx]
            RadixTabs[ui/tabs.tsx]
        end
        
        NextApp --> AppLayout
        NextApp --> RootPage
        NextApp --> BenchmarkPage
        NextApp --> APIRoutes
        NextApp --> BenchmarkViz
        NextApp --> DatasetAnalysis
        NextApp --> PerformanceMetrics
        NextApp --> SchemeParams
        NextApp --> SimpleAddition
        NextApp --> AboutSection
        NextApp --> Navbar
        NextApp --> ThemeProvider
        NextApp --> ThemeToggle
        BenchmarkViz --> RadixButton
        BenchmarkViz --> RadixCard
        BenchmarkViz --> RadixProgress
    end

    %% Configuration Layer
    subgraph "Configuration & Utilities"
        NextConfig[next.config.ts]
        TailwindConfig[tailwind.config.ts]
        PostCSSConfig[postcss.config.mjs]
        TSConfig[tsconfig.json]
        ESLintConfig[eslint.config.mjs]
        ComponentsJSON[components.json]
        
        subgraph "Utility Libraries"
            APIConfig[config/api.ts]
            UtilsLib[lib/utils.ts]
            CVALib[class-variance-authority]
            ClsxLib[clsx]
            LucideIcons[lucide-react]
        end
        
        NextApp --> NextConfig
        NextApp --> TailwindConfig
        NextApp --> PostCSSConfig
        NextApp --> TSConfig
        NextApp --> ESLintConfig
        NextApp --> ComponentsJSON
        NextApp --> APIConfig
        NextApp --> UtilsLib
        UtilsLib --> CVALib
        UtilsLib --> ClsxLib
        BenchmarkViz --> LucideIcons
    end

    %% Backend Layer
    subgraph "Backend Layer (Node.js + Express)"
        ExpressApp[Express Application]
        
        subgraph "Core Backend Files"
            MainServer[src/index.js]
            Logger[logger.js]
            PackageJSON[package.json]
        end
        
        subgraph "API Endpoints"
            HealthEndpoint[/api/health]
            EncryptEndpoint[/api/encrypt]
            DecryptEndpoint[/api/decrypt]
            AddEndpoint[/api/add]
            MultiplyEndpoint[/api/multiply]
            CSVSumEndpoint[/api/csv/sum]
            CSVAvgEndpoint[/api/csv/average]
            BenchmarkEndpoint[/api/benchmark]
        end
        
        subgraph "Middleware Stack"
            CORSMiddleware[CORS Middleware]
            LoggingMiddleware[Logging Middleware]
            BodyParser[Body Parser]
            ErrorHandler[Error Handler]
            RateLimit[Rate Limiting]
        end
        
        ExpressApp --> MainServer
        ExpressApp --> Logger
        ExpressApp --> PackageJSON
        MainServer --> HealthEndpoint
        MainServer --> EncryptEndpoint
        MainServer --> DecryptEndpoint
        MainServer --> AddEndpoint
        MainServer --> MultiplyEndpoint
        MainServer --> CSVSumEndpoint
        MainServer --> CSVAvgEndpoint
        MainServer --> BenchmarkEndpoint
        ExpressApp --> CORSMiddleware
        ExpressApp --> LoggingMiddleware
        ExpressApp --> BodyParser
        ExpressApp --> ErrorHandler
        ExpressApp --> RateLimit
    end

    %% Encryption Layer
    subgraph "Encryption Layer (node-seal)"
        NodeSealEngine[Node-SEAL Engine]
        
        subgraph "SEAL Components"
            SealContext[SEAL Context]
            KeyGenerator[Key Generator]
            Encryptor[Encryptor]
            Evaluator[Evaluator]
            Decryptor[Decryptor]
            IntegerEncoder[Integer Encoder]
            CiphertextObj[Ciphertext Objects]
            PlaintextObj[Plaintext Objects]
        end
        
        subgraph "Encryption Operations"
            EncryptOp[Encryption Operation]
            DecryptOp[Decryption Operation]
            AddOp[Addition Operation]
            MultiplyOp[Multiplication Operation]
            SerializeOp[Serialization Operation]
            DeserializeOp[Deserialization Operation]
        end
        
        NodeSealEngine --> SealContext
        NodeSealEngine --> KeyGenerator
        NodeSealEngine --> Encryptor
        NodeSealEngine --> Evaluator
        NodeSealEngine --> Decryptor
        NodeSealEngine --> IntegerEncoder
        NodeSealEngine --> CiphertextObj
        NodeSealEngine --> PlaintextObj
        NodeSealEngine --> EncryptOp
        NodeSealEngine --> DecryptOp
        NodeSealEngine --> AddOp
        NodeSealEngine --> MultiplyOp
        NodeSealEngine --> SerializeOp
        NodeSealEngine --> DeserializeOp
    end

    %% Data Layer
    subgraph "Data Layer"
        DataProcessor[Data Processor]
        
        subgraph "Data Sources"
            HealthcareCSV[(healthcare_dataset.csv)]
            ConfigFiles[(Configuration Files)]
            LogFiles[(Application Logs)]
            TempFiles[(Temporary Files)]
        end
        
        subgraph "Data Operations"
            CSVParser[CSV Parser]
            DataValidator[Data Validator]
            ColumnExtractor[Column Extractor]
            StatisticsCalc[Statistics Calculator]
            DataSanitizer[Data Sanitizer]
        end
        
        DataProcessor --> HealthcareCSV
        DataProcessor --> ConfigFiles
        DataProcessor --> LogFiles
        DataProcessor --> TempFiles
        DataProcessor --> CSVParser
        DataProcessor --> DataValidator
        DataProcessor --> ColumnExtractor
        DataProcessor --> StatisticsCalc
        DataProcessor --> DataSanitizer
    end

    %% Package Management
    subgraph "Package Management & Build"
        PackageManager[Package Manager]
        
        subgraph "Frontend Dependencies"
            NextFramework[Next.js Framework]
            ReactLib[React Library]
            RadixUI[Radix UI Components]
            TailwindCSS[Tailwind CSS]
            TypeScript[TypeScript]
            ESLint[ESLint]
        end
        
        subgraph "Backend Dependencies"
            ExpressFramework[Express Framework]
            NodeSealLib[node-seal Library]
            CORSLib[CORS Library]
            LoggerLib[Logger Library]
            Nodemon[Nodemon]
        end
        
        PackageManager --> NextFramework
        PackageManager --> ReactLib
        PackageManager --> RadixUI
        PackageManager --> TailwindCSS
        PackageManager --> TypeScript
        PackageManager --> ESLint
        PackageManager --> ExpressFramework
        PackageManager --> NodeSealLib
        PackageManager --> CORSLib
        PackageManager --> LoggerLib
        PackageManager --> Nodemon
    end

    %% Inter-layer connections
    APIRoutes <-->|HTTP/JSON| MainServer
    BenchmarkViz -->|Fetch API| BenchmarkEndpoint
    DatasetAnalysis -->|Fetch API| CSVSumEndpoint
    SimpleAddition -->|Fetch API| AddEndpoint
    
    EncryptEndpoint --> NodeSealEngine
    AddEndpoint --> NodeSealEngine
    CSVSumEndpoint --> DataProcessor
    DataProcessor --> NodeSealEngine
    
    %% External connections
    NextApp -.->|Build process| NextFramework
    ExpressApp -.->|Runtime| ExpressFramework
    NodeSealEngine -.->|Bindings| NodeSealLib

    %% Styling
    classDef frontend fill:#0070f3,stroke:#0051bb,stroke-width:2px,color:white
    classDef config fill:#7c3aed,stroke:#5b21b6,stroke-width:2px,color:white
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:white
    classDef encryption fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:white
    classDef data fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:white
    classDef packages fill:#6b7280,stroke:#4b5563,stroke-width:2px,color:white

    class NextApp,AppLayout,RootPage,BenchmarkPage,APIRoutes,BenchmarkViz,DatasetAnalysis,PerformanceMetrics,SchemeParams,SimpleAddition,AboutSection,Navbar,ThemeProvider,ThemeToggle,RadixButton,RadixCard,RadixInput,RadixLabel,RadixProgress,RadixSelect,RadixSeparator,RadixTabs frontend
    
    class NextConfig,TailwindConfig,PostCSSConfig,TSConfig,ESLintConfig,ComponentsJSON,APIConfig,UtilsLib,CVALib,ClsxLib,LucideIcons config
    
    class ExpressApp,MainServer,Logger,PackageJSON,HealthEndpoint,EncryptEndpoint,DecryptEndpoint,AddEndpoint,MultiplyEndpoint,CSVSumEndpoint,CSVAvgEndpoint,BenchmarkEndpoint,CORSMiddleware,LoggingMiddleware,BodyParser,ErrorHandler,RateLimit backend
    
    class NodeSealEngine,SealContext,KeyGenerator,Encryptor,Evaluator,Decryptor,IntegerEncoder,CiphertextObj,PlaintextObj,EncryptOp,DecryptOp,AddOp,MultiplyOp,SerializeOp,DeserializeOp encryption
    
    class DataProcessor,HealthcareCSV,ConfigFiles,LogFiles,TempFiles,CSVParser,DataValidator,ColumnExtractor,StatisticsCalc,DataSanitizer data
    
    class PackageManager,NextFramework,ReactLib,RadixUI,TailwindCSS,TypeScript,ESLint,ExpressFramework,NodeSealLib,CORSLib,LoggerLib,Nodemon packages
```

## Architecture Layers

### Frontend Layer (Next.js + TypeScript)
- **Next.js Application**: Modern React framework with app router
- **Component Hierarchy**: Modular, reusable UI components
- **UI Foundation**: Radix UI primitives for accessibility
- **Type Safety**: Full TypeScript integration

### Configuration & Utilities
- **Build Configuration**: Next.js, Tailwind, PostCSS, and TypeScript configs
- **Utility Libraries**: Helper functions and external library integrations
- **Component System**: Shadcn/ui component configuration

### Backend Layer (Node.js + Express)
- **Express Application**: RESTful API server
- **Endpoint Handlers**: Organized route handlers for different operations
- **Middleware Stack**: Comprehensive request processing pipeline
- **Logging & Monitoring**: Application logging and error handling

### Encryption Layer (node-seal)
- **Node-SEAL Engine**: JavaScript interface to Microsoft SEAL
- **SEAL Components**: Core encryption primitives and operations
- **Operations**: Homomorphic encryption, addition, multiplication, serialization

### Data Layer
- **Data Processing**: Healthcare data handling and validation
- **File Management**: CSV processing and temporary file handling
- **Statistics**: Mathematical operations on encrypted and plain data

### Package Management & Build
- **Dependency Management**: Frontend and backend package management
- **Framework Integration**: Next.js, React, Express, and utility libraries
- **Development Tools**: TypeScript, ESLint, Nodemon for development workflow

## Key Features

### Development Experience
- **Hot Reload**: Both frontend and backend support hot reload
- **Type Safety**: End-to-end TypeScript for better developer experience
- **Modern Tooling**: ESLint, Prettier, and modern build tools
- **Component Library**: Pre-built, accessible UI components

### Performance & Scalability
- **Next.js Optimizations**: Automatic code splitting and optimization
- **Express Middleware**: Efficient request processing pipeline
- **SEAL Integration**: Optimized JavaScript bindings to native SEAL library
- **Caching**: Built-in caching mechanisms for improved performance
