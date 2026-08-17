/**
 * Hồ sơ đơn vị — nơi lưu câu trả lời của người dùng.
 *
 * Đây là thứ khiến việc phỏng vấn đáng bỏ công. Trả lời một lần, dùng mãi:
 *   - lần sau mở tệp cùng loại thì không hỏi lại;
 *   - tệp hồ sơ chia sẻ được cho đồng nghiệp, cả cơ quan trả lời một lần;
 *   - và nó tự trở thành một hồ sơ nhận dạng mới cho tầng 2.
 *
 * Công cụ học được, nhưng học từ người dùng chứ không từ mô hình nào.
 */

import { chuanHoa } from "../tien-ich/chuoi.js";

export const PHIEN_BAN = 1;

/** Chữ ký cấu trúc của một bảng: dùng để nhận ra "vẫn là loại tệp ấy". */
export function chuKyCauTruc(bang) {
  const ten = bang.tieuDe.map((t) => chuanHoa(t)).filter(Boolean).sort();
  return ten.join("|");
}

export function hoSoMoi(bang, { ten = "", ghiChu = "" } = {}) {
  return {
    phienBan: PHIEN_BAN,
    ten: ten || bang.ten || "Hồ sơ chưa đặt tên",
    ghiChu,
    chuKy: chuKyCauTruc(bang),
    soCot: bang.soCot,
    tieuDe: bang.tieuDe.slice(),
    traLoi: {},
  };
}

/** Chữ ký khớp bao nhiêu phần trăm — cho phép tệp thêm bớt vài cột. */
export function doKhop(hoSo, bang) {
  const a = new Set(hoSo.chuKy.split("|").filter(Boolean));
  const b = new Set(chuKyCauTruc(bang).split("|").filter(Boolean));
  if (!a.size || !b.size) return 0;
  let chung = 0;
  for (const x of b) if (a.has(x)) chung++;
  return chung / Math.max(a.size, b.size);
}

export function ghiTraLoi(hoSo, maCauHoi, maLuaChon, { boiVi = "" } = {}) {
  hoSo.traLoi[maCauHoi] = { chon: maLuaChon, boiVi };
  return hoSo;
}

export function docTraLoi(hoSo) {
  const ra = {};
  for (const [k, v] of Object.entries(hoSo.traLoi || {})) ra[k] = v.chon;
  return ra;
}

/**
 * Rút ra những quyết định mà lõi cần, từ các câu trả lời đã ghi.
 * Đây là chỗ duy nhất dịch từ câu trả lời của người sang tham số của máy.
 */
export function quyetDinhTu(hoSo, bang) {
  const tl = hoSo && hoSo.traLoi ? hoSo.traLoi : {};
  const qd = {
    khoaNhanDang: null, // mảng chỉ số cột, hoặc null nếu chưa chọn
    nghiaOTrong: {}, // chỉ số cột → mã nghĩa
    thuTuNgay: {}, // chỉ số cột → "ngay-truoc" | "thang-truoc"
    capMaNhan: [], // [[chỉ số a, chỉ số b]]
    coDinhDanh: null,
    gopGiaTri: [], // [{cot, tu, den}] — den rỗng nghĩa là xoá giá trị
  };

  for (const [ma, v] of Object.entries(tl)) {
    if (ma.startsWith("KHOA:")) {
      qd.khoaNhanDang = v.chon === "khong-gop" ? [] : v.chon.split(",").map(Number);
    } else if (ma.startsWith("TRONG:")) {
      for (const c of ma.slice(6).split("-").map(Number)) qd.nghiaOTrong[c] = v.chon;
    } else if (ma.startsWith("NGAY:")) {
      qd.thuTuNgay[Number(ma.slice(5))] = v.chon;
    } else if (ma.startsWith("MANHAN:")) {
      if (v.chon === "cap-ma-nhan") qd.capMaNhan.push(ma.slice(7).split("-").map(Number));
    } else if (ma.startsWith("DINHDANH:")) {
      qd.coDinhDanh = v.chon === "co";
    } else if (ma.startsWith("HIEM:")) {
      const [, cot, gt] = ma.split(":");
      const tu = decodeURIComponent(gt);
      if (v.chon === "giu-rieng") continue;
      qd.gopGiaTri.push({
        cot: Number(cot),
        tu,
        den: v.chon === "de-trong" ? "" : v.chon.slice(1),
      });
    }
  }

  // Cột thuộc vế mã của một cặp mã–nhãn thì loại khỏi phần tổng hợp, để cùng
  // một thứ không bị đếm hai lần.
  qd.cotBoKhiTongHop = [];
  for (const [a, b] of qd.capMaNhan) {
    const ca = bang.cot[a];
    const cb = bang.cot[b];
    if (!ca || !cb) continue;
    // Vế mã là vế mà giá trị ngắn hơn và thiên về chữ số.
    const diem = (c) => {
      const m = [...c.tanSuat.keys()].slice(0, 20);
      const daiTb = m.reduce((t, x) => t + String(x).length, 0) / Math.max(1, m.length);
      const tySo = m.filter((x) => /^\d+$/.test(String(x).trim())).length / Math.max(1, m.length);
      return tySo * 2 - daiTb / 20;
    };
    qd.cotBoKhiTongHop.push(diem(ca) >= diem(cb) ? a : b);
  }
  return qd;
}

export function sangJson(hoSo) {
  return JSON.stringify(hoSo, null, 2);
}

export function tuJson(chuoi) {
  const h = JSON.parse(chuoi);
  if (!h || h.phienBan !== PHIEN_BAN) {
    throw new Error("Tệp hồ sơ đơn vị không đúng phiên bản.");
  }
  return h;
}
