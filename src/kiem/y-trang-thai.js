/**
 * Nhóm Y2 — trạng thái và sự kiện mâu thuẫn nhau.
 *
 * Phân loại giá trị trạng thái có bỏ dấu tiếng Việt, và đây là ngoại lệ có chủ ý
 * của quy tắc "không bỏ dấu khi so giá trị dữ liệu". Lý do: ở đây máy KHÔNG gộp
 * hai giá trị thành một, nó chỉ hỏi "giá trị này có thuộc nhóm đã biết không".
 * Nhận `Tử vong` và `tu vong` vào cùng một nhóm không làm mất giá trị nào, khác
 * hẳn việc gộp `Xã Vĩnh Thanh` với `Xã Vĩnh Thạnh` thành một xã.
 */

import { MUC } from "./kiem-chung.js";
import { chuanHoa } from "../tien-ich/chuoi.js";
import { docNgayTheo } from "../sua/sua-du-lieu.js";
import { nhanKhaiNiem } from "../tu-dien/khai-niem.js";

/** Các nhóm trạng thái nhận ra được. Khoá so theo ranh giới từ trên bản bỏ dấu. */
export const NHOM_TT = {
  TU_VONG: "tu-vong",
  DANG_DIEU_TRI: "dang-dieu-tri",
  BO_TRI: "bo-tri",
  CHUYEN_DI: "chuyen-di",
  AM_TINH: "am-tinh",
  DUONG_TINH: "duong-tinh",
};

const KHOA_TT = [
  { nhom: NHOM_TT.TU_VONG, khoa: ["tu vong", "da chet", "chet", "deceased", "death"] },
  {
    nhom: NHOM_TT.DANG_DIEU_TRI,
    khoa: ["dang dieu tri", "con dieu tri", "duy tri dieu tri", "dang tham gia", "active"],
  },
  { nhom: NHOM_TT.BO_TRI, khoa: ["bo dieu tri", "bo tri", "mat dau", "lost", "ltfu"] },
  { nhom: NHOM_TT.CHUYEN_DI, khoa: ["chuyen di", "chuyen tuyen", "chuyen ngoai tinh", "transfer out"] },
  { nhom: NHOM_TT.AM_TINH, khoa: ["am tinh", "khong nhiem", "negative", "=am"] },
  { nhom: NHOM_TT.DUONG_TINH, khoa: ["duong tinh", "nhiem hiv", "positive", "=duong"] },
];

/** Giá trị này thuộc nhóm trạng thái nào; null nếu không nhận ra. */
export function nhomCua(v) {
  const t = chuanHoa(v);
  if (!t) return null;
  for (const k of KHOA_TT) {
    for (const kh of k.khoa) {
      if (kh.startsWith("=")) {
        if (t === kh.slice(1)) return k.nhom;
      } else if (new RegExp(`(?<![\\p{L}\\p{N}_])${kh}(?![\\p{L}\\p{N}_])`, "u").test(t)) {
        return k.nhom;
      }
    }
  }
  return null;
}

function phat(ds, o) {
  ds.push({ viDu: [], suaDuoc: false, ...o });
}

function coGiaTri(v) {
  return v != null && !(typeof v === "string" && v.trim() === "");
}

/**
 * Kiểm nhóm Y2.
 * @param {object} bang bảng đã chạy suyKieuBang
 * @param {object} tuyChon { kn, thuTuNgay }
 */
export function kiemTrangThai(bang, tuyChon = {}) {
  const ds = [];
  const kn = tuyChon.kn || nhanKhaiNiem(bang);
  const thuTu = tuyChon.thuTuNgay || "ngay-truoc";
  const soHang = (i) => bang.chiSoHangTieuDe + 2 + i;
  const lay = (ma) => kn.theoMa.get(ma);
  const oCua = (i, c) => (c == null ? null : bang.dong[i][c]);

  const cTTDieuTri = lay("TRANG_THAI_DIEU_TRI");
  const cTTNguoi = lay("TRANG_THAI_NGUOI");
  const cNgayTV = lay("NGAY_TU_VONG");
  const cLyDo = lay("LY_DO_KET_THUC");
  const cNgayKT = lay("NGAY_KET_THUC");
  const cKetQua = lay("KET_QUA_KHANG_DINH");
  const cARV = lay("NGAY_ARV_DAU");
  const cMaBN = lay("MA_BENH_NHAN");
  const cKhamCuoi = lay("NGAY_KHAM_CUOI");

  /** Nhóm trạng thái của dòng i, xét cả hai cột trạng thái. */
  const nhomDong = (i) => {
    for (const c of [cTTNguoi, cTTDieuTri]) {
      if (c == null) continue;
      const n = nhomCua(bang.dong[i][c]);
      if (n) return { nhom: n, cot: c };
    }
    return { nhom: null, cot: null };
  };

  // ------------------------------------------------------------------ Y2.1
  if (cNgayTV != null && (cTTDieuTri != null || cTTNguoi != null)) {
    const vp = [];
    for (let i = 0; i < bang.dong.length; i++) {
      if (!docNgayTheo(oCua(i, cNgayTV), thuTu)) continue;
      const { nhom } = nhomDong(i);
      if (nhom === NHOM_TT.DANG_DIEU_TRI) vp.push(`dòng ${soHang(i)}`);
    }
    if (vp.length) {
      phat(ds, {
        ma: "Y2.1",
        mucDo: MUC.CHAC_CHAN,
        cot: bang.tieuDe[cNgayTV] || "",
        chiSoCot: cNgayTV,
        soDong: vp.length,
        moTa: `${vp.length} dòng ghi trạng thái đang điều trị nhưng lại có ngày tử vong.`,
        viDu: vp.slice(0, 5),
        deXuat: "Một trong hai cột chưa được cập nhật; đối chiếu với sổ điều trị.",
      });
    }
  }

  // ------------------------------------------------------------------ Y2.2
  if (cNgayTV != null && (cTTDieuTri != null || cTTNguoi != null)) {
    const vp = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const { nhom } = nhomDong(i);
      if (nhom !== NHOM_TT.TU_VONG) continue;
      if (!docNgayTheo(oCua(i, cNgayTV), thuTu)) vp.push(`dòng ${soHang(i)}`);
    }
    if (vp.length) {
      phat(ds, {
        ma: "Y2.2",
        mucDo: MUC.CAN_XAC_MINH,
        cot: bang.tieuDe[cNgayTV] || "",
        chiSoCot: cNgayTV,
        soDong: vp.length,
        moTa:
          `${vp.length} dòng ghi trạng thái tử vong nhưng không có ngày tử vong. ` +
          "Mọi phép tính theo thời gian sẽ bỏ sót đúng những ca này.",
        viDu: vp.slice(0, 5),
        deXuat: "Bổ sung ngày tử vong từ sổ nguồn, hoặc ghi rõ là không xác định được.",
      });
    }
  }

  // ------------------------------------------------------------ Y2.3, Y2.4
  // Kết quả âm tính nhưng có dấu hiệu đang điều trị HIV.
  //
  // MỨC CẦN XÁC MINH, không phải chắc chắn. Hai ngoại lệ có thật: trẻ dưới 18
  // tháng có lâm sàng tiến triển và kháng thể dương được điều trị ngay trong khi
  // chờ xét nghiệm phát hiện acid nucleic; và thuốc kháng HIV còn dùng để dự phòng
  // trước hoặc sau phơi nhiễm ở người chưa nhiễm.
  // Y2.4 ĐÃ BỎ. Nó định nghĩa là "kết quả âm tính nhưng có mã bệnh án điều trị",
  // nhưng máy chỉ nhận được cột mã bệnh nhân — mà mọi dòng đều có mã bệnh nhân.
  // Nên nó nổ đúng những dòng Y2.3 đã nổ, không thêm một tin nào. Bộ thử sinh theo
  // tổ hợp phát hiện điều này: 44 ca có Y2.4 đi kèm Y2.3 và không ca nào có Y2.4
  // đứng một mình.
  if (cKetQua != null) {
    for (const [ma, cot, ten] of [
      ["Y2.3", cARV, "ngày bắt đầu điều trị ARV"],
    ]) {
      if (cot == null) continue;
      const vp = [];
      for (let i = 0; i < bang.dong.length; i++) {
        if (nhomCua(oCua(i, cKetQua)) !== NHOM_TT.AM_TINH) continue;
        if (coGiaTri(oCua(i, cot))) vp.push(`dòng ${soHang(i)}`);
      }
      if (!vp.length) continue;
      phat(ds, {
        ma,
        mucDo: MUC.CAN_XAC_MINH,
        cot: bang.tieuDe[cKetQua] || "",
        chiSoCot: cKetQua,
        soDong: vp.length,
        moTa:
          `${vp.length} dòng có kết quả khẳng định âm tính nhưng vẫn có ${ten}. ` +
          "Chưa chắc là lỗi: trẻ nhỏ chưa khẳng định được vẫn có thể được điều trị " +
          "trong khi chờ kết quả, và thuốc kháng HIV còn dùng để dự phòng cho người " +
          "chưa nhiễm. Máy không tự quyết.",
        viDu: vp.slice(0, 5),
        deXuat: "Đối chiếu hồ sơ: nếu là dự phòng hoặc đang chờ khẳng định thì ghi rõ vào cột trạng thái.",
      });
    }
  }

  // ------------------------------------------------------------ Y2.5, Y2.6
  if (cLyDo != null && cNgayKT != null) {
    const thieuNgay = [];
    const thieuLyDo = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const coLyDo = coGiaTri(oCua(i, cLyDo));
      const coNgay = !!docNgayTheo(oCua(i, cNgayKT), thuTu);
      if (coLyDo && !coNgay) thieuNgay.push(`dòng ${soHang(i)}`);
      if (coNgay && !coLyDo) thieuLyDo.push(`dòng ${soHang(i)}`);
    }
    if (thieuNgay.length) {
      phat(ds, {
        ma: "Y2.5",
        mucDo: MUC.CAN_XAC_MINH,
        cot: bang.tieuDe[cNgayKT] || "",
        chiSoCot: cNgayKT,
        soDong: thieuNgay.length,
        moTa: `${thieuNgay.length} dòng có lý do kết thúc nhưng không có ngày kết thúc.`,
        viDu: thieuNgay.slice(0, 5),
        deXuat: "Bổ sung ngày kết thúc, vì thiếu nó thì không xếp được ca vào kỳ báo cáo nào.",
      });
    }
    if (thieuLyDo.length) {
      phat(ds, {
        ma: "Y2.6",
        mucDo: MUC.CAN_XAC_MINH,
        cot: bang.tieuDe[cLyDo] || "",
        chiSoCot: cLyDo,
        soDong: thieuLyDo.length,
        moTa: `${thieuLyDo.length} dòng có ngày kết thúc nhưng không ghi lý do.`,
        viDu: thieuLyDo.slice(0, 5),
        deXuat: "Bổ sung lý do; nếu không rõ thì ghi rõ là không xác định được.",
      });
    }
  }

  // ------------------------------------------------------------------ Y2.7
  if (cKhamCuoi != null && (cTTDieuTri != null || cTTNguoi != null) && cNgayKT != null) {
    const vp = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const { nhom } = nhomDong(i);
      if (nhom !== NHOM_TT.BO_TRI && nhom !== NHOM_TT.CHUYEN_DI) continue;
      const kt = docNgayTheo(oCua(i, cNgayKT), thuTu);
      const kham = docNgayTheo(oCua(i, cKhamCuoi), thuTu);
      if (kt && kham && kham.getTime() > kt.getTime()) vp.push(`dòng ${soHang(i)}`);
    }
    if (vp.length) {
      phat(ds, {
        ma: "Y2.7",
        mucDo: MUC.CAN_XAC_MINH,
        cot: bang.tieuDe[cKhamCuoi] || "",
        chiSoCot: cKhamCuoi,
        soDong: vp.length,
        moTa:
          `${vp.length} dòng ghi đã bỏ trị hoặc chuyển đi, nhưng ngày khám gần nhất ` +
          "lại sau ngày kết thúc. Có thể người bệnh đã quay lại mà trạng thái chưa được cập nhật.",
        viDu: vp.slice(0, 5),
        deXuat: "Cập nhật lại trạng thái nếu người bệnh đã quay lại điều trị.",
      });
    }
  }

  // ------------------------------------------------------------------ Y2.8
  // Hai cột trạng thái nói ngược nhau.
  if (cTTDieuTri != null && cTTNguoi != null) {
    const vp = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const a = nhomCua(oCua(i, cTTDieuTri));
      const b = nhomCua(oCua(i, cTTNguoi));
      if (!a || !b) continue;
      const nguoc =
        (a === NHOM_TT.TU_VONG && b === NHOM_TT.DANG_DIEU_TRI) ||
        (b === NHOM_TT.TU_VONG && a === NHOM_TT.DANG_DIEU_TRI);
      if (nguoc) vp.push(`dòng ${soHang(i)}: “${bang.dong[i][cTTDieuTri]}” và “${bang.dong[i][cTTNguoi]}”`);
    }
    if (vp.length) {
      phat(ds, {
        ma: "Y2.8",
        mucDo: MUC.CHAC_CHAN,
        cot: `${bang.tieuDe[cTTDieuTri]} · ${bang.tieuDe[cTTNguoi]}`,
        chiSoCot: cTTDieuTri,
        soDong: vp.length,
        moTa: `${vp.length} dòng có hai cột trạng thái nói ngược nhau về cùng một người.`,
        viDu: vp.slice(0, 5),
        deXuat: "Chốt một cột làm cột chuẩn rồi cập nhật cột kia theo.",
      });
    }
  }

  // ------------------------------------------------------------------ Y2.10
  // Các cột cùng nói về tử vong cho ra số ca khác nhau.
  const dem = [];
  if (cNgayTV != null) {
    let n = 0;
    for (let i = 0; i < bang.dong.length; i++) if (docNgayTheo(oCua(i, cNgayTV), thuTu)) n++;
    dem.push({ ten: bang.tieuDe[cNgayTV] || "ngày tử vong", n });
  }
  for (const c of [cTTNguoi, cTTDieuTri]) {
    if (c == null) continue;
    let n = 0;
    for (let i = 0; i < bang.dong.length; i++) if (nhomCua(oCua(i, c)) === NHOM_TT.TU_VONG) n++;
    dem.push({ ten: bang.tieuDe[c] || `cột ${c + 1}`, n });
  }
  if (cLyDo != null) {
    let n = 0;
    for (let i = 0; i < bang.dong.length; i++) if (nhomCua(oCua(i, cLyDo)) === NHOM_TT.TU_VONG) n++;
    dem.push({ ten: bang.tieuDe[cLyDo] || "lý do kết thúc", n });
  }
  const coSo = dem.filter((d) => d.n > 0);
  if (coSo.length >= 2 && new Set(coSo.map((d) => d.n)).size > 1) {
    phat(ds, {
      ma: "Y2.10",
      mucDo: MUC.CAN_XAC_MINH,
      cot: coSo.map((d) => d.ten).join(" · "),
      chiSoCot: -1,
      soDong: Math.max(...coSo.map((d) => d.n)) - Math.min(...coSo.map((d) => d.n)),
      moTa:
        "Các cột cùng nói về tử vong cho ra số ca khác nhau: " +
        coSo.map((d) => `${d.ten} = ${d.n}`).join("; ") +
        ". Số ca tử vong trong báo cáo sẽ khác nhau tuỳ người làm chọn cột nào, " +
        "mà thường không ai biết là mình đang chọn.",
      viDu: [],
      deXuat: "Chốt một cột làm cột chuẩn cho mọi báo cáo, và ghi lựa chọn ấy vào tài liệu của đơn vị.",
    });
  }

  return ds;
}
