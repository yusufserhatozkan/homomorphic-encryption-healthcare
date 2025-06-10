/**
 * Mini Backend Server for Homomorphic Encryption Testing and CSV Operations
 * 
 * This file implements a lightweight REST API server that provides:
 * 1. Basic homomorphic encryption/decryption operations for testing
 * 2. CSV file reading and processing capabilities
 * 3. Public key distribution endpoints
 * 
 * Unlike the main backend, this server generates keys automatically and
 * provides direct encrypt/decrypt endpoints for development and testing.
 */

#include "crow.h"                    // Crow HTTP framework for REST API
#include "HomomorphicEncryption.h"   // Our custom homomorphic encryption wrapper
#include "CORSMiddleware.h"          // CORS middleware for cross-origin requests
#include <iostream>                  // For console I/O operations
#include <chrono>                    // For performance timing measurements

// Platform-specific includes for memory usage monitoring
#if defined(_WIN32)
    #include <windows.h>
    #include <psapi.h>
#else
    #include <sys/resource.h>
#endif

/**
 * Utility function to safely log ciphertext for debugging
 * Truncates long ciphertext strings to prevent console overflow
 * 
 * @param ct The ciphertext string to log
 * @return A truncated version of the ciphertext (first 20 characters) or "[EMPTY]" if empty
 */
static std::string log_cipher(const std::string& ct) {
    if (ct.empty()) return "[EMPTY]";
    return ct.substr(0, std::min(20, (int)ct.length()));
}

/**
 * Read numeric values from a specific column in a CSV file
 * This function is used for processing datasets before encryption
 * 
 * @param file_path Path to the CSV file to read
 * @param column_index Zero-based index of the column to extract
 * @return Vector of double values from the specified column
 * @throws std::runtime_error if file cannot be opened
 * 
 * Note: Automatically skips the header row and ignores conversion errors
 */
std::vector<double> read_csv(const std::string& file_path, int column_index) {
    std::ifstream file(file_path);
    if (!file.is_open()) {
        throw std::runtime_error("Could not open file");
    }
    
    std::vector<double> values;
    std::string line, cell;
    
    // Skip header row
    std::getline(file, line);
    
    // Process each data row
    while (std::getline(file, line)) {
        std::stringstream ss(line);
        int current_col = 0;
        
        // Parse each cell in the row
        while (std::getline(ss, cell, ',')) {
            if (current_col++ == column_index) {
                try {
                    values.push_back(std::stod(cell));  // Convert string to double
                } catch (...) {
                    // Ignore conversion errors for invalid/missing data
                }
                break;  // Found target column, move to next row
            }
        }
    }
    
    return values;
}


// Global counter to track encryption operations for session management
int encryption_count = 0;

/**
 * Print session start delimiter for console logging
 * Used to visually group related operations in the console output
 */
void print_session_start() {
    std::cout << "###########################\n";
}

/**
 * Print session end delimiter for console logging
 * Marks the completion of a logical group of operations
 */
void print_session_end() {
    std::cout << "###########################\n";
}

/**
 * Print operation separator for console logging
 * Used to separate individual operations within a session
 */
void print_op_separator() {
    std::cout << "---------------------------\n";
}

/**
 * Main function - Entry point for the mini backend server
 * 
 * 
 * - Automatically generates keys for both BFV and CKKS schemes
 * - Provides direct encrypt/decrypt endpoints for testing
 * - Includes CSV processing capabilities for dataset operations
 * - Runs on port 18081 to avoid conflicts with the main backend
 */
int main() {
    // Initialize homomorphic encryption instances with automatic key generation
    // This makes the mini backend ready to use immediately for testing
    HomomorphicEncryption he_bfv(false, true);   // BFV with key generation
    HomomorphicEncryption he_ckks(true, true);   // CKKS with key generation

    // Initialize Crow web application with CORS middleware
    crow::App<CORSMiddleware> app;
    app.loglevel(crow::LogLevel::Warning);  // Reduce log verbosity

    // ========================================
    // CSV PROCESSING ENDPOINTS
    // ========================================
    
    /**
     * CSV Read Endpoint
     * POST /csv/read
     * 
     * Reads numeric values from a specific column in a CSV file
     * Used for loading datasets before encryption or analysis
     * 
     * Request body (JSON):
     * {
     *   "file_path": "path/to/file.csv",
     *   "column_index": 0
     * }
     * 
     * Response (JSON):
     * {
     *   "values": [1.0, 2.0, 3.0, ...]
     * }
     */
    CROW_ROUTE(app, "/csv/read")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;
        
        // Validate required fields
        if (!json_data || !json_data.has("file_path") || !json_data.has("column_index")) {
            response["error"] = "Missing required fields";
            return crow::response(400, response);
        }

        try {
            std::string file_path = json_data["file_path"].s();
            int column_index = json_data["column_index"].i();
            auto values = read_csv(file_path, column_index);
            response["values"] = values;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    /**
     * CSV Sum Endpoint (Non-encrypted)
     * POST /csv/sum
     * 
     * Computes the sum of values from a CSV column without encryption
     * Used for baseline performance comparison with encrypted operations
     * 
     * Request body (JSON):
     * {
     *   "file_path": "path/to/file.csv",
     *   "column_index": 0
     * }
     * 
     * Response (JSON):
     * {
     *   "result": 123.45,
     *   "values_processed": 100
     * }
     */
    CROW_ROUTE(app, "/csv/sum") // sum for non-encrypted calculations
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;
        
        // Validate required fields
        if (!json_data || !json_data.has("file_path") || !json_data.has("column_index")) {
            response["error"] = "Missing required fields";
            return crow::response(400, response);
        }

        try {
            std::string file_path = json_data["file_path"].s();
            int column_index = json_data["column_index"].i();
            auto values = read_csv(file_path, column_index);
            
            // Compute sum of all values
            double sum = 0.0;
            for (const auto& val : values) {
                sum += val;
            }
            
            response["result"] = sum;
            response["values_processed"] = values.size();
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    /**
     * CSV Average Endpoint (Non-encrypted)
     * POST /csv/average
     * 
     * Computes the average of values from a CSV column without encryption
     * Used for baseline performance comparison with encrypted operations
     * 
     * Request body (JSON):
     * {
     *   "file_path": "path/to/file.csv", 
     *   "column_index": 0
     * }
     * 
     * Response (JSON):
     * {
     *   "result": 12.345,
     *   "values_processed": 100
     * }
     */
    CROW_ROUTE(app, "/csv/average") // average for non-encrypted calculations
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;
        
        // Validate required fields
        if (!json_data || !json_data.has("file_path") || !json_data.has("column_index")) {
            response["error"] = "Missing required fields";
            return crow::response(400, response);
        }

        try {
            std::string file_path = json_data["file_path"].s();
            int column_index = json_data["column_index"].i();
            auto values = read_csv(file_path, column_index);
            
            // Compute sum of all values
            double sum = 0.0;
            for (const auto& val : values) {
                sum += val;
            }
            
            // Calculate average (handle empty dataset)
            double average = values.empty() ? 0.0 : sum / values.size();
            
            response["result"] = average;
            response["values_processed"] = values.size();
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });
            response["values_processed"] = values.size();
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    // ========================================
    // HOMOMORPHIC ENCRYPTION ENDPOINTS
    // ========================================

    /**
     * Encryption Endpoint
     * POST /encrypt
     * 
     * Encrypts a single numeric value using the specified scheme
     * Includes performance timing and memory usage monitoring
     * 
     * Request body (JSON):
     * {
     *   "value": 42.5,
     *   "scheme": "bfv" | "ckks"
     * }
     * 
     * Response (JSON):
     * {
     *   "ciphertext": "base64_encoded_ciphertext",
     *   "execution_us": 1234,
     *   "ram_kb": 5678
     * }
     */
    CROW_ROUTE(app, "/encrypt")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;

        // Validate required fields
        if (!json_data || !json_data.has("value") || !json_data.has("scheme")) {
            response["error"] = "Missing required fields";
            return crow::response(400, response);
        }

        try {
            std::string scheme = json_data["scheme"].s();
            double value = json_data["value"].d();
            std::string ciphertext;

            // Session management: Start new session every 2 encryptions
            if (encryption_count % 2 == 0) {
                print_session_start();  // Start of session every 2 encryptions
            }

            // Start performance timing
            auto start = std::chrono::high_resolution_clock::now();

            // Perform encryption based on the specified scheme
            if (scheme == "bfv") {
                ciphertext = he_bfv.encrypt(value);
            } else if (scheme == "ckks") {
                ciphertext = he_ckks.encrypt(value);
            } else {
                throw std::runtime_error("Invalid scheme");
            }

            // Calculate execution time
            auto end = std::chrono::high_resolution_clock::now();
            auto duration_us = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
            
            // Log operation details for monitoring
            std::cout << "Encrypted | Scheme: " << scheme 
                      << " | Ciphertext (first 20): " << log_cipher(ciphertext) << std::endl;

            std::cout << "Encryption was done in " << duration_us << " microseconds\n";
            std::cout << "Throughput: " << (1000000.0 / duration_us) << " operations per second\n";

            // Measure current memory usage
            size_t ram_kb = 0;

            // Platform-specific memory measurement
            #if defined(_WIN32)
                // Windows memory measurement
                PROCESS_MEMORY_COUNTERS memInfo;
                GetProcessMemoryInfo(GetCurrentProcess(), &memInfo, sizeof(memInfo));
                ram_kb = memInfo.WorkingSetSize / 1024;
            #else
                // Unix/Linux memory measurement
                struct rusage usage;
                getrusage(RUSAGE_SELF, &usage);
                #ifdef __APPLE__
                    ram_kb = usage.ru_maxrss / 1024;  // macOS returns bytes
                #else
                    ram_kb = usage.ru_maxrss;         // Linux returns KB
                #endif
            #endif

            // Include memory usage in response
            response["ram_kb"] = ram_kb;

            // Console formatting and operation tracking
            print_op_separator(); // Separator after encryption
            encryption_count++;   // Increment operation counter

            // Prepare response with encrypted data and performance metrics
            response["ciphertext"] = ciphertext;
            response["execution_us"] = duration_us;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    /**
     * Decryption Endpoint
     * POST /decrypt
     * 
     * Decrypts a ciphertext back to its original numeric value
     * Includes performance timing and memory usage monitoring
     * 
     * Request body (JSON):
     * {
     *   "ciphertext": "base64_encoded_ciphertext", 
     *   "scheme": "bfv" | "ckks"
     * }
     * 
     * Response (JSON):
     * {
     *   "value": 42.5,
     *   "execution_us": 1234,
     *   "ram_kb": 5678
     * }
     */
    CROW_ROUTE(app, "/decrypt")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;

        // Validate required fields
        if (!json_data || !json_data.has("ciphertext") || !json_data.has("scheme")) {
            response["error"] = "Missing required fields";
            return crow::response(400, response);
        }

        try {
            std::string scheme = json_data["scheme"].s();
            std::string ciphertext = json_data["ciphertext"].s();
            double value;

            // Start performance timing
            auto start = std::chrono::high_resolution_clock::now();

            // Perform decryption based on the specified scheme
            if (scheme == "bfv") {
                value = he_bfv.decrypt(ciphertext);
            } else if (scheme == "ckks") {
                value = he_ckks.decrypt(ciphertext);
            } else {
                throw std::runtime_error("Invalid scheme");
            }

            // Calculate execution time
            auto end = std::chrono::high_resolution_clock::now();
            auto duration_us = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
            
            // Log operation details for monitoring
            std::cout << "Decrypting | Scheme: " << scheme 
                      << " | Ciphertext (first 20): " << log_cipher(ciphertext) << std::endl;

            std::cout << "Decryption was done in " << duration_us << " microseconds\n";
            std::cout << "Throughput: " << (1000000.0 / duration_us) << " operations per second\n";

            // Measure current memory usage
            size_t ram_kb = 0;

            // Platform-specific memory measurement
            #if defined(_WIN32)
                // Windows memory measurement
                PROCESS_MEMORY_COUNTERS memInfo;
                GetProcessMemoryInfo(GetCurrentProcess(), &memInfo, sizeof(memInfo));
                ram_kb = memInfo.WorkingSetSize / 1024;
            #else
                // Unix/Linux memory measurement
                struct rusage usage;
                getrusage(RUSAGE_SELF, &usage);
                #ifdef __APPLE__
                    ram_kb = usage.ru_maxrss / 1024;  // macOS returns bytes
                #else
                    ram_kb = usage.ru_maxrss;         // Linux returns KB
                #endif
            #endif

            // Include memory usage in response
            response["ram_kb"] = ram_kb;

            // Console formatting and session management
            print_op_separator(); // Separator after decryption
            print_session_end();  // End of session after 2 encryptions + 1 decryption

            // Prepare response with decrypted value and performance metrics
            response["value"] = value;
            response["execution_us"] = duration_us;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    // ========================================
    // KEY DISTRIBUTION ENDPOINT
    // ========================================

    /**
     * Public Key Endpoint
     * GET /public_key?scheme=bfv|ckks
     * 
     * Returns the public key for the specified encryption scheme
     * Allows clients to encrypt data without access to private keys
     * 
     * Query parameters:
     * - scheme: "bfv" or "ckks"
     * 
     * Response (JSON):
     * {
     *   "public_key": "base64_encoded_public_key"
     * }
     */
    CROW_ROUTE(app, "/public_key")
    .methods("GET"_method)
    ([&](const crow::request& req) {
        crow::json::wvalue response;
        try {
            std::string scheme = req.url_params.get("scheme");
            if (scheme == "bfv") {
                response["public_key"] = he_bfv.serialize_public_key();
            } else if (scheme == "ckks") {
                response["public_key"] = he_ckks.serialize_public_key();
            } else {
                throw std::runtime_error("Invalid scheme");
            }
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    // ========================================
    // CORS PREFLIGHT ENDPOINT
    // ========================================

    /**
     * CORS Preflight Handler
     * OPTIONS /
     * 
     * Handles CORS preflight requests for cross-origin API access
     * Required for web frontend applications
     */
    CROW_ROUTE(app, "/")
    .methods("OPTIONS"_method)
    ([](const crow::request& req, crow::response& res) {
        res.code = 200;
        res.end();
    });

    // ========================================
    // SERVER STARTUP
    // ========================================
    // Start the HTTP server on port 18081 with multithreading support
    // Port 18081 is used to avoid conflicts with the main backend (18080)
    std::cout << "Starting mini-backend on port 18081...\n";
    std::cout << "###########################\n"; 

    app.port(18081).multithreaded().run();  // Blocks here until server is stopped
}
