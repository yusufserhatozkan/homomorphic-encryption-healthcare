@echo off
REM Change to the directory containing this script, then go up to backend\
cd /d %~dp0\..

REM Create the build directory if it doesn't exist
if not exist build mkdir build

REM Enter the build directory
cd build

REM Run CMake to configure the project
cmake ..

REM Build the project using the default build tool (e.g., MSBuild or NMake)
cmake --build .
