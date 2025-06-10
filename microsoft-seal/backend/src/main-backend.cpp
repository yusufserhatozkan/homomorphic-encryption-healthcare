#include "crow.h"
#include "HomomorphicEncryption.h"
#include "CORSMiddleware.h"
#include <chrono>  // for timing

#if defined(_WIN32)
    #include <windows.h>
    #include <psapi.h>
#else
    #include <sys/resource.h>
#endif

void print_session_start() {
    std::cout << "---------------------------\n";
}

void print_session_end() {
    std::cout << "---------------------------\n";
}
static std::string log_cipher(const std::string& ct) {
    if (ct.empty()) return "[EMPTY]";
    return ct.substr(0, std::min(20, (int)ct.length()));
}

int main() {
    HomomorphicEncryption he_bfv(false, false);  // BFV without key generation
    HomomorphicEncryption he_ckks(true, false);  // CKKS without key generation

    // Use our CORS middleware
    crow::App<CORSMiddleware> app;
    app.loglevel(crow::LogLevel::Warning);

    // Homomorphic Operations
    CROW_ROUTE(app, "/add_encrypted")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;

        if (!json_data || 
            !json_data.has("a") || 
            !json_data.has("b") || 
            !json_data.has("scheme")) {
            response["error"] = "Missing required fields";
            std::cout << "Homomorphic addition failed: Missing required fields" << std::endl;
            return crow::response(400, response);
        }

        try {
            std::string scheme = json_data["scheme"].s();
            std::string encrypted_a = json_data["a"].s();
            std::string encrypted_b = json_data["b"].s();

            std::string encrypted_result;

            print_session_start();  // Start of a session

            auto start = std::chrono::high_resolution_clock::now();

            // Perform homomorphic addition
            if (scheme == "bfv") {
                encrypted_result = he_bfv.add(encrypted_a, encrypted_b);
            } else if (scheme == "ckks") {
                encrypted_result = he_ckks.add(encrypted_a, encrypted_b);
            } else {
                throw std::runtime_error("Invalid scheme");
            }

            auto end = std::chrono::high_resolution_clock::now();
            auto duration_us = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
            std::cout << "Homomorphic addition | Scheme: " << scheme
                      << " | A (first 20): " << log_cipher(encrypted_a)
                      << " | B (first 20): " << log_cipher(encrypted_b) << std::endl;
            std::cout << "Homomorphic addition result | Scheme: " << scheme
                      << " | Result (first 20): " << log_cipher(encrypted_result) << std::endl;

            std::cout << "Homomorphic addition was done in " << duration_us << " microseconds\n";
            std::cout << "Throughput: " << (1000000.0 / duration_us) << " operations per second\n";

            size_t ram_kb = 0;

            #if defined(_WIN32)
                PROCESS_MEMORY_COUNTERS memInfo;
                GetProcessMemoryInfo(GetCurrentProcess(), &memInfo, sizeof(memInfo));
                ram_kb = memInfo.WorkingSetSize / 1024;
            #else
                struct rusage usage;
                getrusage(RUSAGE_SELF, &usage);
                #ifdef __APPLE__
                    ram_kb = usage.ru_maxrss / 1024;
                #else
                    ram_kb = usage.ru_maxrss;
                #endif
            #endif

            response["ram_kb"] = ram_kb;



            print_session_end();  // End of a session
            response["ciphertext"] = encrypted_result;
            response["execution_us"] = duration_us;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    // CSV Operations
    CROW_ROUTE(app, "/csv/sum")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;
        
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
            std::cout << "Homomorphic CSV sum | Scheme: " << scheme
                    << " | Values count: " << encrypted_values.size() << std::endl;
            
            for (size_t i = 0; i < encrypted_values.size(); ++i) {
                std::string cipher = encrypted_values[i].s();
                ciphertexts.push_back(cipher);
                std::cout << "  Value " << (i+1) << ": " 
                        << log_cipher(cipher) << std::endl;
            }
            
            std::string encrypted_sum;
            if (scheme == "bfv") {
                encrypted_sum = he_bfv.sum(ciphertexts);
            } else if (scheme == "ckks") {
                encrypted_sum = he_ckks.sum(ciphertexts);
            } else {
                throw std::runtime_error("Invalid scheme");
            }
            
            std::cout << "Homomorphic CSV sum result | Scheme: " << scheme
                    << " | Result: " << log_cipher(encrypted_sum) << std::endl;
            
            response["encrypted_result"] = encrypted_sum;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    CROW_ROUTE(app, "/csv/average")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;
        
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
            int count = json_data["count"].i();
            
            std::vector<std::string> ciphertexts;
            for (const auto& val : encrypted_values) {
                ciphertexts.push_back(val.s());
            }
            
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

    // Status endpoint
    CROW_ROUTE(app, "/json")
    .methods("GET"_method)
    ([]() {
        crow::json::wvalue response;
        response["status"] = "ok";
        response["message"] = "Main backend is running";
        return response;
    });

    std::cout << "Starting main backend on port 18080...\n";
    std::cout << "###########################\n";
    app.port(18080).multithreaded().run();
}
