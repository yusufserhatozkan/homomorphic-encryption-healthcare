cmake_minimum_required(VERSION 3.10)
project(CrowBackend)

set(CMAKE_CXX_STANDARD 17)

# Add include directories for Crow and GTest
include_directories(${CMAKE_SOURCE_DIR}/libraries/crow/include)
include_directories(${CMAKE_SOURCE_DIR}/libraries/asio/include)
include_directories(${CMAKE_BINARY_DIR}/_deps/googletest-src/googletest/include) # For GTest
add_executable(backend src/main.cpp)

if(WIN32)
    target_link_libraries(backend Ws2_32 Mswsock)
elseif(UNIX AND NOT APPLE)
    target_link_libraries(backend pthread)
endif()

# Testing Files
include(FetchContent)
FetchContent_Declare(
        googletest
        GIT_REPOSITORY https://github.com/google/googletest.git
        GIT_TAG release-1.11.0
)
FetchContent_MakeAvailable(googletest)

# Create test executable
add_executable(csv_tests tests/csv_handler_test.cpp)
target_link_libraries(csv_tests gtest_main)

# Enable testing
enable_testing()
add_test(NAME csv_tests COMMAND csv_tests)

