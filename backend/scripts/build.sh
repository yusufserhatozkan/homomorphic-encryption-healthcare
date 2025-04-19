#!/bin/bash

# Change to the directory containing this script, then go up to backend/
cd "$(dirname "$0")/.."

# Create the build directory if it doesn't exist
mkdir -p build

# Enter the build directory
cd build

# Run CMake to configure the project
cmake ..

# Build the project using the default build tool (usually make)
make
