/**
 * Lõi phân tích — điểm vào duy nhất, dùng chung cho cả hai vỏ.
 *
 * Vỏ chỉ có một việc: đưa vùng ô thô vào đây, rồi hiển thị kết quả trả ra. Mọi
 * suy luận nằm trong lõi này, nên bộ thử chạy được mà không cần Excel và không
 * cần trình duyệt.
 */

import { taoBang, HINH_DANG } from "./bang/tao-bang.js";
import { suyKieuBang } from "./bang/suy-kieu.js";
import { kiemChung, MUC } from "./kiem/kiem-chung.js";
import { kiemBieu } from "./kiem/kiem-bieu.js";
import { nhanDang } from "./ho-so/nhan-dang.js";
import HO_SO_HIVINFO, { kiemTapGiaTri, kiemCheo } from "./ho-so/hivinfo-giam-sat-ca-benh.js";
import { DS_BIEU_TT05, nhanDangBieu, kiemBieuTT05 } from "./ho-so/tt05-bieu-bao-cao.js";
import { dungPhuLuc4 } from "./bieu-mau/phu-luc-4-tt07.js";
import { sinhCauHoi, VIEC } from "./phong-van/cau-hoi.js";
import { heQuaKhoa } from "./phong-van/bang-chung.js";
import {
  chuKyCauTruc,
  doKhop,
  ghiTraLoi,
  docTraLoi,
  hoSoMoi,
  quyetDinhTu,
  sangJson,
  tuJson,
} from "./phong-van/ho-so-don-vi.js";

import { apDung, deXuatSua, trangNhatKy, NHOM } from "./sua/sua-du-lieu.js";
import { ghiXlsx } from "./ghi-tep/ghi-xlsx.js";

import {
  chayPhanTich, lietKePhanTich, phanTichThanhHang,
  DANH_MUC, TEN_NHOM, NGUONG_MAC_DINH, cheONho, gopNhomNho,
} from "./phan-tich/index.js";

export { HINH_DANG, MUC, dungPhuLuc4 };
export { deXuatSua, apDung, trangNhatKy, NHOM, ghiXlsx };
export {
  chayPhanTich, lietKePhanTich, phanTichThanhHang,
  DANH_MUC, TEN_NHOM, NGUONG_MAC_DINH, cheONho, gopNhomNho,
};
export { sinhCauHoi, VIEC, heQuaKhoa };
export { hoSoMoi, ghiTraLoi, docTraLoi, quyetDinhTu, doKhop, sangJson, tuJson, chuKyCauTruc };

/** Danh sách hồ sơ cho DANH SÁCH từng ca. Thêm loại tệp mới thì thêm một mục vào đây. */
export const DS_HO_SO = [HO_SO_HIVINFO];

/** Danh mục biểu đã cộng — nhận dạng theo nhãn dòng, không theo tên cột. */
export { DS_BIEU_TT05, nhanDangBieu, kiemBieuTT05 };
export { kiemBieu };

const KIEM_THEO_HO_SO = {
  "hivinfo-giam-sat-ca-benh": [kiemTapGiaTri, kiemCheo],
};

/**
 * Rà soát một vùng ô thô.
 * vungTho = { ten, hang: [[...]], oGop?: [...] }
 */
export function raSoat(vungTho) {
  const bang = taoBang(vungTho);
  suyKieuBang(bang);

  const nd = nhanDang(bang, DS_HO_SO);
  const phatHien = [];
  const canhBaoLuong = [];
  let ndBieu = null;

  if (bang.hinhDang === HINH_DANG.BIEU_TONG_HOP) {
    canhBaoLuong.push(
      "Trang tính này trông như một biểu đã cộng chứ không phải danh sách từng ca. " +
        "Công cụ KHÔNG đề xuất phép làm sạch nào dành cho danh sách — xoá dòng trùng " +
        "trên một biểu đã cộng là phá tệp. Lý do nhận định: " +
        bang.lyDoHinhDang.join("; ") +
        "."
    );
    // Biểu đã cộng không kiểm được bằng bộ phép kiểm của danh sách, nhưng nó có
    // các quan hệ số học kiểm được. Không chạy gì cả rồi chỉ báo một câu là để
    // người dùng tưởng công cụ đã xem hết.
    phatHien.push(...kiemBieu(bang));
    ndBieu = nhanDangBieu(bang, DS_BIEU_TT05);
    if (ndBieu.bieu && ndBieu.ketQua === "nhan-ra") {
      phatHien.push(...kiemBieuTT05(bang, ndBieu.bieu));
    } else {
      canhBaoLuong.push(
        ndBieu.ketQua === "co-the"
          ? ndBieu.moTa
          : "Chưa nhận ra đây là biểu mẫu báo cáo nào trong Thông tư 05/2023/TT-BYT, nên " +
              "công cụ chỉ chạy các phép kiểm số học chung cho biểu đã cộng, không áp quan " +
              "hệ riêng của từng biểu và không nêu cách cắt kỳ."
      );
    }
  } else {
    phatHien.push(...kiemChung(bang));
    if (bang.hinhDang === HINH_DANG.CHUA_XAC_DINH) {
      canhBaoLuong.push(
        "Chưa xác định chắc chắn đây là danh sách hay biểu đã cộng. Công cụ chạy các " +
          "phép kiểm dành cho danh sách, nhưng hãy xem lại trước khi áp dụng phép sửa nào."
      );
    }
  }

  if (nd.hoSo && nd.ketQua === "nhan-ra") {
    for (const f of KIEM_THEO_HO_SO[nd.hoSo.ma] || []) {
      phatHien.push(...f(bang, nd.theoVaiTro));
    }
  }

  const thuTu = { [MUC.CHAC_CHAN]: 0, [MUC.CAN_XAC_MINH]: 1, [MUC.GHI_NHAN]: 2 };
  phatHien.sort((a, b) => (thuTu[a.mucDo] - thuTu[b.mucDo]) || b.soDong - a.soDong);

  return {
    bang,
    nhanDang: nd,
    nhanDangBieu: ndBieu,
    phatHien,
    canhBaoLuong,
    tomTat: {
      soDong: bang.soDong,
      soCot: bang.soCot,
      hangTieuDe: bang.chiSoHangTieuDe + 1,
      hinhDang: bang.hinhDang,
      soChacChan: phatHien.filter((p) => p.mucDo === MUC.CHAC_CHAN).length,
      soCanXacMinh: phatHien.filter((p) => p.mucDo === MUC.CAN_XAC_MINH).length,
      soGhiNhan: phatHien.filter((p) => p.mucDo === MUC.GHI_NHAN).length,
    },
  };
}
