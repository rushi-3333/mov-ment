# Run this script as Administrator (right-click -> Run with PowerShell as Admin)
# Sets DNS to Cloudflare so MongoDB Atlas hostnames can resolve.

$ErrorActionPreference = 'Stop'
$adapter = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null } | Select-Object -First 1
if (-not $adapter) { Write-Host "No active network adapter found."; exit 1 }
Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses '1.1.1.1', '1.0.0.1'
Write-Host "DNS set to 1.1.1.1 and 1.0.0.1 on adapter index $($adapter.InterfaceIndex)."
ipconfig /flushdns
Write-Host "DNS cache flushed. Run: node index.js"
