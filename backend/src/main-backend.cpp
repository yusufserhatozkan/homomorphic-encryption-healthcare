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

int main() {
    // Initialize HE without key generation
    HomomorphicEncryption he_bfv(false, false);  // BFV without key generation
    HomomorphicEncryption he_ckks(true, false);  // CKKS without key generation

    // Use our CORS middleware
    crow::App<CORSMiddleware> app;
    app.loglevel(crow::LogLevel::Warning);

    // Endpoint for homomorphic addition
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
            std::cout << "Homomorphic addition was done in " << duration_us << " microseconds\n";
            std::cout << "Throughput: " << (1000000.0 / duration_us) << " operations per second\n";

#if defined(_WIN32)
            PROCESS_MEMORY_COUNTERS memInfo;
            GetProcessMemoryInfo(GetCurrentProcess(), &memInfo, sizeof(memInfo));
            std::cout << "RAM usage: " << (memInfo.WorkingSetSize / 1024) << " KB\n";
#else
            struct rusage usage;
            getrusage(RUSAGE_SELF, &usage);
            std::cout << "RAM usage: " << usage.ru_maxrss << " KB\n";
#endif

            print_session_end();  // End of a session

            response["ciphertext"] = encrypted_result;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    // Simple status endpoint
    CROW_ROUTE(app, "/json")
    .methods("GET"_method)
    ([]() {
        crow::json::wvalue response;
        response["status"] = "ok";
        response["message"] = "Main backend is running";
        return response;
    });

    // Handle OPTIONS for all routes using regex
    CROW_ROUTE(app, "/")
    .methods("OPTIONS"_method)
    ([](const crow::request& req, crow::response& res) {
        res.code = 200;
        res.end();
    });

    std::cout << "Starting main backend on port 18080...\n";
    std::cout << "###########################\n"; // One-time line at startup
    app.port(18080).multithreaded().run();
}
