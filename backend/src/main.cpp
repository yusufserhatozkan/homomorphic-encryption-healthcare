#include "crow.h"
#include <iostream>
#include "CORSMiddleware.h"
#include "interfaceCSV.cpp"
#include "HomomorphicEncryption.h"

int main() {
    HomomorphicEncryption he_bfv(false);   // BFV
    HomomorphicEncryption he_ckks(true);   // CKKS

    crow::App<CORSMiddleware> app;

    app.loglevel(crow::LogLevel::Warning);

    CROW_ROUTE(app, "/")
    .methods("GET"_method)
    ([](const crow::request& req) {
        return "Welcome to the homomorphic backend!";
    });

    CROW_ROUTE(app, "/json")
    .methods("GET"_method)
    ([]() {
        crow::json::wvalue response;
        response["status"] = "ok";
        response["message"] = "Backend is running";
        return response;
    });

    CROW_ROUTE(app, "/add_encrypted")
    .methods("POST"_method)
    ([&](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::response res;

        if (!json_data || 
            !json_data.has("a") || 
            !json_data.has("b") || 
            !json_data.has("scheme")) {
            res.code = 400;
            res.body = "{\"error\": \"Missing required fields\"}";
            return res;
        }

        try {
            std::string scheme = json_data["scheme"].s();
            HomomorphicEncryption* he_ptr = nullptr;

            if (scheme == "bfv") {
                he_ptr = &he_bfv;
            } else if (scheme == "ckks") {
                he_ptr = &he_ckks;
            } else {
                throw std::runtime_error("Invalid scheme. Use 'bfv' or 'ckks'");
            }

            double a = json_data["a"].d();
            double b = json_data["b"].d();

            if (scheme == "bfv") {
                if (a > 131070 || b > 131070) {
                    throw std::runtime_error("Value too large for BFV (max 131070)");
                }
                if (std::floor(a) != a || std::floor(b) != b) {
                    throw std::runtime_error("BFV requires integer values");
                }
            }

            std::string encrypted_a = he_ptr->encrypt(a);
            std::string encrypted_b = he_ptr->encrypt(b);
            std::string encrypted_result = he_ptr->add(encrypted_a, encrypted_b);
            double final_result = he_ptr->decrypt(encrypted_result);

            crow::json::wvalue result;
            result["result"] = final_result;
            
            res.body = result.dump();
            res.code = 200;
        } catch (const std::exception& e) {
            res.code = 400;
            res.body = "{\"error\": \"" + std::string(e.what()) + "\"}";
        }

        res.set_header("Content-Type", "application/json");
        return res;
    });
    addCSVRoutes(app);

    std::cout << "Starting backend server on port 18080..." << std::endl;
    app.port(18080).multithreaded().run();

    return 0;
}