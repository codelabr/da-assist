# DA Assist - kich ban go add-in khoi Excel tren Windows.
#
# Chay bang:
#   iex (New-Object Net.WebClient).DownloadString('https://codelabr.github.io/da-assist/go-cai-dat.ps1')
#
# Kich ban nay xoa dung nhung gi kich ban cai da tao ra: mot muc trong so dang ky
# cua tai khoan hien tai, va mot thu muc chua ban ke khai. KHONG dong den tep du
# lieu nao cua ban, va KHONG dong den trang tinh nao.
#
# Thong bao khong dau tieng Viet, cung ly do nhu kich ban cai.

$ErrorActionPreference = 'Stop'

$MA_ADDIN = '7c1f4a92-3b6d-4e58-9a02-5d8f1c6b7e34'
$THU_MUC = Join-Path $env:LOCALAPPDATA 'DaAssist'

function Ghi([string]$s, [string]$mau = 'Gray') { Write-Host $s -ForegroundColor $mau }

Ghi ''
Ghi '  DA ASSIST - go add-in khoi Excel' 'Cyan'
Ghi ''

$daXoa = 0

# --- 1. Xoa khai bao trong so dang ky --------------------------------------
foreach ($v in @('16.0', '15.0')) {
  $khoa = "HKCU:\Software\Microsoft\Office\$v\WEF\Developer"
  if (-not (Test-Path $khoa)) { continue }
  $muc = Get-ItemProperty -Path $khoa -ErrorAction SilentlyContinue
  if ($null -ne $muc -and $null -ne $muc.$MA_ADDIN) {
    Remove-ItemProperty -Path $khoa -Name $MA_ADDIN -ErrorAction SilentlyContinue
    Ghi "  [1/2] Da xoa khai bao trong $khoa" 'Green'
    $daXoa++
  }
}
if ($daXoa -eq 0) {
  Ghi '  [1/2] Khong tim thay khai bao nao - co the da go truoc do' 'Yellow'
}

# --- 2. Xoa thu muc chua ban ke khai ---------------------------------------
# Chi xoa dung thu muc do kich ban cai tao ra, va chi khi trong do khong co gi
# ngoai ban ke khai. Nguoi dung co the da luu tep rieng vao day.
if (Test-Path $THU_MUC) {
  $conLai = Get-ChildItem $THU_MUC -Force | Where-Object { $_.Name -ne 'manifest.xml' }
  if ($conLai) {
    Ghi "  [2/2] Thu muc $THU_MUC con tep khac nen KHONG xoa ca thu muc." 'Yellow'
    Ghi '        Chi xoa ban ke khai. Cac tep sau duoc giu nguyen:' 'Yellow'
    foreach ($c in $conLai) { Ghi "          $($c.Name)" 'DarkGray' }
    Remove-Item (Join-Path $THU_MUC 'manifest.xml') -Force -ErrorAction SilentlyContinue
  } else {
    Remove-Item $THU_MUC -Recurse -Force
    Ghi "  [2/2] Da xoa thu muc $THU_MUC" 'Green'
  }
} else {
  Ghi '  [2/2] Khong con thu muc ban ke khai' 'Yellow'
}

Ghi ''
Ghi '  DA GO XONG.' 'Green'
Ghi ''
Ghi '  Dong han Excel roi mo lai thi add-in bien mat khoi dai lenh.' 'Cyan'
Ghi ''
Ghi '  Van dung duoc cong cu ma khong can cai gi:' 'Cyan'
Ghi '  https://codelabr.github.io/da-assist/docs/' 'Cyan'
Ghi ''
Ghi '  Cai lai bat cu luc nao:' 'Cyan'
Ghi "    iex (New-Object Net.WebClient).DownloadString('https://codelabr.github.io/da-assist/cai-dat.ps1')" 'White'
Ghi ''
