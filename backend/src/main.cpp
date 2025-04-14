#include "crow.h"
#include <iostream>
#include "CORSMiddleware.h"
#include "interfaceCSV.cpp"

// Sekretny klucz używany do symulowanego homomorficznego szyfrowania
const int SECRET_KEY = 1337;

// Prosty middleware do obsługi CORS

// Homomorphic addition helper
int homomorphic_add(int encrypted_a, int encrypted_b) {
    return encrypted_a + encrypted_b;
}

int main() {
    crow::App<CORSMiddleware> app;

    addCSVRoutes(app);

    // Root route
    CROW_ROUTE(app, "/")([]() {
        crow::response res("Welcome to the homomorphic backend!");
        res.set_header("Content-Type", "text/plain");
        return res;
    });

    // JSON test route
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

    // Homomorphic addition route
    CROW_ROUTE(app, "/add_encrypted").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        std::cout << "[LOG] /add_encrypted hit!\n";
        std::cout << "[LOG] Body: " << req.body << std::endl;

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

            int encrypted_a = json_data["a"].i();
            int encrypted_b = json_data["b"].i();

            int encrypted_sum = homomorphic_add(encrypted_a, encrypted_b);
            std::cout << "[LOG] Encrypted sum: " << encrypted_sum << std::endl;

            crow::json::wvalue result;
            result["result"] = encrypted_sum;
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
    app.port(18080).multithreaded().run();

    return 0;
}
