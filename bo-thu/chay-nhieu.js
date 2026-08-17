/**
 * Bộ thử sinh theo tổ hợp — chạy bằng: node bo-thu/chay-nhieu.js
 *
 * Bộ thử ở chay.js là bộ chọn tay: mỗi ca đo một điều cụ thể và đọc được. Bộ này
 * làm việc khác: nhân cùng một quy tắc lên nhiều biến thể dữ liệu để tìm những chỗ
 * quy tắc chỉ đúng với một dạng ghi. Ba trục nhân:
 *
 *   - định dạng ngày: chuỗi dd/mm/yyyy · chuỗi ISO · ô ngày thật của Excel
 *   - cách viết trạng thái: bốn kiểu, kể cả không dấu và viết hoa toàn bộ
 *   - số dòng và số lỗi bơm vào
 *
 * BÁO CÁO TÁCH HAI LOẠI LỖI, không gộp thành một tỷ lệ đạt:
 *
 *   BỎ LỌT   quy tắc phải nêu mà không nêu, hoặc nêu sai số dòng
 *   BÁO NHẦM quy tắc nêu trên dữ liệu không có lỗi ấy
 *
 * Gộp hai loại vào một con số là che mất điều quan trọng: báo nhầm nguy hiểm hơn
 * bỏ lọt về lâu dài, vì cán bộ bị mắng oan vài lần sẽ thôi đọc cảnh báo.
 */

import { sinhDanhSachY } from "./mau.js";
import { raSoat as raSoatLoi } from "../src/index.js";
import { MUC } from "../src/kiem/kiem-chung.js";

const MOC_HOM_NAY = new Date(Date.UTC(2026, 11, 31));
const raSoat = (v, tc = {}) => raSoatLoi(v, { homNay: MOC_HOM_NAY, ...tc });

/* ── Ba trục biến thể ─────────────────────────────────────────────── */

const BIEN_THE = [
  { ten: "ngày dạng chuỗi, viết có dấu", dangNgay: "chuoi", cachViet: 0 },
  { ten: "ngày dạng ISO, viết không dấu", dangNgay: "iso", cachViet: 1 },
  { ten: "ô ngày thật, viết hoa toàn bộ", dangNgay: "o-ngay", cachViet: 2 },
  { ten: "ngày dạng chuỗi, cách viết khác", dangNgay: "chuoi", cachViet: 3 },
];

const SO_DONG = [12, 30, 80];
const SO_LOI = [1, 2, 5, 9];

/**
 * Danh mục quy tắc đo được bằng bộ sinh.
 *   bom       tên tuỳ chọn bơm lỗi
 *   mucDo     mức phải xếp
 *   keoTheo   mã quy tắc khác CÙNG ĐÚNG khi bơm lỗi này, có giải thích
 *   toiThieu  số dòng tối thiểu để quy tắc chạy
 */
const QUY_TAC = [
  {
    ma: "Y1.1", bom: "ketThucTruocBatDau", mucDo: MUC.CHAC_CHAN,
    keoTheo: [],
  },
  {
    ma: "Y1.2", bom: "tuVongTruocKhangDinh", mucDo: MUC.CHAC_CHAN,
    // Trong bộ sinh, ngày bắt đầu ARV luôn sau ngày khẳng định. Nên ngày tử vong
    // đứng trước ngày khẳng định thì đương nhiên cũng đứng trước ngày ARV. Đây là
    // hệ quả logic, không phải báo nhầm.
    keoTheo: ["Y1.3"],
  },
  {
    ma: "Y1.4", bom: "baoTruocTuVong", mucDo: MUC.CHAC_CHAN,
    keoTheo: [],
  },
  {
    ma: "Y1.5a", bom: "khamSauTuVong", mucDo: MUC.CHAC_CHAN,
    // Ngày tử vong bơm vào là 01/01/2021, còn ngày ARV chạy theo chỉ số dòng nên
    // ở một số dòng ngày ARV muộn hơn. Khi ấy Y1.3 đúng.
    keoTheo: ["Y1.3"],
  },
  {
    ma: "Y1.9", bom: "ngayTuongLai", mucDo: MUC.CHAC_CHAN,
    // Ngày khẳng định bị đẩy sang 2030, tức sau ngày ARV của chính dòng ấy.
    keoTheo: ["Y1.10"],
  },
  {
    ma: "Y1.10", bom: "arvTruocKhangDinh", mucDo: MUC.CAN_XAC_MINH,
    keoTheo: [],
  },
  {
    ma: "Y2.1", bom: "dangDieuTriMaCoNgayTuVong", mucDo: MUC.CHAC_CHAN,
    // Có ngày tử vong mà trạng thái vẫn là đang điều trị: cột ngày tử vong đếm ra
    // một số, cột trạng thái đếm ra số khác, nên Y2.10 đúng. Ngày khám 2023 sau
    // ngày tử vong 2024? không — nhưng ngày tử vong 02/2024 sau ngày khám 02/2023
    // nên Y1.5a im lặng.
    keoTheo: ["Y2.10"],
  },
  {
    ma: "Y2.2", bom: "tuVongMaThieuNgay", mucDo: MUC.CAN_XAC_MINH,
    keoTheo: ["Y2.10"],
  },
  {
    ma: "Y2.3", bom: "amTinhMaCoArv", mucDo: MUC.CAN_XAC_MINH,
    keoTheo: [],
  },
  {
    ma: "Y2.5", bom: "coLyDoThieuNgayKetThuc", mucDo: MUC.CAN_XAC_MINH,
    keoTheo: [],
  },
  {
    ma: "Y2.8", bom: "haiTrangThaiNguoc", mucDo: MUC.CHAC_CHAN,
    keoTheo: ["Y2.1", "Y2.10"],
  },
  {
    ma: "Y10.1", bom: "maTrungKhacGioi", mucDo: MUC.CHAC_CHAN,
    keoTheo: [],
  },
  {
    ma: "Y10.2", bom: "cccdTrungKhacMa", mucDo: MUC.CAN_XAC_MINH,
    keoTheo: [],
  },
  {
    ma: "Y10.3", bom: "maLechKhuon", mucDo: MUC.CAN_XAC_MINH,
    toiThieu: 20,
    // Quy tắc chỉ nêu khi có MỘT khuôn dạng áp đảo, từ 80% số dòng trở lên. Cột
    // vốn nhiều khuôn dạng thì im lặng, vì khi ấy "lệch khuôn" không còn nghĩa gì.
    // Nên bỏ qua các tổ hợp có số dòng lệch khuôn từ 20% trở lên.
    tyLeToiDa: 0.2,
    keoTheo: [],
  },
  {
    ma: "Y10.5", bom: "dtThieuSoKhong", mucDo: MUC.CAN_XAC_MINH,
    keoTheo: [],
  },
  {
    ma: "Y10.6", bom: "maDvLechTen", mucDo: MUC.CAN_XAC_MINH,
    keoTheo: [],
  },
];

/* ── Chạy ─────────────────────────────────────────────────────────── */

const maY = (kq) => kq.phatHien.filter((p) => /^Y/.test(p.ma));
let dat = 0;
const boLot = [];
const baoNham = [];

function ghiBoLot(ten, vi) {
  boLot.push(`${ten} — ${vi}`);
}
function ghiBaoNham(ten, vi) {
  baoNham.push(`${ten} — ${vi}`);
}

/* Ca âm: dữ liệu điền đúng thì KHÔNG quy tắc chuyên ngành nào được nêu. */
for (const bt of BIEN_THE) {
  for (const n of SO_DONG) {
    const ten = `ca âm · ${bt.ten} · ${n} dòng`;
    const kq = raSoat(sinhDanhSachY({ soDong: n, ...bt }));
    const co = maY(kq);
    if (co.length) ghiBaoNham(ten, `nêu ${co.map((p) => p.ma).join(", ")}`);
    else dat++;
  }
}

/* Ca dương: bơm đúng một loại lỗi, đo cả số dòng và mức, cùng với việc không
   quy tắc nào khác bị kéo theo ngoài danh sách đã khai. */
for (const qt of QUY_TAC) {
  for (const bt of BIEN_THE) {
    for (const n of SO_DONG) {
      if (qt.toiThieu && n < qt.toiThieu) continue;
      for (const soLoi of SO_LOI) {
        if (soLoi * 2 >= n) continue; // giữ chỗ cho các dòng đúng
        if (qt.tyLeToiDa && soLoi / n >= qt.tyLeToiDa) continue;
        const ten = `${qt.ma} · ${bt.ten} · ${n} dòng · ${soLoi} lỗi`;
        const kq = raSoat(sinhDanhSachY({ soDong: n, ...bt, [qt.bom]: soLoi }));
        const co = maY(kq);
        const chinh = co.filter((p) => p.ma === qt.ma);

        if (!chinh.length) {
          ghiBoLot(ten, "không nêu quy tắc này");
          continue;
        }
        if (chinh[0].mucDo !== qt.mucDo) {
          ghiBoLot(ten, `xếp mức ${chinh[0].mucDo}, lẽ ra ${qt.mucDo}`);
          continue;
        }
        const laDem = /^(Y1\.|Y2\.1$|Y2\.2$|Y2\.5$|Y10\.5$)/.test(qt.ma);
        if (laDem && chinh[0].soDong !== soLoi) {
          ghiBoLot(ten, `nêu ${chinh[0].soDong} dòng, lẽ ra ${soLoi}`);
          continue;
        }
        const laLa = co
          .map((p) => p.ma)
          .filter((m) => m !== qt.ma && !qt.keoTheo.includes(m));
        if (laLa.length) {
          ghiBaoNham(ten, `kéo theo ${[...new Set(laLa)].join(", ")}`);
          continue;
        }
        dat++;
      }
    }
  }
}

/* ── Trục thứ tư: biến thể cách viết TÊN CỘT ──────────────────────
 *
 * Đây là chỗ dễ sai nhất của cả bộ, vì một quy tắc đúng áp lên cột sai còn tệ hơn
 * không có quy tắc. Mỗi khái niệm được đo bằng nhiều cách viết mà cán bộ thật hay
 * dùng, cộng với những tên GẦN GIỐNG mà tuyệt đối không được nhận.
 */

// Giá trị mẫu phải ĐÚNG KIỂU của khái niệm. Nhồi giá trị ngày vào cột giới tính thì
// chốt chặn kiểm kiểu loại cột ấy — và loại đúng, vì một cột toàn ngày không phải
// cột giới tính. Bản đầu của bộ thử này nhồi ngày vào mọi cột và trượt 26 ca.
const GIA_TRI = {
  ngay: ["01/02/2024", "03/03/2024", "25/04/2024", "17/05/2024"],
  ma: ["BN001", "BN002", "BN003", "BN004"],
  cccd: ["001234567890", "001234567891", "001234567892", "001234567893"],
  cmnd: ["123456789", "123456790", "123456791", "123456792"],
  dt: ["0912345678", "0912345679", "0912345680", "0912345681"],
  gioi: ["Nam", "Nữ", "Nam", "Nữ"],
  chu: ["Đang điều trị", "Đã kết thúc", "Đang điều trị", "Chuyển đi"],
};

const TEN_COT = [
  // [khái niệm mong đợi, tên phải nhận, tên KHÔNG được nhận, loại giá trị mẫu]
  ["NGAY_KHANG_DINH",
    ["Ngày XN khẳng định", "Ngày xét nghiệm khẳng định", "NGÀY KHẲNG ĐỊNH",
      "Ngày chẩn đoán", "Ngày phát hiện", "ngay khang dinh"],
    ["Ngày chẩn đoán Lao", "Ngày chẩn đoán viêm gan B", "Ngày khẳng định Methadone"], "ngay"],
  ["NGAY_ARV_DAU",
    ["Ngày điều trị ARV lần đầu", "Ngày bắt đầu ARV", "Ngày bắt đầu điều trị ARV",
      "ngay bat dau dieu tri arv"],
    ["Ngày bắt đầu điều trị Lao tiềm ẩn", "Ngày bắt đầu điều trị viêm gan C",
      "Ngày bắt đầu điều trị PrEP"], "ngay"],
  ["NGAY_TU_VONG",
    ["Ngày tử vong", "NGÀY TỬ VONG", "ngay tu vong", "Ngày mất"],
    ["Ngày báo tử vong", "Nguyên nhân tử vong"], "ngay"],
  ["NGAY_BAO_TU_VONG",
    ["Ngày báo tử vong", "Ngày ghi nhận tử vong"],
    [], "ngay"],
  ["NGAY_KET_THUC",
    ["Ngày kết thúc", "Ngày dừng điều trị", "Ngày ra khỏi chương trình"],
    ["Ngày kết thúc điều trị Lao", "Ngày kết thúc điều trị viêm gan C"], "ngay"],
  ["NGAY_KHAM_CUOI",
    ["Ngày khám gần nhất", "Ngày khám cuối", "Ngày lĩnh thuốc gần nhất"],
    ["Ngày hẹn khám lại", "Ngày khám dự kiến"], "ngay"],
  ["NGAY_SINH",
    ["Ngày sinh", "NGÀY SINH", "ngay sinh"],
    ["Ngày dự sinh", "Ngày dự kiến sinh"], "ngay"],
  ["MA_BENH_NHAN",
    ["Mã bệnh nhân", "Mã BN", "Mã hồ sơ", "Mã người bệnh", "ma benh nhan"],
    [], "ma"],
  ["SO_CCCD", ["Số CCCD", "CCCD", "Số căn cước"], ["Số CMND"], "cccd"],
  ["SO_CMND", ["Số CMND", "CMND", "Số chứng minh nhân dân"], ["Số CCCD"], "cmnd"],
  ["SO_DIEN_THOAI", ["Số điện thoại", "Điện thoại", "SĐT"], [], "dt"],
  ["GIOI_TINH", ["Giới tính", "GIỚI TÍNH", "gioi tinh"], ["Năm sinh", "Năm phát hiện"], "gioi"],
  ["TRANG_THAI_DIEU_TRI",
    ["Trạng thái điều trị", "Trạng thái điều trị hiện tại", "Tình trạng điều trị"],
    [], "chu"],
  ["TRANG_THAI_NGUOI", ["Trạng thái người nhiễm", "Tình trạng người nhiễm"], [], "chu"],
  ["LY_DO_KET_THUC", ["Lý do kết thúc", "Lý do ra khỏi chương trình"], [], "chu"],
  ["KET_QUA_KHANG_DINH",
    ["Kết quả khẳng định", "Kết quả xét nghiệm khẳng định"],
    ["Kết luận chẩn đoán nhiễm mới"], "chu"],
];

for (const [khaiNiem, phaiNhan, khongNhan, loai] of TEN_COT) {
  const mau = GIA_TRI[loai];
  // Cột đầu đặt tên trung tính "TT". Bản đầu tôi đặt "Mã bệnh nhân", và khi khái
  // niệm đang đo chính là mã bệnh nhân thì cột đầu giành chỗ cột đang đo.
  const dungHang = (ten) => ({
    ten: "Thu ten cot",
    hang: [["TT", ten], ...mau.map((v, k) => [k + 1, v])],
  });
  for (const ten of phaiNhan) {
    const nhan = `${khaiNiem} · nhận cột “${ten}”`;
    const v = dungHang(ten);
    const kn = raSoat(v).khaiNiem;
    if (kn.theoMa.get(khaiNiem) === 1) dat++;
    else ghiBoLot(nhan, `“${ten}” nhận thành ${kn.theoCot.get(1) || "KHÔNG GÌ"}`);
  }
  for (const ten of khongNhan) {
    const nhan = `ca âm cột · KHÔNG được nhận “${ten}” thành ${khaiNiem}`;
    const v = dungHang(ten);
    const kn = raSoat(v).khaiNiem;
    if (kn.theoMa.get(khaiNiem) === 1) ghiBaoNham(nhan, "đã nhận sai");
    else dat++;
  }
}

/* ── Báo cáo ──────────────────────────────────────────────────────── */

const tong = dat + boLot.length + baoNham.length;
const dong = "═".repeat(64);
process.stdout.write(`\n${dong}\n`);
process.stdout.write(`BỘ THỬ SINH THEO TỔ HỢP — ${tong} ca\n`);
process.stdout.write(`${dong}\n`);
process.stdout.write(`  đạt        ${String(dat).padStart(5)}\n`);
process.stdout.write(`  bỏ lọt     ${String(boLot.length).padStart(5)}   quy tắc phải nêu mà không nêu\n`);
process.stdout.write(`  báo nhầm   ${String(baoNham.length).padStart(5)}   nêu trên dữ liệu không có lỗi ấy\n`);

/** Gộp theo dạng: "mã quy tắc + phần lý do" — để thấy có mấy nguyên nhân gốc. */
function gop(ds) {
  const m = new Map();
  for (const l of ds) {
    const [dau, ...con] = l.split(" — ");
    const ma = dau.split(" · ")[0];
    const khoa = `${ma} — ${con.join(" — ")}`;
    m.set(khoa, (m.get(khoa) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

for (const [nhan, ds] of [["BỎ LỌT", boLot], ["BÁO NHẦM", baoNham]]) {
  if (!ds.length) continue;
  const g = gop(ds);
  process.stdout.write(`\n── ${nhan}: ${ds.length} ca, ${g.length} dạng ──\n`);
  for (const [khoa, n] of g) process.stdout.write(`  ${String(n).padStart(4)}×  ${khoa}\n`);
}

process.stdout.write(`\n${dong}\n`);
process.exit(boLot.length + baoNham.length === 0 ? 0 : 1);
