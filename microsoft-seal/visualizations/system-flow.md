# System Flow - Microsoft SEAL Implementation

```mermaid
flowchart TD
    %% Main actors
    User([Healthcare Professional])
    ReactApp[React Frontend Application]
    CrowServer[C++ Crow Server]
    SEALEngine[Microsoft SEAL Engine]
    CSVData[(Healthcare CSV Data)]

    %% User interactions
    User -->|Input: Patient data values| ReactApp
    User -->|Select: CSV column operations| ReactApp
    User -->|Request: Encrypted computations| ReactApp

    %% Frontend processing
    subgraph "Frontend Processing"
        ReactApp -->|Validate input data| InputValidation[Input Validation]
        InputValidation -->|Prepare API requests| APIPrep[API Request Preparation]
        APIPrep -->|Send HTTP requests| HTTPClient[HTTP Client]
    end

    %% API Communication
    HTTPClient -->|POST /encrypt| CrowServer
    HTTPClient -->|POST /add_encrypted| CrowServer
    HTTPClient -->|POST /csv/sum| CrowServer
    HTTPClient -->|POST /csv/average| CrowServer

    %% Backend processing
    subgraph "C++ Backend Processing"
        CrowServer -->|Initialize SEAL context| SEALSetup[SEAL Context Setup]
        SEALSetup -->|Create keys & encoders| KeyManagement[Key Management]
        KeyManagement -->|Process encryption requests| SEALEngine
        
        CrowServer -->|Load healthcare data| CSVData
        CSVData -->|Extract patient records| DataExtraction[Data Extraction]
        DataExtraction -->|Encrypt sensitive data| SEALEngine
    end

    %% SEAL operations
    subgraph "Microsoft SEAL Operations"
        SEALEngine -->|Encrypt plaintext| Encryption[Encryption]
        Encryption -->|Perform homomorphic ops| HomomorphicOps[Homomorphic Operations]
        HomomorphicOps -->|Add encrypted values| Addition[Addition]
        HomomorphicOps -->|Multiply encrypted values| Multiplication[Multiplication]
        Addition -->|Generate encrypted result| EncryptedResult[Encrypted Result]
        Multiplication -->|Generate encrypted result| EncryptedResult
    end

    %% Return path
    EncryptedResult -->|Serialize ciphertext| Serialization[Ciphertext Serialization]
    Serialization -->|JSON response| CrowServer
    CrowServer -->|HTTP response| HTTPClient
    HTTPClient -->|Process response| ResponseHandler[Response Handler]
    ResponseHandler -->|Decrypt final results| Decryption[Client-side Decryption]
    Decryption -->|Display to user| ReactApp
    ReactApp -->|Show results| User

    %% Error handling
    subgraph "Error Handling"
        ErrorHandler[Error Handler]
        CrowServer -.->|Server errors| ErrorHandler
        SEALEngine -.->|SEAL errors| ErrorHandler
        CSVData -.->|Data errors| ErrorHandler
        ErrorHandler -.->|Error response| HTTPClient
    end

    %% Data flow styling
    classDef user fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef frontend fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef backend fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef seal fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef data fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef error fill:#ffebee,stroke:#d32f2f,stroke-width:2px

    class User user
    class ReactApp,InputValidation,APIPrep,HTTPClient,ResponseHandler,Decryption frontend
    class CrowServer,SEALSetup,KeyManagement,DataExtraction,Serialization backend
    class SEALEngine,Encryption,HomomorphicOps,Addition,Multiplication,EncryptedResult seal
    class CSVData data
    class ErrorHandler error
```

## Process Flow Description

### 1. User Interaction Layer
Healthcare professionals interact with the React frontend to:
- Input sensitive patient data values
- Select operations on healthcare datasets
- Request encrypted computations

### 2. Frontend Processing
The React application:
- Validates user input for security
- Prepares API requests with proper formatting
- Manages HTTP communication with backend

### 3. Backend Server (C++ Crow)
The C++ server:
- Receives and routes API requests
- Initializes Microsoft SEAL context and keys
- Loads and processes healthcare CSV data
- Orchestrates encryption/decryption operations

### 4. Microsoft SEAL Engine
The SEAL library:
- Encrypts sensitive healthcare data
- Performs homomorphic operations (addition, multiplication)
- Maintains data privacy throughout computation
- Generates encrypted results

### 5. Data Return Path
Results flow back through:
- Ciphertext serialization for transmission
- JSON response formatting
- HTTP response delivery
- Client-side result processing and display

### Security Features
- End-to-end encryption of sensitive data
- Homomorphic operations preserve privacy
- No plaintext exposure during computation
- Secure key management within SEAL context
