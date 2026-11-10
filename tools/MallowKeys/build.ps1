param(
    [string]$Python = "python"
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = [System.IO.Path]::GetFullPath((Join-Path $here "..\.."))
$sounds = Join-Path $here "sounds"
$icon = Join-Path $here "app.ico"
$exe = Join-Path $here "MallowKeys.exe"
$downloadDir = Join-Path $repo "public\downloads"
$zip = Join-Path $downloadDir "MallowKeys-1.0.1.zip"

$cscCandidates = @(
    (Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\csc.exe"),
    (Join-Path $env:WINDIR "Microsoft.NET\Framework\v4.0.30319\csc.exe")
)
$csc = $cscCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $csc) { throw "Could not find the .NET Framework C# compiler." }

if (-not (Test-Path (Join-Path $sounds "red-1.wav"))) {
    & $Python (Join-Path $here "generate_sounds.py") $sounds
    if ($LASTEXITCODE -ne 0) { throw "Sound generation failed." }
}

if (-not (Test-Path $icon)) {
    Push-Location $here
    try {
        & $Python "make_icon.py"
        if ($LASTEXITCODE -ne 0) { throw "Icon generation failed." }
    } finally {
        Pop-Location
    }
}

Push-Location $here
try {
    & $csc /nologo /target:winexe /platform:anycpu /optimize+ "/out:$exe" "/win32icon:$icon" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll Program.cs
    if ($LASTEXITCODE -ne 0) { throw "C# compilation failed." }
} finally {
    Pop-Location
}

$stageRoot = Join-Path $env:TEMP "MallowKeys-package"
$stage = Join-Path $stageRoot "MallowKeys"
if (Test-Path $stageRoot) { Remove-Item -LiteralPath $stageRoot -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null
New-Item -ItemType Directory -Force -Path $downloadDir | Out-Null

Copy-Item -LiteralPath $exe -Destination $stage
Copy-Item -LiteralPath (Join-Path $here "README.txt") -Destination $stage
Copy-Item -LiteralPath $sounds -Destination (Join-Path $stage "sounds") -Recurse
Copy-Item -LiteralPath (Join-Path $here "Program.cs") -Destination (Join-Path $stage "SOURCE-Program.cs.txt")

if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -Path $stage -DestinationPath $zip -CompressionLevel Optimal

Write-Host "Built $exe"
Write-Host "Packaged $zip"
