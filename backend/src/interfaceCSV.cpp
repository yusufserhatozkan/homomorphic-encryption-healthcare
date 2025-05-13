#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <numeric>
#include <cmath>
#include "crow.h"
#include "CORSMiddleware.h"
#include "HomomorphicEncryption.h"

/**
 * @class CSVDataHandler
 * @brief Handles operations on CSV data with homomorphic encryption capabilities
 */
class CSVDataHandler {
    std::vector<std::vector<double>> data; ///< Stores the CSV data as a 2D vector.
    std::string filename; ///< Name of the CSV file being processed.
    HomomorphicEncryption he; ///< Homomorphic encryption instance using SEAL

public:
    /**
     * @brief Constructor to initialize the handler with a CSV file.
     * @param file The name of the CSV file to load.
     */
    CSVDataHandler(const std::string& file) : filename(file) {
        loadCSVData();
    }

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

    std::vector<double> getColumn(int columnIndex) const {
        std::vector<double> column;
        for (const auto& row : data) {
            if (columnIndex < row.size()) {
                column.push_back(row[columnIndex]);
            }
        }
        return column;
    }

    double calculateSum(int columnIndex) const {
        auto column = getColumn(columnIndex);
        return std::accumulate(column.begin(), column.end(), 0.0);
    }

    /**
     * @brief Calculates encrypted sum of a column using SEAL homomorphic encryption
     * @param columnIndex The index of the column to sum
     * @return The encrypted sum as an integer (after decryption)
     */
    int calculateEncryptedSum(int columnIndex) const {
        auto column = getColumn(columnIndex);
        if (column.empty()) return 0;

        std::cout << "Calculating encrypted sum for column " << columnIndex << std::endl;

        // Encrypt first value
        std::string encryptedSum = he.encrypt(static_cast<int>(column[0]));
        std::cout << "First value: " << column[0] << ", encrypted: " << encryptedSum.substr(0, 20) << "..." << std::endl;

        // Add remaining values homomorphically
        for (size_t i = 1; i < column.size(); i++) {
            std::string encryptedVal = he.encrypt(static_cast<int>(column[i]));
            std::cout << "Adding value: " << column[i] << ", encrypted: " << encryptedVal.substr(0, 20) << "..." << std::endl;
            encryptedSum = he.add(encryptedSum, encryptedVal);
        }

        // Decrypt the final result
        int decryptedSum = he.decryptCSV(encryptedSum);
        std::cout << "Final encrypted sum decrypted: " << decryptedSum << std::endl;

        return decryptedSum;
    }

    double calculateAverage(int columnIndex) const {
        auto column = getColumn(columnIndex);
        if (column.empty()) return 0.0;
        return calculateSum(columnIndex) / column.size();
    }

    double calculateEncryptedAverage(int columnIndex) const {
        auto column = getColumn(columnIndex);
        if (column.empty()) return 0.0;

        int encryptedSum = calculateEncryptedSum(columnIndex);
        return static_cast<double>(encryptedSum) / column.size();
    }
    
};

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

            std::cout << "Processing CSV sum request for file: " << filename
                      << ", column: " << column
                      << ", encrypted: " << (encrypted ? "yes" : "no") << std::endl;

            CSVDataHandler handler(filename);

            crow::json::wvalue result;
            if (encrypted) {
                int encryptedSum = handler.calculateEncryptedSum(column);
                result["encrypted_sum"] = encryptedSum;
                std::cout << "Returning encrypted sum: " << encryptedSum << std::endl;
            } else {
                double sum = handler.calculateSum(column);
                result["sum"] = sum;
                std::cout << "Returning regular sum: " << sum << std::endl;
            }

            res.body = result.dump();
            res.code = 200;
        } catch (const std::exception& e) {
            std::cerr << "Error processing CSV sum: " << e.what() << std::endl;
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

            std::cout << "Processing CSV average request for file: " << filename
                      << ", column: " << column << std::endl;

            bool encrypted = json_data.has("encrypted") ? json_data["encrypted"].b() : false;

            CSVDataHandler handler(filename);
            crow::json::wvalue result;  // Add this line to declare the result variable
            double average;
            if (encrypted) {
                average = handler.calculateEncryptedAverage(column);
                result["encrypted_average"] = average;
                std::cout << "Returning encrypted average: " << average << std::endl;
            } else {
                average = handler.calculateAverage(column);
                result["average"] = average;
                std::cout << "Returning regular average: " << average << std::endl;
            }

            res.body = result.dump();
            res.code = 200;
        } catch (const std::exception& e) {
            std::cerr << "Error processing CSV average: " << e.what() << std::endl;
            res.code = 500;
            res.body = "{\"error\": \"" + std::string(e.what()) + "\"}";
        }

        res.set_header("Content-Type", "application/json");
        return res;
    });
}