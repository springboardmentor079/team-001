param([string]$PostgresBin = 'C:/Program Files/PostgreSQL/18/bin')
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$bundledNode = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
$nodeExe = if (Test-Path -LiteralPath $bundledNode) { $bundledNode } else { (Get-Command node).Source }
$env:PATH = (Split-Path $nodeExe) + ';' + $env:PATH
$localDir = Join-Path $projectRoot '.local'
$pgData = Join-Path $localDir 'postgres'
if (!(Test-Path -LiteralPath (Join-Path $projectRoot 'backend/.env'))) { throw 'Configure backend/.env first; see README.md.' }
if (!(Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules'))) { throw 'Run npm ci first.' }
if (Test-Path -LiteralPath $pgData) {
    & (Join-Path $PostgresBin 'pg_ctl.exe') -D $pgData status | Out-Null
    if ($LASTEXITCODE -ne 0) {
        & (Join-Path $PostgresBin 'pg_ctl.exe') -D $pgData -l (Join-Path $localDir 'postgres.log') -o '-p 55432 -h 127.0.0.1' -w start
        if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL did not start.' }
    }
}
New-Item -ItemType Directory -Force -Path $localDir | Out-Null
function Test-ServiceUrl([string]$url) {
    try {
        # Windows PowerShell 5 otherwise attempts to use the retired Internet
        # Explorer HTML parser and reports healthy services as unavailable.
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10
        return $response.StatusCode -eq 200
    } catch { return $false }
}
if (!(Test-ServiceUrl 'http://127.0.0.1:4300/api/ready')) {
    $api = Start-Process -FilePath $nodeExe -ArgumentList 'dist/src/server.js' -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $localDir 'api.log') -RedirectStandardError (Join-Path $localDir 'api-error.log')
    $api.Id | Set-Content -LiteralPath (Join-Path $localDir 'api.pid')
}
if (!(Test-ServiceUrl 'http://localhost:4200')) {
    $rootAngularCli = Join-Path $projectRoot 'node_modules/@angular/cli/bin/ng.js'
    $workspaceAngularCli = Join-Path $projectRoot 'frontend/node_modules/@angular/cli/bin/ng.js'
    $angularCli = if (Test-Path -LiteralPath $rootAngularCli) { $rootAngularCli } else { $workspaceAngularCli }
    if (!(Test-Path -LiteralPath $angularCli)) { throw 'Angular CLI is missing; run npm ci first.' }
    $webArgs = '"' + $angularCli + '" serve --host 127.0.0.1 --port 4200 --proxy-config proxy.conf.json'
    $web = Start-Process -FilePath $nodeExe -ArgumentList $webArgs -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $localDir 'web.log') -RedirectStandardError (Join-Path $localDir 'web-error.log')
    $web.Id | Set-Content -LiteralPath (Join-Path $localDir 'web.pid')
}
foreach ($serviceUrl in @('http://127.0.0.1:4300/api/ready', 'http://localhost:4200')) {
    # Cold starts can spend more than 30 seconds loading Node modules from a
    # OneDrive-backed workspace, especially after the machine has restarted.
    $serviceDeadline = (Get-Date).AddSeconds(180)
    while (!(Test-ServiceUrl $serviceUrl)) {
        if ((Get-Date) -ge $serviceDeadline) { throw "Service did not become ready: $serviceUrl. Check .local logs." }
        Start-Sleep -Milliseconds 250
    }
}
Write-Output 'BuildTrack is ready at http://localhost:4200. Logs are in .local/.'
