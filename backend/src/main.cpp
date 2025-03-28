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

int main() {
    crow::SimpleApp app;

    CROW_ROUTE(app, "/")([](){
        return "Welcome to the backend!";
    });

    CROW_ROUTE(app, "/encrypt").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req, crow::response& res){
        std::cout << "[LOG] /encrypt hit!\n";
        std::cout << "[LOG] Body: " << req.body << std::endl;

        auto json_data = crow::json::load(req.body);
        if (!json_data) {
            std::cout << "[ERROR] Invalid JSON\n";
            res.code = 400;
            res.body = "Invalid JSON";
            res.end();
            return;
        }

        std::string plaintext = json_data["data"].s();
        std::string encrypted = encryptData(plaintext);

        std::cout << "[LOG] Encrypted: " << encrypted << std::endl;

        res.set_header("Content-Type", "text/plain");
        res.body = encrypted;
        res.code = 200;
        res.end();
    });

    app.port(18080).multithreaded().run();
}
