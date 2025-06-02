#include "crow.h"
#include "HomomorphicEncryption.h"
#include "CORSMiddleware.h"
#include <iostream>
#include <chrono>

#if defined(_WIN32)
    #include <windows.h>
    #include <psapi.h>
#else
    #include <sys/resource.h>
#endif

int encryption_count = 0; // Track how many encryptions we've done in this session

void print_session_start() {
    std::cout << "###########################\n";
}

void print_session_end() {
    std::cout << "###########################\n";
}

void print_op_separator() {
    std::cout << "---------------------------\n";
}

int main() {
    HomomorphicEncryption he_bfv(false, true);   // BFV with key generation
    HomomorphicEncryption he_ckks(true, true);   // CKKS with key generation

    // Use our CORS middleware
    crow::App<CORSMiddleware> app;
    app.loglevel(crow::LogLevel::Warning);

    CROW_ROUTE(app, "/encrypt")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;

        if (!json_data || !json_data.has("value") || !json_data.has("scheme")) {
            response["error"] = "Missing required fields";
            return crow::response(400, response);
        }

        try {
            std::string scheme = json_data["scheme"].s();
            double value = json_data["value"].d();
            std::string ciphertext;

            if (encryption_count % 2 == 0) {
                print_session_start();  // Start of session every 2 encryptions
            }

            auto start = std::chrono::high_resolution_clock::now();

            if (scheme == "bfv") {
                ciphertext = he_bfv.encrypt(value);
            } else if (scheme == "ckks") {
                ciphertext = he_ckks.encrypt(value);
            } else {
                throw std::runtime_error("Invalid scheme");
            }

            auto end = std::chrono::high_resolution_clock::now();
            auto duration_us = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
            std::cout << "Encryption was done in " << duration_us << " microseconds\n";
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

            print_op_separator(); // Separator after encryption
            encryption_count++;

            response["ciphertext"] = ciphertext;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    CROW_ROUTE(app, "/decrypt")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::json::wvalue response;

        if (!json_data || !json_data.has("ciphertext") || !json_data.has("scheme")) {
            response["error"] = "Missing required fields";
            return crow::response(400, response);
        }

        try {
            std::string scheme = json_data["scheme"].s();
            std::string ciphertext = json_data["ciphertext"].s();
            double value;

            auto start = std::chrono::high_resolution_clock::now();

            if (scheme == "bfv") {
                value = he_bfv.decrypt(ciphertext);
            } else if (scheme == "ckks") {
                value = he_ckks.decrypt(ciphertext);
            } else {
                throw std::runtime_error("Invalid scheme");
            }

            auto end = std::chrono::high_resolution_clock::now();
            auto duration_us = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();
            std::cout << "Decryption was done in " << duration_us << " microseconds\n";
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

            print_op_separator(); // Separator after decryption
            print_session_end();  // End of session after 2 encryptions + 1 decryption

            response["value"] = value;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    // Public key endpoint
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

    CROW_ROUTE(app, "/")
    .methods("OPTIONS"_method)
    ([](const crow::request& req, crow::response& res) {
        res.code = 200;
        res.end();
    });

    std::cout << "Starting mini-backend on port 18081...\n";
    std::cout << "###########################\n"; // Only once at backend start

    app.port(18081).multithreaded().run();
}
