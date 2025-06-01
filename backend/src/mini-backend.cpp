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

int main() {
    HomomorphicEncryption he_bfv(false, true);   // BFV with key generation
    HomomorphicEncryption he_ckks(true, true);   // CKKS with key generation

    // Use our CORS middleware
    crow::App<CORSMiddleware> app;
    app.loglevel(crow::LogLevel::Warning);

    // Encryption endpoint
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

            // RAM usage
#if defined(_WIN32)
            PROCESS_MEMORY_COUNTERS memInfo;
            GetProcessMemoryInfo(GetCurrentProcess(), &memInfo, sizeof(memInfo));
            std::cout << "RAM usage: " << (memInfo.WorkingSetSize / 1024) << " KB\n";
#else
            struct rusage usage;
            getrusage(RUSAGE_SELF, &usage);
            std::cout << "RAM usage: " << usage.ru_maxrss << " KB\n";
#endif

            response["ciphertext"] = ciphertext;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    // Decryption endpoint
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

            // RAM usage
#if defined(_WIN32)
            PROCESS_MEMORY_COUNTERS memInfo;
            GetProcessMemoryInfo(GetCurrentProcess(), &memInfo, sizeof(memInfo));
            std::cout << "RAM usage: " << (memInfo.WorkingSetSize / 1024) << " KB\n";
#else
            struct rusage usage;
            getrusage(RUSAGE_SELF, &usage);
            std::cout << "RAM usage: " << usage.ru_maxrss << " KB\n";
#endif

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

    // Handle OPTIONS for root route
    CROW_ROUTE(app, "/")
    .methods("OPTIONS"_method)
    ([](const crow::request& req, crow::response& res) {
        res.code = 200;
        res.end();
    });

    std::cout << "Starting mini-backend on port 18081...\n";
    app.port(18081).multithreaded().run();
}
