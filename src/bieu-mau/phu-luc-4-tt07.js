/**
 * Dựng biểu mẫu Phụ lục 4 — Báo cáo tổng hợp số liệu giám sát ca bệnh HIV/AIDS,
 * ban hành kèm Thông tư 07/2023/TT-BYT (Điều 11 khoản 4).
 *
 * CẮT KỲ theo Thông tư 07 Điều 11 khoản 2: quý tính từ ngày đầu tiên đến hết ngày
 * cuối cùng của quý; năm tính từ ngày đầu tiên đến hết ngày cuối cùng của năm.
 * KHÔNG dùng quy tắc của Thông tư 05 Điều 3 (từ ngày 15 tháng trước đến ngày 14
 * tháng cuối quý) — đó là chế độ báo cáo khác, cắt kỳ khác.
 *
 * Mỗi ô đều kèm danh sách chỉ số dòng đã đếm vào ô đó, để người dùng đối chiếu và
 * giải trình được con số của mình.
 */

import { chuanHoa } from "../tien-ich/chuoi.js";
import { khoangKy, trongKhoang } from "../tien-ich/ngay.js";
import { docNgay } from "../ho-so/hivinfo-giam-sat-ca-benh.js";

const NAM = new Set(["nam", "m", "male", "1"]);
const NU = new Set(["nu", "f", "female", "2"]);
const DA_TU_VONG = new Set(["tu vong", "da tu vong", "deceased"]);

function gioiCua(v) {
  const t = chuanHoa(v);
  if (NAM.has(t)) return "nam";
  if (NU.has(t)) return "nu";
  return "khongRo";
}

/** Đếm một tập dòng, tách theo giới. */
function dem(bang, cGioi, chiSo) {
  const o = { nam: 0, nu: 0, khongRo: 0, tong: 0, dong: chiSo };
  for (const i of chiSo) {
    o.tong++;
    if (cGioi == null) {
      o.khongRo++;
      continue;
    }
    o[gioiCua(bang.dong[i][cGioi])]++;
  }
  return o;
}

/**
 * @param {object} bang       bảng đã chuẩn hoá
 * @param {Map} vt            bản đồ vai trò → chỉ số cột
 * @param {object} ky         { nam, quy }  quy = null nghĩa là báo cáo năm
 */
export function dungPhuLuc4(bang, vt, { nam, quy = null }) {
  const thieu = [];
  const cKd = vt.get("ngay_khang_dinh");
  const cGioi = vt.get("gioi_tinh");
  const cNgoai = vt.get("ngoai_tinh");
  const cNhiemMoi = vt.get("ket_luan_nhiem_moi");
  const cNtv = vt.get("ngay_tu_vong");
  const cTt = vt.get("trang_thai_nguoi_nhiem");

  if (cKd == null) thieu.push("ngày xét nghiệm khẳng định");
  if (cGioi == null) thieu.push("giới tính");
  if (cNgoai == null) thieu.push("cờ ngoại tỉnh");
  if (cNhiemMoi == null) thieu.push("kết luận chẩn đoán nhiễm mới");
  if (cNtv == null && cTt == null) thieu.push("thông tin tử vong");

  if (cKd == null) {
    return { dungDuoc: false, thieu, dong: [], ghiChu: [] };
  }

  const kyQuy = quy == null ? null : khoangKy({ nam, quy });
  const cuoiKy = kyQuy ? kyQuy.den : khoangKy({ nam }).den;
  const tuDauNam = { tu: khoangKy({ nam }).tu, den: cuoiKy };

  const ngayKd = bang.dong.map((d) => docNgay(d[cKd]));
  const ngayTv = cNtv == null ? bang.dong.map(() => null) : bang.dong.map((d) => docNgay(d[cNtv]));

  const laNgoaiTinh = (i) => {
    if (cNgoai == null) return false;
    const t = chuanHoa(bang.dong[i][cNgoai]);
    return t === "x" || t === "co" || t === "1" || t === "true";
  };
  const laNhiemMoi = (i) => {
    if (cNhiemMoi == null) return false;
    return chuanHoa(bang.dong[i][cNhiemMoi]) === "nhiem moi";
  };
  const daTuVong = (i) => {
    if (cTt != null && DA_TU_VONG.has(chuanHoa(bang.dong[i][cTt]))) return true;
    return false;
  };

  const loc = (dk) => {
    const r = [];
    for (let i = 0; i < bang.dong.length; i++) if (dk(i)) r.push(i);
    return r;
  };

  const phatHien = (kh) => loc((i) => ngayKd[i] && trongKhoang(ngayKd[i], kh));
  const tuVongTrong = (kh) => loc((i) => ngayTv[i] && trongKhoang(ngayTv[i], kh));

  const dong = [];
  const them = (muc, noiDung, chiSo, capDo = 1) =>
    dong.push({ muc, noiDung, capDo, ...dem(bang, cGioi, chiSo) });

  if (kyQuy) {
    dong.push({ muc: "I", noiDung: "Số liệu báo cáo quý", capDo: 0, tieuDeMuc: true });
    const pq = phatHien(kyQuy);
    them("1", "Số người nhiễm HIV phát hiện mới trong quý", pq);
    them("", "trong đó: số người nhiễm HIV ngoại tỉnh phát hiện mới trong quý",
      pq.filter(laNgoaiTinh), 2);
    them("2", "Số người phát hiện nhiễm mới HIV theo phương cách trong quý",
      pq.filter(laNhiemMoi));
    them("3", "Số người nhiễm HIV tử vong trong quý", tuVongTrong(kyQuy));
  }

  dong.push({
    muc: "II",
    noiDung: "Số liệu từ đầu năm đến cuối kỳ báo cáo",
    capDo: 0,
    tieuDeMuc: true,
  });
  const pn = phatHien(tuDauNam);
  them("1", "Số người nhiễm HIV phát hiện mới", pn);
  them("", "trong đó: số người nhiễm HIV ngoại tỉnh phát hiện mới",
    pn.filter(laNgoaiTinh), 2);
  them("2", "Số người phát hiện nhiễm mới HIV theo phương cách", pn.filter(laNhiemMoi));
  them("3", "Số người nhiễm HIV tử vong", tuVongTrong(tuDauNam));

  dong.push({
    muc: "III",
    noiDung: "Số người nhiễm HIV hiện quản lý tính đến cuối kỳ báo cáo",
    capDo: 0,
    tieuDeMuc: true,
  });
  const luyTich = loc((i) => ngayKd[i] && ngayKd[i] <= cuoiKy);
  const tuVongLuy = luyTich.filter((i) => (ngayTv[i] && ngayTv[i] <= cuoiKy) || daTuVong(i));
  const tapTuVong = new Set(tuVongLuy);
  them("1", "Số người nhiễm HIV lũy tích", luyTich);
  them("2", "Số người nhiễm HIV còn sống", luyTich.filter((i) => !tapTuVong.has(i)));
  them("3", "Số người nhiễm HIV tử vong", tuVongLuy);

  const ghiChu = [];
  ghiChu.push(
    quy == null
      ? `Kỳ báo cáo năm ${nam}, cắt số liệu từ 01/01/${nam} đến 31/12/${nam} theo Thông tư 07/2023/TT-BYT Điều 11 khoản 2.`
      : `Kỳ báo cáo quý ${quy} năm ${nam}, cắt số liệu từ ngày đầu tiên đến hết ngày cuối cùng của quý theo Thông tư 07/2023/TT-BYT Điều 11 khoản 2.`
  );

  const khongRo = dong.reduce((t, d) => t + (d.khongRo || 0), 0);
  if (khongRo > 0) {
    ghiChu.push(
      `Có ô giới tính không đọc được ở một số dòng, tổng cộng ${khongRo} lượt đếm. ` +
        "Các dòng này vào cột Tổng nhưng không vào cột Nam hay cột Nữ, nên Nam cộng Nữ sẽ nhỏ hơn Tổng."
    );
  }
  if (cNhiemMoi != null) {
    const coKl = bang.dong.filter((d) => chuanHoa(d[cNhiemMoi]) !== "").length;
    const tyLe = bang.dong.length ? Math.round((coKl / bang.dong.length) * 100) : 0;
    ghiChu.push(
      `Chỉ ${tyLe}% số dòng có kết luận chẩn đoán nhiễm mới. Dòng số 2 của biểu vì vậy ` +
        "phản ánh số ca đã được xét nghiệm và có kết luận, không phải toàn bộ ca phát hiện mới."
    );
  }
  if (cNgoai != null) {
    // KHÔNG phán đoán tỷ lệ này cao hay thấp là bất thường. Máy không biết cột
    // đánh dấu điều gì, và đoán sai thì thành mắng oan. Chỉ nêu con số đã đếm,
    // rồi để cơ chế phỏng vấn hỏi người dùng nghĩa của cột.
    const soNgoai = bang.dong.filter((d, i) => laNgoaiTinh(i)).length;
    const ty = bang.dong.length ? Math.round((soNgoai / bang.dong.length) * 100) : 0;
    ghiChu.push(
      `Dòng “trong đó ngoại tỉnh” đếm theo cột “${bang.tieuDe[cNgoai]}”; ` +
        `${ty}% số dòng của tệp có dấu ở cột này.`
    );
  }
  if (thieu.length) {
    ghiChu.push(`Thiếu cột: ${thieu.join(", ")}. Các dòng liên quan để trống.`);
  }

  return { dungDuoc: true, thieu, dong, ghiChu, cuoiKy };
}
