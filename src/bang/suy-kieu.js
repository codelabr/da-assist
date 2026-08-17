/**
 * Tầng 1 — suy kiểu từng cột. Không cần biết gì về chuyên môn, nên chạy được với
 * mọi tệp bảng, kể cả bảng tự làm tại đơn vị.
 */

import { catTrang, chuanHoa } from "../tien-ich/chuoi.js";
import { DANG, doanNgay } from "../tien-ich/ngay.js";

export const KIEU = {
  TRONG: "trong",
  SO_NGUYEN: "so-nguyen",
  SO_THUC: "so-thuc",
  NGAY: "ngay",
  PHAN_LOAI: "phan-loai",
  MA_DINH_DANH: "ma-dinh-danh",
  DUNG_SAI: "dung-sai",
  VAN_BAN: "van-ban",
  LAN_LON: "lan-lon",
};

const DUNG_SAI = new Set(["co", "khong", "yes", "no", "x", "true", "false", "1", "0", "y", "n"]);

function rong(v) {
  return v == null || (typeof v === "string" && v.trim() === "");
}

function chuoiSo(s) {
  return /^-?\d+([.,]\d+)?$/.test(s);
}

/** Trông như mã định danh: chữ và số trộn nhau, hoặc chuỗi số dài. */
function trongNhuMa(s) {
  return /^[A-Za-z]{1,6}[-_]?\d{3,}$/.test(s) || /^\d{6,}$/.test(s);
}

/**
 * Suy kiểu một cột.
 * Trả về mô tả đầy đủ, gồm cả những dấu hiệu mà tầng kiểm chung sẽ dùng.
 */
export function suyKieuCot(giaTri, ten = "", chiSo = -1) {
  const mo = {
    chiSo,
    ten,
    kieu: KIEU.TRONG,
    soO: giaTri.length,
    soODay: 0,
    soOTrong: 0,
    soGiaTriKhacNhau: 0,
    mau: [],
    tanSuat: new Map(),
    // Tần suất theo giá trị ĐÃ CẮT khoảng trắng. Bắt buộc phải có riêng: danh
    // sách biến thể lưu giá trị đã cắt, nên tra tần suất bằng bảng khoá theo giá
    // trị thô sẽ trượt, và phép thống nhất hoa thường chọn nhầm dạng phổ biến.
    tanSuatCat: new Map(),
    dangNgay: {},
    soNgayVanBan: 0,
    soSoLuuVanBan: 0,
    soKhoangTrangThua: 0,
    bienThe: [],
    ngayDaDoc: [],
  };

  let soNgay = 0;
  let soSo = 0;
  let soChuoi = 0;
  let coSoThuc = false;
  const soTrongKhoangNgay = [];
  const theoChuan = new Map();

  for (const v of giaTri) {
    if (rong(v)) {
      mo.soOTrong++;
      continue;
    }
    mo.soODay++;

    const khoa = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
    mo.tanSuat.set(khoa, (mo.tanSuat.get(khoa) || 0) + 1);
    const khoaCat = typeof v === "string" ? catTrang(v) : khoa;
    mo.tanSuatCat.set(khoaCat, (mo.tanSuatCat.get(khoaCat) || 0) + 1);
    if (mo.mau.length < 5 && !mo.mau.includes(khoa)) mo.mau.push(khoa);

    if (v instanceof Date) {
      soNgay++;
      mo.dangNgay[DANG.O_NGAY] = (mo.dangNgay[DANG.O_NGAY] || 0) + 1;
      mo.ngayDaDoc.push(v);
      continue;
    }

    if (typeof v === "number") {
      soSo++;
      if (!Number.isInteger(v)) coSoThuc = true;
      if (v >= 32874 && v <= 58439) soTrongKhoangNgay.push(v);
      continue;
    }

    const s = String(v);
    const cat = catTrang(s);
    if (cat !== s) mo.soKhoangTrangThua++;

    const th = cat.toLowerCase();
    if (!theoChuan.has(th)) theoChuan.set(th, new Set());
    theoChuan.get(th).add(cat);

    const rn = doanNgay(cat);
    if (rn) {
      soNgay++;
      mo.soNgayVanBan++;
      mo.dangNgay[rn.dang] = (mo.dangNgay[rn.dang] || 0) + 1;
      mo.ngayDaDoc.push(rn.ngay);
      continue;
    }

    if (chuoiSo(cat)) {
      soSo++;
      mo.soSoLuuVanBan++;
      if (!/^-?\d+$/.test(cat)) coSoThuc = true;
      continue;
    }

    soChuoi++;
  }

  mo.soGiaTriKhacNhau = mo.tanSuat.size;

  // Số nằm trong khoảng ngày, ở một cột đã có ngày, gần như chắc là số thứ tự ngày
  // của Excel chưa được định dạng.
  if (soNgay > 0 && soTrongKhoangNgay.length > 0) {
    mo.dangNgay[DANG.SO_THU_TU] = soTrongKhoangNgay.length;
    soNgay += soTrongKhoangNgay.length;
    soSo -= soTrongKhoangNgay.length;
    for (const n of soTrongKhoangNgay) {
      mo.ngayDaDoc.push(new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86400000));
    }
  }

  // Hai loại biến thể, KHÔNG được gộp làm một:
  //   "hoa-thuong" — chỉ khác hoa thường, chắc chắn là cùng một giá trị.
  //   "dau"        — khác nhau ở dấu tiếng Việt. Có thể là cùng một giá trị gõ
  //                  thiếu dấu, nhưng cũng có thể là hai giá trị khác nhau thật:
  //                  Vĩnh Thanh và Vĩnh Thạnh là hai địa danh riêng biệt. Máy
  //                  không được tự quyết ở đây.
  for (const [th, tap] of theoChuan) {
    if (tap.size > 1) mo.bienThe.push({ loai: "hoa-thuong", chuan: th, matChu: [...tap] });
  }
  const theoDau = new Map();
  for (const th of theoChuan.keys()) {
    const c = chuanHoa(th);
    if (!theoDau.has(c)) theoDau.set(c, []);
    theoDau.get(c).push(th);
  }
  for (const [c, dsThuong] of theoDau) {
    if (dsThuong.length > 1) {
      const matChu = dsThuong.flatMap((th) => [...theoChuan.get(th)]);
      mo.bienThe.push({ loai: "dau", chuan: c, matChu });
    }
  }

  if (mo.soODay === 0) {
    mo.kieu = KIEU.TRONG;
    return mo;
  }

  const tyNgay = soNgay / mo.soODay;
  const tySo = soSo / mo.soODay;
  const tyChuoi = soChuoi / mo.soODay;

  if (tyNgay >= 0.8) mo.kieu = KIEU.NGAY;
  else if (tySo >= 0.9) mo.kieu = coSoThuc ? KIEU.SO_THUC : KIEU.SO_NGUYEN;
  else if (tyChuoi >= 0.8 || (tyChuoi > 0 && tyChuoi + tySo >= 0.95 && tyChuoi >= 0.5)) {
    const chuanTap = new Set([...mo.tanSuat.keys()].map((x) => chuanHoa(x)));
    const toanDungSai = [...chuanTap].every((x) => DUNG_SAI.has(x));
    const toanMa = [...mo.tanSuat.keys()].every((x) => trongNhuMa(catTrang(x)));
    if (toanDungSai && chuanTap.size <= 4) mo.kieu = KIEU.DUNG_SAI;
    else if (toanMa && mo.soGiaTriKhacNhau / mo.soODay > 0.8) mo.kieu = KIEU.MA_DINH_DANH;
    else if (mo.soGiaTriKhacNhau <= 60 && mo.soGiaTriKhacNhau / mo.soODay <= 0.3) {
      mo.kieu = KIEU.PHAN_LOAI;
    } else mo.kieu = KIEU.VAN_BAN;
  } else mo.kieu = KIEU.LAN_LON;

  // Cột toàn số nhưng giá trị lặp lại nhiều thì thực chất là mã phân loại.
  if (
    (mo.kieu === KIEU.SO_NGUYEN || mo.kieu === KIEU.SO_THUC) &&
    mo.soGiaTriKhacNhau <= 20 &&
    mo.soODay >= 20 &&
    mo.soGiaTriKhacNhau / mo.soODay <= 0.1
  ) {
    mo.kieu = KIEU.PHAN_LOAI;
  }

  return mo;
}

/** Suy kiểu toàn bộ cột của một bảng. */
export function suyKieuBang(bang) {
  const cot = [];
  for (let c = 0; c < bang.soCot; c++) {
    const gt = bang.dong.map((d) => d[c]);
    cot.push(suyKieuCot(gt, bang.tieuDe[c], c));
  }
  bang.cot = cot;
  return cot;
}
