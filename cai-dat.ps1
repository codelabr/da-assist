# DA Assist - kich ban cai add-in vao Excel tren Windows.
#
# Chay bang:
#   iex (New-Object Net.WebClient).DownloadString('https://codelabr.github.io/da-assist/cai-dat.ps1')
#
# Kich ban nay:
#   - KHONG can quyen quan tri
#   - KHONG mo cong mang nao, KHONG cai dich vu nao
#   - chi ghi vao HKEY_CURRENT_USER, tuc chi anh huong tai khoan Windows cua ban
#   - go ra bang mot lenh, xem dong cuoi khi chay xong
#
# Toan bo thong bao trong tep nay khong dau tieng Viet. Ly do: kich ban duoc tai
# ve qua mang roi chay ngay, ma PowerShell 5.1 giai ma noi dung theo bang ma cua
# phan hoi HTTP chu khong theo UTF-8. Chu co dau se bi hong. Tai lieu va giao dien
# cong cu thi van tieng Viet co dau day du.

$ErrorActionPreference = 'Stop'

# Ma dinh danh cua add-in, lay tu chinh ban ke khai. Dung lam ten muc trong so
# dang ky nen chay lai nhieu lan cung khong sinh ra ban trung.
$MA_ADDIN = '7c1f4a92-3b6d-4e58-9a02-5d8f1c6b7e34'
$DIA_CHI_KE_KHAI = 'https://codelabr.github.io/da-assist/vo-addin/manifest.xml'
$THU_MUC = Join-Path $env:LOCALAPPDATA 'DaAssist'
$TEP_KE_KHAI = Join-Path $THU_MUC 'manifest.xml'

function Ghi([string]$s, [string]$mau = 'Gray') { Write-Host $s -ForegroundColor $mau }

Ghi ''
Ghi '  DA ASSIST - cai add-in vao Excel' 'Cyan'
Ghi '  Cong cu ra soat, lam sach va phan tich tep Excel so lieu HIV/AIDS' 'DarkGray'
Ghi '  Ma nguon: https://github.com/codelabr/da-assist' 'DarkGray'
Ghi ''

# --- 1. Tim ban Office ------------------------------------------------------
# Khoa WEF nam theo phien ban Office. 16.0 la Office 2016, 2019, 2021 va
# Microsoft 365; 15.0 la Office 2013.
$dsPhienBan = @()
foreach ($v in @('16.0', '15.0')) {
  if (Test-Path "HKCU:\Software\Microsoft\Office\$v") { $dsPhienBan += $v }
}
if ($dsPhienBan.Count -eq 0) {
  Ghi '  KHONG tim thay Office nao trong so dang ky cua tai khoan nay.' 'Red'
  Ghi '  Neu may co Excel, hay mo Excel mot lan roi chay lai kich ban nay.' 'Yellow'
  Ghi ''
  Ghi '  Van dung duoc cong cu ma khong can cai gi:' 'Cyan'
  Ghi '  https://codelabr.github.io/da-assist/docs/' 'Cyan'
  return
}
$phienBan = $dsPhienBan[0]
Ghi "  [1/4] Tim thay Office phien ban $phienBan" 'Green'
if ($phienBan -eq '15.0') {
  Ghi '        Office 2013 khong ho tro nut tren dai lenh. Sau khi cai, mo' 'Yellow'
  Ghi '        add-in bang: Chen > Add-in cua toi.' 'Yellow'
}

# --- 2. Canh bao neu Excel dang chay ---------------------------------------
$dangChay = Get-Process EXCEL -ErrorAction SilentlyContinue
if ($dangChay) {
  Ghi "  [2/4] Excel dang chay ($($dangChay.Count) tien trinh)" 'Yellow'
  Ghi '        Kich ban van cai duoc, nhung phai DONG HAN Excel roi mo lai' 'Yellow'
  Ghi '        thi add-in moi hien ra.' 'Yellow'
} else {
  Ghi '  [2/4] Excel dang dong - tot' 'Green'
}

# --- 3. Tai ban ke khai va kiem ------------------------------------------
#
# Tai theo BYTE, khong tai theo chuoi. DownloadString giai ma noi dung theo bang
# ma ANSI khi phan hoi khong khai charset, nen ten add-in tieng Viet trong ban ke
# khai se thanh ky tu rac; ghi lai chuoi da hong thanh UTF-8 thi ra mot ban ke
# khai hong ma van dung cu phap XML. Ghi nguyen byte thi khong the sai.
Ghi '  [3/4] Tai ban ke khai...' 'Gray'
New-Item -ItemType Directory -Force -Path $THU_MUC | Out-Null
$byte = (New-Object Net.WebClient).DownloadData($DIA_CHI_KE_KHAI)

# Ghi ra tep tam roi kiem, chi dat vao cho chinh thuc khi da kiem xong. Tai ve mot
# trang bao loi cua may chu roi khai no vao Excel thi Excel chi bao "manifest khong
# hop le" ma khong noi vi sao.
$tepTam = Join-Path $THU_MUC 'manifest.tai-ve'
[IO.File]::WriteAllBytes($tepTam, $byte)

$xml = New-Object System.Xml.XmlDocument
try {
  # Load doc tu tep nen ton trong khai bao encoding trong chinh tep XML.
  $xml.Load($tepTam)
} catch {
  Remove-Item $tepTam -Force -ErrorAction SilentlyContinue
  Ghi '        THAT BAI: tep tai ve khong phai XML hop le.' 'Red'
  Ghi '        Co the may khong vao duoc mang, hoac dang qua may chu trung gian.' 'Yellow'
  return
}
$maTaiVe = $xml.OfficeApp.Id
if ($maTaiVe -ne $MA_ADDIN) {
  Remove-Item $tepTam -Force -ErrorAction SilentlyContinue
  Ghi '        THAT BAI: ma dinh danh trong ban ke khai khong dung nhu mong doi.' 'Red'
  Ghi "        Mong doi: $MA_ADDIN" 'Red'
  Ghi "        Tai ve:   $maTaiVe" 'Red'
  return
}
Move-Item $tepTam $TEP_KE_KHAI -Force
Ghi '        Da kiem: XML hop le, ma dinh danh dung' 'Green'
Ghi "        Luu tai: $TEP_KE_KHAI" 'DarkGray'

# --- 4. Khai vao so dang ky -----------------------------------------------
Ghi '  [4/4] Khai vao so dang ky cua tai khoan hien tai...' 'Gray'
foreach ($v in $dsPhienBan) {
  $khoa = "HKCU:\Software\Microsoft\Office\$v\WEF\Developer"
  New-Item -Path $khoa -Force | Out-Null
  New-ItemProperty -Path $khoa -Name $MA_ADDIN -Value $TEP_KE_KHAI `
    -PropertyType String -Force | Out-Null
  Ghi "        $khoa" 'DarkGray'
}
Ghi '        Xong' 'Green'

Ghi ''
Ghi '  CAI DAT XONG.' 'Green'
Ghi ''
Ghi '  Viec tiep theo:' 'Cyan'
Ghi '    1. Dong han Excel neu dang mo, ke ca cua so an o thanh tac vu.'
Ghi '    2. Mo Excel.'
Ghi '    3. Add-in hien o the Trang dau, nhom DA Assist, nut Ra soat bang tinh.'
Ghi '       Neu khong thay: Chen > Add-in cua toi > the Developer Add-ins.'
Ghi ''
Ghi '  Luu y:' 'Cyan'
Ghi '    - Lan mo dau tien can co mang, vi giao dien tai tu GitHub Pages.'
Ghi '      Sau lan dau Excel luu dem nen chay duoc ca khi mat mang.'
Ghi '    - DU LIEU CUA BAN KHONG BAO GIO ROI KHOI MAY. Chi phan giao dien'
Ghi '      duoc tai ve.'
Ghi ''
Ghi '  Go cai dat bang mot lenh:' 'Cyan'
Ghi "    iex (New-Object Net.WebClient).DownloadString('https://codelabr.github.io/da-assist/go-cai-dat.ps1')" 'White'
Ghi ''
