/**
 * Dựng bộ trang tính xuất ra.
 *
 * Năm trang, và mỗi trang trả lời một câu hỏi khác nhau:
 *
 *   Đã làm sạch      dữ liệu dùng được sau khi sửa
 *   Đối chiếu        bản sao nguyên trạng, tô ô có vấn đề — để đối chiếu bằng mắt
 *   Danh sách vấn đề mỗi phát hiện một dòng, lọc và sắp xếp được
 *   Nhóm trùng       các bản ghi trùng xếp cạnh nhau
 *   Nhật ký          từng ô đã đổi: trước, sau, và quy tắc nào sinh ra phép sửa
 *
 * MÀU KHÔNG BAO GIỜ LÀ TÍN HIỆU DUY NHẤT. Trang Đối chiếu có tô màu, nhưng mọi
 * thông tin trong màu ấy đều có mặt dưới dạng chữ ở trang Danh sách vấn đề. Màu mất
 * nghĩa ngay khi người dùng lọc, sắp xếp, in trắng đen, hoặc khi người xem không
 * phân biệt được cặp màu ấy.
 *
 * Tệp này là logic thuần, không gọi Office.js, nên đo được không cần Excel.
 */

import { MUC } from "../kiem/kiem-chung.js";
import { diaChi } from "../tien-ich/vung.js";

const TEN_MUC = {
  [MUC.CHAC_CHAN]: "Chắc chắn",
  [MUC.CAN_XAC_MINH]: "Cần xác minh",
  [MUC.GHI_NHAN]: "Ghi nhận",
};

function veGiaTri(v) {
  if (v instanceof Date) return v;
  if (v == null) return "";
  return v;
}

/**
 * Danh sách ô có vấn đề, suy từ các phát hiện.
 *
 * Phát hiện nào nêu được cột và các dòng cụ thể thì cho ra ô; phát hiện nêu cả cột
 * thì cho ra cả cột. Phát hiện không gắn với cột nào thì không cho ra ô nào —
 * không đoán bừa để có màu mà tô.
 */
export function oCoVanDe(bang, phatHien) {
  const ra = [];
  const hangDau = bang.chiSoHangTieuDe + 1; // dòng dữ liệu đầu, 0-based
  for (const p of phatHien) {
    if (p.mucDo === MUC.GHI_NHAN) continue;
    if (p.chiSoCot == null || p.chiSoCot < 0) continue;

    if (Array.isArray(p.dongLoi) && p.dongLoi.length) {
      for (const i of p.dongLoi) ra.push({ hang: hangDau + i, cot: p.chiSoCot, ma: p.ma });
      continue;
    }
    // Không biết dòng nào thì tô cả cột phần dữ liệu.
    for (let i = 0; i < bang.dong.length; i++) {
      ra.push({ hang: hangDau + i, cot: p.chiSoCot, ma: p.ma });
    }
  }
  return ra;
}

/** Trang Danh sách vấn đề. */
export function trangVanDe(bang, phatHien, tenTrangGoc = "") {
  const hang = [[
    "Mã quy tắc", "Mức", "Cột", "Số dòng chạm tới", "Vấn đề", "Đề xuất",
    "Ví dụ", "Địa chỉ ô đầu tiên",
  ]];
  const hangDau = bang.chiSoHangTieuDe + 1;

  for (const p of phatHien) {
    let dc = "";
    if (p.chiSoCot != null && p.chiSoCot >= 0) {
      const dong = Array.isArray(p.dongLoi) && p.dongLoi.length ? p.dongLoi[0] : 0;
      dc = diaChi(hangDau + dong, p.chiSoCot, hangDau + dong, p.chiSoCot);
    }
    hang.push([
      p.ma,
      TEN_MUC[p.mucDo] || p.mucDo,
      p.cot || "",
      p.soDong || 0,
      p.moTa || "",
      p.deXuat || "",
      (p.viDu || []).slice(0, 3).join(" · "),
      dc,
    ]);
  }

  if (hang.length === 1) {
    hang.push(["", "", "", 0, "Không có phát hiện nào.", "", "", ""]);
  }
  hang.push([]);
  hang.push([`Trang nguồn: ${tenTrangGoc}`]);
  hang.push(["Cột “Địa chỉ ô đầu tiên” trỏ vào trang nguồn, không phải trang này."]);
  return { ten: "Danh sach van de", hang };
}

/**
 * Trang Nhóm trùng.
 *
 * Cột “Nhóm” là thứ làm cho trang này dùng được sau khi lọc hay sắp xếp — nếu chỉ
 * dựa vào việc các dòng nằm cạnh nhau thì một thao tác sắp xếp là mất hết thông tin.
 */
export function trangNhomTrung(bang, dsNhom) {
  const hang = [["Nhóm", "Lý do coi là trùng", "Dòng trên trang nguồn", ...bang.tieuDe]];
  let so = 0;
  for (const nhom of dsNhom || []) {
    so++;
    for (const i of nhom.dong) {
      hang.push([
        so,
        nhom.lyDo || "",
        bang.chiSoHangTieuDe + 2 + i,
        ...bang.dong[i].map(veGiaTri),
      ]);
    }
  }
  if (so === 0) hang.push(["", "Không tìm thấy nhóm trùng nào.", ""]);
  return { ten: "Nhom trung", hang };
}

/**
 * Gom các CẶP dòng trùng thành NHÓM.
 *
 * Phép so trùng trả về từng cặp [giữ, bỏ]. Nhưng một người có thể bị nhập ba lần,
 * khi ấy có hai cặp cùng trỏ về một dòng gốc và người dùng cần nhìn cả ba dòng
 * cạnh nhau chứ không phải hai cặp rời. Gom bằng cách nối các cặp có chung dòng.
 *
 * @param {Array} capTrung [[giữ, bỏ], …] chỉ số dòng dữ liệu 0-based
 */
export function nhomTuCap(capTrung, lyDo = "Giống nhau ở mọi cột mang thông tin") {
  const cha = new Map();
  const tim = (x) => {
    while (cha.get(x) !== x) {
      cha.set(x, cha.get(cha.get(x)));
      x = cha.get(x);
    }
    return x;
  };
  for (const [a, b] of capTrung || []) {
    if (!cha.has(a)) cha.set(a, a);
    if (!cha.has(b)) cha.set(b, b);
    const ra = tim(a);
    const rb = tim(b);
    if (ra !== rb) cha.set(rb, ra);
  }
  const theoGoc = new Map();
  for (const x of cha.keys()) {
    const g = tim(x);
    if (!theoGoc.has(g)) theoGoc.set(g, []);
    theoGoc.get(g).push(x);
  }
  return [...theoGoc.values()]
    .map((dong) => ({ dong: dong.sort((a, b) => a - b), lyDo }))
    .sort((a, b) => a.dong[0] - b.dong[0]);
}

/** Trang Đối chiếu — bản sao nguyên trạng của vùng dữ liệu. */
export function trangDoiChieu(bang, ghiChuChan = "") {
  const hang = [bang.tieuDe.slice(), ...bang.dong.map((d) => d.map(veGiaTri))];
  if (ghiChuChan) {
    hang.push([]);
    hang.push([ghiChuChan]);
  }
  return { ten: "Doi chieu", hang };
}

/**
 * Dựng cả bộ trang.
 *
 * @param {object} p { bang, phatHien, ketQuaSua, dsNhomTrung, tenTrangGoc, ghiChuChan }
 * @returns {Array} danh sách trang, mỗi trang { ten, hang }
 */
export function dungBoTrang(p) {
  const {
    bang, phatHien = [], ketQuaSua = null, dsNhomTrung = null,
    tenTrangGoc = "", ghiChuChan = "", nhatKy = null,
  } = p;

  const ds = [];
  if (ketQuaSua) ds.push({ ten: "Da lam sach", hang: ketQuaSua.hang });
  ds.push(trangDoiChieu(bang, ghiChuChan));
  ds.push(trangVanDe(bang, phatHien, tenTrangGoc));
  if (dsNhomTrung) ds.push(trangNhomTrung(bang, dsNhomTrung));
  if (nhatKy) ds.push(nhatKy);
  return ds;
}
