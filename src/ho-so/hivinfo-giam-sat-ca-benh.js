/**
 * Hồ sơ nhận dạng: Danh sách giám sát ca bệnh HIV — bản xuất từ hệ thống HIV-INFO.
 *
 * Căn cứ tập giá trị: Thông tư 07/2023/TT-BYT.
 *   Phụ lục 1 — bảng mã Nghề nghiệp (12 mã), Đối tượng (10 mã),
 *               Kết quả xác minh hiện trạng cư trú (8 mã).
 *   Phụ lục 3 — bảng mã Nguyên nhân tử vong (7 mã).
 *
 * Lưu ý về mức kết luận: giá trị nằm ngoài bảng mã KHÔNG được xếp là lỗi chắc
 * chắn. Hệ thống nguồn có thể dùng danh mục mở rộng hợp lệ. Mức đúng là
 * "cần xác minh", kèm trích dẫn điều khoản để người dùng tự đối chiếu.
 */

import { catTrang, chuanHoa } from "../tien-ich/chuoi.js";
import { doanNgay, soNgayGiua } from "../tien-ich/ngay.js";
import { MUC } from "../kiem/kiem-chung.js";

/** Bỏ tiền tố "Mã 10 - " để so với tên trong bảng mã. */
export function loiMa(s) {
  return chuanHoa(String(s == null ? "" : s).replace(/^\s*ma\s*\d+(?:\.\d+)*\s*[-–:]\s*/iu, ""));
}

export function docNgay(v) {
  const r = doanNgay(v, { nhanSoThuTu: true });
  return r ? r.ngay : null;
}

const CAN_CU_PL1 = "Thông tư 07/2023/TT-BYT, Phụ lục 1";
const CAN_CU_PL3 = "Thông tư 07/2023/TT-BYT, Phụ lục 3";

export const TAP_GIA_TRI = {
  nghe_nghiep: {
    canCu: CAN_CU_PL1,
    ten: [
      "Nhân viên cơ sở kinh doanh dịch vụ dễ bị lợi dụng để hoạt động mại dâm",
      "Lái xe",
      "Ngư dân",
      "Người làm nông nghiệp",
      "Công nhân",
      "Cán bộ, chiến sĩ lực lượng vũ trang nhân dân",
      "Công chức, viên chức, người lao động có hợp đồng",
      "Học sinh, sinh viên",
      "Trẻ em",
      "Lao động tự do",
      "Thất nghiệp",
      "Phạm nhân",
    ],
  },
  doi_tuong: {
    canCu: CAN_CU_PL1,
    ten: [
      "Người sử dụng ma túy",
      "Người bán dâm",
      "Người có quan hệ tình dục đồng giới",
      "Người chuyển đổi giới tính",
      "Vợ, chồng và thành viên khác của gia đình cùng sống chung với người nhiễm HIV",
      "Người có quan hệ tình dục với người nhiễm HIV",
      "Người mắc các bệnh lây truyền qua đường tình dục",
      "Phạm nhân, người bị tạm giam, trại viên cơ sở giáo dục bắt buộc, học sinh trường giáo dưỡng, học viên cơ sở cai nghiện ma túy",
      "Nhóm bệnh nhân Lao",
      "Người nghi ngờ AIDS",
    ],
  },
  hien_trang_cu_tru: {
    canCu: CAN_CU_PL1,
    ten: [
      "Mất dấu",
      "Hiện đang sinh sống tại địa phương",
      "Không có thực tế",
      "Đi trại",
      "Chuyển đi tỉnh khác",
      "Chưa xác định được",
      "Đi làm ăn xa",
      "Chuyển đi trong tỉnh",
    ],
  },
  nguyen_nhan_tu_vong: {
    canCu: CAN_CU_PL3,
    ma: ["1", "2", "3", "4", "5", "6", "7"],
    ten: [
      "Giai đoạn cuối của AIDS",
      "Do mắc bệnh khác",
      "Sốc do sử dụng ma tuý quá liều",
      "Tự tử",
      "Tai nạn",
      "Khác",
      "Không rõ",
    ],
  },
};

export const HO_SO = {
  ma: "hivinfo-giam-sat-ca-benh",
  ten: "Danh sách giám sát ca bệnh HIV (bản xuất HIV-INFO)",
  moTa:
    "Mỗi dòng là một người nhiễm HIV được quản lý trong hệ thống giám sát ca bệnh. " +
    "Đây là tệp dựng được biểu mẫu Phụ lục 4 của Thông tư 07/2023/TT-BYT.",

  // Thứ tự có ý nghĩa: vai trò đứng trước nhận cột trước. Các vai trò "mã ..."
  // phải đứng trước vai trò tên tương ứng, nếu không thì "Mã Phường/Xã hiện tại"
  // bị nhận nhầm thành "Phường/Xã hiện tại".
  dauHieu: [
    { vaiTro: "ma_benh_nhan", khoa: ["ma benh nhan", "=patient id"], trongSo: 2 },
    { vaiTro: "ho_ten", khoa: ["=ho ten", "=ho va ten"], trongSo: 2 },
    { vaiTro: "nam_sinh", khoa: ["=nam sinh"], trongSo: 2, batBuoc: false },
    { vaiTro: "gioi_tinh", khoa: ["=gioi tinh"], trongSo: 3, batBuoc: true },
    { vaiTro: "dan_toc", khoa: ["=dan toc"], trongSo: 1 },
    { vaiTro: "so_cccd", khoa: ["=so cccd"], trongSo: 1 },
    { vaiTro: "so_cmnd", khoa: ["=so cmnd"], trongSo: 1 },
    { vaiTro: "so_dien_thoai", khoa: ["=so dien thoai"], trongSo: 1 },
    { vaiTro: "nghe_nghiep", khoa: ["=nghe nghiep"], trongSo: 2 },
    { vaiTro: "doi_tuong", khoa: ["=doi tuong"], trongSo: 2 },
    { vaiTro: "hanh_vi_nguy_co", khoa: ["hanh vi nguy co"], trongSo: 1 },
    { vaiTro: "duong_lay", khoa: ["=duong lay"], trongSo: 3, batBuoc: false },
    { vaiTro: "ma_tinh_thuong_tru", khoa: ["ma tinh/tp thuong tru"], trongSo: 0.5 },
    { vaiTro: "tinh_thuong_tru", khoa: ["tinh/tp thuong tru"], trongSo: 1 },
    { vaiTro: "ma_xa_thuong_tru", khoa: ["ma phuong/xa thuong tru"], trongSo: 0.5 },
    { vaiTro: "xa_thuong_tru", khoa: ["phuong/xa thuong tru"], trongSo: 1 },
    { vaiTro: "hien_trang_cu_tru_tt", khoa: ["cu tru - tinh thuong tru"], trongSo: 1 },
    { vaiTro: "ma_tinh_hien_tai", khoa: ["ma tinh/tp hien tai"], trongSo: 0.5 },
    { vaiTro: "tinh_hien_tai", khoa: ["tinh/tp hien tai"], trongSo: 1 },
    { vaiTro: "ma_xa_hien_tai", khoa: ["ma phuong/xa hien tai"], trongSo: 0.5 },
    { vaiTro: "xa_hien_tai", khoa: ["phuong/xa hien tai"], trongSo: 1 },
    { vaiTro: "hien_trang_cu_tru_ht", khoa: ["cu tru - tinh hien tai"], trongSo: 1 },
    { vaiTro: "tinh_phat_hien", khoa: ["tinh/tp phat hien"], trongSo: 1 },
    { vaiTro: "co_so_khang_dinh", khoa: ["co so khang dinh"], trongSo: 1 },
    { vaiTro: "ngay_khang_dinh", khoa: ["ngay xn khang dinh"], trongSo: 4, batBuoc: true },
    { vaiTro: "ket_luan_nhiem_moi", khoa: ["ket luan chan doan nhiem moi"], trongSo: 2 },
    { vaiTro: "tinh_dieu_tri", khoa: ["=tinh dieu tri"], trongSo: 1 },
    { vaiTro: "co_so_dieu_tri", khoa: ["co so dieu tri"], trongSo: 1 },
    { vaiTro: "trang_thai_dieu_tri", khoa: ["trang thai dieu tri"], trongSo: 2 },
    { vaiTro: "ngay_arv", khoa: ["ngay dieu tri arv"], trongSo: 2 },
    { vaiTro: "phac_do", khoa: ["phac do dieu tri"], trongSo: 1 },
    // Bốn cột dưới đây TRỐNG HOÀN TOÀN trong bản xuất HIV-INFO thật. Vẫn khai vai
    // trò để các phân tích về bậc thang điều trị biết mà báo "cột có nhưng trống"
    // thay vì báo "thiếu cột" — hai chuyện khác nhau, và người dùng cần biết là
    // hệ thống nguồn không xuất ra chứ không phải họ chọn nhầm tệp.
    { vaiTro: "tai_luong_gan_nhat", khoa: ["tai luong virus arv lan gan day nhat"], trongSo: 0.5 },
    { vaiTro: "tai_luong_lan_dau", khoa: ["tai luong virus arv lan dau"], trongSo: 0.5 },
    { vaiTro: "cd4_gan_nhat", khoa: ["ket qua kiem tra cd4 gan nhat"], trongSo: 0.5 },
    { vaiTro: "giai_doan_ls", khoa: ["giai doan lam sang gan nhat"], trongSo: 0.5 },
    { vaiTro: "ngay_ket_thuc", khoa: ["=ngay ket thuc"], trongSo: 1 },
    { vaiTro: "ly_do_ket_thuc", khoa: ["=ly do ket thuc"], trongSo: 1 },
    { vaiTro: "ngay_chuyen_giam_sat", khoa: ["ngay chuyen giam sat"], trongSo: 3 },
    { vaiTro: "ngay_nhap_lieu", khoa: ["=ngay nhap lieu"], trongSo: 2 },
    { vaiTro: "ngay_bao_tu_vong", khoa: ["ngay bao tu vong"], trongSo: 1 },
    { vaiTro: "ngay_tu_vong", khoa: ["=ngay tu vong"], trongSo: 3 },
    { vaiTro: "nguyen_nhan_tu_vong", khoa: ["nguyen nhan tu vong"], trongSo: 2 },
    { vaiTro: "ngoai_tinh", khoa: ["=ngoai tinh"], trongSo: 2 },
    { vaiTro: "phan_loai_ca", khoa: ["phan loai ca"], trongSo: 1 },
    { vaiTro: "trang_thai_nguoi_nhiem", khoa: ["trang thai nguoi nhiem"], trongSo: 3 },
    { vaiTro: "nghi_trung", khoa: ["trang thai nghi trung"], trongSo: 1 },
  ],

  tapGiaTri: {
    nghe_nghiep: TAP_GIA_TRI.nghe_nghiep,
    doi_tuong: TAP_GIA_TRI.doi_tuong,
    hien_trang_cu_tru_tt: TAP_GIA_TRI.hien_trang_cu_tru,
    hien_trang_cu_tru_ht: TAP_GIA_TRI.hien_trang_cu_tru,
    nguyen_nhan_tu_vong: TAP_GIA_TRI.nguyen_nhan_tu_vong,
  },

  phanTich: [
    "P1", "P2",
    "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11",
    "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B9",
    "C1", "C2", "C3", "C4",
    "D1", "D2",
  ],
};

/* ---------------------------------------------------------------------- */
/* Kiểm tập giá trị theo bảng mã                                          */
/* ---------------------------------------------------------------------- */

export function kiemTapGiaTri(bang, theoVaiTro) {
  const ds = [];
  for (const [vaiTro, tap] of Object.entries(HO_SO.tapGiaTri)) {
    const c = theoVaiTro.get(vaiTro);
    if (c == null) continue;

    const chuanTen = new Set((tap.ten || []).map((x) => chuanHoa(x)));
    const chuanMa = new Set(tap.ma || []);
    const la = new Map();

    for (const d of bang.dong) {
      const v = d[c];
      if (v == null || catTrang(v) === "") continue;
      const raw = catTrang(v);
      if (chuanMa.size && chuanMa.has(raw)) continue;
      const loi = loiMa(raw);
      if (chuanTen.has(loi)) continue;
      // So thêm theo cách chứa nhau, vì hệ thống hay cắt ngắn tên dài.
      let khop = false;
      for (const t of chuanTen) {
        if (t.length >= 8 && (t.includes(loi) || loi.includes(t))) {
          khop = true;
          break;
        }
      }
      if (khop) continue;
      la.set(raw, (la.get(raw) || 0) + 1);
    }

    if (la.size > 0) {
      const tong = [...la.values()].reduce((a, b) => a + b, 0);
      ds.push({
        ma: "HS-TGT",
        mucDo: MUC.CAN_XAC_MINH,
        cot: bang.tieuDe[c],
        chiSoCot: c,
        soDong: tong,
        moTa:
          `Có ${la.size} giá trị nằm ngoài bảng mã của ${tap.canCu} ` +
          `(${tong} dòng). Hệ thống nguồn có thể dùng danh mục mở rộng hợp lệ, ` +
          "nên cần người đối chiếu chứ máy không tự kết luận.",
        viDu: [...la.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map((x) => `${x[0]} (${x[1]} dòng)`),
        canCu: tap.canCu,
        deXuat: "Đối chiếu với bảng mã trong văn bản, hoặc ghi nhận là danh mục mở rộng của địa phương.",
      });
    }
  }
  return ds;
}

/* ---------------------------------------------------------------------- */
/* Luật kiểm chéo giữa nhiều cột                                          */
/* ---------------------------------------------------------------------- */

function kiemThuTuNgay(bang, theoVaiTro, { ma, truoc, sau, moTa, deXuat }) {
  const a = theoVaiTro.get(truoc);
  const b = theoVaiTro.get(sau);
  if (a == null || b == null) return null;
  const dong = [];
  for (let i = 0; i < bang.dong.length; i++) {
    const x = docNgay(bang.dong[i][a]);
    const y = docNgay(bang.dong[i][b]);
    if (!x || !y) continue;
    if (soNgayGiua(x, y) < 0) dong.push(i);
  }
  if (!dong.length) return null;
  return {
    ma,
    mucDo: MUC.CAN_XAC_MINH,
    cot: `${bang.tieuDe[a]} → ${bang.tieuDe[b]}`,
    chiSoCot: b,
    soDong: dong.length,
    moTa: `${moTa} (${dong.length} dòng).`,
    viDu: dong.slice(0, 5).map((i) => `dòng ${i + 2}`),
    deXuat,
    dongLoi: dong,
  };
}

export function kiemCheo(bang, theoVaiTro) {
  const ds = [];

  // Năm phép kiểm thứ tự ngày LC01–LC05 đã chuyển sang nhóm Y1 ở
  // src/kiem/y-thoi-gian.js. Nhóm Y1 nhận cột theo TỪNG CỘT MỘT qua từ điển khái
  // niệm, nên chạy được cả với tệp không phải bản xuất HIV-INFO — trong khi năm
  // phép cũ chỉ chạy khi cả hồ sơ này được nhận ra. Để lại mảng rỗng thay vì xoá
  // vòng lặp, để phần LC06–LC08 bên dưới không phải viết lại.
  const thuTu = [];

  for (const t of thuTu) {
    const r = kiemThuTuNgay(bang, theoVaiTro, t);
    if (r) ds.push(r);
  }

  // Năm sinh so với ngày khẳng định.
  const cNam = theoVaiTro.get("nam_sinh");
  const cKd = theoVaiTro.get("ngay_khang_dinh");
  if (cNam != null && cKd != null) {
    const dong = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const ns = Number(String(bang.dong[i][cNam]).replace(/[^\d]/g, ""));
      const kd = docNgay(bang.dong[i][cKd]);
      if (!kd || !Number.isFinite(ns) || ns < 1900 || ns > 2100) continue;
      if (ns > kd.getUTCFullYear()) dong.push(i);
    }
    if (dong.length) {
      ds.push({
        ma: "LC06",
        mucDo: MUC.CAN_XAC_MINH,
        cot: `${bang.tieuDe[cNam]} → ${bang.tieuDe[cKd]}`,
        chiSoCot: cNam,
        soDong: dong.length,
        moTa: `Năm sinh muộn hơn năm xét nghiệm khẳng định (${dong.length} dòng).`,
        viDu: dong.slice(0, 5).map((i) => `dòng ${i + 2}`),
        deXuat: "Kiểm tra lại năm sinh.",
        dongLoi: dong,
      });
    }
  }

  // Đối chiếu chéo các cột nói về tử vong.
  const dem = {};
  const cTt = theoVaiTro.get("trang_thai_nguoi_nhiem");
  const cDt = theoVaiTro.get("trang_thai_dieu_tri");
  const cLd = theoVaiTro.get("ly_do_ket_thuc");
  const cNtv = theoVaiTro.get("ngay_tu_vong");

  const demTheo = (c, hop) =>
    c == null ? null : bang.dong.filter((d) => hop(chuanHoa(d[c]))).length;

  dem["trạng thái người nhiễm"] = demTheo(cTt, (x) => x === "tu vong" || x === "da tu vong");
  dem["trạng thái điều trị"] = demTheo(cDt, (x) => x === "tu vong");
  dem["lý do kết thúc"] = demTheo(cLd, (x) => x === "death" || x === "tu vong");
  dem["có ngày tử vong"] = cNtv == null ? null : bang.dong.filter((d) => docNgay(d[cNtv])).length;

  const coMat = Object.entries(dem).filter((x) => x[1] != null);
  if (coMat.length >= 2) {
    const gt = coMat.map((x) => x[1]);
    if (Math.max(...gt) !== Math.min(...gt)) {
      ds.push({
        ma: "LC07",
        mucDo: MUC.CAN_XAC_MINH,
        cot: coMat.map((x) => x[0]).join(" · "),
        chiSoCot: cTt == null ? -1 : cTt,
        soDong: Math.max(...gt) - Math.min(...gt),
        moTa:
          "Các cột cùng nói về tử vong cho ra số khác nhau: " +
          coMat.map((x) => `${x[0]} = ${x[1]}`).join("; ") +
          ". Số người tử vong trong biểu mẫu sẽ khác nhau tuỳ chọn cột nào.",
        deXuat:
          "Chọn một cột làm cột chuẩn cho biểu mẫu và rà soát các dòng lệch. " +
          "Phụ lục 4 Thông tư 07 đếm theo trạng thái người nhiễm.",
      });
    }
  }

  // Có ngày tử vong nhưng vẫn ghi còn sống.
  if (cNtv != null && cTt != null) {
    const dong = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const co = docNgay(bang.dong[i][cNtv]);
      const tt = chuanHoa(bang.dong[i][cTt]);
      if (co && tt && tt !== "tu vong" && tt !== "da tu vong") dong.push(i);
    }
    if (dong.length) {
      ds.push({
        ma: "LC08",
        mucDo: MUC.CAN_XAC_MINH,
        cot: `${bang.tieuDe[cNtv]} → ${bang.tieuDe[cTt]}`,
        chiSoCot: cTt,
        soDong: dong.length,
        moTa: `Có ngày tử vong nhưng trạng thái người nhiễm không phải tử vong (${dong.length} dòng).`,
        viDu: dong.slice(0, 5).map((i) => `dòng ${i + 2}`),
        deXuat: "Cập nhật trạng thái, hoặc xoá ngày tử vong nếu nhập nhầm.",
        dongLoi: dong,
      });
    }
  }

  return ds;
}

export default HO_SO;
