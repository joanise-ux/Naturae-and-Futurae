# Upload nature-future to OVH hosting via FTP
# Serwer: ftp.cluster100.hosting.ovh.net | Login: nfplano | Katalog: /www

$ftpServer = "ftp://ftp.cluster100.hosting.ovh.net"
$ftpUser = "nfplano"
$ftpPass = Read-Host "Podaj haslo FTP dla nfplano" -AsSecureString
$cred = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)

$projectDir = $PSScriptRoot

$files = @(
    "index.html",
    "index-en.html",
    "sklep.html",
    "sklep-en.html",
    "historia.html",
    "historia-en.html",
    "technologia.html",
    "technologia-en.html",
    "panel-klienta.html",
    "panel-klienta-en.html",
    "konto.html",
    "konto-en.html",
    "admin.html",
    "support.js",
    "supabase-config.js",
    "content-editor.js",
    "footer.js",
    "transitions.js"
)

$assetFiles = @(
    "assets/capsule-forest.jpg",
    "assets/cathedral.jpg",
    "assets/green-city.jpg",
    "assets/greenhouse-neon.jpg",
    "assets/hero-hand-fern-data.jpg",
    "assets/leaf-wall.jpg",
    "assets/logo-circle.png",
    "assets/logo.jpg",
    "assets/sp-airship-day.jpg",
    "assets/sp-airship-night.jpg",
    "assets/sp-desk-bottles.jpg",
    "assets/sp-greenhouse.jpg",
    "assets/sp-terrarium-gauge.jpg",
    "assets/capsule-rainforest.jpg",
    "assets/logo-icon.png",
    "assets/moss-laptop.jpg",
    "assets/sp-animation.mp4",
    "assets/sp-flasks.jpg",
    "assets/sp-library-terrarium.jpg",
    "assets/sp-street.jpg",
    "assets/bottle-vial.jpg",
    "assets/mobile.css"
)

function Upload-FtpFile($localPath, $remotePath) {
    $uri = "$ftpServer/$remotePath"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.Credentials = $cred
    $request.UseBinary = $true
    $request.UsePassive = $true
    $request.EnableSsl = $false

    $fileContent = [System.IO.File]::ReadAllBytes($localPath)
    $request.ContentLength = $fileContent.Length

    $stream = $request.GetRequestStream()
    $stream.Write($fileContent, 0, $fileContent.Length)
    $stream.Close()

    $response = $request.GetResponse()
    $status = $response.StatusDescription
    $response.Close()
    return $status
}

function Create-FtpDirectory($dirPath) {
    $uri = "$ftpServer/$dirPath"
    try {
        $request = [System.Net.FtpWebRequest]::Create($uri)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $request.Credentials = $cred
        $request.UsePassive = $true
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "  Katalog $dirPath utworzony" -ForegroundColor Green
    } catch {
        Write-Host "  Katalog $dirPath juz istnieje" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Upload do OVH: nfplantbiotech.com ===" -ForegroundColor Cyan
Write-Host "Serwer: ftp.cluster100.hosting.ovh.net"
Write-Host "Katalog docelowy: /www`n"

# Tworzenie katalogu assets
Write-Host "Tworzenie katalogu /www/assets..." -ForegroundColor Cyan
Create-FtpDirectory "www/assets"

# Upload plikow glownych
Write-Host "`nUpload plikow HTML i JS..." -ForegroundColor Cyan
foreach ($file in $files) {
    $localPath = Join-Path $projectDir $file
    if (Test-Path $localPath) {
        try {
            $result = Upload-FtpFile $localPath "www/$file"
            Write-Host "  OK: $file" -ForegroundColor Green
        } catch {
            Write-Host "  BLAD: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  BRAK: $file" -ForegroundColor Yellow
    }
}

# Upload assetow
Write-Host "`nUpload assetow (obrazy, CSS, wideo)..." -ForegroundColor Cyan
foreach ($file in $assetFiles) {
    $localPath = Join-Path $projectDir ($file -replace '/', '\')
    if (Test-Path $localPath) {
        try {
            $result = Upload-FtpFile $localPath "www/$file"
            Write-Host "  OK: $file" -ForegroundColor Green
        } catch {
            Write-Host "  BLAD: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  BRAK: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Upload zakonczony! ===" -ForegroundColor Cyan
Write-Host "Strona powinna byc dostepna pod: https://nfplantbiotech.com`n"
