#include "crow.h"
#include "HomomorphicEncryption.h"
#include "CORSMiddleware.h"

int main() {
    // Initialize HE without key generation
    HomomorphicEncryption he_bfv(false, false);  // BFV without key generation
    HomomorphicEncryption he_ckks(true, false);  // CKKS without key generation
    
    crow::App<CORSMiddleware> app;
    app.loglevel(crow::LogLevel::Warning);

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

            auto log_cipher = [](const std::string& ct) -> std::string {
                if (ct.empty()) return "[EMPTY]";
                return ct.substr(0, std::min(20, (int)ct.length()));
            };
            
            std::cout << "Homomorphic addition | Scheme: " << scheme
                      << " | A (first 20): " << log_cipher(encrypted_a)
                      << " | B (first 20): " << log_cipher(encrypted_b) << std::endl;
            
            std::string encrypted_result;
            if (scheme == "bfv") {
                encrypted_result = he_bfv.add(encrypted_a, encrypted_b);
            } else if (scheme == "ckks") {
                encrypted_result = he_ckks.add(encrypted_a, encrypted_b);
            } else {
                throw std::runtime_error("Invalid scheme");
            }
            
            std::cout << "Homomorphic addition result | Scheme: " << scheme
                      << " | Result (first 20): " << log_cipher(encrypted_result) << std::endl;
            
            response["ciphertext"] = encrypted_result;
            return crow::response(200, response);
        } catch (const std::exception& e) {
            std::cout << "Homomorphic addition failed: " << e.what() << std::endl;
            response["error"] = e.what();
            return crow::response(500, response);
        }
    });

    CROW_ROUTE(app, "/json")
    .methods("GET"_method)
    ([]() {
        crow::json::wvalue response;
        response["status"] = "ok";
        response["message"] = "Main backend is running";
        return response;
    });

    CROW_ROUTE(app, "/")
    .methods("OPTIONS"_method)
    ([](const crow::request& req, crow::response& res) {
        res.code = 200;
        res.end();
    });

    std::cout << "Starting main backend on port 18080...\n";
    app.port(18080).multithreaded().run();
}