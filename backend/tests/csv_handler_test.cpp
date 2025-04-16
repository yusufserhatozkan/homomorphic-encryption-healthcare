// tests/csv_handler_test.cpp
#include <gtest/gtest.h>
#include <fstream>
#include "../src/interfaceCSV.cpp"  // Ideally use .h instead of .cpp

class CSVDataHandlerTest : public ::testing::Test {
protected:
    void SetUp() override {
        std::ofstream testFile("test_data.csv");
        testFile << "10,20,30,40,50\n";
        testFile << "15,25,35,45,55\n";
        testFile << "20,30,40,50,60\n";
        testFile << "25,35,45,55,65\n";
        testFile.close();
    }

    void TearDown() override {
        std::remove("test_data.csv");
    }
};

// Now define the tests outside the class
TEST_F(CSVDataHandlerTest, LoadsCSVFileSuccessfully) {
    CSVDataHandler handler("test_data.csv");
    std::vector<double> column = handler.getColumn(0);
    ASSERT_EQ(column.size(), 4);
}

TEST_F(CSVDataHandlerTest, HandlesFileNotFound) {
    CSVDataHandler handler("nonexistent_file.csv");
    std::vector<double> column = handler.getColumn(0);
    ASSERT_TRUE(column.empty());
}

TEST_F(CSVDataHandlerTest, ExtractsColumnCorrectly) {
    CSVDataHandler handler("test_data.csv");
    std::vector<double> column = handler.getColumn(2);
    ASSERT_EQ(column.size(), 4);
    EXPECT_EQ(column[0], 30);
    EXPECT_EQ(column[1], 35);
    EXPECT_EQ(column[2], 40);
    EXPECT_EQ(column[3], 45);
}

TEST_F(CSVDataHandlerTest, CalculatesSumCorrectly) {
    CSVDataHandler handler("test_data.csv");
    double sum = handler.calculateSum(0);
    EXPECT_EQ(sum, 70);
}

TEST_F(CSVDataHandlerTest, CalculatesAverageCorrectly) {
    CSVDataHandler handler("test_data.csv");
    double avg = handler.calculateAverage(0);
    EXPECT_DOUBLE_EQ(avg, 17.5);
}

TEST_F(CSVDataHandlerTest, EncryptsValueCorrectly) {
    CSVDataHandler handler("test_data.csv");
    int encrypted = handler.encryptValue(10);
    EXPECT_EQ(encrypted, 10 * 1337);
}

TEST_F(CSVDataHandlerTest, DecryptsValueCorrectly) {
    CSVDataHandler handler("test_data.csv");
    double decrypted = handler.decryptValue(13370);
    EXPECT_DOUBLE_EQ(decrypted, 10.0);
}

TEST_F(CSVDataHandlerTest, ExtractsEncryptedColumnCorrectly) {
    CSVDataHandler handler("test_data.csv");
    std::vector<int> encryptedColumn = handler.getEncryptedColumn(0);
    ASSERT_EQ(encryptedColumn.size(), 4);
    EXPECT_EQ(encryptedColumn[0], 10 * 1337);
    EXPECT_EQ(encryptedColumn[1], 15 * 1337);
}

TEST_F(CSVDataHandlerTest, CalculatesEncryptedSumCorrectly) {
    CSVDataHandler handler("test_data.csv");
    int encryptedSum = handler.calculateEncryptedSum(0);
    EXPECT_EQ(encryptedSum, 70 * 1337);
}
