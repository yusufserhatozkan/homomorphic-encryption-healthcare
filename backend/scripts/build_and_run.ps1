# build_and_run.ps1
# Updated script for building and running both backends

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

# Paths to executables
$miniBackendExe = Join-Path -Path $buildDir -ChildPath "$buildType\mini-backend.exe"
$mainBackendExe = Join-Path -Path $buildDir -ChildPath "$buildType\main-backend.exe"

# Check if executables exist
if (-not (Test-Path $miniBackendExe)) {
    Write-Host "mini-backend.exe not found, build failed."
    exit 1
}

if (-not (Test-Path $mainBackendExe)) {
    Write-Host "main-backend.exe not found, build failed."
    exit 1
}

# Start mini-backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& `"$miniBackendExe`""
Start-Sleep -Seconds 2

# Start main-backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& `"$mainBackendExe`""