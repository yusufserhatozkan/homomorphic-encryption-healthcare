cmake_minimum_required(VERSION 3.10)
project(CrowBackend)

set(CMAKE_CXX_STANDARD 17)

# Ścieżki do Crow i Asio
include_directories(${CMAKE_SOURCE_DIR}/libraries/crow/include)
include_directories(${CMAKE_SOURCE_DIR}/libraries/asio/include)

# Plik wykonywalny
add_executable(backend backend/src/main.cpp)

# Platform-specific: linkujemy co trzeba
if(WIN32)
    target_link_libraries(backend Ws2_32 Mswsock)
elseif(UNIX AND NOT APPLE)
    target_link_libraries(backend pthread)
endif()

