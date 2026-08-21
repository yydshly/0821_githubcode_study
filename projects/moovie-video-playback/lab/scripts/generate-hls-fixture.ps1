param(
  [string]$Ffmpeg = 'ffmpeg'
)

$ErrorActionPreference = 'Stop'
$outputDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\media\hls'))
[System.IO.Directory]::CreateDirectory($outputDir) | Out-Null

$playlist = Join-Path $outputDir 'index.m3u8'
$segmentPattern = Join-Path $outputDir 'segment%03d.ts'
$arguments = @(
  '-y',
  '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30:duration=12',
  '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=12',
  '-c:v', 'libx264', '-preset', 'veryfast', '-profile:v', 'main', '-level', '3.1',
  '-pix_fmt', 'yuv420p', '-g', '60', '-keyint_min', '60', '-sc_threshold', '0',
  '-c:a', 'aac', '-b:a', '96k', '-ar', '48000',
  '-hls_time', '2', '-hls_playlist_type', 'vod',
  '-hls_segment_filename', $segmentPattern,
  $playlist
)

& $Ffmpeg @arguments
if ($LASTEXITCODE -ne 0) { throw "ffmpeg exited with code $LASTEXITCODE" }

Write-Output "Generated local synthetic HLS fixture: $playlist"
Get-ChildItem -LiteralPath $outputDir | Select-Object Name, Length
