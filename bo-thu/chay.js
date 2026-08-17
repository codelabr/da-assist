/**
 * Bộ thử của lõi. Chạy bằng: node bo-thu/chay.js
 *
 * Nguyên tắc: mỗi phép nhận diện phải có CẢ ca dương lẫn ca âm. Ca âm là ca
 * "trông rất giống lỗi nhưng thực ra không phải" — thiếu nó thì không đo được
 * báo nhầm, mà báo nhầm nguy hiểm hơn bỏ lọt về lâu dài.
 */

import { bang, ca, chayTatCa, dung, nhomCa, sai } from "./khung.js";
import {
  sinhBangKhongLienQuan,
  sinhBieuHaiPhan,
  sinhBieuMethadone,
  sinhBieuPrepNam,
  sinhBieuTongHop,
  sinhBieuTuVanXetNghiem,
  sinhDanhSach,
  sinhDanhSachNhanSu,
} from "./mau.js";

import { boDau, chuanHoa, khopKhoa } from "../src/bang/../tien-ich/chuoi.js";
import { DANG, doanNgay, khoangKy, layNam } from "../src/tien-ich/ngay.js";
import { taoBang, timHangTieuDe } from "../src/bang/tao-bang.js";
import { suyKieuBang, KIEU } from "../src/bang/suy-kieu.js";
import { MUC } from "../src/kiem/kiem-chung.js";
import { docSoBieu, nhomPhanTo } from "../src/kiem/kiem-bieu.js";
import { nhanDang } from "../src/ho-so/nhan-dang.js";
import { kiemBieuTT05, nhanDangBieu } from "../src/ho-so/tt05-bieu-bao-cao.js";
import HO_SO from "../src/ho-so/hivinfo-giam-sat-ca-benh.js";
import { dungPhuLuc4 } from "../src/bieu-mau/phu-luc-4-tt07.js";
import {
  HINH_DANG,
  raSoat,
  sinhCauHoi,
  VIEC,
  hoSoMoi,
  ghiTraLoi,
  docTraLoi,
  quyetDinhTu,
  doKhop,
  sangJson,
  tuJson,
  deXuatSua,
  apDung,
  trangNhatKy,
  NHOM,
  ghiXlsx,
  chayPhanTich,
  lietKePhanTich,
  phanTichThanhHang,
  cheONho,
  gopNhomNho,
} from "../src/index.js";
import { banDoGopCap, NHOM_TUOI, phanVi, xepNhomTuoi } from "../src/phan-tich/tien-ich.js";
import { cotTuToaDo } from "../src/doc-tep/doc-xlsx.js";
import { docXlsx } from "../src/doc-tep/doc-xlsx.js";
import { toaDoCot } from "../src/ghi-tep/ghi-xlsx.js";
import { taoExcelGia } from "./excel-gia.js";
import { dinhDangLaNgay, docTrangHienTai } from "../src/vo-addin/doc-excel.js";
import { ghiNhieuTrang, ghiTrangMoi, tenTrangHopLe } from "../src/vo-addin/ghi-excel.js";
import { chuoiTuByte, moZip } from "../src/doc-tep/giai-nen.js";

/** Dựng một tệp zip một mục, đủ chuẩn để bộ đọc mở được. */
function dungZipMotTep(ten, thoc, nen) {
  const t = new TextEncoder().encode(ten);
  const b = [];
  const d16 = (n) => b.push(n & 255, (n >> 8) & 255);
  const d32 = (n) => b.push(n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255);
  const chen = (u8) => { for (const x of u8) b.push(x); };

  d32(0x04034b50); d16(20); d16(0); d16(8); d16(0); d16(0);
  d32(0); d32(nen.length); d32(thoc.length); d16(t.length); d16(0);
  chen(t); chen(nen);

  const viTriMuc = b.length;
  d32(0x02014b50); d16(20); d16(20); d16(0); d16(8); d16(0); d16(0);
  d32(0); d32(nen.length); d32(thoc.length); d16(t.length); d16(0); d16(0);
  d16(0); d16(0); d32(0); d32(0);
  chen(t);

  const coMuc = b.length - viTriMuc;
  d32(0x06054b50); d16(0); d16(0); d16(1); d16(1); d32(coMuc); d32(viTriMuc); d16(0);
  return new Uint8Array(b);
}

const co = (ds, ma) => ds.filter((x) => x.ma === ma);
const mot = (ds, ma) => {
  const r = co(ds, ma);
  if (r.length !== 1) throw new Error(`mong đúng 1 phát hiện ${ma}, nhận ${r.length}`);
  return r[0];
};

/* ══════════════════════════════════════════════════════════ */
nhomCa("Chuỗi tiếng Việt");

ca("bỏ dấu giữ được chữ đ hoa và thường", () => {
  bang(boDau("Đặng Đỗ Đinh Đào Đoàn"), "Dang Do Dinh Dao Doan");
});

ca("chuẩn hoá gộp khoảng trắng và thường hoá", () => {
  bang(chuanHoa("  Ngày   XN Khẳng Định  "), "ngay xn khang dinh");
});

ca("khoá một từ không nuốt tên cột dài hơn", () => {
  dung(khopKhoa("ten", "Họ tên"), "phải khớp đúng từ");
  sai(khopKhoa("name", "facility_name"), "gạch dưới phải là ranh giới từ");
});

ca("khoá cụm cũng chặn ranh giới từ", () => {
  dung(khopKhoa("tam tru", "Địa chỉ tạm trú"), "");
  sai(khopKhoa("tam tru", "Huyết áp tâm trương"), "cụm không được nuốt từ dài hơn");
});

ca("khoá mà bản bỏ dấu trùng từ thông dụng thì phải tránh, không phải sửa hàm", () => {
  // "nam" (giới tính) và "năm" (thời gian) trùng nhau sau khi bỏ dấu. Hàm khớp
  // đúng; cách xử lý là KHÔNG đưa khoá như vậy vào từ điển. Hồ sơ HIV-INFO vì
  // thế dùng "=gioi tinh" chứ không dùng khoá trần "nam".
  dung(khopKhoa("nam", "Năm sinh"), "đây là hành vi đúng của hàm");
  sai(HO_SO.dauHieu.some((d) => d.khoa.includes("nam")), "từ điển không được chứa khoá trần nam");
});

ca("khoá một từ vẫn khớp sau chữ có dấu — chỗ mà \\b thất bại", () => {
  dung(khopKhoa("trú", "Địa chỉ thường trú"), "sau chữ có dấu vẫn phải có ranh giới");
  dung(khopKhoa("dâm", "Người bán dâm"), "");
});

ca("khoá cụm khớp theo chứa cụm", () => {
  dung(khopKhoa("ngay xn khang dinh", "Ngày XN khẳng định đầu tiên"), "");
  sai(khopKhoa("ngay xn khang dinh", "Ngày khẳng định"), "");
});

ca("khoá dấu bằng đòi khớp toàn bộ", () => {
  dung(khopKhoa("=ngay tu vong", "Ngày tử vong"), "");
  sai(khopKhoa("=ngay tu vong", "Ngày báo tử vong"), "");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Đọc tệp xlsx");

ca("toạ độ ô đổi đúng sang chỉ số cột", () => {
  bang(cotTuToaDo("A1"), 0);
  bang(cotTuToaDo("Z9"), 25);
  bang(cotTuToaDo("AA1"), 26);
  bang(cotTuToaDo("CH2000"), 85);
  bang(cotTuToaDo("CL1"), 89);
});

ca("mở được tệp zip do chính Node nén", async () => {
  const zlib = await import("node:zlib");
  const noi = new TextEncoder().encode("<a>xin chào</a>");
  const nen = new Uint8Array(zlib.deflateRawSync(Buffer.from(noi)));
  const zip = dungZipMotTep("thu.xml", noi, nen);
  const ra = await moZip(zip);
  bang(chuoiTuByte(ra["thu.xml"]), "<a>xin chào</a>");
});

ca("báo lỗi rõ ràng khi tệp không phải zip", async () => {
  let loi = "";
  try {
    await moZip(new Uint8Array([1, 2, 3, 4, 5]));
  } catch (e) {
    loi = e.message;
  }
  dung(loi.includes("zip"), loi);
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Ngày tháng");

ca("nhận ba định dạng văn bản", () => {
  bang(doanNgay("2026-05-26").dang, DANG.ISO);
  bang(doanNgay("26/05/2026").dang, DANG.NGAY_TRUOC);
  bang(doanNgay("13/05/2026").dang, DANG.NGAY_TRUOC);
});

ca("ngày mập mờ vẫn đọc theo lối ngày trước nhưng gắn cờ", () => {
  const r = doanNgay("05/06/2026");
  bang(r.dang, DANG.NGAY_TRUOC);
  bang(r.mapHo, true);
});

ca("số thứ tự ngày của Excel chỉ nhận khi được phép", () => {
  bang(doanNgay(46000), null);
  bang(doanNgay(46000, { nhanSoThuTu: true }).dang, DANG.SO_THU_TU);
  bang(layNam(46000, { nhanSoThuTu: true }), 2025);
});

ca("số ngoài khoảng ngày không bị nhận nhầm thành ngày", () => {
  bang(doanNgay(307, { nhanSoThuTu: true }), null, "tải lượng 307 không phải ngày");
  bang(doanNgay(1988, { nhanSoThuTu: true }), null, "năm sinh không phải số thứ tự ngày");
});

ca("chuỗi không hợp lệ trả null", () => {
  bang(doanNgay("32/13/2026"), null);
  bang(doanNgay("Không rõ"), null);
});

ca("kỳ báo cáo cắt theo Thông tư 07 Điều 11 khoản 2", () => {
  const q3 = khoangKy({ nam: 2026, quy: 3 });
  bang(q3.tu.toISOString().slice(0, 10), "2026-07-01");
  bang(q3.den.toISOString().slice(0, 10), "2026-09-30");
  const n = khoangKy({ nam: 2026 });
  bang(n.tu.toISOString().slice(0, 10), "2026-01-01");
  bang(n.den.toISOString().slice(0, 10), "2026-12-31");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Tầng 0 — hình dạng và hàng tiêu đề");

ca("hàng tiêu đề ở dòng 1 của một danh sách", () => {
  bang(timHangTieuDe(sinhDanhSach({ soDong: 60 }).hang).chiSo, 0);
});

ca("hàng tiêu đề KHÔNG ở dòng 1 của một biểu mẫu", () => {
  bang(timHangTieuDe(sinhBieuTongHop().hang).chiSo, 2);
});

ca("nhận ra danh sách từng ca", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  bang(b.hinhDang, HINH_DANG.DANH_SACH, b.lyDoHinhDang.join("; "));
  bang(b.soDong, 60);
});

ca("nhận ra biểu đã cộng", () => {
  const b = taoBang(sinhBieuTongHop());
  bang(b.hinhDang, HINH_DANG.BIEU_TONG_HOP, b.lyDoHinhDang.join("; "));
});

ca("cột số thứ tự dòng KHÔNG làm danh sách bị coi là biểu mẫu", () => {
  const b = taoBang(sinhBangKhongLienQuan());
  bang(b.hinhDang, HINH_DANG.DANH_SACH, b.lyDoHinhDang.join("; "));
});

ca("biểu đã cộng thì không chạy phép làm sạch dành cho danh sách", () => {
  const kq = raSoat(sinhBieuTongHop());
  bang(kq.phatHien.length, 0, "không được đề xuất phép sửa nào");
  dung(kq.canhBaoLuong.length > 0, "phải nói rõ vì sao không chạy");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Tầng 1 — suy kiểu cột");

ca("cột ngày nhận đúng kiểu, cột mã không bị coi là số", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  suyKieuBang(b);
  const kieu = (ten) => b.cot.find((c) => c.ten === ten).kieu;
  bang(kieu("Ngày XN khẳng định đầu tiên"), KIEU.NGAY);
  bang(kieu("Mã bệnh nhân"), KIEU.MA_DINH_DANH);
  bang(kieu("Đường lây"), KIEU.PHAN_LOAI);
  bang(kieu("Ghi chú"), KIEU.TRONG);
});

ca("năm sinh là số nguyên chứ không phải ngày", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  suyKieuBang(b);
  const c = b.cot.find((x) => x.ten === "Năm sinh");
  dung(c.kieu === KIEU.SO_NGUYEN || c.kieu === KIEU.PHAN_LOAI, `nhận ${c.kieu}`);
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Tầng 1 — kiểm chung, ca dương");

ca("KC05 bắt được hai định dạng ngày lẫn nhau", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, soDongIso: 10 }));
  const p = mot(kq.phatHien, "KC05");
  bang(p.cot, "Ngày XN khẳng định đầu tiên");
  bang(p.soDong, 60);
  bang(p.mucDo, MUC.CHAC_CHAN);
});

ca("KC09 bắt được biến thể hoa thường của giới tính", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, bienTheGioi: 6 }));
  const p = kq.phatHien.filter((x) => x.ma === "KC09" && x.cot === "Giới tính");
  bang(p.length, 1);
  bang(p[0].soDong, 60, "cả cột bị tách nhóm, không chỉ 6 dòng lệch");
});

ca("KC13 tách riêng biến thể về dấu, KHÔNG tự gộp", () => {
  const v = sinhDanhSach({ soDong: 60 });
  const c = v.hang[0].indexOf("Phường/Xã hiện tại");
  // Hai địa danh chỉ khác nhau ở dấu — có thể là hai xã khác nhau thật.
  v.hang[1][c] = "Xã Vĩnh Thanh";
  v.hang[2][c] = "Xã Vĩnh Thạnh";
  const kq = raSoat(v);
  const p = kq.phatHien.filter((x) => x.ma === "KC13" && x.cot === "Phường/Xã hiện tại");
  bang(p.length, 1);
  bang(p[0].mucDo, MUC.CAN_XAC_MINH, "không được xếp là lỗi chắc chắn");
  bang(
    kq.phatHien.filter((x) => x.ma === "KC09" && x.cot === "Phường/Xã hiện tại").length,
    0,
    "khác dấu không phải là khác hoa thường"
  );
});

ca("cột mã lưu dạng văn bản chỉ là ghi nhận, không phải lỗi", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60 }));
  const p = kq.phatHien.filter((x) => x.ma === "KC07" && x.cot === "Mã Tỉnh/TP thường trú");
  if (p.length) bang(p[0].mucDo, MUC.GHI_NHAN, "mã định danh giữ dạng văn bản là đúng");
});

ca("KC12 bắt được dòng trùng hoàn toàn", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, soCapTrung: 2 }));
  bang(mot(kq.phatHien, "KC12").soDong, 2);
});

ca("KC12 bắt được trùng chỉ khác cột số thứ tự dòng — dạng có thật", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, trungKhacTT: 3 }));
  const p = mot(kq.phatHien, "KC12");
  bang(p.soDong, 3);
  dung(p.moTa.includes("số thứ tự dòng"), p.moTa);
});

ca("hai dòng khác nhau thật thì không bị coi là trùng", () => {
  const v = sinhDanhSach({ soDong: 60, trungKhacTT: 1 });
  const c = v.hang[0].indexOf("Số điện thoại");
  v.hang[v.hang.length - 1][c] = "0900000000";
  const kq = raSoat(v);
  bang(co(kq.phatHien, "KC12").length, 0, "khác một cột thông tin thì không phải trùng");
});

ca("KC10 bắt được mã cha và mã con cùng cột", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, maPhanCap: true }));
  const p = kq.phatHien.filter((x) => x.ma === "KC10" && x.cot === "Đường lây");
  bang(p.length, 1);
  bang(p[0].mucDo, MUC.CAN_XAC_MINH);
});

ca("KC08 bắt được khoảng trắng thừa", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, khoangTrangThua: 4 }));
  const p = kq.phatHien.filter((x) => x.ma === "KC08");
  dung(p.length >= 1, "phải có ít nhất một cột bị báo");
  bang(p[0].mucDo, MUC.CHAC_CHAN);
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Tầng 1 — kiểm chung, ca âm");

ca("cột trống hoàn toàn xếp mức ghi nhận, KHÔNG phải lỗi", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60 }));
  const p = kq.phatHien.filter((x) => x.ma === "KC01" && x.cot === "Ghi chú");
  bang(p.length, 1);
  bang(p[0].mucDo, MUC.GHI_NHAN);
});

ca("tệp sạch không sinh phát hiện mức chắc chắn nào", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, ngayThat: true }));
  const xau = kq.phatHien.filter((x) => x.mucDo === MUC.CHAC_CHAN);
  bang(xau.map((x) => `${x.ma}:${x.cot}`), [], "không được báo nhầm trên tệp sạch");
});

ca("KC04 báo ngày lưu dạng văn bản, và chỉ báo khi đúng là văn bản", () => {
  const vanBan = raSoat(sinhDanhSach({ soDong: 60 }));
  dung(co(vanBan.phatHien, "KC04").length >= 1, "ngày dạng chuỗi phải bị báo");
  const oNgay = raSoat(sinhDanhSach({ soDong: 60, ngayThat: true }));
  bang(co(oNgay.phatHien, "KC04").length, 0, "ô ngày thật thì không được báo");
});

ca("một định dạng ngày duy nhất thì không báo KC05", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, soDongIso: 0 }));
  bang(co(kq.phatHien, "KC05").length, 0);
});

ca("không có dòng trùng thì không báo KC12", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, soCapTrung: 0 }));
  bang(co(kq.phatHien, "KC12").length, 0);
});

ca("mã cùng cấp không bị coi là mã phân cấp", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, maPhanCap: false }));
  bang(co(kq.phatHien, "KC10").length, 0);
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Tầng 2 — nhận dạng hồ sơ");

ca("nhận ra danh sách giám sát ca bệnh", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  suyKieuBang(b);
  const nd = nhanDang(b, [HO_SO]);
  bang(nd.ketQua, "nhan-ra", nd.moTa);
  dung(nd.diem > 0.9, `điểm ${nd.diem}`);
});

ca("gán đúng vai trò cho các cột dễ lẫn", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  const nd = nhanDang(b, [HO_SO]);
  const ten = (v) => b.tieuDe[nd.theoVaiTro.get(v)];
  bang(ten("ngay_tu_vong"), "Ngày tử vong");
  bang(ten("ngay_bao_tu_vong"), "Ngày báo tử vong");
  bang(ten("xa_hien_tai"), "Phường/Xã hiện tại");
  bang(ten("ma_xa_hien_tai"), "Mã Phường/Xã hiện tại");
  bang(ten("tinh_thuong_tru"), "Tỉnh/TP thường trú");
});

ca("KHÔNG nhận nhầm bảng nhập kho", () => {
  const b = taoBang(sinhBangKhongLienQuan());
  bang(nhanDang(b, [HO_SO]).ketQua, "khong-nhan-ra");
});

ca("KHÔNG nhận nhầm danh sách nhân sự — ca âm khó nhất", () => {
  const b = taoBang(sinhDanhSachNhanSu());
  const nd = nhanDang(b, [HO_SO]);
  bang(nd.ketQua, "khong-nhan-ra", `điểm ${nd.diem} — có họ tên, năm sinh, giới tính`);
});

ca("không nhận ra thì nói rõ là chỉ chạy tầng chung", () => {
  const kq = raSoat(sinhDanhSachNhanSu());
  dung(kq.nhanDang.moTa.includes("tầng kiểm chung"), kq.nhanDang.moTa);
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Tầng 2 — kiểm theo hồ sơ");

ca("báo giá trị ngoài bảng mã Thông tư 07, mức cần xác minh", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, giaTriLaNgheNghiep: 8 }));
  const p = kq.phatHien.filter((x) => x.ma === "HS-TGT" && x.cot === "Nghề nghiệp");
  bang(p.length, 1);
  bang(p[0].mucDo, MUC.CAN_XAC_MINH);
  dung(p[0].canCu.includes("Phụ lục 1"), p[0].canCu);
});

ca("giá trị đúng bảng mã thì không báo", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, giaTriLaNgheNghiep: 0 }));
  bang(kq.phatHien.filter((x) => x.ma === "HS-TGT" && x.cot === "Nghề nghiệp").length, 0);
});

ca("ba cột tử vong khớp nhau thì không báo LC07", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60 }));
  bang(co(kq.phatHien, "LC07").length, 0);
});

ca("LC07 bắt được ba cột tử vong lệch nhau", () => {
  const kq = raSoat(sinhDanhSach({ soDong: 60, lechTuVong: 2 }));
  const p = mot(kq.phatHien, "LC07");
  bang(p.mucDo, MUC.CAN_XAC_MINH);
  bang(p.soDong, 2, "chênh lệch lớn nhất giữa các cột");
  dung(p.deXuat.includes("Phụ lục 4"), "phải chỉ ra cột nào là cột chuẩn của biểu mẫu");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Biểu mẫu Phụ lục 4 Thông tư 07");

function chuanBi(tuyChon = {}) {
  const b = taoBang(sinhDanhSach({ soDong: 60, ...tuyChon }));
  suyKieuBang(b);
  const nd = nhanDang(b, [HO_SO]);
  return { b, vt: nd.theoVaiTro };
}

ca("báo cáo năm 2026 ra đúng từng ô", () => {
  const { b, vt } = chuanBi();
  const r = dungPhuLuc4(b, vt, { nam: 2026 });
  dung(r.dungDuoc, "phải dựng được");
  const lay = (noiDung) => r.dong.find((d) => d.noiDung === noiDung);

  const moi = lay("Số người nhiễm HIV phát hiện mới");
  bang([moi.nam, moi.nu, moi.tong], [10, 5, 15]);

  const tv = lay("Số người nhiễm HIV tử vong");
  bang([tv.nam, tv.nu, tv.tong], [2, 1, 3]);

  const luy = lay("Số người nhiễm HIV lũy tích");
  bang([luy.nam, luy.nu, luy.tong], [40, 20, 60]);

  const song = lay("Số người nhiễm HIV còn sống");
  bang([song.nam, song.nu, song.tong], [36, 18, 54]);
});

ca("mỗi ô giữ danh sách dòng đã đếm để đối chiếu", () => {
  const { b, vt } = chuanBi();
  const r = dungPhuLuc4(b, vt, { nam: 2026 });
  const moi = r.dong.find((d) => d.noiDung === "Số người nhiễm HIV phát hiện mới");
  bang(moi.dong.length, moi.tong);
  bang(moi.dong.slice(0, 3), [3, 7, 11]);
});

ca("báo cáo quý chỉ đếm trong quý đó", () => {
  const { b, vt } = chuanBi();
  const tong = [1, 2, 3, 4].map((q) => {
    const r = dungPhuLuc4(b, vt, { nam: 2026, quy: q });
    return r.dong.find((d) => d.noiDung === "Số người nhiễm HIV phát hiện mới trong quý").tong;
  });
  bang(tong.reduce((a, x) => a + x, 0), 15, "bốn quý phải cộng lại bằng cả năm");
});

ca("nêu rõ dòng ngoại tỉnh đếm theo cột nào", () => {
  const { b, vt } = chuanBi();
  const r = dungPhuLuc4(b, vt, { nam: 2026 });
  dung(
    r.ghiChu.some((g) => g.includes("Ngoại tỉnh") && g.includes("đếm theo cột")),
    "phải nói rõ con số lấy từ cột nào để người dùng đối chiếu"
  );
});

ca("KHÔNG phán đoán tỷ lệ nào là bất thường — máy không biết cột nghĩa là gì", () => {
  for (const ty of [0.05, 0.5, 0.95]) {
    const { b, vt } = chuanBi({ tyLeNgoaiTinh: ty });
    const r = dungPhuLuc4(b, vt, { nam: 2026 });
    sai(
      r.ghiChu.some((g) => g.includes("bất thường") || g.includes("Cảnh báo")),
      `tỷ lệ ${ty} không được bị gán là bất thường`
    );
  }
});

ca("ghi chú luôn nêu căn cứ cắt kỳ", () => {
  const { b, vt } = chuanBi();
  const r = dungPhuLuc4(b, vt, { nam: 2026, quy: 3 });
  dung(r.ghiChu[0].includes("Điều 11 khoản 2"), r.ghiChu[0]);
});

ca("thiếu cột thì báo thiếu chứ không đoán", () => {
  const v = sinhDanhSach({ soDong: 60 });
  const c = v.hang[0].indexOf("Ngoại tỉnh");
  for (const h of v.hang) h.splice(c, 1);
  const b = taoBang(v);
  suyKieuBang(b);
  const nd = nhanDang(b, [HO_SO]);
  const r = dungPhuLuc4(b, nd.theoVaiTro, { nam: 2026 });
  dung(r.thieu.includes("cờ ngoại tỉnh"), r.thieu.join(", "));
  dung(r.ghiChu.some((g) => g.includes("Thiếu cột")), "");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Phỏng vấn — sinh câu hỏi từ bằng chứng");

function bangTu(hang, ten = "thu") {
  const b = taoBang({ ten, hang });
  suyKieuBang(b);
  return b;
}

ca("gom cột trống cùng mẫu thành MỘT câu hỏi, không hỏi từng cột", () => {
  const hang = [["stt", "ngày tử vong", "nguyên nhân", "nơi mất", "họ tên"]];
  for (let i = 0; i < 40; i++) {
    const mat = i % 5 === 0;
    hang.push([i + 1, mat ? "01/02/2025" : "", mat ? "1" : "", mat ? "Nhà" : "", `Người ${i}`]);
  }
  const { canHoi } = sinhCauHoi(bangTu(hang));
  const p = canHoi.filter((c) => c.loai === "o-trong");
  bang(p.length, 1, "ba cột cùng mẫu trống phải gom thành một câu");
  bang(p[0].cot.length, 3);
});

ca("hỏi thứ tự ngày khi dữ liệu KHÔNG tự phân giải được", () => {
  const hang = [["stt", "ngày"]];
  for (let i = 0; i < 30; i++) hang.push([i + 1, `0${(i % 9) + 1}/0${(i % 9) + 1}/2026`]);
  const { canHoi } = sinhCauHoi(bangTu(hang));
  bang(canHoi.filter((c) => c.loai === "thu-tu-ngay").length, 1);
});

ca("KHÔNG hỏi thứ tự ngày khi chỉ một giá trị đủ phân giải — ca âm", () => {
  const hang = [["stt", "ngày"]];
  for (let i = 0; i < 30; i++) hang.push([i + 1, `0${(i % 9) + 1}/0${(i % 9) + 1}/2026`]);
  hang[1][1] = "25/03/2026"; // một giá trị có ngày lớn hơn 12 là đủ
  const { canHoi } = sinhCauHoi(bangTu(hang));
  bang(canHoi.filter((c) => c.loai === "thu-tu-ngay").length, 0);
});

ca("phát hiện cặp mã và nhãn, gợi ý sẵn câu trả lời", () => {
  const hang = [["stt", "mã tỉnh", "tên tỉnh"]];
  const t = [[96, "Tỉnh Cà Mau"], [92, "Thành phố Cần Thơ"], [79, "Thành phố Hồ Chí Minh"]];
  for (let i = 0; i < 45; i++) hang.push([i + 1, t[i % 3][0], t[i % 3][1]]);
  const { canHoi } = sinhCauHoi(bangTu(hang));
  const p = canHoi.filter((c) => c.loai === "cap-ma-nhan");
  bang(p.length, 1);
  bang(p[0].goiY, "cap-ma-nhan", "phải điền sẵn để người dùng chỉ xác nhận");
});

ca("hai cột không xác định lẫn nhau thì không bị coi là cặp mã nhãn — ca âm", () => {
  const hang = [["stt", "giới tính", "đường lây"]];
  const g = ["Nam", "Nữ"];
  const d = ["Máu", "Tình dục"];
  for (let i = 0; i < 45; i++) hang.push([i + 1, g[i % 2], d[(i >> 1) % 2]]);
  const { canHoi } = sinhCauHoi(bangTu(hang));
  bang(canHoi.filter((c) => c.loai === "cap-ma-nhan").length, 0);
});

ca("câu hỏi khoá nhận dạng nêu HỆ QUẢ của từng lựa chọn", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60, trungKhacTT: 4 }));
  suyKieuBang(b);
  const nd = nhanDang(b, [HO_SO]);
  const { canHoi } = sinhCauHoi(b, nd.theoVaiTro, { viec: VIEC.GOP_TRUNG });
  const p = canHoi.filter((c) => c.loai === "khoa-nhan-dang");
  bang(p.length, 1);
  dung(p[0].luaChon.length >= 3, "phải có nhiều bộ khoá để so");
  dung(
    p[0].luaChon.every((x) => x.ma === "khong-gop" || /\d+ nhóm nghi trùng/.test(x.moTa)),
    "mỗi lựa chọn phải kèm số nhóm trùng"
  );
  dung(p[0].luaChon.some((x) => x.ma === "khong-gop"), "phải có lối thoát không gộp gì");
});

ca("nói đúng khi mọi bộ khoá cho cùng một kết quả", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60, trungKhacTT: 2 }));
  suyKieuBang(b);
  const vt = nhanDang(b, [HO_SO]).theoVaiTro;
  const c = sinhCauHoi(b, vt, { viec: VIEC.GOP_TRUNG }).canHoi
    .find((x) => x.loai === "khoa-nhan-dang");
  const so = new Set(c.luaChon.filter((x) => x.heQua).map((x) => x.heQua.soDongThua));
  if (so.size === 1) {
    sai(c.moTa.includes("thay đổi từ"), "không được nói là thay đổi khi mọi lựa chọn như nhau");
    dung(c.moTa.includes("chọn bộ nào cũng ra cùng kết quả"), c.moTa);
  } else {
    dung(c.moTa.includes("thay đổi từ"), c.moTa);
  }
});

ca("lọc đúng theo việc đang làm — gộp trùng không hỏi chuyện ô trống", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  suyKieuBang(b);
  const nd = nhanDang(b, [HO_SO]);
  const gop = sinhCauHoi(b, nd.theoVaiTro, { viec: VIEC.GOP_TRUNG }).canHoi;
  bang(gop.filter((c) => c.loai === "o-trong").length, 0);
  const sua = sinhCauHoi(b, nd.theoVaiTro, { viec: VIEC.SUA_DU_LIEU }).canHoi;
  bang(sua.filter((c) => c.loai === "khoa-nhan-dang").length, 0);
});

ca("chỉ hỏi về những cột mà thao tác thực sự chạm tới", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  suyKieuBang(b);
  const vt = nhanDang(b, [HO_SO]).theoVaiTro;

  const cot = b.tieuDe.indexOf("Ngày tử vong");
  const toanBo = sinhCauHoi(b, vt, { viec: VIEC.DUNG_BIEU_MAU }).canHoi;
  const motCot = sinhCauHoi(b, vt, { viec: VIEC.DUNG_BIEU_MAU, cotLienQuan: [cot] }).canHoi;
  dung(toanBo.length > 1, "phải có nhiều câu để so");
  dung(
    motCot.length < toanBo.length,
    `lọc theo cột phải ít hơn: ${motCot.length} so với ${toanBo.length}`
  );
  for (const c of motCot) dung(c.chiSoCot.includes(cot), `câu ${c.ma} không liên quan cột đó`);
});

ca("việc làm sạch KHÔNG hỏi chuyện ô trống — câu ấy không đổi phép sửa nào", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  suyKieuBang(b);
  const vt = nhanDang(b, [HO_SO]).theoVaiTro;
  bang(
    sinhCauHoi(b, vt, { viec: VIEC.SUA_DU_LIEU }).canHoi.filter((c) => c.loai === "o-trong").length,
    0
  );
  dung(
    sinhCauHoi(b, vt, { viec: VIEC.DUNG_BIEU_MAU }).canHoi.some((c) => c.loai === "o-trong"),
    "nhưng khi dựng biểu mẫu thì phải hỏi, vì nó đổi mẫu số"
  );
});

ca("mọi câu hỏi đều khai chỉ số cột của mình", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  suyKieuBang(b);
  const { tatCa } = sinhCauHoi(b, nhanDang(b, [HO_SO]).theoVaiTro);
  for (const c of tatCa) {
    dung(Array.isArray(c.chiSoCot) && c.chiSoCot.length, `câu ${c.ma} thiếu chiSoCot`);
  }
});

ca("mỗi câu hỏi phải khai rõ nó phục vụ việc gì và vì sao hỏi", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  suyKieuBang(b);
  const { tatCa } = sinhCauHoi(b, nhanDang(b, [HO_SO]).theoVaiTro);
  dung(tatCa.length > 0, "phải sinh được câu hỏi");
  for (const c of tatCa) {
    dung(Array.isArray(c.viec) && c.viec.length, `câu ${c.ma} không khai việc`);
    dung(c.viSaoHoi && c.viSaoHoi.length > 20, `câu ${c.ma} không nêu lý do hỏi`);
    dung(c.luaChon.length >= 2, `câu ${c.ma} không đủ lựa chọn`);
  }
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Phỏng vấn — hồ sơ đơn vị");

ca("đã trả lời thì không hỏi lại", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  suyKieuBang(b);
  const vt = nhanDang(b, [HO_SO]).theoVaiTro;
  const lan1 = sinhCauHoi(b, vt, { viec: VIEC.DUNG_BIEU_MAU }).canHoi;
  dung(lan1.length > 0, "lần đầu phải có câu hỏi");

  const hs = hoSoMoi(b, { ten: "CDC thử" });
  for (const c of lan1) ghiTraLoi(hs, c.ma, c.luaChon[0].ma);
  const lan2 = sinhCauHoi(b, vt, { viec: VIEC.DUNG_BIEU_MAU, daTraLoi: docTraLoi(hs) }).canHoi;
  bang(lan2.length, 0, "lần sau không được hỏi lại");
});

ca("hồ sơ đơn vị đi vòng qua JSON vẫn nguyên", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60 }));
  suyKieuBang(b);
  const hs = hoSoMoi(b, { ten: "CDC Cà Mau" });
  ghiTraLoi(hs, "NGAY:24", "thang-truoc", { boiVi: "tệp xuất từ hệ thống nước ngoài" });
  const lai = tuJson(sangJson(hs));
  bang(lai.ten, "CDC Cà Mau");
  bang(lai.traLoi["NGAY:24"].chon, "thang-truoc");
  bang(lai.traLoi["NGAY:24"].boiVi, "tệp xuất từ hệ thống nước ngoài");
});

ca("nhận ra tệp cùng loại kể cả khi thêm bớt vài cột", () => {
  const b1 = taoBang(sinhDanhSach({ soDong: 60 }));
  suyKieuBang(b1);
  const hs = hoSoMoi(b1);
  const v2 = sinhDanhSach({ soDong: 40 });
  for (const h of v2.hang) h.splice(5, 1);
  const b2 = taoBang(v2);
  suyKieuBang(b2);
  const k = doKhop(hs, b2);
  dung(k > 0.9 && k < 1, `độ khớp ${k} — phải cao nhưng không tuyệt đối`);
  dung(doKhop(hs, taoBang(sinhBangKhongLienQuan())) < 0.1, "tệp khác hẳn phải khớp thấp");
});

ca("câu trả lời dịch được thành quyết định cho lõi", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60, trungKhacTT: 3 }));
  suyKieuBang(b);
  const vt = nhanDang(b, [HO_SO]).theoVaiTro;
  const { canHoi } = sinhCauHoi(b, vt, { viec: VIEC.GOP_TRUNG });
  const cauKhoa = canHoi.find((c) => c.loai === "khoa-nhan-dang");
  const hs = hoSoMoi(b);
  ghiTraLoi(hs, cauKhoa.ma, cauKhoa.luaChon[0].ma);
  const qd = quyetDinhTu(hs, b);
  dung(Array.isArray(qd.khoaNhanDang) && qd.khoaNhanDang.length >= 1, "phải ra bộ khoá");
});

ca("chọn không gộp gì thì ra bộ khoá rỗng, không phải null", () => {
  const b = taoBang(sinhDanhSach({ soDong: 60, trungKhacTT: 3 }));
  suyKieuBang(b);
  const vt = nhanDang(b, [HO_SO]).theoVaiTro;
  const cauKhoa = sinhCauHoi(b, vt, { viec: VIEC.GOP_TRUNG }).canHoi
    .find((c) => c.loai === "khoa-nhan-dang");
  const hs = hoSoMoi(b);
  ghiTraLoi(hs, cauKhoa.ma, "khong-gop");
  bang(quyetDinhTu(hs, b).khoaNhanDang, []);
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Ghi tệp xlsx — vòng tròn ghi rồi đọc lại");

ca("ghi ra rồi đọc lại phải ra đúng từng ô, đủ mọi kiểu", async () => {
  const goc = [
    ["Chuỗi", "Số nguyên", "Số thực", "Ngày", "Trống", "Ký tự lạ"],
    ["Nguyễn Văn A", 42, 3.5, new Date(Date.UTC(2026, 4, 26)), "", "a<b>&\"c'd"],
    ["Xã Vĩnh Thạnh", -7, 0.125, new Date(Date.UTC(1999, 11, 31)), "", "  giữ  lề  "],
    ["", 0, 1e6, new Date(Date.UTC(2030, 0, 1)), "", "dòng\tcó tab"],
  ];
  const tep = await ghiXlsx([{ ten: "Thu", hang: goc }]);
  dung(tep.length > 400, `tệp quá nhỏ: ${tep.length} byte`);
  const doc = await docXlsx(tep);
  bang(doc.length, 1);
  bang(doc[0].ten, "Thu");
  for (let r = 0; r < goc.length; r++) {
    for (let c = 0; c < goc[r].length; c++) {
      const a = goc[r][c];
      const b = (doc[0].hang[r] || [])[c];
      const veA = a instanceof Date ? a.toISOString().slice(0, 10) : a === "" ? "" : a;
      const veB = b instanceof Date ? b.toISOString().slice(0, 10) : b === "" || b == null ? "" : b;
      bang(veB, veA, `ô hàng ${r + 1} cột ${c + 1}`);
    }
  }
});

ca("ghi được nhiều trang tính, tên trang bị cắt gọt cho hợp lệ", async () => {
  const tep = await ghiXlsx([
    { ten: "Du lieu", hang: [["a"], [1]] },
    { ten: "Ten/rat*dai[qua]muc-cho-phep-cua-Excel-nen-phai-cat", hang: [["b"], [2]] },
  ]);
  const doc = await docXlsx(tep);
  bang(doc.length, 2);
  bang(doc[0].ten, "Du lieu");
  dung(doc[1].ten.length <= 31, `tên dài ${doc[1].ten.length}`);
  sai(/[:\\/?*[\]]/.test(doc[1].ten), "tên trang còn ký tự cấm");
});

ca("toạ độ cột đúng cả khi vượt quá cột Z", () => {
  bang(toaDoCot(0), "A");
  bang(toaDoCot(25), "Z");
  bang(toaDoCot(26), "AA");
  bang(toaDoCot(89), "CL");
  bang(cotTuToaDo(toaDoCot(89) + "1"), 89);
});

ca("ô rỗng giữa dòng không làm dồn cột", async () => {
  const goc = [["a", "b", "c", "d"], ["x", "", "", "y"]];
  const doc = await docXlsx(await ghiXlsx([{ ten: "T", hang: goc }]));
  bang(doc[0].hang[1][0], "x");
  bang(doc[0].hang[1][3], "y");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Áp dụng phép sửa");

function chuanBiSua(tuyChon) {
  const v = sinhDanhSach(tuyChon);
  const kq = raSoat(v);
  const dx = deXuatSua(kq.bang, kq.phatHien, {});
  return { kq, dx };
}

ca("đề xuất đúng các nhóm sửa, không đề xuất nhóm cần phán đoán", () => {
  const { dx } = chuanBiSua({ soDong: 60, ngayThat: true, khoangTrangThua: 4,
    bienTheGioi: 6, trungKhacTT: 2 });
  const nhom = new Set(dx.map((d) => d.nhom));
  dung(nhom.has(NHOM.TRANG), "phải có nhóm cắt khoảng trắng");
  dung(nhom.has(NHOM.HOA), "phải có nhóm thống nhất hoa thường");
  dung(nhom.has(NHOM.TRUNG), "phải có nhóm bỏ dòng trùng");
  sai([...nhom].some((x) => String(x).includes("DAU")), "không được tự sửa biến thể về dấu");
  for (const d of dx) dung(d.xemTruoc.length > 0 || d.boDong, `nhóm ${d.ma} thiếu xem trước`);
});

ca("áp dụng KHÔNG chạm vào bảng gốc", () => {
  const { kq, dx } = chuanBiSua({ soDong: 60, ngayThat: true, khoangTrangThua: 4 });
  const truoc = JSON.stringify(kq.bang.dong);
  apDung(kq.bang, dx, dx.map((d) => d.ma));
  bang(JSON.stringify(kq.bang.dong), truoc, "bảng gốc phải nguyên vẹn");
});

ca("sửa xong thì hết khoảng trắng thừa và hết lệch hoa thường", () => {
  const { kq, dx } = chuanBiSua({ soDong: 60, ngayThat: true, khoangTrangThua: 4,
    bienTheGioi: 6, trungKhacTT: 2 });
  const r = apDung(kq.bang, dx, dx.map((d) => d.ma));
  bang(r.tomTat.soDongDaBo, 2);
  bang(r.tomTat.soDongSau, 60);

  const cGioi = kq.bang.tieuDe.indexOf("Giới tính");
  const cXa = kq.bang.tieuDe.indexOf("Phường/Xã thường trú");
  const than = r.hang.slice(1);
  sai(than.some((d) => typeof d[cXa] === "string" && d[cXa] !== d[cXa].trim()), "còn khoảng trắng thừa");
  bang([...new Set(than.map((d) => d[cGioi]))].sort(), ["Nam", "Nữ"]);
});

ca("chuẩn hoá cột ngày đưa ô văn bản thành ô ngày thật", () => {
  const { kq, dx } = chuanBiSua({ soDong: 40 });
  const ngay = dx.filter((d) => d.nhom === NHOM.NGAY);
  dung(ngay.length >= 3, `mong nhiều cột ngày, nhận ${ngay.length}`);
  const r = apDung(kq.bang, dx, ngay.map((d) => d.ma));
  const c = kq.bang.tieuDe.indexOf("Ngày XN khẳng định đầu tiên");
  const than = r.hang.slice(1);
  dung(than.every((d) => d[c] instanceof Date), "mọi ô phải thành ô ngày thật");
});

ca("ngày dạng ISO cũng phải thành ô ngày thật, không được bỏ qua", () => {
  // Chuỗi "2019-05-26" hiển thị y hệt ô ngày cùng ngày ấy. Chốt chặn "không đổi
  // thì bỏ qua" mà so theo mặt chữ sẽ bỏ lọt hết nhóm này, và cột lẫn hai định
  // dạng chỉ được sửa một nửa.
  const hang = [["stt", "ngày"]];
  for (let i = 0; i < 20; i++) hang.push([i + 1, `${String(i + 1).padStart(2, "0")}/07/2026`]);
  for (let i = 0; i < 5; i++) hang.push([21 + i, `2019-05-${String(20 + i)}`]);
  const b = taoBang({ ten: "t", hang });
  suyKieuBang(b);
  const dx = deXuatSua(b, [], {});
  const r = apDung(b, dx, dx.map((d) => d.ma));
  const than = r.hang.slice(1);
  bang(than.filter((d) => !(d[1] instanceof Date)).length, 0, "còn ô chưa thành ngày");
  bang(than[20][1].toISOString().slice(0, 10), "2019-05-20");
  bang(r.nhatKy.length, 25, "cả 25 ô phải vào nhật ký");
});

ca("không chọn nhóm nào thì không đổi gì", () => {
  const { kq, dx } = chuanBiSua({ soDong: 60, ngayThat: true, khoangTrangThua: 4,
    bienTheGioi: 6, trungKhacTT: 2 });
  const r = apDung(kq.bang, dx, []);
  bang(r.nhatKy.length, 0);
  bang(r.tomTat.soDongSau, kq.bang.dong.length);
});

ca("chọn một nhóm thì chỉ nhóm đó được áp dụng", () => {
  const { kq, dx } = chuanBiSua({ soDong: 60, ngayThat: true, khoangTrangThua: 4,
    bienTheGioi: 6, trungKhacTT: 2 });
  const chiTrung = dx.filter((d) => d.nhom === NHOM.TRUNG).map((d) => d.ma);
  const r = apDung(kq.bang, dx, chiTrung);
  bang(r.tomTat.soDongDaBo, 2);
  bang(r.tomTat.soODaSua, 0, "không được sửa ô nào khi chỉ chọn bỏ dòng trùng");
});

ca("nhật ký ghi đủ dòng, cột, giá trị trước và sau, thuộc nhóm nào", () => {
  const { kq, dx } = chuanBiSua({ soDong: 60, ngayThat: true, khoangTrangThua: 4,
    bienTheGioi: 6, trungKhacTT: 2 });
  const r = apDung(kq.bang, dx, dx.map((d) => d.ma));
  bang(r.nhatKy.length, r.tomTat.soODaSua + r.tomTat.soDongDaBo);
  for (const x of r.nhatKy) {
    dung(Number.isInteger(x.dong) && x.dong >= 2, `số dòng sai: ${x.dong}`);
    dung(typeof x.cot === "string" && x.cot.length > 0, "thiếu tên cột");
    dung(x.moi !== undefined && x.cu !== undefined, "thiếu giá trị trước hoặc sau");
    dung(typeof x.nhom === "string" && x.nhom.length > 0, "thiếu tên nhóm sửa");
  }
  const nk = trangNhatKy(r.nhatKy, r.tomTat, "goc.xlsx");
  dung(nk.hang.length > r.nhatKy.length, "trang nhật ký phải có cả phần đầu");
  dung(nk.hang.some((h) => String(h[0]).includes("không bị thay đổi")), "phải nói rõ bản gốc còn nguyên");
});

ca("hỏi về giá trị hiếm thay vì tự đoán nghĩa của nó", () => {
  const hang = [["stt", "giới tính"]];
  for (let i = 0; i < 200; i++) hang.push([i + 1, i % 3 === 0 ? "Nữ" : "Nam"]);
  for (let i = 0; i < 4; i++) hang.push([201 + i, "M"]);
  hang.push([210, "F"]);
  const b = taoBang({ ten: "t", hang });
  suyKieuBang(b);

  const hoi = sinhCauHoi(b).canHoi.filter((c) => c.loai === "gia-tri-hiem");
  bang(hoi.length, 2, "phải hỏi riêng từng giá trị hiếm");
  const cauM = hoi.find((c) => c.tieuDe.includes("“M”"));
  dung(cauM.luaChon.some((l) => l.nhan.includes("“Nam”")), "phải chào các giá trị phổ biến");
  dung(cauM.luaChon.some((l) => l.ma === "giu-rieng"), "phải cho giữ nguyên");
  dung(cauM.luaChon.some((l) => l.ma === "de-trong"), "phải cho để trống");

  // Chưa trả lời thì KHÔNG có nhóm sửa nào cho việc gộp.
  sai(deXuatSua(b, [], {}).some((d) => d.nhom === NHOM.GOP), "máy không được tự gộp");

  // Trả lời rồi thì mới có.
  const hs = hoSoMoi(b);
  ghiTraLoi(hs, cauM.ma, "=Nam");
  const dx = deXuatSua(b, [], quyetDinhTu(hs, b));
  const gop = dx.filter((d) => d.nhom === NHOM.GOP);
  bang(gop.length, 1);
  bang(gop[0].thayDoi.length, 4);
  const r = apDung(b, dx, dx.map((d) => d.ma));
  bang([...new Set(r.hang.slice(1).map((d) => d[1]))].sort(), ["F", "Nam", "Nữ"]);
});

ca("KHÔNG hỏi về giá trị hợp lệ chỉ tình cờ ít gặp — ca âm quan trọng nhất", () => {
  const hang = [["stt", "dân tộc", "đối tượng", "mã tỉnh"]];
  const dt = ["Kinh", "Kinh", "Kinh", "Kinh", "Kinh", "Kinh", "Kinh", "Kinh", "Kinh", "Khơ-me"];
  for (let i = 0; i < 300; i++) {
    hang.push([
      i + 1,
      i === 7 ? "Hoa" : dt[i % 10],                       // dân tộc hiếm nhưng là từ ngữ
      i === 11 ? "Người bán dâm" : "Người sử dụng ma túy", // đối tượng hiếm nhưng hợp lệ
      i === 13 ? "89" : i % 2 ? "96" : "92",              // mã ngắn, nhưng cột toàn mã ngắn
    ]);
  }
  const b = taoBang({ ten: "t", hang });
  suyKieuBang(b);
  const hoi = sinhCauHoi(b).canHoi.filter((c) => c.loai === "gia-tri-hiem");
  bang(hoi.map((c) => c.tieuDe), [], "không được hỏi câu nào");
});

ca("chỉ hỏi khi giá trị hiếm khác hẳn về hình thức", () => {
  const hang = [["stt", "giới tính"]];
  for (let i = 0; i < 300; i++) hang.push([i + 1, i % 3 === 0 ? "Nữ" : "Nam"]);
  for (let i = 0; i < 3; i++) hang.push([301 + i, "M"]);
  const b = taoBang({ ten: "t", hang });
  suyKieuBang(b);
  const hoi = sinhCauHoi(b).canHoi.filter((c) => c.loai === "gia-tri-hiem");
  bang(hoi.length, 1, "một chữ cái lẻ giữa các từ ngữ thì phải hỏi");
});

ca("chọn để trống thì xoá giá trị, không gộp bừa", () => {
  const hang = [["stt", "nhóm"]];
  for (let i = 0; i < 150; i++) hang.push([i + 1, i % 2 ? "Nhóm một" : "Nhóm hai"]);
  hang.push([151, "X"]);
  const b = taoBang({ ten: "t", hang });
  suyKieuBang(b);
  const cau = sinhCauHoi(b).canHoi.find((c) => c.loai === "gia-tri-hiem");
  const hs = hoSoMoi(b);
  ghiTraLoi(hs, cau.ma, "de-trong");
  const dx = deXuatSua(b, [], quyetDinhTu(hs, b));
  const r = apDung(b, dx, dx.map((d) => d.ma));
  bang(r.hang[151][1], "");
  bang(r.nhatKy[0].moi, "");
});

ca("câu trả lời về thứ tự ngày được dùng khi sửa", () => {
  const hang = [["stt", "ngày"]];
  for (let i = 0; i < 30; i++) hang.push([i + 1, "05/06/2026"]);
  const b = taoBang({ ten: "t", hang });
  suyKieuBang(b);
  const cauNgay = sinhCauHoi(b).canHoi.find((c) => c.loai === "thu-tu-ngay");
  const hs = hoSoMoi(b);
  ghiTraLoi(hs, cauNgay.ma, "thang-truoc");

  const dx = deXuatSua(b, [], quyetDinhTu(hs, b));
  const r = apDung(b, dx, dx.map((d) => d.ma));
  const d = r.hang[1][1];
  bang(d.toISOString().slice(0, 10), "2026-05-06", "tháng trước ngày sau: 05/06 là ngày 6 tháng 5");
});

ca("tệp kết quả gồm cả dữ liệu đã sửa và trang nhật ký", async () => {
  const { kq, dx } = chuanBiSua({ soDong: 40, ngayThat: true, khoangTrangThua: 3, trungKhacTT: 1 });
  const r = apDung(kq.bang, dx, dx.map((d) => d.ma));
  const tep = await ghiXlsx([
    { ten: "Du lieu da lam sach", hang: r.hang },
    trangNhatKy(r.nhatKy, r.tomTat, "goc.xlsx"),
  ]);
  const doc = await docXlsx(tep);
  bang(doc.length, 2);
  bang(doc[0].hang.length, r.hang.length);
  bang(doc[0].hang[0][2], kq.bang.tieuDe[2], "hàng tiêu đề phải giữ nguyên");
  dung(doc[1].hang.length > 5, "trang nhật ký phải có nội dung");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Vỏ add-in — đọc bảng tính qua Office.js");

const NGAY_SERIAL = (y, m, d) =>
  Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);

ca("nhận đúng định dạng nào là định dạng ngày", () => {
  dung(dinhDangLaNgay("dd/mm/yyyy"), "");
  dung(dinhDangLaNgay("m/d/yy h:mm"), "");
  sai(dinhDangLaNgay("General"), "");
  sai(dinhDangLaNgay("@"), "");
  sai(dinhDangLaNgay("#,##0.00"), "");
  sai(dinhDangLaNgay('#,##0" đồng"'), "chữ trong ngoặc kép không được tính");
  sai(dinhDangLaNgay('0.00" ly"'), "chữ y trong ngoặc kép không phải mã ngày");
});

ca("đọc được vùng dữ liệu KHÔNG bắt đầu từ ô A1", async () => {
  const gt = [
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "Họ tên", "Năm sinh"],
    ["", "", "Người A", 1990],
    ["", "", "Người B", 1985],
  ];
  const g = taoExcelGia([{ ten: "T", gt }]);
  const v = await docTrangHienTai(g.Excel);
  bang(v.ten, "T");
  bang(v.hang.length, 3);
  bang(v.hang[0], ["Họ tên", "Năm sinh"]);
  bang(v.hang[2], ["Người B", 1985]);
});

ca("ô ngày trả về là số, phải đổi lại thành ngày nhờ định dạng ô", async () => {
  const gt = [["Ngày", "Số tiền"], [NGAY_SERIAL(2026, 5, 26), 45000]];
  const dd = [["General", "General"], ["dd/mm/yyyy", "#,##0"]];
  const g = taoExcelGia([{ ten: "T", gt, dd }]);
  const v = await docTrangHienTai(g.Excel);
  dung(v.hang[1][0] instanceof Date, `nhận ${typeof v.hang[1][0]}`);
  bang(v.hang[1][0].toISOString().slice(0, 10), "2026-05-26");
  bang(v.hang[1][1], 45000, "số thường phải giữ nguyên là số");
});

ca("đọc theo khối vẫn ra đủ dòng và đúng thứ tự", async () => {
  const gt = [["stt"]];
  for (let i = 0; i < 47; i++) gt.push([i + 1]);
  const g = taoExcelGia([{ ten: "T", gt }]);
  const goi = [];
  const v = await docTrangHienTai(g.Excel, { moiKhoi: 5, tienTrinh: (a, b) => goi.push(`${a}/${b}`) });
  bang(v.hang.length, 48);
  bang(v.hang[1][0], 1);
  bang(v.hang[47][0], 47);
  dung(goi.length >= 9, `phải báo tiến trình nhiều lần, nhận ${goi.length}`);
  bang(goi[goi.length - 1], "48/48");
});

ca("trang tính rỗng thì trả về bảng rỗng, không ném lỗi", async () => {
  const g = taoExcelGia([{ ten: "Rong", gt: [] }]);
  const v = await docTrangHienTai(g.Excel);
  bang(v.hang.length, 0);
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Vỏ add-in — ghi sang trang tính mới");

ca("đặt tên trang không trùng và cắt cho hợp lệ", () => {
  bang(tenTrangHopLe("Du lieu", []), "Du lieu");
  bang(tenTrangHopLe("Du lieu", ["Du lieu"]), "Du lieu (2)");
  bang(tenTrangHopLe("Du lieu", ["Du lieu", "Du lieu (2)"]), "Du lieu (3)");
  sai(/[:\\/?*[\]]/.test(tenTrangHopLe("A/B*C[D]", [])), "còn ký tự cấm");
  dung(tenTrangHopLe("x".repeat(60), []).length <= 31, "phải cắt còn 31 ký tự");
});

ca("ghi sang trang mới và KHÔNG chạm vào trang gốc", async () => {
  const gtGoc = [["a", "b"], [1, 2]];
  const g = taoExcelGia([{ ten: "Goc", gt: gtGoc }]);
  await ghiTrangMoi(g.Excel, { ten: "Ket qua", hang: [["x", "y"], [9, 8]] });
  bang(g.tenTrang(), ["Goc", "Ket qua"]);
  bang(g.layTrang("Goc").gt, [["a", "b"], [1, 2]], "trang gốc phải nguyên vẹn");
  bang(g.layTrang("Ket qua").gt[1], [9, 8]);
  dung(g.layTrang("Ket qua").daKichHoat, "trang mới phải được chuyển tới");
});

ca("trùng tên thì tự đổi, không ném lỗi", async () => {
  const g = taoExcelGia([{ ten: "Ket qua", gt: [["a"]] }]);
  const ten = await ghiTrangMoi(g.Excel, { ten: "Ket qua", hang: [["b"]] });
  bang(ten, "Ket qua (2)");
  bang(g.tenTrang().length, 2);
});

ca("ngày ghi ra thành số kèm định dạng ngày", async () => {
  const g = taoExcelGia([{ ten: "G", gt: [["a"]] }]);
  await ghiTrangMoi(g.Excel, {
    ten: "R", hang: [["Ngày"], [new Date(Date.UTC(2026, 4, 26))]],
  });
  const t = g.layTrang("R");
  bang(t.gt[1][0], NGAY_SERIAL(2026, 5, 26));
  bang(t.dd[1][0], "dd/mm/yyyy");
});

ca("chuỗi số dài giữ dạng văn bản để không mất số 0 đứng đầu", async () => {
  const g = taoExcelGia([{ ten: "G", gt: [["a"]] }]);
  await ghiTrangMoi(g.Excel, { ten: "R", hang: [["CCCD"], ["096082945955"], [42]] });
  const t = g.layTrang("R");
  bang(t.dd[1][0], "@", "mã định danh phải là văn bản");
  bang(t.dd[2][0], "General", "số thường thì không");
});

ca("ghi được nhiều trang, trang đầu là trang được chuyển tới", async () => {
  const g = taoExcelGia([{ ten: "G", gt: [["a"]] }]);
  const ten = await ghiNhieuTrang(g.Excel, [
    { ten: "Du lieu", hang: [["x"]] },
    { ten: "Nhat ky", hang: [["y"]] },
  ]);
  bang(ten, ["Du lieu", "Nhat ky"]);
  dung(g.layTrang("Du lieu").daKichHoat, "");
  sai(g.layTrang("Nhat ky").daKichHoat, "");
});

ca("vòng tròn đầy đủ: đọc Excel → làm sạch → ghi trang mới → đọc lại", async () => {
  const gt = [
    ["TT", "Họ tên", "Giới tính", "Ngày XN"],
    [1, "Người A", "Nam ", "26/05/2026"],
    [2, "Người B", "nam", "2019-05-20"],
    [3, "Người C", "Nữ", "07/11/2022"],
    [4, "Người D", "Nữ", "01/02/2020"],
  ];
  // Trùng với dòng dữ liệu đầu, chỉ khác đúng cột số thứ tự.
  gt.push([5, "Người A", "Nam ", "26/05/2026"]);
  const g = taoExcelGia([{ ten: "Goc", gt }]);

  const vung = await docTrangHienTai(g.Excel);
  const kq = raSoat(vung);
  const dx = deXuatSua(kq.bang, kq.phatHien, {});
  const r = apDung(kq.bang, dx, dx.map((d) => d.ma));
  await ghiNhieuTrang(g.Excel, [
    { ten: "Da lam sach", hang: r.hang },
    trangNhatKy(r.nhatKy, r.tomTat, "Goc"),
  ]);

  bang(g.tenTrang(), ["Goc", "Da lam sach", "Nhat ky lam sach"]);
  bang(g.layTrang("Goc").gt.length, 6, "trang gốc phải còn nguyên số dòng");

  const moi = g.layTrang("Da lam sach");
  bang(moi.gt.length, 5, "một dòng trùng bị bỏ");
  bang(moi.gt[1][2], "Nam", "khoảng trắng thừa đã cắt");
  bang(moi.gt[2][2], "Nam", "hoa thường đã thống nhất");
  bang(moi.dd[1][3], "dd/mm/yyyy", "cột ngày phải mang định dạng ngày");
  bang(moi.gt[2][3], NGAY_SERIAL(2019, 5, 20), "ngày dạng ISO cũng phải đổi");

  const nk = g.layTrang("Nhat ky lam sach");
  dung(nk.gt.length > 5, "nhật ký phải có nội dung");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Phân tích — công cụ dùng chung");

ca("phân vị tính giống hàm QUARTILE của Excel", () => {
  const v = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  bang(phanVi(v, 0.25), 3.25);
  bang(phanVi(v, 0.5), 5.5);
  bang(phanVi(v, 0.75), 7.75);
  bang(phanVi([5], 0.5), 5);
  bang(phanVi([], 0.5), null);
});

ca("nhóm tuổi chia theo văn bản, không tự nghĩ ra", () => {
  bang(xepNhomTuoi(10, NHOM_TUOI.TT07_PL9), "Dưới 15 tuổi");
  bang(xepNhomTuoi(15, NHOM_TUOI.TT07_PL9), "15–49 tuổi");
  bang(xepNhomTuoi(49, NHOM_TUOI.TT07_PL9), "15–49 tuổi");
  bang(xepNhomTuoi(50, NHOM_TUOI.TT07_PL9), "Trên 49 tuổi");
  bang(xepNhomTuoi(14, NHOM_TUOI.TT05), "Dưới 15 tuổi");
  bang(xepNhomTuoi(80, NHOM_TUOI.TT05), "Từ 15 tuổi trở lên");
  bang(xepNhomTuoi(null, NHOM_TUOI.TT05), "Không rõ");
  bang(xepNhomTuoi(-3, NHOM_TUOI.TT05), "Không rõ");
});

ca("gộp mã con về mã cha, chỉ khi mã cha có mặt", () => {
  const b = banDoGopCap(["Mã 2 - Tình dục", "Mã 2.1 - Đồng giới", "Mã 3 - Mẹ con"]);
  bang(b.get("Mã 2.1 - Đồng giới"), "Mã 2 - Tình dục");
  bang(b.get("Mã 3 - Mẹ con"), "Mã 3 - Mẹ con");
  // Mã cha vắng mặt thì giữ nguyên mã con, không bịa ra nhóm mới.
  const c = banDoGopCap(["Mã 2.1 - Đồng giới", "Mã 2.2 - Khác giới"]);
  bang(c.get("Mã 2.1 - Đồng giới"), "Mã 2.1 - Đồng giới");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Phân tích — che ô nhỏ");

ca("che ô nhỏ nhưng KHÔNG che số không", () => {
  const b = { tieuDe: ["Năm", "Nam", "Nữ"], hang: [[2026, 3, 0], [2025, 40, 7]], tongCot: ["Tổng", 43, 7] };
  const r = cheONho(b, { nguong: 5 });
  bang(r.bang.hang[0], [2026, "<5", 0], "số 3 bị che, số 0 giữ nguyên");
  bang(r.bang.hang[1], [2025, 40, 7]);
  bang(r.soODaChe, 1);
  dung(r.ghiChu.some((g) => g.includes("trừ ngược")), "phải nói rõ giới hạn của phép che");
});

ca("không che cột nhãn dù nhãn là số", () => {
  const b = { tieuDe: ["Năm", "Số ca"], hang: [[2, 3]], tongCot: null };
  bang(cheONho(b, { nguong: 5 }).bang.hang[0], [2, "<5"], "cột đầu là nhãn, không phải số đếm");
});

ca("gộp nhóm nhỏ an toàn hơn che ô", () => {
  const b = {
    tieuDe: ["Xã", "Nam", "Tổng"],
    hang: [["A", 40, 40], ["B", 2, 2], ["C", 1, 1], ["D", 3, 3]],
    tongCot: ["Tổng", 46, 46],
  };
  const r = gopNhomNho(b, { nguong: 5 });
  bang(r.soNhomDaGop, 3);
  bang(r.bang.hang.length, 2);
  bang(r.bang.hang[1][2], 6, "ba nhóm nhỏ cộng lại");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Phân tích — liệt kê và tình trạng");

function chuanBiPT(tuyChon = {}) {
  const v = sinhDanhSach({ soDong: 120, ngayThat: true, ...tuyChon });
  const kq = raSoat(v);
  return { kq, vt: kq.nhanDang.theoVaiTro };
}

ca("liệt kê đủ 28 phân tích, chia bốn nhóm", () => {
  const { kq, vt } = chuanBiPT();
  const ds = lietKePhanTich(kq.bang, vt);
  const dem = (n) => ds.filter((x) => x.nhom === n).length;
  bang([dem("A"), dem("B"), dem("C"), dem("D")], [11, 9, 6, 2]);
  bang(ds.length, 28);
  bang([...new Set(ds.map((x) => x.ma))].length, 28, "mã không được trùng");
});

ca("phân biệt THIẾU CỘT với CỘT CÓ NHƯNG TRỐNG", () => {
  const { kq, vt } = chuanBiPT();
  const ds = lietKePhanTich(kq.bang, vt);
  const c5 = ds.find((x) => x.ma === "C5");
  sai(c5.chayDuoc, "bộ mẫu không có dữ liệu tải lượng nên C5 không chạy được");
  dung(c5.lyDo.length > 20, c5.lyDo);

  // Bỏ hẳn cột đi thì lý do phải khác.
  const v = sinhDanhSach({ soDong: 60, ngayThat: true });
  const c = v.hang[0].indexOf("Ngày điều trị ARV lần đầu");
  for (const h of v.hang) h.splice(c, 1);
  const kq2 = raSoat(v);
  const c2 = lietKePhanTich(kq2.bang, kq2.nhanDang.theoVaiTro).find((x) => x.ma === "C2");
  dung(c2.lyDo.includes("không có cột"), c2.lyDo);
});

ca("phân tích không có vai trò bắt buộc thì luôn chạy được", () => {
  const { kq, vt } = chuanBiPT();
  const ds = lietKePhanTich(kq.bang, vt);
  for (const ma of ["B4", "B5", "B6", "B7"]) {
    dung(ds.find((x) => x.ma === ma).chayDuoc, `${ma} phải chạy được với mọi tệp`);
  }
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Phân tích — nhóm A");

ca("A1 đếm ca theo năm, tổng khớp số dòng có ngày", () => {
  const { kq, vt } = chuanBiPT();
  const r = chayPhanTich(kq.bang, vt, "A1");
  dung(r.chayDuoc, r.lyDo);
  bang(r.bang.tongChung, kq.bang.dong.length);
  bang(r.bieuDo.loai, "duong");
  bang(r.bang.hang.map((h) => h[0]), [2023, 2024, 2025, 2026], "năm phải sắp tăng dần");
});

ca("A2 cắt quý theo dương lịch, bốn quý cộng lại bằng cả năm", () => {
  const { kq, vt } = chuanBiPT();
  const r = chayPhanTich(kq.bang, vt, "A2");
  const a1 = chayPhanTich(kq.bang, vt, "A1");
  bang(r.bang.tongChung, a1.bang.tongChung);
  dung(r.canCu.includes("Điều 11 khoản 2"), r.canCu);
});

ca("A3 tách giới tính, tổng mỗi dòng bằng tổng của dòng đó", () => {
  const { kq, vt } = chuanBiPT();
  const r = chayPhanTich(kq.bang, vt, "A3");
  for (const h of r.bang.hang) {
    const cong = h.slice(1, -1).reduce((a, b) => a + b, 0);
    bang(h[h.length - 1], cong, `dòng ${h[0]} không khớp`);
  }
});

ca("A4 đổi được cách chia nhóm tuổi, và nêu căn cứ", () => {
  const { kq, vt } = chuanBiPT();
  const a = chayPhanTich(kq.bang, vt, "A4", { tuyChonPhanTich: { nhomTuoi: "tt05" } });
  const b = chayPhanTich(kq.bang, vt, "A4", { tuyChonPhanTich: { nhomTuoi: "tt07" } });
  dung(a.bang.tieuDe.includes("Từ 15 tuổi trở lên"), a.bang.tieuDe.join(","));
  dung(b.bang.tieuDe.includes("15–49 tuổi"), b.bang.tieuDe.join(","));
  bang(a.bang.tongChung, b.bang.tongChung, "đổi cách chia không được đổi tổng");
  dung(a.canCu.includes("Thông tư 05"), a.canCu);
  dung(a.ghiChu.some((g) => g.includes("Sai số tới một tuổi")), "phải nói rõ tuổi tính theo năm");
});

ca("A5 gộp mã con về mã cha nên không đếm hai lần", () => {
  const { kq, vt } = chuanBiPT({ maPhanCap: true });
  const r = chayPhanTich(kq.bang, vt, "A5");
  const cot = r.bang.tieuDe.slice(1, -1);
  sai(cot.some((c) => /2\.1/.test(String(c))), `còn mã con: ${cot.join(", ")}`);
  dung(r.ghiChu.some((g) => g.includes("gộp mã con")), "phải nói đã gộp");
  bang(r.bang.tongChung, kq.bang.dong.length);
});

ca("A10 đặt hai cách tổng hợp cạnh nhau", () => {
  const { kq, vt } = chuanBiPT({ maPhanCap: true });
  const r = chayPhanTich(kq.bang, vt, "A10");
  bang(r.bangPhu.length, 1);
  dung(r.bang.hang.length > r.bangPhu[0].bang.hang.length, "gộp xong phải ít nhóm hơn");
  bang(r.bang.tongChung, r.bangPhu[0].bang.tongChung, "gộp không được làm mất ca");
});

ca("A11 nêu rõ đây là dấu hiệu, không phải kết luận, và dẫn Quyết định 286", () => {
  const { kq, vt } = chuanBiPT({ soDong: 300 });
  const r = chayPhanTich(kq.bang, vt, "A11");
  dung(r.canCu.includes("286"), r.canCu);
  dung(r.ghiChu.some((g) => g.includes("KHÔNG phải kết luận")), "phải nói rõ mức độ");
  dung(r.ghiChu.some((g) => g.includes("sinh học phân tử")), "phải nói rõ cái gì không tính được");
  dung(r.ghiChu.some((g) => g.includes("Cách tính của công cụ")), "phải công khai cách tính");
});

ca("A11 tìm ra được chùm ca khi có chùm ca thật", () => {
  // Nền thưa: mỗi tháng một ca ở mỗi xã. Rồi dồn 6 ca vào một xã trong một tháng.
  const hang = [["stt", "Họ tên", "Ngày XN khẳng định đầu tiên", "Phường/Xã hiện tại"]];
  let n = 1;
  for (let thang = 1; thang <= 12; thang++) {
    for (const xa of ["Xã A", "Xã B"]) {
      hang.push([n, `Người ${n}`, `05/${String(thang).padStart(2, "0")}/2025`, xa]);
      n++;
    }
  }
  for (let k = 0; k < 6; k++) {
    hang.push([n, `Người ${n}`, `1${k}/07/2025`, "Xã A"]);
    n++;
  }
  const b = taoBang({ ten: "t", hang });
  suyKieuBang(b);
  // Bảng bốn cột không đủ để nhận dạng hồ sơ, nên dựng thẳng bản đồ vai trò —
  // ca thử này đo riêng phép tìm chùm ca, không đo phép nhận dạng.
  const vt = new Map([["ngay_khang_dinh", 2], ["xa_hien_tai", 3]]);
  const r = chayPhanTich(b, vt, "A11");
  dung(r.chayDuoc, r.lyDo);
  bang(r.bang.hang.length, 1, "đúng một cảnh báo");
  bang(r.bang.hang[0][0], "Xã A");
  bang(r.bang.hang[0][1], "2025-07");
  bang(r.bang.hang[0][2], 7, "sáu ca dồn cộng một ca nền của tháng đó");
});

ca("A11 KHÔNG cảnh báo khi số ca rải đều — ca âm", () => {
  const hang = [["stt", "Họ tên", "Ngày XN khẳng định đầu tiên", "Phường/Xã hiện tại"]];
  let n = 1;
  for (let thang = 1; thang <= 12; thang++) {
    for (const xa of ["Xã A", "Xã B"]) {
      for (let k = 0; k < 2; k++) {
        hang.push([n, `Người ${n}`, `0${k + 1}/${String(thang).padStart(2, "0")}/2025`, xa]);
        n++;
      }
    }
  }
  const b = taoBang({ ten: "t", hang });
  suyKieuBang(b);
  const vt = new Map([["ngay_khang_dinh", 2], ["xa_hien_tai", 3]]);
  bang(chayPhanTich(b, vt, "A11").bang.hang.length, 0,
    "hai ca mỗi tháng đều đặn thì không có chùm ca");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Phân tích — nhóm B, C, D");

ca("B1 cho trung vị và phân nhóm độ trễ, nêu mẫu số", () => {
  const { kq, vt } = chuanBiPT();
  const r = chayPhanTich(kq.bang, vt, "B1");
  dung(r.chayDuoc, r.lyDo);
  dung(r.ghiChu.some((g) => g.includes("Trung vị")), r.ghiChu.join(" | "));
  dung(r.ghiChu.some((g) => g.includes("Mẫu số")), "mọi tỷ lệ phải kèm mẫu số");
});

ca("B3 cảnh báo tỷ lệ kịp thời của năm gần nhất bị cao giả tạo", () => {
  const { kq, vt } = chuanBiPT();
  const r = chayPhanTich(kq.bang, vt, "B3");
  dung(r.ghiChu.some((g) => g.includes("cao giả tạo")), r.ghiChu.join(" | "));
});

ca("B4 chia ba nhóm và nhắc ba trường hợp không phải lỗi", () => {
  const { kq, vt } = chuanBiPT();
  const r = chayPhanTich(kq.bang, vt, "B4");
  bang(r.bang.hang.length, kq.bang.cot.length);
  dung(r.ghiChu.some((g) => g.includes("KHÔNG phải lỗi")), r.ghiChu.join(" | "));
  const xep = new Set(r.bang.hang.map((h) => h[4]));
  dung(xep.has("Trống hoàn toàn"), "bộ mẫu có cột trống hoàn toàn");
});

ca("B8 phát hiện các cột tử vong lệch nhau", () => {
  const { kq, vt } = chuanBiPT({ lechTuVong: 3 });
  const r = chayPhanTich(kq.bang, vt, "B8");
  dung(r.ghiChu.some((g) => g.includes("chênh lệch")), r.ghiChu.join(" | "));
  dung(r.ghiChu.some((g) => g.includes("Phụ lục 4")), "phải chỉ ra cột nào là chuẩn của biểu mẫu");
});

ca("C2 nêu tỷ lệ bắt đầu ARV trong 7 và 30 ngày", () => {
  const { kq, vt } = chuanBiPT();
  const r = chayPhanTich(kq.bang, vt, "C2");
  dung(r.ghiChu[0].includes("trong 7 ngày"), r.ghiChu[0]);
  dung(r.ghiChu[0].includes("trong 30 ngày"), r.ghiChu[0]);
});

ca("C5 và C6 nêu đúng ngưỡng theo văn bản Việt Nam", () => {
  // Bản xuất thật để trống hai cột này, nên phải tự bơm số vào mới đo được.
  const v = sinhDanhSach({ soDong: 40, ngayThat: true });
  v.hang[0].push("Tải lượng virus ARV lần gần đây nhất", "Kết quả kiểm tra CD4 gần nhất");
  for (let i = 1; i < v.hang.length; i++) {
    const k = i - 1;
    v.hang[i].push(k < 10 ? 50 : k < 20 ? 500 : 5000, k < 8 ? 120 : 400);
  }
  const kq = raSoat(v);
  const vt = kq.nhanDang.theoVaiTro;
  const c5 = chayPhanTich(kq.bang, vt, "C5", {});
  dung(c5.chayDuoc, c5.lyDo);
  bang(c5.bang.hang[0][1], 10, "dưới 200 bản sao");
  bang(c5.bang.hang[1][1], 20, "dưới 1.000 bản sao");
  dung(c5.canCu.includes("5968"), c5.canCu);
  const c6 = chayPhanTich(kq.bang, vt, "C6", {});
  bang(c6.bang.hang[0][1], 8, "CD4 dưới 200");
  dung(c6.ghiChu.some((g) => g.includes("KHÔNG có trong hướng dẫn Việt Nam")),
    "phải nói rõ mốc 350 là chuẩn tham khảo");
});

ca("D1 nhắc rằng năm chưa triển khai xét nghiệm thì tỷ lệ bằng không là bình thường", () => {
  const { kq, vt } = chuanBiPT();
  const r = chayPhanTich(kq.bang, vt, "D1");
  dung(r.ghiChu.some((g) => g.includes("không phải thiếu dữ liệu")), r.ghiChu.join(" | "));
});

ca("che ô nhỏ áp dụng được cho mọi phân tích, kể cả bảng phụ", () => {
  const { kq, vt } = chuanBiPT({ soDong: 40 });
  const thuong = chayPhanTich(kq.bang, vt, "A3");
  const daChe = chayPhanTich(kq.bang, vt, "A3", { che: true, nguong: 5 });
  dung(daChe.soODaChe >= 0, "");
  if (daChe.soODaChe > 0) {
    dung(JSON.stringify(daChe.bang.hang).includes("<5"), "phải thay bằng ký hiệu che");
    dung(daChe.ghiChu.length > thuong.ghiChu.length, "phải thêm ghi chú về việc che");
  }
});

ca("đổi kết quả thành hàng để ghi ra tệp", () => {
  const { kq, vt } = chuanBiPT();
  const r = chayPhanTich(kq.bang, vt, "A1");
  const hang = phanTichThanhHang(r);
  bang(hang[0][0], r.ten);
  dung(hang.some((h) => h[0] === "Ghi chú"), "phải có phần ghi chú");
  dung(hang.some((h) => String(h[0]).includes("Mẫu số")), "ghi chú về mẫu số phải đi kèm");
  dung(hang.length > r.bang.hang.length, "phải có cả tiêu đề và ghi chú");
});

ca("phân tích có bảng phụ thì bảng phụ cũng vào tệp", () => {
  const { kq, vt } = chuanBiPT({ maPhanCap: true });
  const r = chayPhanTich(kq.bang, vt, "A10");
  const hang = phanTichThanhHang(r);
  dung(hang.some((h) => h[0] === r.bangPhu[0].ten), "phải có tiêu đề bảng phụ");
});

/* ══════════════════════════════════════════════════════════ */
nhomCa("Biểu đã cộng — phép kiểm số học chung");

const raBieu = (v) => raSoat(v);
const coMa = (kq, ma) => kq.phatHien.filter((p) => p.ma === ma);
const chacChan = (kq) => kq.phatHien.filter((p) => p.mucDo === MUC.CHAC_CHAN);

ca("biểu điền đúng thì KHÔNG có phát hiện chắc chắn nào — ca âm", () => {
  const kq = raBieu(sinhBieuTuVanXetNghiem());
  bang(kq.bang.hinhDang, HINH_DANG.BIEU_TONG_HOP);
  bang(
    chacChan(kq).map((p) => p.ma),
    [],
    "biểu điền đúng không được sinh cảnh báo chắc chắn nào"
  );
});

ca("biểu giám sát ca bệnh không bị nhận bừa thành biểu Thông tư 05 — ca âm", () => {
  const kq = raBieu(sinhBieuTongHop());
  bang(kq.nhanDangBieu.ketQua, "khong-nhan-ra");
  bang(chacChan(kq).length, 0, "biểu cộng đúng thì không có lỗi chắc chắn");
});

ca("BB01 bắt dòng con lớn hơn dòng cha", () => {
  const kq = raBieu(sinhBieuTuVanXetNghiem({ conVuotCha: true }));
  const p = coMa(kq, "BB01");
  bang(p.length, 1);
  bang(p[0].mucDo, MUC.CHAC_CHAN);
  dung(p[0].viDu.some((v) => v.includes("mã 6.1")), "phải nêu đúng mã dòng vi phạm");
});

ca("BB01 KHÔNG báo khi hai phần La Mã dùng lại cùng dãy mã — ca âm", () => {
  // Mục 1.1 của phần II là 25, lớn hơn mục 1 của phần I là 10. Nếu mã không được
  // đánh theo từng phần thì máy sẽ tưởng đây là dòng con vượt dòng cha.
  const kq = raBieu(sinhBieuHaiPhan());
  bang(coMa(kq, "BB01").length, 0, "mã phải được đánh theo từng phần La Mã");
});

ca("BB02 bắt cột tổng NHỎ HƠN tổng cột phân tổ, xếp mức chắc chắn", () => {
  const kq = raBieu(sinhBieuTuVanXetNghiem({ tongNhoHon: true }));
  const p = coMa(kq, "BB02");
  bang(p.length, 1);
  bang(p[0].mucDo, MUC.CHAC_CHAN);
});

ca("BB03 cột tổng LỚN HƠN chỉ ở mức cần xác minh, vì có thể còn nhóm không rõ giới", () => {
  const kq = raBieu(sinhBieuTuVanXetNghiem({ tongLonHon: true }));
  const p = coMa(kq, "BB03");
  bang(p.length, 1);
  bang(p[0].mucDo, MUC.CAN_XAC_MINH);
  dung(p[0].moTa.includes("chưa chắc là lỗi"), "phải nói rõ đây chưa chắc là lỗi");
  bang(coMa(kq, "BB02").length, 0, "lệch chiều này không được xếp mức chắc chắn");
});

ca("cột Năm đứng cạnh cột Tổng không bị hiểu thành cột giới tính — ca âm", () => {
  // Bỏ dấu thì "Năm" trùng "Nam". Đòi đủ cặp Nam–Nữ là cách chặn bẫy này.
  const b = taoBang({
    ten: "Theo nam",
    hang: [
      ["TT", "Chỉ tiêu", "Năm", "Tổng"],
      ["1", "Số ca phát hiện", 2019, 40],
      ["2", "Số ca tử vong", 2020, 3],
    ],
  });
  bang(nhomPhanTo(b).length, 0, "không được gom cột Năm vào nhóm phân tổ giới tính");
});

ca("BB06 bắt số ghi dưới dạng chuỗi, và đọc đúng dấu phân cách hàng nghìn", () => {
  bang(docSoBieu("1.240").so, 1240, "dấu chấm trong tiếng Việt là phân cách hàng nghìn");
  bang(docSoBieu("12,5").so, 12.5, "dấu phẩy là phân cách thập phân");
  bang(docSoBieu("—"), null, "gạch ngang là cách ghi không có số liệu");
  const kq = raBieu(sinhBieuTuVanXetNghiem({ soDangChuoi: true }));
  const p = coMa(kq, "BB06");
  bang(p.length, 1);
  bang(p[0].mucDo, MUC.CHAC_CHAN);
  dung(p[0].moTa.includes("SUM"), "phải nói rõ hậu quả: hàm SUM bỏ qua mà không báo lỗi");
});

ca("BB07 nêu việc dùng lẫn ô trống và số 0, ở mức ghi nhận", () => {
  const kq = raBieu(sinhBieuTuVanXetNghiem({ tronTrongVaKhong: true }));
  const p = coMa(kq, "BB07");
  dung(p.length >= 1, "phải nêu cột dùng lẫn hai cách ghi");
  bang(p[0].mucDo, MUC.GHI_NHAN);
});

ca("BB04 im lặng khi dòng tổng khớp một cách gom hợp lý — ca âm", () => {
  const kq = raBieu(sinhBieuTongHop());
  bang(coMa(kq, "BB04").length, 0, "dòng tổng khớp toàn bộ mục cấp một thì không nêu");
});

nhomCa("Biểu đã cộng — hồ sơ biểu mẫu Thông tư 05");

ca("nhận ra biểu Tư vấn xét nghiệm HIV theo nhãn dòng", () => {
  const kq = raBieu(sinhBieuTuVanXetNghiem());
  bang(kq.nhanDangBieu.ketQua, "nhan-ra");
  bang(kq.nhanDangBieu.bieu.ma, "tt05-tu-van-xet-nghiem");
});

ca("nhận ra biểu Methadone và biểu duy trì PrEP báo cáo năm", () => {
  bang(raBieu(sinhBieuMethadone()).nhanDangBieu.bieu.ma, "tt05-methadone");
  bang(raBieu(sinhBieuPrepNam()).nhanDangBieu.bieu.ma, "tt05-prep-nam");
});

ca("T502 bắt quan hệ cộng mà phụ lục khai rõ: mục 6 = 6.1 + 6.2", () => {
  const kq = raBieu(sinhBieuTuVanXetNghiem({ lechSauChia: true }));
  const p = coMa(kq, "T502");
  bang(p.length, 1);
  bang(p[0].mucDo, MUC.CHAC_CHAN);
  dung(p[0].moTa.includes("Thông tư 05"), "phải dẫn căn cứ");
  bang(coMa(kq, "BB01").length, 0, "lệch kiểu này không phải dòng con vượt dòng cha");
});

ca("ba mục con lồng nhau của biểu Methadone KHÔNG bị cộng lại — ca âm", () => {
  // 1.1 + 1.2 + 1.3 = 380 + 351 + 64 = 795, lớn hơn mục 1 là 420. Biểu điền ĐÚNG.
  // Áp quan hệ cộng cho mọi bộ mục con thì ca này sẽ bị báo nhầm.
  const kq = raBieu(sinhBieuMethadone());
  bang(chacChan(kq).length, 0, "tập lồng không được kiểm bằng quan hệ cộng");
});

ca("T501 bắt quan hệ tập lồng: mục 1.2 không được lớn hơn mục 1.1", () => {
  const kq = raBieu(sinhBieuMethadone({ lechLong: true }));
  const p = coMa(kq, "T501");
  bang(p.length, 1);
  bang(p[0].mucDo, MUC.CHAC_CHAN);
  dung(p[0].moTa.includes("trên 12 tháng"), "phải giải thích quan hệ bằng lời");
  bang(coMa(kq, "BB01").length, 0, "mã phân cấp không nói lên quan hệ giữa 1.2 và 1.1");
});

ca("T501 bắt quan hệ giữa hai mục NGANG CẤP của biểu duy trì PrEP", () => {
  const kq = raBieu(sinhBieuPrepNam({ duyTriVuot: true }));
  const p = coMa(kq, "T501");
  dung(p.length >= 1, "mục 2 lớn hơn mục 1 phải bị bắt");
  bang(p[0].mucDo, MUC.CHAC_CHAN);
});

ca("mọi biểu nhận ra được đều nêu cách cắt kỳ của Thông tư 05 Điều 3", () => {
  const kq = raBieu(sinhBieuTuVanXetNghiem());
  const p = coMa(kq, "T503");
  bang(p.length, 1);
  bang(p[0].mucDo, MUC.GHI_NHAN);
  dung(p[0].moTa.includes("ngày 15"), "phải nêu mốc 15 tháng trước kỳ");
  dung(p[0].moTa.includes("Thông tư 07"), "phải nói rõ khác với cách cắt kỳ của Thông tư 07");
});

ca("biểu duy trì PrEP nêu mốc thống kê riêng 15/9 đến 14/9", () => {
  const kq = raBieu(sinhBieuPrepNam());
  const ly = coMa(kq, "T504").map((p) => p.moTa).join(" ");
  dung(ly.includes("15/9") && ly.includes("14/9"), "phải nêu mốc riêng của biểu này");
  dung(ly.includes("thứ ba"), "phải nói rõ đây là cách cắt kỳ thứ ba, khác cả hai cách kia");
});

ca("biểu lũy tích nhắc rõ không được cộng bốn quý", () => {
  const b = taoBang({
    ten: "Bang 1",
    hang: [
      ["BẢNG 1: Hoạt động can thiệp giảm tác hại", "", "", "", ""],
      ["TT", "Đối tượng", "Bơm kim tiêm", "Bao cao su", "Chất bôi trơn"],
      ["1", "Người sử dụng ma túy", 120, 300, 80],
      ["2", "Người bán dâm", 5, 210, 190],
      ["3", "Người có quan hệ tình dục đồng giới", 2, 260, 240],
      ["4", "Người chuyển đổi giới tính (TG)", 0, 40, 38],
    ],
  });
  const nd = nhanDangBieu(b);
  bang(nd.bieu.ma, "tt05-can-thiep-giam-tac-hai");
  const ly = kiemBieuTT05(b, nd.bieu).map((p) => p.moTa).join(" ");
  dung(ly.includes("LŨY TÍCH"), "phải nêu số liệu là lũy tích");
  dung(ly.includes("KHÔNG được cộng bốn quý"), "phải nói rõ hệ quả khi cộng bốn quý");
});

ca("biểu đi qua tệp xlsx thật vẫn nhận đúng, dù mất thông tin ô gộp", async () => {
  // Ghi ra tệp rồi đọc lại làm mất ô gộp — dấu hiệu mạnh nhất của biểu đã cộng.
  // Nếu hình dạng chỉ nhận ra được nhờ ô gộp thì mọi tệp người dùng tự lưu lại sẽ
  // bị hiểu thành danh sách, và công cụ sẽ chào phép xoá dòng trùng trên biểu.
  const mau = sinhBieuMethadone({ lechLong: true });
  const doc = await docXlsx(await ghiXlsx([{ ten: "Bieu", hang: mau.hang }]));
  const kq = raSoat(doc[0]);
  bang(kq.bang.hinhDang, HINH_DANG.BIEU_TONG_HOP, "vẫn phải nhận ra là biểu đã cộng");
  bang(kq.bang.chiSoHangTieuDe + 1, 3, "hàng tiêu đề thật nằm ở dòng 3");
  bang(kq.nhanDangBieu.bieu.ma, "tt05-methadone");
  const p = coMa(kq, "T501");
  bang(p.length, 1);
  dung(p[0].moTa.includes("Dòng 6") && p[0].moTa.includes("dòng 5"),
    "số hàng phải tính theo trang tính thật, không phải theo chỉ số dòng dữ liệu");
});

ca("bảng không phải biểu Thông tư 05 thì nói rõ đang ở tầng chung — ca âm", () => {
  const b = {
    ten: "Bang tu lam",
    oGop: [{ hangDau: 0, hangCuoi: 0, cotDau: 0, cotCuoi: 2 }],
    hang: [
      ["THEO DÕI VẬT TƯ TIÊU HAO THÁNG 8", "", ""],
      ["TT", "Loại vật tư", "Số lượng"],
      ["1", "Găng tay", 400],
      ["2", "Khẩu trang", 900],
      ["Tổng", "", 1300],
    ],
  };
  const kq = raBieu(b);
  bang(kq.nhanDangBieu.ketQua, "khong-nhan-ra");
  dung(
    kq.canhBaoLuong.some((c) => c.includes("chỉ chạy các phép kiểm số học chung")),
    "phải nói rõ đang ở tầng chung chứ không im lặng"
  );
  bang(coMa(kq, "T503").length, 0, "không nhận ra biểu thì không được viện dẫn Điều 3");
});

/* ══════════════════════════════════════════════════════════ */
const ok = await chayTatCa();
process.exit(ok ? 0 : 1);
