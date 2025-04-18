/**
 * @file csv_handler_test.cpp
 * @brief Unit tests for the `CSVDataHandler` class, verifying its functionality for CSV file operations,
 *        calculations, and encryption/decryption.
 */

#include <gtest/gtest.h>
#include <fstream>
#include "../src/interfaceCSV.cpp"  // Ideally use .h instead of .cpp

/**
 * @class CSVDataHandlerTest
 * @brief Test fixture for `CSVDataHandler` tests. Sets up and tears down a temporary CSV file for testing.
 */
class CSVDataHandlerTest : public ::testing::Test {
protected:
    /**
     * @brief Creates a temporary CSV file with sample data for testing.
     */
    void SetUp() override {
        std::ofstream testFile("test_data.csv");
        testFile << "10,20,30,40,50\n";
        testFile << "15,25,35,45,55\n";
        testFile << "20,30,40,50,60\n";
        testFile << "25,35,45,55,65\n";
        testFile.close();
    }

    /**
     * @brief Removes the temporary CSV file after each test.
     */
    void TearDown() override {
        std::remove("test_data.csv");
    }
};

/**
 * @test LoadsCSVFileSuccessfully
 * @brief Verifies that the CSV file is loaded correctly and the number of rows matches expectations.
 */
TEST_F(CSVDataHandlerTest, LoadsCSVFileSuccessfully) {
    CSVDataHandler handler("test_data.csv");
    std::vector<double> column = handler.getColumn(0);
    ASSERT_EQ(column.size(), 4);
}

/**
 * @test HandlesFileNotFound
 * @brief Ensures that attempting to load a non-existent file does not crash and returns an empty column.
 */
TEST_F(CSVDataHandlerTest, HandlesFileNotFound) {
    CSVDataHandler handler("nonexistent_file.csv");
    std::vector<double> column = handler.getColumn(0);
    ASSERT_TRUE(column.empty());
}

/**
 * @test ExtractsColumnCorrectly
 * @brief Checks that a specific column is extracted correctly from the CSV file.
 */
TEST_F(CSVDataHandlerTest, ExtractsColumnCorrectly) {
    CSVDataHandler handler("test_data.csv");
    std::vector<double> column = handler.getColumn(2);
    ASSERT_EQ(column.size(), 4);
    EXPECT_EQ(column[0], 30);
    EXPECT_EQ(column[1], 35);
    EXPECT_EQ(column[2], 40);
    EXPECT_EQ(column[3], 45);
}

/**
 * @test CalculatesSumCorrectly
 * @brief Validates the sum calculation for a specific column.
 */
TEST_F(CSVDataHandlerTest, CalculatesSumCorrectly) {
    CSVDataHandler handler("test_data.csv");
    double sum = handler.calculateSum(0);
    EXPECT_EQ(sum, 70);
}

/**
 * @test CalculatesAverageCorrectly
 * @brief Ensures the average calculation is accurate for a specific column.
 */
TEST_F(CSVDataHandlerTest, CalculatesAverageCorrectly) {
    CSVDataHandler handler("test_data.csv");
    double avg = handler.calculateAverage(0);
    EXPECT_DOUBLE_EQ(avg, 17.5);
}

/**
 * @test EncryptsValueCorrectly
 * @brief Tests the encryption logic for a single value.
 */
TEST_F(CSVDataHandlerTest, EncryptsValueCorrectly) {
    CSVDataHandler handler("test_data.csv");
    int encrypted = handler.encryptValue(10);
    EXPECT_EQ(encrypted, 10 * 1337);
}

/**
 * @test DecryptsValueCorrectly
 * @brief Verifies the decryption logic for a single value.
 */
TEST_F(CSVDataHandlerTest, DecryptsValueCorrectly) {
    CSVDataHandler handler("test_data.csv");
    double decrypted = handler.decryptValue(13370);
    EXPECT_DOUBLE_EQ(decrypted, 10.0);
}

/**
 * @test ExtractsEncryptedColumnCorrectly
 * @brief Confirms that an entire column is encrypted correctly.
 */
TEST_F(CSVDataHandlerTest, ExtractsEncryptedColumnCorrectly) {
    CSVDataHandler handler("test_data.csv");
    std::vector<int> encryptedColumn = handler.getEncryptedColumn(0);
    ASSERT_EQ(encryptedColumn.size(), 4);
    EXPECT_EQ(encryptedColumn[0], 10 * 1337);
    EXPECT_EQ(encryptedColumn[1], 15 * 1337);
}

/**
 * @test CalculatesEncryptedSumCorrectly
 * @brief Validates the homomorphic sum calculation for an encrypted column.
 */
TEST_F(CSVDataHandlerTest, CalculatesEncryptedSumCorrectly) {
    CSVDataHandler handler("test_data.csv");
    int encryptedSum = handler.calculateEncryptedSum(0);
    EXPECT_EQ(encryptedSum, 70 * 1337);
}