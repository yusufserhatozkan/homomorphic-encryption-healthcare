#include "crow.h"
#include <string>
#include <iostream>

std::string encryptData(const std::string& plaintext) {
    std::string encrypted = plaintext;
    int shift = 3;
    for (char& c : encrypted) {
        if (isalpha(c)) {
            char offset = isupper(c) ? 'A' : 'a';
            c = (c - offset + shift) % 26 + offset;
        }
    }
    return encrypted;
}

std::string decryptData(const std::string& ciphertext) {
    std::string decrypted = ciphertext;
    int shift = 3;
    for (char& c : decrypted) {
        if (isalpha(c)) {
            char offset = isupper(c) ? 'A' : 'a';
            // Add 26 to handle negative modulo
            c = (c - offset - shift + 26) % 26 + offset;
        }
    }
    return decrypted;
}

class CORSMiddleware {
public:
    struct context {};

    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        // Set CORS headers for all requests
        res.set_header("Access-Control-Allow-Origin", "http://localhost:5173");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        
        // Handle OPTIONS method directly in middleware
        if (req.method == crow::HTTPMethod::OPTIONS) {
            res.code = 204;
            res.end();
        }
    }

    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        // Ensure CORS headers are on all responses
        res.set_header("Access-Control-Allow-Origin", "http://localhost:5173");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
    }
};

int main() {
    crow::App<CORSMiddleware> app;
    
    // Root route
    CROW_ROUTE(app, "/")([](){
        crow::response res("Welcome to the backend!");
        res.set_header("Content-Type", "text/plain");
        return res;
    });
    
    // JSON info route
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
    
    // Encrypt route
    CROW_ROUTE(app, "/encrypt").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        std::cout << "[LOG] /encrypt hit!\n";
        std::cout << "[LOG] Body: " << req.body << std::endl;
        
        crow::response res;
        
        try {
            auto json_data = crow::json::load(req.body);
            if (!json_data || !json_data.has("data")) {
                std::cout << "[ERROR] Invalid JSON or missing 'data' field\n";
                res.code = 400;
                res.body = "{\"error\": \"Invalid JSON or missing 'data' field\"}";
                res.set_header("Content-Type", "application/json");
                return res;
            }
            
            std::string plaintext = json_data["data"].s();
            std::string encrypted = encryptData(plaintext);
            
            std::cout << "[LOG] Encrypted: " << encrypted << std::endl;
            
            crow::json::wvalue result;
            result["encrypted"] = encrypted;
            
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
    
    // Decrypt route
    CROW_ROUTE(app, "/decrypt").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        std::cout << "[LOG] /decrypt hit!\n";
        std::cout << "[LOG] Body: " << req.body << std::endl;
        
        crow::response res;
        
        try {
            auto json_data = crow::json::load(req.body);
            if (!json_data || !json_data.has("data")) {
                std::cout << "[ERROR] Invalid JSON or missing 'data' field\n";
                res.code = 400;
                res.body = "{\"error\": \"Invalid JSON or missing 'data' field\"}";
                res.set_header("Content-Type", "application/json");
                return res;
            }
            
            std::string ciphertext = json_data["data"].s();
            std::string decrypted = decryptData(ciphertext);
            
            std::cout << "[LOG] Decrypted: " << decrypted << std::endl;
            
            crow::json::wvalue result;
            result["decrypted"] = decrypted;
            
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
    
    // Print startup message and run the app
    std::cout << "Starting backend server on port 18080..." << std::endl;
    app.port(18080).multithreaded().run();
    
    return 0;
}