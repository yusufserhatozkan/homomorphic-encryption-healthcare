cmake_minimum_required(VERSION 3.10)
project(HomomorphicBackend)

set(CMAKE_CXX_STANDARD 17)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/libraries/crow/include)
include_directories(${CMAKE_SOURCE_DIR}/libraries/asio/include)
include_directories(${CMAKE_BINARY_DIR}/_deps/googletest-src/googletest/include)

# Add SEAL
add_subdirectory(libraries/SEAL)

add_definitions(-DCROW_JSON_NO_ERROR_HANDLER)

# Build mini-backend executable
add_executable(mini-backend
    src/mini-backend.cpp
    src/HomomorphicEncryption.cpp
)

# Build main-backend executable
add_executable(main-backend
    src/main-backend.cpp
    src/HomomorphicEncryption.cpp
)

# Link SEAL to both backends
target_link_libraries(mini-backend SEAL::seal)
target_link_libraries(main-backend SEAL::seal)

# Windows-specific linking
if(WIN32)
    target_link_libraries(mini-backend Ws2_32 Mswsock)
    target_link_libraries(main-backend Ws2_32 Mswsock)
elseif(UNIX AND NOT APPLE)
    target_link_libraries(mini-backend pthread)
    target_link_libraries(main-backend pthread)
endif()

# ----------- GTEST SECTION -------------
include(FetchContent)
FetchContent_Declare(
    googletest
    GIT_REPOSITORY https://github.com/google/googletest.git
    GIT_TAG release-1.11.0
)
FetchContent_MakeAvailable(googletest)

# Build tests
add_executable(csv_tests tests/csv_handler_test.cpp)
target_link_libraries(csv_tests gtest_main)

if(WIN32)
    target_link_libraries(csv_tests Ws2_32 Mswsock)
endif()

enable_testing()
add_test(NAME csv_tests COMMAND csv_tests)