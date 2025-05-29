#include "crow.h"
#include <iostream>
#include "CORSMiddleware.h"
#include "interfaceCSV.cpp"
#include "HomomorphicEncryption.h"


int main() {
    bool use_ckks = false;   // true = CKKS, false = BFV
    
    HomomorphicEncryption HE(use_ckks); 
    crow::App<CORSMiddleware> app;

    addCSVRoutes(app);

    CROW_ROUTE(app, "/")([]() {
        crow::response res("Welcome to the homomorphic backend!");
        res.set_header("Content-Type", "text/plain");
        return res;
    });

    CROW_ROUTE(app, "/json").methods(crow::HTTPMethod::GET)
    ([](const crow::request& req) {
        crow::json::wvalue response;
        response["status"] = "ok";
        response["message"] = "Backend is running";

        crow::response res;
        res.set_header("Content-Type", "application/json");
        res.body = response.dump();
        return res;
    });

    CROW_ROUTE(app, "/add_encrypted").methods(crow::HTTPMethod::POST)
    ([&HE, use_ckks](const crow::request& req) {
        std::cout << "[LOG] /add_encrypted hit!\n";
        std::cout << "[LOG] Body: " << req.body << std::endl;
        std::cout << "[LOG] Using scheme: " << (use_ckks ? "CKKS" : "BFV") << "\n";

        crow::response res;

        try {
            auto json_data = crow::json::load(req.body);
            if (!json_data || !json_data.has("a") || !json_data.has("b")) {
                std::cout << "[ERROR] Missing 'a' or 'b' in JSON\n";
                res.code = 400;
                res.body = "{\"error\": \"Missing 'a' or 'b' field\"}";
                res.set_header("Content-Type", "application/json");
                return res;
            }

            double a, b;
            if (use_ckks) {
                a = json_data["a"].d();
                b = json_data["b"].d();
            } else {
                a = static_cast<double>(json_data["a"].i());
                b = static_cast<double>(json_data["b"].i());
                if (a > 131070 || b > 131070) {
                    throw std::runtime_error("Value too large for BFV scheme (max 131070)");
                }
            }

            std::cout << "[LOG] Received values: a = " << a << ", b = " << b << std::endl;

            std::string encrypted_a = HE.encrypt(a);
            std::string encrypted_b = HE.encrypt(b);
            std::string encrypted_result = HE.add(encrypted_a, encrypted_b);
            std::cout << "[LOG] Encrypted result: " << encrypted_result << std::endl;
            double final_result = HE.decrypt(encrypted_result);
            std::cout << "[LOG] Decrypted result: " << final_result << std::endl;

            crow::json::wvalue result;
            if (use_ckks) {
                result["result"] = final_result;
            } else {
                result["result"] = static_cast<int>(final_result);
            }
            
            res.body = result.dump();
            res.code = 200;
        } catch (const std::exception& e) {
            std::cout << "[ERROR] Exception: " << e.what() << std::endl;
            res.code = 500;
            res.body = "{\"error\": \"Server error: " + std::string(e.what()) + "\"}";
        }

        res.set_header("Content-Type", "application/json");
        return res;
    });

    std::cout << "Starting backend server on port 18080..." << std::endl;
    std::cout << "Using encryption scheme: " << (use_ckks ? "CKKS" : "BFV") << std::endl;
    app.port(18080).multithreaded().run();

    return 0;
}