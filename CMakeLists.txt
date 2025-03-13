cmake_minimum_required(VERSION 3.10)
project(CppServer)

set(CMAKE_CXX_STANDARD 17)

# Include Crow (Adjust path if needed)
include_directories(third_party/Crow/include)

# Create the executable
add_executable(server src/main.cpp)
