cmake_minimum_required(VERSION 3.10)
project(CrowBackend)

set(CMAKE_CXX_STANDARD 17)  # Change from 11 to 17

# Add Crow and Asio's include directories
include_directories(${CMAKE_SOURCE_DIR}/libraries/crow/include)
include_directories(/opt/homebrew/include)  # For Asio on macOS

# Add executable
add_executable(backend src/main.cpp)

# Link Asio (needed for networking)
target_link_libraries(backend pthread)
