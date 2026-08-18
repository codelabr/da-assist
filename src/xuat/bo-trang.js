/**
 * Dựng bộ trang tính xuất ra.
 *
 * Bốn trang, và mỗi trang trả lời một câu hỏi khác nhau:
 *
 *   Đã làm sạch      dữ liệu dùng được sau khi sửa, tô những ô đã đổi
 *   Danh sách vấn đề mỗi phát hiện một dòng, lọc và sắp xếp được
 *   Nhóm trùng       các bản ghi trùng xếp cạnh nhau
 *   Nhật ký          từng ô đã đổi: trước, sau, và quy tắc nào sinh ra phép sửa
 *
 * KHÔNG CÓ TRANG ĐỐI CHIẾU. Bản đầu có thêm một trang chép nguyên trạng vùng dữ
 * liệu để tô những ô có vấn đề rồi so bằng mắt. Bỏ theo quyết định ngày 18/8/2026:
 * nó nhân đôi dung lượng tệp cho một việc mà trang Danh sách vấn đề đã làm đầy đủ
 * hơn bằng chữ, lại còn lọc và sắp xếp được.
 *
 * MÀU KHÔNG BAO GIỜ LÀ TÍN HIỆU DUY NHẤT. Trang Đã làm sạch có tô những ô đã đổi,
 * nhưng mọi ô ấy đều có mặt dưới dạng chữ ở trang Nhật ký. Màu mất nghĩa ngay khi
 * người dùng lọc, sắp xếp, in trắng đen, hoặc khi người xem không phân biệt được
 * cặp màu ấy.
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
 * Ba nhóm ô cần tô trên trang Đã làm sạch.
 *
 *   xanh  ô đã được sửa, và dòng được giữ lại của mỗi nhóm trùng
 *   vàng  ô còn vấn đề mà chưa sửa
 *
 * MỘT NGUYÊN TẮC, KHÔNG CÓ NGOẠI LỆ: chỉ tô khi biết ĐÍCH XÁC ô nào. Phép kiểm chỉ
 * nói "cột này có 37 ô sai" mà không nói dòng nào thì không tô gì cho nó — bản đầu
 * tô cả cột trong trường hợp ấy, và một cột vàng rực từ đầu đến cuối không chỉ ra
 * được gì. Số phát hiện không tô được trả về ở `soKhongDinhVi` để vỏ nói ra, chứ
 * không im lặng.
 *
 * Vàng tô SAU cùng nên thắng khi chồng lên xanh: một ô vừa được sửa một lỗi vừa còn
 * lỗi khác thì việc còn lại quan trọng hơn việc đã xong.
 */
export function oToMau(bang, phatHien, ketQuaSua) {
  // Gom qua tập khoá để một ô không bị đẩy vào hai lần. Dòng giữ lại của nhóm
  // trùng được tô cả dòng, mà dòng ấy thường cũng có vài ô được sửa — đẩy trùng
  // thì phép gom vùng phải làm việc thừa và ngân sách 2.000 vùng hụt đi vô cớ.
  const tapXanh = new Map();
  const vang = [];
  let soKhongDinhVi = 0;
  const themXanh = (hang, cot) => tapXanh.set(hang + ":" + cot, { hang, cot });

  const anhXa = (ketQuaSua && ketQuaSua.anhXaDong) || null;
  const soCot = bang.tieuDe.length;

  // Dòng giữ lại của mỗi nhóm trùng — tô cả dòng.
  for (const h of (ketQuaSua && ketQuaSua.dongGiuTrung) || []) {
    for (let c = 0; c < soCot; c++) themXanh(h, c);
  }

  // Ô đã sửa.
  for (const o of (ketQuaSua && ketQuaSua.oDaSua) || []) themXanh(o.hang, o.cot);

  // Cột đã có ít nhất một ô được sửa. Phép sửa chạy trên CẢ CỘT chứ không chạy
  // trên từng ô, nên một cột đã được sửa thì phát hiện sửa được ở cột ấy coi như
  // đã xong — kể cả những ô mà phép sửa không phải động tới.
  //
  // Thiếu chốt này thì tô sai theo đúng hướng ngược: cột giới tính lẫn "Nam " với
  // "nam" được thống nhất về một dạng, những ô vốn đã đúng dạng ấy không phải đổi
  // gì, và chúng hiện ra vàng như thể vẫn còn lỗi.
  const cotDaSua = new Set(((ketQuaSua && ketQuaSua.oDaSua) || []).map((o) => o.cot));

  // Ô còn vấn đề mà chưa sửa.
  for (const p of phatHien) {
    if (p.mucDo === MUC.GHI_NHAN) continue;
    if (p.chiSoCot == null || p.chiSoCot < 0) continue;
    if (p.suaDuoc && cotDaSua.has(p.chiSoCot)) continue;
    if (!Array.isArray(p.dongLoi) || !p.dongLoi.length) {
      soKhongDinhVi++;
      continue;
    }
    for (const i of p.dongLoi) {
      // Không có kết quả sửa thì trang Đã làm sạch cũng không có, nên không tô.
      if (!anhXa) continue;
      const h = anhXa[i];
      if (h == null || h < 0) continue; // dòng đã bị bỏ
      // KHÔNG loại ô chỉ vì nó đã được đổi. Một ô ngày lưu dạng văn bản được
      // chuẩn hoá thành ô ngày thật thì đã xong việc ĐỊNH DẠNG, nhưng ngày kết
      // thúc vẫn có thể đứng trước ngày bắt đầu — lỗi thứ hai còn nguyên. Loại
      // theo ô thì lỗi thứ hai biến mất khỏi màu, mà nó mới là lỗi cần người xem.
      vang.push({ hang: h + 1, cot: p.chiSoCot });
    }
  }

  return { xanh: [...tapXanh.values()], vang, soKhongDinhVi };
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

/**
 * Dựng cả bộ trang.
 *
 * @param {object} p { bang, phatHien, ketQuaSua, dsNhomTrung, tenTrangGoc }
 * @returns {Array} danh sách trang, mỗi trang { ten, hang }
 */
export function dungBoTrang(p) {
  const {
    bang, phatHien = [], ketQuaSua = null, dsNhomTrung = null,
    tenTrangGoc = "", nhatKy = null,
  } = p;

  const ds = [];
  if (ketQuaSua) ds.push({ ten: "Da lam sach", hang: ketQuaSua.hang });
  ds.push(trangVanDe(bang, phatHien, tenTrangGoc));
  if (dsNhomTrung) ds.push(trangNhomTrung(bang, dsNhomTrung));
  if (nhatKy) ds.push(nhatKy);
  return ds;
}
