/**
 * Bộ chạy phân tích.
 *
 * Nguyên tắc: CHỈ CHÀO NHỮNG PHÂN TÍCH TÍNH ĐƯỢC, và với những phân tích không
 * chạy được thì nói rõ VÌ SAO — thiếu cột hay cột có mà trống. Ẩn đi thì người
 * dùng tưởng công cụ không hỗ trợ; nói chung chung thì họ tưởng mình chọn nhầm tệp.
 */

import { cheONho, gopNhomNho, NGUONG_MAC_DINH } from "./chan-o-nho.js";
import { DANH_MUC, TEN_NHOM, phuTro, tinhTrangVaiTro } from "./danh-muc.js";

export { DANH_MUC, TEN_NHOM, NGUONG_MAC_DINH, cheONho, gopNhomNho };

/**
 * Liệt kê phân tích và tình trạng từng cái.
 * @returns {Array<{ma,ten,nhom,moTa,chayDuoc,lyDo,thieuCot,cotTrong}>}
 */
export function lietKePhanTich(bang, vt, { qd = {} } = {}) {
  const p = phuTro(bang, vt, qd);
  return DANH_MUC.map((pt) => {
    const thieuCot = [];
    const cotTrong = [];
    for (const v of pt.vaiTro) {
      const t = tinhTrangVaiTro(p, v);
      if (t === "thieu-cot") thieuCot.push(v);
      else if (t === "cot-trong") cotTrong.push(p.tenCot(v));
    }
    const chayDuoc = thieuCot.length === 0 && cotTrong.length === 0;
    let lyDo = null;
    if (thieuCot.length) {
      lyDo = `Tệp không có cột cho: ${thieuCot.join(", ")}.`;
    } else if (cotTrong.length) {
      lyDo =
        `Cột ${cotTrong.map((x) => `“${x}”`).join(", ")} có trong tệp nhưng TRỐNG HOÀN TOÀN. ` +
        "Hệ thống nguồn không xuất ra trường này — không phải bạn chọn nhầm tệp.";
    }
    return {
      ma: pt.ma,
      ten: pt.ten,
      nhom: pt.nhom,
      moTa: pt.moTa,
      tuyChon: pt.tuyChon || null,
      chayDuoc,
      lyDo,
      thieuCot,
      cotTrong,
      // Chỉ số cột mà phân tích này dùng — để giao diện chỉ hỏi về đúng những
      // cột ấy khi người dùng mở phân tích, thay vì hỏi cả tệp từ đầu.
      chiSoCot: pt.vaiTro.map((v) => p.cot(v)).filter((c) => c >= 0),
    };
  });
}

/**
 * Chạy một phân tích.
 * @param {object} tuyChon { qd, tuyChonPhanTich, phatHien, che, nguong }
 */
export function chayPhanTich(bang, vt, ma, tuyChon = {}) {
  const pt = DANH_MUC.find((x) => x.ma === ma);
  if (!pt) throw new Error(`Không có phân tích mang mã ${ma}.`);

  const p = phuTro(bang, vt, tuyChon.qd || {});
  const thieu = pt.vaiTro.filter((v) => tinhTrangVaiTro(p, v) !== "co");
  if (thieu.length) {
    const mo = lietKePhanTich(bang, vt, tuyChon).find((x) => x.ma === ma);
    return { ma, ten: pt.ten, nhom: pt.nhom, chayDuoc: false, lyDo: mo.lyDo, ghiChu: [] };
  }

  const kq = pt.chay(p, tuyChon.tuyChonPhanTich || {}, tuyChon.phatHien || []);
  const ra = {
    ma,
    ten: pt.ten,
    nhom: pt.nhom,
    moTa: pt.moTa,
    chayDuoc: true,
    bang: kq.bang,
    bangPhu: kq.bangPhu || [],
    bieuDo: kq.bieuDo || null,
    ghiChu: kq.ghiChu || [],
    canCu: kq.canCu || null,
    soODaChe: 0,
  };

  if (tuyChon.che) {
    const nguong = tuyChon.nguong || NGUONG_MAC_DINH;
    const c = cheONho(ra.bang, { nguong });
    ra.bang = c.bang;
    ra.soODaChe = c.soODaChe;
    ra.ghiChu = [...ra.ghiChu, ...c.ghiChu];
    ra.bangPhu = ra.bangPhu.map((x) => {
      const cp = cheONho(x.bang, { nguong });
      ra.soODaChe += cp.soODaChe;
      return { ...x, bang: cp.bang };
    });
  }
  return ra;
}

/** Đổi một kết quả phân tích thành các hàng để ghi ra tệp hoặc trang tính. */
export function phanTichThanhHang(kq) {
  const hang = [[kq.ten]];
  if (kq.moTa) hang.push([kq.moTa]);
  hang.push([]);

  const themBang = (b, ten) => {
    if (ten) hang.push([ten]);
    hang.push(b.tieuDe.slice());
    for (const h of b.hang) hang.push(h.slice());
    if (b.tongCot) hang.push(b.tongCot.slice());
    hang.push([]);
  };

  if (kq.bang) themBang(kq.bang, null);
  for (const x of kq.bangPhu || []) themBang(x.bang, x.ten);

  if (kq.canCu) hang.push([`Căn cứ: ${kq.canCu}`]);
  if (kq.ghiChu && kq.ghiChu.length) {
    hang.push(["Ghi chú"]);
    for (const g of kq.ghiChu) hang.push([g]);
  }
  return hang;
}
