# Define paths
$source = "docs\\browser"
$destination = "docs"

function CopyFilesToFolder ($fromFolder, $toFolder) {
  $childItems = Get-ChildItem $fromFolder
  $childItems | ForEach-Object {
       Copy-Item -Path $_.FullName -Destination $toFolder -Recurse -Force
  }
}

# Ensure source exists
if (Test-Path $source) {
    CopyFilesToFolder $source $destination

    Write-Host " Files moved and browser folder removed."
} else {
    Write-Host " 'docs\\browser' does not exist."
}