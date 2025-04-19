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

/**
 * @class CSVDataHandler
 * @brief Handles operations on CSV data, including loading, column extraction,
 *        basic calculations (sum, average), and encryption/decryption.
 */
class CSVDataHandler {
    std::vector<std::vector<double>> data; ///< Stores the CSV data as a 2D vector.
    std::string filename; ///< Name of the CSV file being processed.
    const int SECRET_KEY = 1337; ///< Secret key used for encryption and decryption.

public:
    /**
     * @brief Constructor to initialize the handler with a CSV file.
     * @param file The name of the CSV file to load.
     */
    CSVDataHandler(const std::string& file) : filename(file) {
        loadCSVData();
    }

    /**
     * @brief Loads data from the specified CSV file.
     * @return True if the file is successfully loaded, false otherwise.
     */
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

    /**
     * @brief Extracts a specific column from the CSV data.
     * @param columnIndex The index of the column to extract.
     * @return A vector containing the values of the specified column.
     */
    std::vector<double> getColumn(int columnIndex) const {
        std::vector<double> column;
        for (const auto& row : data) {
            if (columnIndex < row.size()) {
                column.push_back(row[columnIndex]);
            }
        }
        return column;
    }

    /**
     * @brief Calculates the sum of a specific column.
     * @param columnIndex The index of the column to sum.
     * @return The sum of the column values.
     */
    double calculateSum(int columnIndex) const {
        auto column = getColumn(columnIndex);
        return std::accumulate(column.begin(), column.end(), 0.0);
    }

    /**
     * @brief Calculates the average of a specific column.
     * @param columnIndex The index of the column to average.
     * @return The average of the column values.
     */
    double calculateAverage(int columnIndex) const {
        auto column = getColumn(columnIndex);
        if (column.empty()) return 0.0;
        return calculateSum(columnIndex) / column.size();
    }

    /**
     * @brief Encrypts a single value using a simple multiplication-based encryption.
     * @param value The value to encrypt.
     * @return The encrypted value.
     */
    int encryptValue(double value) const {
        return static_cast<int>(value * SECRET_KEY);
    }

    /**
     * @brief Decrypts a single value using the inverse of the encryption process.
     * @param encryptedValue The encrypted value to decrypt.
     * @return The decrypted value.
     */
    double decryptValue(int encryptedValue) const {
        return static_cast<double>(encryptedValue) / SECRET_KEY;
    }

    /**
     * @brief Extracts and encrypts a specific column from the CSV data.
     * @param columnIndex The index of the column to encrypt.
     * @return A vector containing the encrypted values of the specified column.
     */
    std::vector<int> getEncryptedColumn(int columnIndex) const {
        auto plainColumn = getColumn(columnIndex);
        std::vector<int> encryptedColumn;

        for (const auto& value : plainColumn) {
            encryptedColumn.push_back(encryptValue(value));
        }

        return encryptedColumn;
    }

    /**
     * @brief Calculates the sum of an encrypted column using homomorphic properties.
     * @param columnIndex The index of the column to sum.
     * @return The encrypted sum of the column values.
     */
    int calculateEncryptedSum(int columnIndex) const {
        auto encryptedColumn = getEncryptedColumn(columnIndex);
        return std::accumulate(encryptedColumn.begin(), encryptedColumn.end(), 0);
    }
};

/**
 * @brief Adds routes for CSV operations to the Crow application.
 * @param app The Crow application instance.
 */
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