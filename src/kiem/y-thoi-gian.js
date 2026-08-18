/**
 * Nhóm Y1 — trình tự thời gian trong hồ sơ điều trị.
 *
 * Nhóm mạnh nhất của bộ chuyên ngành: thuần logic, không cần ngưỡng lâm sàng nào,
 * không cần đơn vị đo, và bắt được rất nhiều lỗi nhập liệu thật.
 *
 * Không viện dẫn văn bản pháp luật. "Không thể tử vong trước khi được chẩn đoán"
 * là sự thật về thời gian, không phải quy định của ai.
 */

import { MUC } from "./kiem-chung.js";
import { docNgayTheo } from "../sua/sua-du-lieu.js";
import { laSuKien, nhanKhaiNiem, tenKhaiNiem } from "../tu-dien/khai-niem.js";

/**
 * Các cặp phải theo thứ tự: cột `truoc` không được sau cột `sau`.
 *
 * Cột `muc` xếp theo mức độ chắc chắn của chính quan hệ ấy, không theo mức nghiêm
 * trọng của hậu quả.
 */
export const CAP_THU_TU = [
  {
    ma: "Y1.1", truoc: "NGAY_ARV_DAU", sau: "NGAY_KET_THUC", muc: MUC.CHAC_CHAN,
    vi: "không thể kết thúc điều trị trước khi bắt đầu",
  },
  {
    ma: "Y1.2", truoc: "NGAY_KHANG_DINH", sau: "NGAY_TU_VONG", muc: MUC.CHAC_CHAN,
    vi: "không thể tử vong trước khi được chẩn đoán",
  },
  {
    ma: "Y1.3", truoc: "NGAY_ARV_DAU", sau: "NGAY_TU_VONG", muc: MUC.CHAC_CHAN,
    vi: "không thể tử vong trước khi bắt đầu điều trị",
  },
  {
    ma: "Y1.4", truoc: "NGAY_TU_VONG", sau: "NGAY_BAO_TU_VONG", muc: MUC.CHAC_CHAN,
    vi: "không thể báo tử vong trước khi tử vong",
  },
  // Ba cặp Y1.5: sự việc phải xảy ra TRƯỚC khi tử vong, nên ngày tử vong đứng ở
  // vế `sau`. Ràng buộc luôn là truoc ≤ sau, không có cờ đảo chiều — thêm một cờ
  // như thế chỉ tạo thêm một chỗ để đọc sai.
  {
    ma: "Y1.5a", truoc: "NGAY_KHAM_CUOI", sau: "NGAY_TU_VONG", muc: MUC.CHAC_CHAN,
    vi: "không thể khám sau khi đã tử vong",
  },
  {
    ma: "Y1.5b", truoc: "NGAY_XN_TAI_LUONG", sau: "NGAY_TU_VONG", muc: MUC.CHAC_CHAN,
    vi: "không thể xét nghiệm tải lượng sau khi đã tử vong",
  },
  {
    ma: "Y1.5c", truoc: "NGAY_XN_CD4", sau: "NGAY_TU_VONG", muc: MUC.CHAC_CHAN,
    vi: "không thể xét nghiệm CD4 sau khi đã tử vong",
  },
  {
    ma: "Y1.6", truoc: "NGAY_SINH", sau: "NGAY_KHANG_DINH", muc: MUC.CHAC_CHAN,
    vi: "không thể được chẩn đoán trước khi sinh",
  },
  {
    ma: "Y1.7", truoc: "NGAY_SINH", sau: "NGAY_XN_SANG_LOC", muc: MUC.CHAC_CHAN,
    vi: "không thể xét nghiệm trước khi sinh",
  },
  {
    ma: "Y1.8a", truoc: "NGAY_KHANG_DINH", sau: "NGAY_NHAP_LIEU", muc: MUC.CHAC_CHAN,
    vi: "không thể nhập liệu trước khi có kết quả được nhập",
  },
  {
    ma: "Y1.8b", truoc: "NGAY_KHANG_DINH", sau: "NGAY_CHUYEN_GIAM_SAT", muc: MUC.CHAC_CHAN,
    vi: "không thể chuyển giám sát ca bệnh trước khi có kết quả khẳng định",
  },
  {
    ma: "Y1.11", truoc: "NGAY_CHUYEN_DEN", sau: "NGAY_CHUYEN_DI", muc: MUC.CAN_XAC_MINH,
    vi: "ngày chuyển đến sau ngày chuyển đi trong cùng một bản ghi",
  },
  {
    // Ngoại lệ có căn cứ: thuốc kháng HIV còn dùng để dự phòng trước và sau phơi
    // nhiễm ở người chưa nhiễm, nên bắt đầu thuốc trước ngày khẳng định là có
    // thật. Vì vậy cặp này ở mức cần xác minh, không phải chắc chắn.
    ma: "Y1.10", truoc: "NGAY_KHANG_DINH", sau: "NGAY_ARV_DAU", muc: MUC.CAN_XAC_MINH,
    vi: "ngày bắt đầu ARV trước ngày khẳng định — có thể đúng nếu trước đó là điều trị dự phòng, cần đối chiếu",
  },
];

function phat(ds, o) {
  ds.push({ viDu: [], suaDuoc: false, ...o });
}

function ve(d) {
  const n = d.getUTCDate();
  const t = d.getUTCMonth() + 1;
  return `${String(n).padStart(2, "0")}/${String(t).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

/**
 * Đọc một ô thành ngày, tôn trọng câu trả lời về thứ tự ngày–tháng.
 * Dùng lại docNgayTheo của phần sửa dữ liệu để hai đường đọc ngày không lệch nhau.
 */
function ngayCua(v, thuTu) {
  return docNgayTheo(v, thuTu || "ngay-truoc");
}

/**
 * Kiểm nhóm Y1.
 *
 * @param {object} bang bảng đã chạy suyKieuBang
 * @param {object} tuyChon { kn: kết quả nhanKhaiNiem, thuTuNgay, homNay }
 */
export function kiemThoiGian(bang, tuyChon = {}) {
  const ds = [];
  const kn = tuyChon.kn || nhanKhaiNiem(bang);
  const thuTu = tuyChon.thuTuNgay || null;
  // homNay truyền từ ngoài vào để bộ thử tái lập được; không đọc đồng hồ trong lõi.
  const homNay = tuyChon.homNay || null;
  const soHang = (i) => bang.chiSoHangTieuDe + 2 + i;

  // ---------------------------------------------------------------- các cặp
  for (const cap of CAP_THU_TU) {
    const cTruoc = kn.theoMa.get(cap.truoc);
    const cSau = kn.theoMa.get(cap.sau);
    if (cTruoc == null || cSau == null || cTruoc === cSau) continue;

    const viPham = [];
    const dongLoi = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const a = ngayCua(bang.dong[i][cTruoc], thuTu);
      const b = ngayCua(bang.dong[i][cSau], thuTu);
      if (!a || !b) continue;
      if (b.getTime() < a.getTime()) {
        dongLoi.push(i);
        viPham.push(`dòng ${soHang(i)}: ${tenKhaiNiem(cap.sau)} ${ve(b)} trước ${tenKhaiNiem(cap.truoc)} ${ve(a)}`);
      }
    }
    if (!viPham.length) continue;

    phat(ds, {
      ma: cap.ma,
      mucDo: cap.muc,
      cot: `${bang.tieuDe[cTruoc]} → ${bang.tieuDe[cSau]}`,
      chiSoCot: cSau,
      soDong: viPham.length,
      moTa: `${viPham.length} dòng có ${cap.vi}.`,
      viDu: viPham.slice(0, 5),
      dongLoi,
      deXuat: "Đối chiếu hai cột với sổ nguồn; một trong hai ngày bị ghi sai.",
    });
  }

  // ---------------------------------------------------------------- Y1.9
  // Ngày trong tương lai.
  //
  // CHỈ áp cho cột ngày của việc ĐÃ xảy ra. Bản đầu tôi áp cho mọi cột ngày và
  // trên tệp thật nó gắn cờ chắc chắn cho 1.196 dòng ở cột "Ngày hết hạn BHYT" —
  // mà ngày hết hạn thẻ bảo hiểm thì ĐÚNG RA phải ở tương lai. Ngày hẹn khám,
  // ngày dự sinh, ngày hết hiệu lực cũng vậy. Một cảnh báo chắc chắn sai trên
  // hơn một nghìn dòng là đủ để người dùng thôi đọc mọi cảnh báo khác.
  if (homNay) {
    const moc = homNay.getTime();
    for (const [ma, chiSoCot] of kn.theoMa) {
      if (!laSuKien(ma)) continue;
      const mo = (bang.cot || []).find((c) => c.chiSo === chiSoCot);
      if (!mo) continue;
      const sau = [];
      const dongLoi = [];
      for (let i = 0; i < bang.dong.length; i++) {
        const d = ngayCua(bang.dong[i][mo.chiSo], thuTu);
        if (d && d.getTime() > moc) { dongLoi.push(i); sau.push(`dòng ${soHang(i)}: ${ve(d)}`); }
      }
      if (!sau.length) continue;
      phat(ds, {
        ma: "Y1.9",
        mucDo: MUC.CHAC_CHAN,
        cot: mo.ten || `cột ${mo.chiSo + 1}`,
        chiSoCot: mo.chiSo,
        soDong: sau.length,
        moTa:
          `${sau.length} ô mang ngày nằm trong tương lai, sau ngày ${ve(homNay)}. ` +
          "Sự việc đã ghi vào sổ thì không thể xảy ra ở tương lai.",
        viDu: sau.slice(0, 5),
        dongLoi,
        deXuat: "Kiểm lại: thường là gõ sai năm, hoặc lẫn thứ tự ngày với tháng.",
      });
    }
  }

  // ---------------------------------------------------------------- Y1.12
  // Hai cột lẽ ra cùng một sự kiện lại lệch nhau quá xa. Chỉ ghi nhận.
  //
  // Chỉ giữ cặp tử vong – báo tử vong. Bản đầu tôi thêm cặp khẳng định – chuyển
  // giám sát với ngưỡng 365 ngày, và trên tệp thật nó nêu 1.120 dòng, hơn nửa số
  // dòng. Tiền đề sai: hai cột ấy KHÔNG ghi cùng một việc, độ trễ đến khâu chuyển
  // giám sát vốn dài — chính bộ dữ liệu này có độ trễ trung vị 483 ngày. Một quy
  // tắc nêu quá nửa số dòng thì không còn là dấu hiệu, nó là tiếng ồn.
  //
  // Cách đúng cho loại việc này là đo độ trễ bất thường so với phân bố của chính
  // cột, thuộc tầng 2 của nhóm NK, làm ở đợt sau.
  const capGan = [["NGAY_TU_VONG", "NGAY_BAO_TU_VONG", 90]];
  for (const [a, b, nguong] of capGan) {
    const ca = kn.theoMa.get(a);
    const cb = kn.theoMa.get(b);
    if (ca == null || cb == null) continue;
    const xa = [];
    const dongLoi = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const da = ngayCua(bang.dong[i][ca], thuTu);
      const db = ngayCua(bang.dong[i][cb], thuTu);
      if (!da || !db) continue;
      const ngay = Math.round((db.getTime() - da.getTime()) / 86400000);
      if (ngay > nguong) {
        dongLoi.push(i);
        xa.push(`dòng ${soHang(i)}: cách ${ngay.toLocaleString("vi-VN")} ngày`);
      }
    }
    if (!xa.length) continue;
    phat(ds, {
      ma: "Y1.12",
      mucDo: MUC.GHI_NHAN,
      cot: `${bang.tieuDe[ca]} → ${bang.tieuDe[cb]}`,
      chiSoCot: cb,
      soDong: xa.length,
      moTa:
        `${xa.length} dòng có hai ngày cách nhau hơn ${nguong} ngày, trong khi hai cột này ` +
        "thường ghi cùng một sự việc. Không hẳn là lỗi, nhưng nếu tính độ trễ theo cặp cột " +
        "này thì con số sẽ bị các dòng ấy kéo đi.",
      viDu: xa.slice(0, 5),
      dongLoi,
      deXuat: "Xem lại vài dòng để biết đây là độ trễ thật hay là ngày bị ghi sai.",
    });
  }

  return ds;
}
