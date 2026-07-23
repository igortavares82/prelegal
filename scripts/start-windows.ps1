$ErrorActionPreference = "Stop"

$ImageName = "prelegal"
$ContainerName = "prelegal"
$Port = 8000

Set-Location (Join-Path $PSScriptRoot "..")

docker rm -f $ContainerName 2>$null | Out-Null

docker build -t $ImageName .

$envArgs = @()
if (Test-Path ".env") {
    $envArgs = @("--env-file", ".env")
}

docker run -d --name $ContainerName -p "${Port}:8000" @envArgs $ImageName

Write-Host "Prelegal is running at http://localhost:$Port"
