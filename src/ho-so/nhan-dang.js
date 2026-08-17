/**
 * Tầng 2 — nhận dạng hồ sơ chuyên môn.
 *
 * Nguyên tắc: KHÔNG nhận bừa. Chấm điểm rồi công bố độ tin cậy. Dưới ngưỡng thì
 * nói rõ là chưa nhận ra loại tệp và lùi về tầng kiểm chung, chứ không im lặng
 * làm ít việc hơn rồi để người dùng tưởng công cụ đã kiểm hết.
 *
 * Thêm một loại tệp mới là viết thêm một tệp mô tả trong thư mục này, không sửa
 * mã lõi.
 */

import { khopBatKy } from "../tien-ich/chuoi.js";

export const NGUONG_NHAN = 0.55;
export const NGUONG_CO_THE = 0.3;

/**
 * Gán vai trò cho từng cột của bảng theo một hồ sơ.
 * Mỗi vai trò lấy cột đầu tiên khớp và chưa bị vai trò khác nhận.
 */
export function ganVaiTro(bang, hoSo) {
  const theoVaiTro = new Map();
  const daDung = new Set();

  for (const dh of hoSo.dauHieu) {
    for (let c = 0; c < bang.tieuDe.length; c++) {
      if (daDung.has(c)) continue;
      if (khopBatKy(dh.khoa, bang.tieuDe[c])) {
        theoVaiTro.set(dh.vaiTro, c);
        daDung.add(c);
        break;
      }
    }
  }
  return theoVaiTro;
}

/** Chấm một hồ sơ với một bảng. */
export function chamHoSo(bang, hoSo) {
  const theoVaiTro = ganVaiTro(bang, hoSo);
  let duoc = 0;
  let tong = 0;
  const thieuBatBuoc = [];

  for (const dh of hoSo.dauHieu) {
    const ts = dh.trongSo == null ? 1 : dh.trongSo;
    tong += ts;
    if (theoVaiTro.has(dh.vaiTro)) duoc += ts;
    else if (dh.batBuoc) thieuBatBuoc.push(dh.vaiTro);
  }

  const diem = tong ? duoc / tong : 0;
  return {
    hoSo,
    diem,
    theoVaiTro,
    thieuBatBuoc,
    dat: diem >= NGUONG_NHAN && thieuBatBuoc.length === 0,
  };
}

/** Chọn hồ sơ khớp nhất trong danh sách. */
export function nhanDang(bang, dsHoSo) {
  const cham = dsHoSo.map((h) => chamHoSo(bang, h)).sort((a, b) => b.diem - a.diem);
  const tot = cham[0];

  if (!tot || tot.diem < NGUONG_CO_THE) {
    return {
      ketQua: "khong-nhan-ra",
      moTa:
        "Chưa nhận ra đây là loại tệp chuyên môn nào. Công cụ chỉ chạy tầng kiểm chung — " +
        "các phép kiểm về kiểu dữ liệu, cách ghi và bản ghi trùng. Các phép kiểm theo " +
        "nghiệp vụ và các phân tích theo chương trình không chạy.",
      cham,
    };
  }

  if (!tot.dat) {
    const thieu = tot.thieuBatBuoc.length
      ? ` Thiếu cột bắt buộc: ${tot.thieuBatBuoc.join(", ")}.`
      : "";
    return {
      ketQua: "co-the",
      hoSo: tot.hoSo,
      diem: tot.diem,
      theoVaiTro: tot.theoVaiTro,
      moTa:
        `Tệp này giống “${tot.hoSo.ten}” nhưng chỉ khớp ${Math.round(tot.diem * 100)}% ` +
        `số cột đặc trưng, chưa đủ để kết luận.${thieu} ` +
        "Công cụ chạy tầng kiểm chung và chỉ chào những phân tích có đủ cột.",
      cham,
    };
  }

  return {
    ketQua: "nhan-ra",
    hoSo: tot.hoSo,
    diem: tot.diem,
    theoVaiTro: tot.theoVaiTro,
    moTa: `Nhận ra “${tot.hoSo.ten}”, khớp ${Math.round(tot.diem * 100)}% số cột đặc trưng.`,
    cham,
  };
}
