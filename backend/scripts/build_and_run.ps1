# build_and_run.ps1
# Script for building and running the backend, assuming it is located in backend/scripts/

# Set variables
$projectRoot = Resolve-Path "$PSScriptRoot\.."
$buildDir = "$projectRoot\build"
$buildType = "Release"

# Move to project root directory
Set-Location -Path $projectRoot

# Remove old build directory if it exists
if (Test-Path $buildDir) {
    Remove-Item -Recurse -Force $buildDir
}

# Create new build directory
New-Item -ItemType Directory -Path $buildDir | Out-Null
Set-Location $buildDir

# Run CMake to generate Visual Studio project files
cmake .. -G "Visual Studio 17 2022" -A x64

# Build the project in Release mode
cmake --build . --config $buildType

# If the build succeeded, run the backend executable
$exePath = Join-Path -Path $buildDir -ChildPath "$buildType\backend.exe"
if (Test-Path $exePath) {
    Write-Host "Running backend.exe..."
    & $exePath
} else {
    Write-Host "backend.exe not found, something went wrong during the build."
}
