$ErrorActionPreference = "Stop"
$PASS=0; $FAIL=0

function Pass($n){ $script:PASS++; Write-Host "✅ PASS: $n" }
function Fail($n,$e){ $script:FAIL++; Write-Host "❌ FAIL: $n"; Write-Host "    $e" }

function Kill-Port($port){
  try {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop |
      Select-Object -ExpandProperty OwningProcess -Unique |
      ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
  } catch {
    $lines = netstat -ano | Select-String ":$port\s+.*LISTENING\s+\d+"
    foreach($l in $lines){
      $pid = ($l.ToString().Trim() -split "\s+")[-1]
      if($pid){ Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }
    }
  }
}

function Http($method,$url,$ct=$null,$body=$null,$timeout=12){
  try {
    $p=@{ Method=$method; Uri=$url; UseBasicParsing=$true; TimeoutSec=$timeout }

    # Only attach body/content-type for verbs that can carry a body
    $canBody = @("POST","PUT","PATCH") -contains ($method.ToString().ToUpper())
    if($canBody -and $body -ne $null -and "$body".Length -gt 0){
      if($ct){ $p.ContentType = $ct }
      $p.Body = $body
    }

    $r = Invoke-WebRequest @p
    return [pscustomobject]@{ Status=[int]$r.StatusCode; Body=$r.Content }
  } catch {
    if($_.Exception.Response){
      $resp=$_.Exception.Response
      $status=[int]$resp.StatusCode.value__
      $txt=""
      try {
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $txt = $reader.ReadToEnd()
      } catch {}
      return [pscustomobject]@{ Status=$status; Body=$txt }
    }
    throw
  }
}

function CleanText($s){
  if($null -eq $s){ return "" }
  $t = "$s"
  $t = $t.Trim()
  if($t.Length -gt 0 -and $t[0] -eq [char]0xFEFF){ $t = $t.Substring(1).Trim() }
  return $t
}

function AssertStatus($name,$resp,$expected){
  if($resp.Status -ne $expected){ throw "$name expected $expected got $($resp.Status). Body: $($resp.Body)" }
}

Write-Host "=== QA START ==="

try { Kill-Port 3000; Pass "Kill port 3000" } catch { Fail "Kill port 3000" $_ }
try { if(Test-Path ".\maze_records.db"){ Remove-Item ".\maze_records.db" -Force }; Pass "Reset DB" } catch { Fail "Reset DB" $_ }

$p=$null
try {
  $p = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WorkingDirectory (Get-Location).Path -WindowStyle Hidden

  $ready=$false
  for($i=0;$i -lt 40;$i++){
    $r = Http "GET" "http://localhost:3000/api/ping" $null $null 12
    if($r.Status -eq 200){ $ready=$true; break }
    Start-Sleep -Milliseconds 300
  }
  if(-not $ready){ throw "Server not ready on /api/ping (timeout)" }
  Pass "Start server + ping"
} catch { Fail "Start server + ping" $_ }

try { AssertStatus "GET /api/ping" (Http "GET" "http://localhost:3000/api/ping") 200; Pass "GET /api/ping" } catch { Fail "GET /api/ping" $_ }
try { AssertStatus "GET /healthc" (Http "GET" "http://localhost:3000/healthc") 200; Pass "GET /healthc" } catch { Fail "GET /healthc" $_ }

try {
  $r = Http "GET" "http://localhost:3000/api/records"
  AssertStatus "GET /api/records" $r 200
  $clean = CleanText $r.Body
  if($clean -ne "[]"){ throw "Expected [] got: $clean" }
  Pass "GET /api/records empty"
} catch { Fail "GET /api/records empty" $_ }

try {
  $r = Http "POST" "http://localhost:3000/api/score" "application/json" "{bad"
  AssertStatus "Invalid JSON -> 400" $r 400
  Pass "Invalid JSON -> 400"
} catch { Fail "Invalid JSON -> 400" $_ }

try {
  $r = Http "POST" "http://localhost:3000/api/score" "text/plain" '{"stage":1,"name":"Ibrahim","time":1.23}'
  AssertStatus "Content-Type guard -> 415" $r 415
  Pass "Content-Type guard -> 415"
} catch { Fail "Content-Type guard -> 415" $_ }

try { AssertStatus "stage validation" (Http "POST" "http://localhost:3000/api/score" "application/json" '{"stage":0,"name":"Ibrahim","time":1.23}') 400; Pass "stage validation -> 400" } catch { Fail "stage validation -> 400" $_ }
try { AssertStatus "name validation"  (Http "POST" "http://localhost:3000/api/score" "application/json" '{"stage":1,"name":"A","time":1.23}') 400; Pass "name validation -> 400" } catch { Fail "name validation -> 400" $_ }
try { AssertStatus "time validation"  (Http "POST" "http://localhost:3000/api/score" "application/json" '{"stage":1,"name":"Ibrahim","time":0}') 400; Pass "time validation -> 400" } catch { Fail "time validation -> 400" $_ }

try {
  AssertStatus "POST 100" (Http "POST" "http://localhost:3000/api/score" "application/json" '{"stage":1,"name":"AAA","time":100}') 200
  $r1 = CleanText (Http "GET" "http://localhost:3000/api/records").Body
  if($r1 -notmatch '"time":100'){ throw "Expected time 100. Got: $r1" }

  AssertStatus "POST 9.99" (Http "POST" "http://localhost:3000/api/score" "application/json" '{"stage":1,"name":"BBB","time":9.99}') 200
  $r2 = CleanText (Http "GET" "http://localhost:3000/api/records").Body
  if($r2 -notmatch '"time":9.99'){ throw "Expected time 9.99. Got: $r2" }

  AssertStatus "POST 50" (Http "POST" "http://localhost:3000/api/score" "application/json" '{"stage":1,"name":"CCC","time":50}') 200
  $r3 = CleanText (Http "GET" "http://localhost:3000/api/records").Body
  if($r3 -notmatch '"time":9.99'){ throw "Expected still 9.99. Got: $r3" }

  Pass "Best-only logic (100 -> 9.99 -> 50 not better)"
} catch { Fail "Best-only logic" $_ }

try {
  $r = Http "GET" "http://localhost:3000/api/nope"
  AssertStatus "API 404" $r 404
  Pass "API 404 (status)"
} catch { Fail "API 404 (status)" $_ }

try { if($p -and -not $p.HasExited){ Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }; Pass "Stop server" } catch { Fail "Stop server" $_ }

Write-Host "=== QA DONE === PASS: $PASS  FAIL: $FAIL ==="
if($FAIL -gt 0){ exit 1 } else { exit 0 }
