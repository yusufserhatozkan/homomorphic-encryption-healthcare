# Class Diagram - Microsoft SEAL Implementation

```mermaid
classDiagram
    class ReactFrontend {
        +useState(): State
        +useEffect(): void
        +encryptNumber(num): string
        +decryptNumber(encrypted): number
        +fetchBackendData(): Promise
        +sendEncryptedSum(): Promise
        +fetchCSVSum(): Promise
        +fetchCSVAverage(): Promise
        -API_BASE_URL: string
        -handleError(): void
    }

    class CrowBackend {
        +main(): int
        +setupRoutes(): void
        -port: 18080
        -app: crow::App
    }

    class HomomorphicEncryption {
        -context: SEALContext
        -keygen: KeyGenerator
        -encoder: IntegerEncoder
        -encryptor: Encryptor
        -evaluator: Evaluator
        -decryptor: Decryptor
        +HomomorphicEncryption()
        +encrypt(value): Ciphertext
        +decrypt(ciphertext): int64_t
        +add(cipher1, cipher2): Ciphertext
        +multiply(cipher1, cipher2): Ciphertext
        +setupSEAL(): bool
    }

    class CSVDataHandler {
        -data: vector<vector<double>>
        -filename: string
        +loadCSVData(filename): bool
        +getColumn(columnIndex): vector<double>
        +calculateSum(columnIndex): double
        +calculateAverage(columnIndex): double
        +getEncryptedColumn(columnIndex): vector<Ciphertext>
        +calculateEncryptedSum(columnIndex): Ciphertext
        +validateData(): bool
    }

    class CORSMiddleware {
        +before_handle(req, res, ctx): void
        +after_handle(req, res, ctx): void
        -setupHeaders(): void
    }

    class APIEndpoints {
        +GET "/" : Welcome message
        +GET "/health" : Server status
        +POST "/encrypt" : Encrypt single value
        +POST "/decrypt" : Decrypt single value
        +POST "/add_encrypted" : Homomorphic addition
        +POST "/multiply_encrypted" : Homomorphic multiplication
        +POST "/csv/sum" : Calculate encrypted column sum
        +POST "/csv/average" : Calculate encrypted column average
    }

    class SEALContext {
        -parms: EncryptionParameters
        -context_data: ContextData
        +SEALContext(parms)
        +is_valid(): bool
    }

    class Ciphertext {
        -data: vector<uint64_t>
        +Ciphertext()
        +size(): size_t
        +is_valid(): bool
    }

    %% Relationships
    CrowBackend *-- HomomorphicEncryption : uses
    CrowBackend *-- CSVDataHandler : uses
    CrowBackend *-- CORSMiddleware : includes
    CrowBackend --> APIEndpoints : exposes
    
    HomomorphicEncryption *-- SEALContext : manages
    HomomorphicEncryption --> Ciphertext : produces/consumes
    CSVDataHandler --> Ciphertext : generates
    
    ReactFrontend ..> APIEndpoints : HTTP requests
    ReactFrontend ..> CrowBackend : communicates with

    %% SEAL Library Components
    HomomorphicEncryption --> "Microsoft SEAL" : utilizes
    SEALContext --> "Microsoft SEAL" : part of
    Ciphertext --> "Microsoft SEAL" : part of

    %% Styling
    classDef frontend fill:#61dafb,stroke:#21759b,stroke-width:2px
    classDef backend fill:#659ad2,stroke:#004482,stroke-width:2px
    classDef seal fill:#ff6b6b,stroke:#c92a2a,stroke-width:2px
    classDef middleware fill:#ffd43b,stroke:#fab005,stroke-width:2px
    classDef data fill:#51cf66,stroke:#37b24d,stroke-width:2px

    class ReactFrontend frontend
    class CrowBackend,APIEndpoints backend
    class HomomorphicEncryption,SEALContext,Ciphertext seal
    class CORSMiddleware middleware
    class CSVDataHandler data
```

## Component Descriptions

### Frontend Components
- **ReactFrontend**: Main React application handling user interface and API communication

### Backend Components
- **CrowBackend**: Main C++ server using Crow framework
- **HomomorphicEncryption**: Core SEAL encryption/decryption operations
- **CSVDataHandler**: Healthcare data processing utilities
- **CORSMiddleware**: Cross-origin request handling

### Microsoft SEAL Components
- **SEALContext**: SEAL library context management
- **Ciphertext**: Encrypted data containers
- **Various SEAL classes**: KeyGenerator, Encryptor, Evaluator, etc.

### API Layer
- **APIEndpoints**: RESTful API interface for client-server communication
