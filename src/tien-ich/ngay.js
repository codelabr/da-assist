/**
 * Nhận dạng và phân tích ngày tháng.
 *
 * Đây là chỗ sinh ra nhiều lỗi phân tích nhất trong các tệp thật, vì cùng một cột
 * có thể chứa ba thứ khác nhau: ô ngày thật của Excel, số thứ tự ngày của Excel
 * chưa được định dạng, và ngày lưu dưới dạng văn bản. Khi văn bản lại lẫn hai
 * định dạng thì mọi phép cắt lấy năm đều sai.
 */

export const DANG = {
  O_NGAY: "o-ngay", // ô ngày thật của Excel
  SO_THU_TU: "so-thu-tu", // số thứ tự ngày của Excel, chưa định dạng
  ISO: "iso", // 2026-05-26
  NGAY_TRUOC: "ngay-truoc", // 26/05/2026 hoặc 26-05-2026
  THANG_TRUOC: "thang-truoc", // 05/26/2026 — chỉ kết luận khi thành phần đầu > 12 là bất khả
};

const MOC = Date.UTC(1899, 11, 30);

/** Số thứ tự ngày của Excel sang Date. */
export function tuSoThuTu(n) {
  return new Date(MOC + Math.round(n) * 86400000);
}

/** Ngưỡng để một số nguyên trông như số thứ tự ngày: khoảng 1990 đến 2060. */
function trongKhoangNgay(n) {
  return Number.isFinite(n) && n >= 32874 && n <= 58439;
}

function hopLe(y, m, d) {
  if (!(y >= 1900 && y <= 2100)) return null;
  if (!(m >= 1 && m <= 12)) return null;
  if (!(d >= 1 && d <= 31)) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return t;
}

/**
 * Đoán một ô có phải ngày không.
 * Trả về { ngay, dang } hoặc null. Với chuỗi kiểu a/b/c mà cả hai cách đọc đều
 * hợp lệ thì trả dang = NGAY_TRUOC (cách ghi phổ biến ở Việt Nam) kèm cờ mapHo.
 */
export function doanNgay(v, { nhanSoThuTu = false } = {}) {
  if (v == null || v === "") return null;

  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return { ngay: v, dang: DANG.O_NGAY, mapHo: false };
  }

  if (typeof v === "number") {
    if (nhanSoThuTu && trongKhoangNgay(v)) {
      return { ngay: tuSoThuTu(v), dang: DANG.SO_THU_TU, mapHo: false };
    }
    return null;
  }

  const s = String(v).trim();
  if (!s) return null;

  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (m) {
    const t = hopLe(+m[1], +m[2], +m[3]);
    return t ? { ngay: t, dang: DANG.ISO, mapHo: false } : null;
  }

  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s);
  if (m) {
    const a = +m[1];
    const b = +m[2];
    const y = +m[3];
    const kieuNgayTruoc = hopLe(y, b, a);
    const kieuThangTruoc = hopLe(y, a, b);
    if (kieuNgayTruoc && kieuThangTruoc) {
      return { ngay: kieuNgayTruoc, dang: DANG.NGAY_TRUOC, mapHo: true };
    }
    if (kieuNgayTruoc) return { ngay: kieuNgayTruoc, dang: DANG.NGAY_TRUOC, mapHo: false };
    if (kieuThangTruoc) return { ngay: kieuThangTruoc, dang: DANG.THANG_TRUOC, mapHo: false };
    return null;
  }

  return null;
}

/** Chỉ lấy năm, an toàn với mọi định dạng ở trên. */
export function layNam(v, tuyChon) {
  const r = doanNgay(v, tuyChon);
  return r ? r.ngay.getUTCFullYear() : null;
}

/** Số ngày giữa hai mốc; trả null nếu thiếu một đầu. */
export function soNgayGiua(tu, den) {
  if (!(tu instanceof Date) || !(den instanceof Date)) return null;
  return Math.round((den.getTime() - tu.getTime()) / 86400000);
}

/** Quý dương lịch 1..4 theo Thông tư 07 Điều 11 khoản 2. */
export function quyCua(ngay) {
  return Math.floor(ngay.getUTCMonth() / 3) + 1;
}

/**
 * Khoảng của một kỳ báo cáo giám sát ca bệnh.
 * Thông tư 07 Điều 11 khoản 2: quý tính từ ngày đầu tiên đến hết ngày cuối cùng
 * của quý; năm tính từ ngày đầu tiên đến hết ngày cuối cùng của năm.
 * KHÔNG dùng quy tắc 15 tháng trước đến 14 tháng cuối quý của Thông tư 05 Điều 3.
 */
export function khoangKy({ nam, quy = null }) {
  if (quy == null) {
    return { tu: new Date(Date.UTC(nam, 0, 1)), den: new Date(Date.UTC(nam, 11, 31)) };
  }
  const thangDau = (quy - 1) * 3;
  return {
    tu: new Date(Date.UTC(nam, thangDau, 1)),
    den: new Date(Date.UTC(nam, thangDau + 3, 0)),
  };
}

export function trongKhoang(ngay, { tu, den }) {
  return ngay instanceof Date && ngay >= tu && ngay <= den;
}
