//
// Created by Luca Nichifor on 4/14/25.
//
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <numeric>
#include <cmath>
#include "crow.h"
#include "CORSMiddleware.h"

// Class to handle CSV data operations, with both plain and encrypted versions
class CSVDataHandler {
private:
    std::vector<std::vector<double>> data;
    std::string filename;
    const int SECRET_KEY = 1337;  // Same key as in main.cpp

public:
    CSVDataHandler(const std::string& file) : filename(file) {
        loadCSVData();
    }

    // Load data from CSV file
    bool loadCSVData() {
        std::ifstream file(filename);
        if (!file.is_open()) {
            std::cerr << "Error: Could not open file " << filename << std::endl;
            return false;
        }

        std::string line;
        while (std::getline(file, line)) {
            std::vector<double> row;
            std::stringstream ss(line);
            std::string cell;

            while (std::getline(ss, cell, ',')) {
                try {
                    double value = std::stod(cell);
                    row.push_back(value);
                } catch (const std::exception& e) {
                    // Skip non-numeric values
                }
            }

            if (!row.empty()) {
                data.push_back(row);
            }
        }

        std::cout << "Loaded " << data.size() << " rows of data from " << filename << std::endl;
        return true;
    }

    // Get column of data by index
    std::vector<double> getColumn(int columnIndex) const {
        std::vector<double> column;
        for (const auto& row : data) {
            if (columnIndex < row.size()) {
                column.push_back(row[columnIndex]);
            }
        }
        return column;
    }

    // Calculate sum of a column
    double calculateSum(int columnIndex) const {
        auto column = getColumn(columnIndex);
        return std::accumulate(column.begin(), column.end(), 0.0);
    }

    // Calculate average of a column
    double calculateAverage(int columnIndex) const {
        auto column = getColumn(columnIndex);
        if (column.empty()) return 0.0;
        return calculateSum(columnIndex) / column.size();
    }

    // "Encrypt" a value (simple simulation)
    int encryptValue(double value) const {
        return static_cast<int>(value * SECRET_KEY);
    }

    // "Decrypt" a value
    double decryptValue(int encryptedValue) const {
        return static_cast<double>(encryptedValue) / SECRET_KEY;
    }

    // Get encrypted column
    std::vector<int> getEncryptedColumn(int columnIndex) const {
        auto plainColumn = getColumn(columnIndex);
        std::vector<int> encryptedColumn;

        for (const auto& value : plainColumn) {
            encryptedColumn.push_back(encryptValue(value));
        }

        return encryptedColumn;
    }

    // Calculate encrypted sum (homomorphic property)
    int calculateEncryptedSum(int columnIndex) const {
        auto encryptedColumn = getEncryptedColumn(columnIndex);
        return std::accumulate(encryptedColumn.begin(), encryptedColumn.end(), 0);
    }
};

// Add these CSV-related routes to your Crow application
void addCSVRoutes(crow::App<CORSMiddleware>& app) {
    // Route to get sum of a column
    CROW_ROUTE(app, "/csv/sum")
    .methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::response res;

        try {
            if (!json_data || !json_data.has("file") || !json_data.has("column")) {
                res.code = 400;
                res.body = "{\"error\": \"Missing 'file' or 'column' field\"}";
                return res;
            }

            std::string filename = json_data["file"].s();
            int column = json_data["column"].i();
            bool encrypted = json_data.has("encrypted") ? json_data["encrypted"].b() : false;

            CSVDataHandler handler(filename);

            crow::json::wvalue result;
            if (encrypted) {
                int encryptedSum = handler.calculateEncryptedSum(column);
                result["encrypted_sum"] = encryptedSum;
            } else {
                double sum = handler.calculateSum(column);
                result["sum"] = sum;
            }

            res.body = result.dump();
            res.code = 200;
        } catch (const std::exception& e) {
            res.code = 500;
            res.body = "{\"error\": \"" + std::string(e.what()) + "\"}";
        }

        res.set_header("Content-Type", "application/json");
        return res;
    });

    // Route to get average of a column
    CROW_ROUTE(app, "/csv/average")
    .methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto json_data = crow::json::load(req.body);
        crow::response res;

        try {
            if (!json_data || !json_data.has("file") || !json_data.has("column")) {
                res.code = 400;
                res.body = "{\"error\": \"Missing 'file' or 'column' field\"}";
                return res;
            }

            std::string filename = json_data["file"].s();
            int column = json_data["column"].i();

            CSVDataHandler handler(filename);
            double average = handler.calculateAverage(column);

            crow::json::wvalue result;
            result["average"] = average;

            res.body = result.dump();
            res.code = 200;
        } catch (const std::exception& e) {
            res.code = 500;
            res.body = "{\"error\": \"" + std::string(e.what()) + "\"}";
        }

        res.set_header("Content-Type", "application/json");
        return res;
    });
}