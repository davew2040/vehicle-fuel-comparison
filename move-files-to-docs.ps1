# Define source and destination directories
$source = "docs/browser"
$destination = "docs"

# Ensure destination directory exists
if (-not (Test-Path -Path $destination)) {
    Write-Error "ERROR: Path $source does not exist."
}

# Copy all files (recursively) without modifying source
Copy-Item -Path "$source\*" -Destination $destination -Recurse -Force