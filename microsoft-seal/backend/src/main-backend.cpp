/**
 * Main Backend Server for Homomorphic Encryption Operations
 * 
 * This file implements a REST API server using the Crow framework that provides
 * homomorphic encryption operations for both BFV and CKKS schemes. The server
 * supports basic arithmetic operations and CSV data processing operations.
 */

#include "crow.h"                    // Crow HTTP framework for REST API
#include "HomomorphicEncryption.h"   // Our custom homomorphic encryption wrapper
#include "CORSMiddleware.h"          // CORS middleware for cross-origin requests
#include <chrono>                    // For performance timing measurements

// Platform-specific includes for memory usage monitoring
#if defined(_WIN32)
    #include <windows.h>
    #include <psapi.h>
#else
    #include <sys/resource.h>
#endif

/**
 * Prints a session start delimiter for console logging
 * Used to visually separate different operations in the console output
 */
void print_session_start() {
    std::cout << "---------------------------\n";
}

/**
 * Prints a session end delimiter for console logging
 * Used to visually separate different operations in the console output
 */
void print_session_end() {
    std::cout << "---------------------------\n";
}

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
 * Main function - Entry point for the homomorphic encryption backend server
 * 
 * Sets up two HomomorphicEncryption instances (BFV and CKKS schemes) and
 * configures a Crow web server with multiple REST endpoints for performing
 * homomorphic operations on encrypted data.
 */
int main() {
    // Initialize homomorphic encryption instances for both schemes
    // BFV: Better for integer operations, exact arithmetic
    // CKKS: Better for floating-point operations, approximate arithmetic
    HomomorphicEncryption he_bfv(false, false);  // BFV without key generation
    HomomorphicEncryption he_ckks(true, false);  // CKKS without key generation

    // Initialize Crow web application with CORS middleware
    // CORS middleware allows cross-origin requests from frontend applications
    crow::App<CORSMiddleware> app;
    app.loglevel(crow::LogLevel::Warning);  // Set logging level to reduce noise

    // ========================================
    // REST API ENDPOINT: Homomorphic Addition
    // ========================================
    // POST /add_encrypted
    // Performs homomorphic addition of two encrypted values
    // Supports both BFV and CKKS encryption schemes
    // 
    // Request body (JSON):
    // {
    //   "a": "encrypted_value_1",
    //   "b": "encrypted_value_2", 
    //   "scheme": "bfv" | "ckks"
    // }
    //
    // Response (JSON):
    // {
    //   "ciphertext": "encrypted_result",
    //   "execution_us": 1234,
    //   "ram_kb": 5678
    // }
    CROW_ROUTE(app, "/add_encrypted")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;

        // Validate required fields in the request
        if (!json_data || 
            !json_data.has("a") || 
            !json_data.has("b") || 
            !json_data.has("scheme")) {
            response["error"] = "Missing required fields";
            std::cout << "Homomorphic addition failed: Missing required fields" << std::endl;
            return crow::response(400, response);
        }

        try {
            // Extract parameters from JSON request
            std::string scheme = json_data["scheme"].s();
            std::string encrypted_a = json_data["a"].s();
            std::string encrypted_b = json_data["b"].s();

            std::string encrypted_result;

            print_session_start();  // Start of a session

            // Start performance timing
            auto start = std::chrono::high_resolution_clock::now();

            // Perform homomorphic addition based on the specified scheme
            if (scheme == "bfv") {
                encrypted_result = he_bfv.add(encrypted_a, encrypted_b);
            } else if (scheme == "ckks") {
                encrypted_result = he_ckks.add(encrypted_a, encrypted_b);
            } else {
                throw std::runtime_error("Invalid scheme");
            }

            // Calculate execution time
            auto end = std::chrono::high_resolution_clock::now();
            auto duration_us = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
            
            // Log operation details for debugging and monitoring
            std::cout << "Homomorphic addition | Scheme: " << scheme
                      << " | A (first 20): " << log_cipher(encrypted_a)
                      << " | B (first 20): " << log_cipher(encrypted_b) << std::endl;
            std::cout << "Homomorphic addition result | Scheme: " << scheme
                      << " | Result (first 20): " << log_cipher(encrypted_result) << std::endl;

            std::cout << "Homomorphic addition was done in " << duration_us << " microseconds\n";
            std::cout << "Throughput: " << (1000000.0 / duration_us) << " operations per second\n";

            // Measure current memory usage
            size_t ram_kb = 0;

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

            // Prepare response with results and performance metrics
            response["ram_kb"] = ram_kb;


            print_session_end();  // End of a session

            // Return successful response with encrypted result and performance data
            response["ciphertext"] = encrypted_result;
            response["execution_us"] = duration_us;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            // Handle errors and return error response
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    // ========================================
    // REST API ENDPOINT: CSV Sum Operation
    // ========================================
    // POST /csv/sum
    // Performs homomorphic sum of multiple encrypted values
    // Useful for processing encrypted datasets
    //
    // Request body (JSON):
    // {
    //   "encrypted_values": ["cipher1", "cipher2", ...],
    //   "scheme": "bfv" | "ckks"
    // }
    //
    // Response (JSON):
    // {
    //   "encrypted_result": "sum_ciphertext"
    // }
    CROW_ROUTE(app, "/csv/sum")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;
        
        // Validate required fields
        if (!json_data || 
            !json_data.has("encrypted_values") || 
            !json_data.has("scheme")) {
            response["error"] = "Missing required fields";
            return crow::response(400, response);
        }

        try {
            std::string scheme = json_data["scheme"].s();
            auto encrypted_values = json_data["encrypted_values"];
            std::vector<std::string> ciphertexts;
            
            // Log operation details
            std::cout << "Homomorphic CSV sum | Scheme: " << scheme
                    << " | Values count: " << encrypted_values.size() << std::endl;
            
            // Extract encrypted values from JSON array and log each one
            for (size_t i = 0; i < encrypted_values.size(); ++i) {
                std::string cipher = encrypted_values[i].s();
                ciphertexts.push_back(cipher);
                std::cout << "  Value " << (i+1) << ": " 
                        << log_cipher(cipher) << std::endl;
            }
            
            // Perform homomorphic sum operation based on scheme
            std::string encrypted_sum;
            if (scheme == "bfv") {
                encrypted_sum = he_bfv.sum(ciphertexts);
            } else if (scheme == "ckks") {
                encrypted_sum = he_ckks.sum(ciphertexts);
            } else {
                throw std::runtime_error("Invalid scheme");
            }
            
            // Log result
            std::cout << "Homomorphic CSV sum result | Scheme: " << scheme
                    << " | Result: " << log_cipher(encrypted_sum) << std::endl;
            
            // Return encrypted sum result
            response["encrypted_result"] = encrypted_sum;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    // ========================================
    // REST API ENDPOINT: CSV Average Operation
    // ========================================
    // POST /csv/average
    // Computes homomorphic average of multiple encrypted values
    // Note: This currently only computes the sum - division would require
    // additional homomorphic operations or be done on the client side
    //
    // Request body (JSON):
    // {
    //   "encrypted_values": ["cipher1", "cipher2", ...],
    //   "scheme": "bfv" | "ckks",
    //   "count": number_of_values
    // }
    //
    // Response (JSON):
    // {
    //   "encrypted_result": "sum_ciphertext"  // Division by count needs to be done client-side
    // }
    CROW_ROUTE(app, "/csv/average")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;
        
        // Validate required fields
        if (!json_data || 
            !json_data.has("encrypted_values") || 
            !json_data.has("scheme") || 
            !json_data.has("count")) {
            response["error"] = "Missing required fields";
            return crow::response(400, response);
        }

        try {
            std::string scheme = json_data["scheme"].s();
            auto encrypted_values = json_data["encrypted_values"];
            int count = json_data["count"].i();  // Count parameter (currently unused in computation)
            
            // Convert JSON array to vector of ciphertext strings
            std::vector<std::string> ciphertexts;
            for (const auto& val : encrypted_values) {
                ciphertexts.push_back(val.s());
            }
            
            // Perform sum operation (average = sum / count, but division is done client-side)
            if (scheme == "bfv") {
                std::string sum = he_bfv.sum(ciphertexts);
                response["encrypted_result"] = sum;
            } else if (scheme == "ckks") {
                std::string sum = he_ckks.sum(ciphertexts);
                response["encrypted_result"] = sum;
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
    // REST API ENDPOINT: Health Check
    // ========================================
    // GET /json
    // Simple health check endpoint to verify server is running
    // Returns basic status information
    //
    // Response (JSON):
    // {
    //   "status": "ok",
    //   "message": "Main backend is running"
    // }
    CROW_ROUTE(app, "/json")
    .methods("GET"_method)
    ([]() {
        crow::json::wvalue response;
        response["status"] = "ok";
        response["message"] = "Main backend is running";
        return response;
    });

    // ========================================
    // SERVER STARTUP
    // ========================================
    // Start the HTTP server on port 18080 with multithreading support
    std::cout << "Starting main backend on port 18080...\n";
    std::cout << "###########################\n";
    app.port(18080).multithreaded().run();  // Blocks here until server is stopped
}
