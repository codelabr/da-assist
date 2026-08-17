/**
 * Công cụ dùng chung cho các phân tích.
 *
 * Ba điều đáng nhớ ở đây:
 *
 *   - Tứ phân vị tính theo cách của Excel (kiểu 7, nội suy tuyến tính), để con số
 *     công cụ đưa ra khớp với con số người dùng tự tính bằng hàm QUARTILE. Lệch
 *     nhau vài đơn vị là đủ để người ta thôi tin công cụ.
 *   - Tuổi ở đây là tuổi THEO NĂM, vì tệp chỉ có năm sinh chứ không có ngày sinh.
 *     Sai số tới một tuổi. Mọi bảng dùng tuổi đều phải ghi rõ điều đó.
 *   - Nhóm tuổi mặc định lấy theo văn bản, không tự nghĩ ra: Thông tư 05 chia
 *     dưới 15 và từ 15 trở lên; Phụ lục 9 Thông tư 07 chia dưới 15, 15–49, trên 49.
 */

import { catTrang, chuanHoa } from "../tien-ich/chuoi.js";

export const NHOM_TUOI = {
  TT05: {
    ma: "tt05",
    ten: "Dưới 15 / từ 15 trở lên",
    canCu: "Thông tư 05/2023/TT-BYT",
    moc: [15],
    nhan: ["Dưới 15 tuổi", "Từ 15 tuổi trở lên"],
  },
  TT07_PL9: {
    ma: "tt07",
    ten: "Dưới 15 / 15–49 / trên 49",
    canCu: "Phụ lục 9 Thông tư 07/2023/TT-BYT",
    moc: [15, 50],
    nhan: ["Dưới 15 tuổi", "15–49 tuổi", "Trên 49 tuổi"],
  },
  CHI_TIET: {
    ma: "chi-tiet",
    ten: "Nhóm năm tuổi chi tiết",
    canCu: "không theo văn bản, dùng khi cần nhìn kỹ cơ cấu",
    moc: [15, 25, 35, 50],
    nhan: ["0–14", "15–24", "25–34", "35–49", "50 trở lên"],
  },
};

export const KHONG_RO = "Không rõ";

/** Xếp một tuổi vào nhóm. Trả về nhãn, hoặc "Không rõ" nếu không tính được. */
export function xepNhomTuoi(tuoi, kieu = NHOM_TUOI.TT07_PL9) {
  if (tuoi == null || !Number.isFinite(tuoi) || tuoi < 0 || tuoi > 120) return KHONG_RO;
  for (let i = 0; i < kieu.moc.length; i++) if (tuoi < kieu.moc[i]) return kieu.nhan[i];
  return kieu.nhan[kieu.nhan.length - 1];
}

/** Tuổi theo năm: năm mốc trừ năm sinh. Sai số tới một tuổi. */
export function tuoiTheoNam(namSinh, namMoc) {
  const ns = Number(String(namSinh).replace(/[^\d]/g, ""));
  if (!Number.isFinite(ns) || ns < 1900 || ns > 2100) return null;
  if (!Number.isFinite(namMoc)) return null;
  return namMoc - ns;
}

/** Phân vị theo kiểu 7 — cùng cách với hàm QUARTILE của Excel. */
export function phanVi(ds, p) {
  const v = ds.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  if (v.length === 1) return v[0];
  const i = (v.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return v[lo];
  return v[lo] + (i - lo) * (v[hi] - v[lo]);
}

/** Thống kê mô tả một dãy số. */
export function thongKe(ds) {
  const v = ds.filter((x) => Number.isFinite(x));
  if (!v.length) return { soCa: 0 };
  const tong = v.reduce((a, b) => a + b, 0);
  return {
    soCa: v.length,
    nhoNhat: Math.min(...v),
    q1: phanVi(v, 0.25),
    trungVi: phanVi(v, 0.5),
    q3: phanVi(v, 0.75),
    lonNhat: Math.max(...v),
    trungBinh: tong / v.length,
  };
}

/**
 * Gộp mã phân cấp về cấp cha.
 * Cột Đường lây của bản xuất thật chứa đồng thời "Mã 2" và "Mã 2.1"; tổng hợp
 * thẳng sẽ đếm song song hai cấp.
 */
export function machSo(s) {
  const m = /(\d+(?:\.\d+)+|\d+)/.exec(catTrang(s));
  return m ? m[1] : null;
}

export function gocCua(s) {
  const m = machSo(s);
  if (!m) return catTrang(s);
  return m.split(".")[0];
}

/**
 * Dựng bản đồ gộp mã con về mã cha, chỉ khi cả hai cấp cùng có mặt.
 * Trả về Map: giá trị → nhãn sau khi gộp.
 */
export function banDoGopCap(dsGiaTri) {
  const theoMa = new Map();
  for (const g of dsGiaTri) {
    const m = machSo(g);
    if (m) theoMa.set(m, g);
  }
  const ra = new Map();
  for (const g of dsGiaTri) {
    const m = machSo(g);
    if (!m) {
      ra.set(g, catTrang(g));
      continue;
    }
    const goc = m.split(".")[0];
    ra.set(g, theoMa.has(goc) ? catTrang(theoMa.get(goc)) : catTrang(g));
  }
  return ra;
}

/** Đếm theo một khoá. */
export function demTheo(ds, khoaCua) {
  const m = new Map();
  for (const x of ds) {
    const k = khoaCua(x);
    if (k == null) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

/**
 * Dựng bảng chéo hai chiều.
 * @returns {{tieuDe:Array, hang:Array, tongCot:Array, tongChung:number}}
 */
export function bangCheo(ds, khoaHang, khoaCot, { sapHang = null, sapCot = null } = {}) {
  const o = new Map();
  const tapCot = new Set();
  for (const x of ds) {
    const h = khoaHang(x);
    const c = khoaCot(x);
    if (h == null || c == null) continue;
    tapCot.add(c);
    if (!o.has(h)) o.set(h, new Map());
    const d = o.get(h);
    d.set(c, (d.get(c) || 0) + 1);
  }

  const sxMacDinh = (a, b) => String(a).localeCompare(String(b), "vi");
  const dsHang = [...o.keys()].sort(sapHang || sxMacDinh);
  const dsCot = [...tapCot].sort(sapCot || sxMacDinh);

  const hang = dsHang.map((h) => {
    const d = o.get(h);
    const so = dsCot.map((c) => d.get(c) || 0);
    return [h, ...so, so.reduce((a, b) => a + b, 0)];
  });
  const tongCot = dsCot.map((_, i) => hang.reduce((t, r) => t + r[i + 1], 0));
  const tongChung = tongCot.reduce((a, b) => a + b, 0);

  return {
    tieuDe: ["", ...dsCot, "Tổng"],
    // Gợi ý định dạng cho từng cột, để giao diện không hiện 0,09 ca mỗi tháng
    // thành "9%". Cột đầu là nhãn, các cột còn lại là số đếm.
    dinhDang: ["chu", ...dsCot.map(() => "so"), "so"],
    hang,
    tongCot: ["Tổng", ...tongCot, tongChung],
    tongChung,
  };
}

/** Bảng một chiều, sắp theo số lượng giảm dần. */
export function bangDem(ds, khoaCua, { tenCot = "Giá trị", sapTheoSo = true, toiDa = null } = {}) {
  const m = demTheo(ds, khoaCua);
  let muc = [...m.entries()];
  muc.sort(sapTheoSo
    ? (a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "vi")
    : (a, b) => String(a[0]).localeCompare(String(b[0]), "vi"));
  const tong = muc.reduce((t, x) => t + x[1], 0);
  let ghiChu = null;
  if (toiDa && muc.length > toiDa) {
    const con = muc.slice(toiDa);
    const conTong = con.reduce((t, x) => t + x[1], 0);
    muc = muc.slice(0, toiDa);
    muc.push([`(còn ${con.length} giá trị khác)`, conTong]);
    ghiChu = `Bảng chỉ hiện ${toiDa} giá trị nhiều nhất; ${con.length} giá trị còn lại gộp vào một dòng.`;
  }
  return {
    tieuDe: [tenCot, "Số ca", "Tỷ lệ"],
    dinhDang: ["chu", "so", "ty-le"],
    hang: muc.map(([k, v]) => [k, v, tong ? v / tong : 0]),
    tongCot: ["Tổng", tong, tong ? 1 : 0],
    tongChung: tong,
    ghiChu,
  };
}

/** Chuẩn hoá giá trị một ô phân loại để làm khoá nhóm. */
export function khoaPhanLoai(v) {
  const s = catTrang(v);
  return s === "" ? KHONG_RO : s;
}

export function bangNhau(a, b) {
  return chuanHoa(a) === chuanHoa(b);
}
