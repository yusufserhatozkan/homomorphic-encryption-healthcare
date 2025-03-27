#include "crow.h"
#include <string>
#include <iostream>

// Simple example of an encryption function (e.g., Caesar cipher)
std::string encryptData(const std::string& plaintext) {
    std::string encrypted = plaintext;
    int shift = 3; // Shift for Caesar cipher (you can change this or implement actual encryption)
    for (char& c : encrypted) {
        if (isalpha(c)) {
            char offset = isupper(c) ? 'A' : 'a';
            c = (c - offset + shift) % 26 + offset;
        }
    }
    return encrypted;
}

int main() {
    crow::SimpleApp app;

    // Home route
    CROW_ROUTE(app, "/")([](){
        return "Welcome to the backend!";
    });

    // JSON route
    CROW_ROUTE(app, "/json")
    ([]{
        crow::json::wvalue x({{"message", "Hello, World!"}});
        x["message2"] = "Hello, World.. Again!";
        return x;
    });

    // Encrypt route
    CROW_ROUTE(app, "/encrypt").methods(crow::HTTPMethod::POST)([](const crow::request& req, crow::response& res){
        auto json_data = crow::json::load(req.body);
        if (!json_data) {
            res.code = 400; // Bad request
            res.body = "Invalid JSON";
            return;
        }

        std::string plaintext = json_data["data"].s(); // Extract data
        std::string encrypted = encryptData(plaintext); // Call encryption function
        res.body = encrypted;
        res.set_header("Content-Type", "text/plain");
        res.code = 200; // OK
    });

    app.port(18080).multithreaded().run();
}
