/**
 * Tầng 0 — nhận dạng hình dạng tệp.
 *
 * Ba câu phải trả lời trước khi làm bất cứ việc gì:
 *   1. Trang tính này có hình dạng nào — danh sách từng ca, hay biểu đã cộng?
 *   2. Hàng nào là hàng tiêu đề thật? Không giả định là dòng 1.
 *   3. Có bao nhiêu dòng dữ liệu thật?
 *
 * Xoá dòng trùng trên một biểu đã cộng là phá tệp. Vì vậy hình dạng phải xác định
 * trước, và khi chưa chắc thì nói rõ là chưa chắc chứ không đoán bừa.
 */

import { catTrang, chuanHoa } from "../tien-ich/chuoi.js";

export const HINH_DANG = {
  DANH_SACH: "danh-sach",
  BIEU_TONG_HOP: "bieu-tong-hop",
  CHUA_XAC_DINH: "chua-xac-dinh",
};

const TU_DONG_CONG = ["tong", "cong", "tong cong", "tong so", "toan tinh", "tong hop"];

function rong(v) {
  return v == null || (typeof v === "string" && v.trim() === "");
}

function laSoThuan(v) {
  if (typeof v === "number") return true;
  if (typeof v !== "string") return false;
  return /^-?\d+([.,]\d+)?$/.test(v.trim());
}

/** Số ô không rỗng nhiều nhất trên một hàng — dùng làm bề rộng thật của bảng. */
function beRongThat(hang) {
  let max = 0;
  for (const h of hang) {
    let d = 0;
    for (let i = 0; i < h.length; i++) if (!rong(h[i])) d = i + 1;
    if (d > max) max = d;
  }
  return max;
}

/**
 * Tìm hàng tiêu đề thật.
 * Hàng tiêu đề là hàng đầu tiên mà phần lớn ô không rỗng, hầu hết là chuỗi không
 * phải số, tên không trùng nhau, và các hàng bên dưới có dữ liệu.
 */
export function timHangTieuDe(hang, { toiDaXet = 30 } = {}) {
  const rong0 = beRongThat(hang);
  if (!rong0) return { chiSo: -1, diem: 0 };
  let tot = { chiSo: -1, diem: -1 };

  const gioiHan = Math.min(toiDaXet, hang.length);
  for (let r = 0; r < gioiHan; r++) {
    const o = hang[r] || [];
    const day = [];
    for (let c = 0; c < rong0; c++) if (!rong(o[c])) day.push(o[c]);
    if (day.length < 2) continue;

    const tyLeDay = day.length / rong0;
    const soChuoi = day.filter((v) => !laSoThuan(v)).length;
    const tyLeChuoi = soChuoi / day.length;

    const ten = day.map((v) => chuanHoa(v)).filter(Boolean);
    const tyLeTrung = ten.length ? 1 - new Set(ten).size / ten.length : 1;

    // Các hàng bên dưới phải có dữ liệu, nếu không thì đây là dòng tiêu đề trang.
    let duoiDay = 0;
    let duoiXet = 0;
    for (let k = r + 1; k <= r + 5 && k < hang.length; k++) {
      const h = hang[k] || [];
      let d = 0;
      for (let c = 0; c < rong0; c++) if (!rong(h[c])) d++;
      duoiDay += d / rong0;
      duoiXet++;
    }
    const tyLeDuoi = duoiXet ? duoiDay / duoiXet : 0;
    if (tyLeDuoi < 0.15) continue;

    const diem = tyLeDay * 1.0 + tyLeChuoi * 1.5 - tyLeTrung * 1.2 + (tyLeDuoi > 0.5 ? 0.4 : 0);
    if (diem > tot.diem + 1e-9) tot = { chiSo: r, diem };
  }

  if (tot.chiSo < 0) tot = { chiSo: 0, diem: 0 };
  return tot;
}

/** Chấm điểm hình dạng. Trả về hình dạng, độ tin cậy và lý do đọc được. */
export function chamHinhDang({ hang, chiSoTieuDe, oGop = [] }) {
  const lyDo = [];
  let diemBieu = 0;
  let diemDanhSach = 0;

  const soDong = Math.max(0, hang.length - chiSoTieuDe - 1);
  const rong0 = beRongThat(hang);

  if (oGop.length > 0) {
    diemBieu += 2;
    lyDo.push(`có ${oGop.length} ô gộp — dấu hiệu mạnh của biểu đã cộng`);
  }

  if (chiSoTieuDe >= 2) {
    diemBieu += 1;
    lyDo.push(`hàng tiêu đề nằm ở dòng ${chiSoTieuDe + 1}, phía trên còn ${chiSoTieuDe} dòng`);
  }

  let soDongCong = 0;
  for (let r = chiSoTieuDe + 1; r < hang.length; r++) {
    const o = hang[r] || [];
    for (let c = 0; c < Math.min(3, rong0); c++) {
      const t = chuanHoa(o[c]);
      if (t && TU_DONG_CONG.includes(t)) {
        soDongCong++;
        break;
      }
    }
  }
  if (soDongCong > 0) {
    diemBieu += 1.5;
    lyDo.push(`có ${soDongCong} dòng mang chữ tổng hoặc cộng trong vùng dữ liệu`);
  }

  if (soDong > 0 && soDong < 60) {
    diemBieu += 1;
    lyDo.push(`chỉ có ${soDong} dòng dữ liệu`);
  } else if (soDong >= 200) {
    diemDanhSach += 3;
    lyDo.push(`có ${soDong} dòng dữ liệu`);
  } else if (soDong >= 60) {
    diemDanhSach += 2;
    lyDo.push(`có ${soDong} dòng dữ liệu`);
  }

  // Cột đầu đánh mục bằng chữ số La Mã là dấu hiệu riêng của biểu mẫu. KHÔNG dùng
  // dãy số 1, 2, 3 làm dấu hiệu — đó là cột số thứ tự dòng, thứ mà danh sách nào
  // cũng có, nên dùng nó sẽ báo nhầm mọi danh sách thành biểu mẫu.
  let soLaMa = 0;
  for (let r = chiSoTieuDe + 1; r < hang.length; r++) {
    const v = (hang[r] || [])[0];
    if (rong(v)) continue;
    if (/^[IVX]{1,5}$/.test(catTrang(v))) soLaMa++;
  }
  if (soLaMa >= 2) {
    diemBieu += 1.5;
    lyDo.push(`cột đầu có ${soLaMa} mục đánh số La Mã`);
  }

  // Cột mã gần như duy nhất trên mỗi dòng là dấu hiệu của danh sách từng ca.
  let coCotDuyNhat = false;
  for (let c = 0; c < rong0 && !coCotDuyNhat; c++) {
    const tap = new Set();
    let day = 0;
    for (let r = chiSoTieuDe + 1; r < hang.length; r++) {
      const v = (hang[r] || [])[c];
      if (rong(v)) continue;
      day++;
      tap.add(v instanceof Date ? v.getTime() : String(v));
    }
    if (day >= 20 && tap.size / day > 0.9) coCotDuyNhat = true;
  }
  if (coCotDuyNhat) {
    diemDanhSach += 1.5;
    lyDo.push("có cột mà giá trị gần như duy nhất trên mỗi dòng");
  }

  let hinhDang = HINH_DANG.CHUA_XAC_DINH;
  const chenh = Math.abs(diemBieu - diemDanhSach);
  if (chenh >= 1.5) {
    hinhDang = diemBieu > diemDanhSach ? HINH_DANG.BIEU_TONG_HOP : HINH_DANG.DANH_SACH;
  }
  const doTinCay = Math.min(1, chenh / 3);
  return { hinhDang, doTinCay, lyDo, diemBieu, diemDanhSach };
}

/**
 * Dựng bảng chuẩn hoá từ vùng ô thô.
 * vungTho = { ten, hang: [[...]], oGop?: [...] }
 */
export function taoBang(vungTho) {
  const hang = vungTho.hang || [];
  const { chiSo } = timHangTieuDe(hang);
  const rong0 = beRongThat(hang);

  const tieuDe = [];
  const hangTieuDe = hang[chiSo] || [];
  for (let c = 0; c < rong0; c++) tieuDe.push(catTrang(hangTieuDe[c]));

  const dong = [];
  for (let r = chiSo + 1; r < hang.length; r++) {
    const o = hang[r] || [];
    let coDuLieu = false;
    const d = [];
    for (let c = 0; c < rong0; c++) {
      d.push(o[c] == null ? "" : o[c]);
      if (!rong(o[c])) coDuLieu = true;
    }
    if (coDuLieu) dong.push(d);
  }

  // Khối chữ phía trên hàng tiêu đề. Với biểu mẫu, tên biểu và kỳ báo cáo nằm
  // chính ở đây, nên bỏ đi thì mất hẳn cách nhận ra đang mở biểu nào.
  const dongTren = [];
  for (let r = 0; r < chiSo; r++) {
    const o = hang[r] || [];
    for (let c = 0; c < rong0; c++) {
      if (!rong(o[c])) dongTren.push(catTrang(o[c]));
    }
  }

  const hd = chamHinhDang({ hang, chiSoTieuDe: chiSo, oGop: vungTho.oGop || [] });

  return {
    ten: vungTho.ten || "",
    chiSoHangTieuDe: chiSo,
    tieuDe,
    dongTren,
    dong,
    soCot: rong0,
    soDong: dong.length,
    hinhDang: hd.hinhDang,
    doTinCayHinhDang: hd.doTinCay,
    lyDoHinhDang: hd.lyDo,
  };
}

/** Lấy một cột theo chỉ số. */
export function layCot(bang, chiSo) {
  return bang.dong.map((d) => d[chiSo]);
}

/** Tìm chỉ số cột theo tên chính xác sau chuẩn hoá. */
export function timCot(bang, ten) {
  const t = chuanHoa(ten);
  return bang.tieuDe.findIndex((x) => chuanHoa(x) === t);
}
