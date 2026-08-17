/**
 * Nhóm Y10 — định danh.
 *
 * Y10.1 là phép bắt trùng mạnh nhất mà KHÔNG cần người dùng chốt khoá trước: cùng
 * một mã bệnh nhân mà giới tính hoặc năm sinh khác nhau thì chắc chắn một trong
 * hai dòng sai, và đây là loại lỗi làm mọi con số về sau lệch theo.
 *
 * Các phép kiểm khuôn dạng ở đây phải nói rõ một khả năng khác trước khi kết luận
 * là sai: Excel làm mất số 0 ở đầu khi ô được lưu dạng số, nên một số điện thoại
 * chỉ có 9 chữ số thường là hỏng ở khâu nhập, không phải người ghi thiếu.
 */

import { MUC } from "./kiem-chung.js";
import { catTrang, chuanHoa } from "../tien-ich/chuoi.js";
import { nhanKhaiNiem, soChuSoCua } from "../tu-dien/khai-niem.js";

function phat(ds, o) {
  ds.push({ viDu: [], suaDuoc: false, ...o });
}

function coGiaTri(v) {
  return v != null && !(typeof v === "string" && v.trim() === "");
}

/** Chỉ giữ chữ số, để so khuôn dạng mã số. */
function chiSoDe(v) {
  return catTrang(v).replace(/\D/g, "");
}

/** Khuôn dạng của một mã: độ dài, có tiền tố chữ hay không. */
function khuon(v) {
  const s = catTrang(v);
  const chu = s.replace(/[\d\s.\-_/]/g, "");
  return `${chu ? "chữ+" : ""}${s.replace(/\D/g, "").length} chữ số`;
}

/**
 * Kiểm nhóm Y10.
 * @param {object} bang bảng đã chạy suyKieuBang
 * @param {object} tuyChon { kn }
 */
export function kiemDinhDanh(bang, tuyChon = {}) {
  const ds = [];
  const kn = tuyChon.kn || nhanKhaiNiem(bang);
  const soHang = (i) => bang.chiSoHangTieuDe + 2 + i;
  const lay = (ma) => kn.theoMa.get(ma);

  const cMa = lay("MA_BENH_NHAN");
  const cGioi = lay("GIOI_TINH");
  const cNamSinh = lay("NAM_SINH");
  const cCccd = lay("SO_CCCD");
  const cDt = lay("SO_DIEN_THOAI");

  // ------------------------------------------------------------------ Y10.1
  // Cùng mã bệnh nhân nhưng khác giới tính hoặc khác năm sinh.
  if (cMa != null && (cGioi != null || cNamSinh != null)) {
    const theoMa = new Map();
    for (let i = 0; i < bang.dong.length; i++) {
      const m = catTrang(bang.dong[i][cMa]);
      if (!m) continue;
      if (!theoMa.has(m)) theoMa.set(m, []);
      theoMa.get(m).push(i);
    }
    const xungDot = [];
    for (const [m, dsDong] of theoMa) {
      if (dsDong.length < 2) continue;
      for (const [c, ten] of [[cGioi, "giới tính"], [cNamSinh, "năm sinh"]]) {
        if (c == null) continue;
        // So trên bản bỏ dấu và bỏ hoa thường: ở đây máy chỉ hỏi "hai dòng có nói
        // cùng một điều không", nên "Nam" và "nam" là như nhau.
        const tap = new Set();
        for (const i of dsDong) {
          const v = chuanHoa(bang.dong[i][c]);
          if (v) tap.add(v);
        }
        if (tap.size > 1) {
          xungDot.push(
            `mã ${m} ở các dòng ${dsDong.map(soHang).join(", ")}: ${ten} ghi ${[...tap].join(" và ")}`
          );
        }
      }
    }
    if (xungDot.length) {
      phat(ds, {
        ma: "Y10.1",
        mucDo: MUC.CHAC_CHAN,
        cot: bang.tieuDe[cMa] || "",
        chiSoCot: cMa,
        soDong: xungDot.length,
        moTa:
          `${xungDot.length} mã bệnh nhân xuất hiện nhiều lần với thông tin nhân khẩu ` +
          "khác nhau. Một mã phải ứng với một người, nên chắc chắn có dòng ghi sai — " +
          "và máy không biết dòng nào đúng.",
        viDu: xungDot.slice(0, 5),
        deXuat: "Đối chiếu từng cặp với hồ sơ gốc trước khi gộp hay xoá bất kỳ dòng nào.",
      });
    }
  }

  // ------------------------------------------------------------------ Y10.2
  // Cùng số căn cước nhưng khác mã bệnh nhân — có thể là một người bị lập hai hồ sơ.
  if (cCccd != null && cMa != null) {
    const theoCccd = new Map();
    for (let i = 0; i < bang.dong.length; i++) {
      const s = chiSoDe(bang.dong[i][cCccd]);
      if (s.length < 9) continue;
      if (!theoCccd.has(s)) theoCccd.set(s, new Set());
      theoCccd.get(s).add(catTrang(bang.dong[i][cMa]));
    }
    const nghi = [];
    for (const [s, dsMa] of theoCccd) {
      if (dsMa.size > 1) {
        nghi.push(`căn cước …${s.slice(-4)} ứng với ${dsMa.size} mã bệnh nhân khác nhau`);
      }
    }
    if (nghi.length) {
      phat(ds, {
        ma: "Y10.2",
        mucDo: MUC.CAN_XAC_MINH,
        cot: bang.tieuDe[cCccd] || "",
        chiSoCot: cCccd,
        soDong: nghi.length,
        moTa:
          `${nghi.length} số căn cước ứng với nhiều mã bệnh nhân. Có thể một người được ` +
          "lập hai hồ sơ ở hai nơi, và cũng có thể số căn cước bị gõ sai ở một dòng.",
        viDu: nghi.slice(0, 5),
        deXuat: "Đây là đầu mối tìm trùng đáng tin; đối chiếu họ tên và năm sinh của các dòng ấy.",
      });
    }
  }

  // ------------------------------------------------------------------ Y10.3
  // Mã bệnh nhân lệch khuôn dạng chung của cột.
  if (cMa != null) {
    const demKhuon = new Map();
    const theoKhuon = new Map();
    let day = 0;
    for (let i = 0; i < bang.dong.length; i++) {
      if (!coGiaTri(bang.dong[i][cMa])) continue;
      day++;
      const k = khuon(bang.dong[i][cMa]);
      demKhuon.set(k, (demKhuon.get(k) || 0) + 1);
      if (!theoKhuon.has(k)) theoKhuon.set(k, []);
      theoKhuon.get(k).push(i);
    }
    if (day >= 20 && demKhuon.size > 1) {
      const xep = [...demKhuon.entries()].sort((a, b) => b[1] - a[1]);
      const [khuonChinh, demChinh] = xep[0];
      // Chỉ nêu khi có một khuôn dạng áp đảo; cột vốn nhiều khuôn dạng thì im lặng.
      if (demChinh >= day * 0.8) {
        const le = [];
        for (const [k, dsDong] of theoKhuon) {
          if (k === khuonChinh) continue;
          for (const i of dsDong.slice(0, 3)) {
            le.push(`dòng ${soHang(i)}: “${catTrang(bang.dong[i][cMa])}” (${k})`);
          }
        }
        phat(ds, {
          ma: "Y10.3",
          mucDo: MUC.CAN_XAC_MINH,
          cot: bang.tieuDe[cMa] || "",
          chiSoCot: cMa,
          soDong: day - demChinh,
          moTa:
            `${day - demChinh} mã lệch khuôn dạng chung của cột. Phần lớn mã có dạng ` +
            `“${khuonChinh}”. Mã lệch khuôn thường là gõ thiếu, gõ thừa, hoặc dán từ nguồn khác.`,
          viDu: le.slice(0, 5),
          deXuat: "Xem lại các mã lệch khuôn; đừng sửa hàng loạt vì có thể là mã của một hệ thống khác.",
        });
      }
    }
  }

  // ------------------------------------------------------------ Y10.4, Y10.5
  // Số chữ số lấy từ chính từ điển khái niệm, để chỉ khai ở một chỗ.
  const dsKhuonSo = [
    {
      ma: "Y10.4", khaiNiem: "SO_CCCD", cot: cCccd,
      moTa: "Số căn cước có 12 chữ số.",
    },
    {
      ma: "Y10.4", khaiNiem: "SO_CMND", cot: lay("SO_CMND"),
      moTa: "Số chứng minh nhân dân theo mẫu cũ có 9 chữ số.",
    },
    {
      ma: "Y10.5", khaiNiem: "SO_DIEN_THOAI", cot: cDt,
      moTa: "Số điện thoại di động trong nước có 10 chữ số.",
    },
  ].map((k) => ({ ...k, dai: soChuSoCua(k.khaiNiem) || [] }));
  for (const k of dsKhuonSo) {
    if (k.cot == null || !k.dai.length) continue;
    const le = [];
    let matSoKhong = 0;
    for (let i = 0; i < bang.dong.length; i++) {
      const v = bang.dong[i][k.cot];
      if (!coGiaTri(v)) continue;
      const s = chiSoDe(v);
      if (!s) continue;
      if (k.dai.includes(s.length)) continue;
      // Thiếu đúng một chữ số so với độ dài hợp lệ ngắn nhất, và ô lưu dạng số:
      // gần như chắc chắn là Excel đã ăn mất số 0 ở đầu.
      if (typeof v === "number" && k.dai.includes(s.length + 1)) matSoKhong++;
      le.push(`dòng ${soHang(i)}: “${catTrang(v)}” (${s.length} chữ số)`);
    }
    if (!le.length) continue;
    const themVeSoKhong = matSoKhong
      ? ` Trong đó ${matSoKhong} ô đang lưu dạng số và thiếu đúng một chữ số — ` +
        "gần như chắc chắn Excel đã làm mất số 0 ở đầu, không phải người ghi thiếu."
      : "";
    phat(ds, {
      ma: k.ma,
      mucDo: MUC.CAN_XAC_MINH,
      cot: bang.tieuDe[k.cot] || "",
      chiSoCot: k.cot,
      soDong: le.length,
      moTa: `${le.length} ô không đúng số chữ số. ${k.moTa}${themVeSoKhong}`,
      viDu: le.slice(0, 5),
      deXuat: matSoKhong
        ? "Đổi cả cột sang dạng văn bản rồi phục hồi số 0 ở đầu; đừng sửa từng ô."
        : "Đối chiếu lại với hồ sơ gốc.",
    });
  }

  // ------------------------------------------------------------------ Y10.6
  // Mã và tên đơn vị hành chính trên cùng dòng không tương ứng một–một.
  // Nhận cặp cột theo tên: cột nào mở đầu bằng "mã" và có phần còn lại trùng với
  // tên một cột khác thì hai cột ấy là một cặp mã–nhãn.
  const cap = [];
  for (const a of bang.cot || []) {
    const t = chuanHoa(a.ten);
    if (!t.startsWith("ma ")) continue;
    const con = t.slice(3).trim();
    if (!con) continue;
    for (const b of bang.cot || []) {
      if (b.chiSo === a.chiSo) continue;
      if (chuanHoa(b.ten) === con) cap.push([a.chiSo, b.chiSo]);
    }
  }
  for (const [cMaDv, cTenDv] of cap) {
    const theoMaDv = new Map();
    for (let i = 0; i < bang.dong.length; i++) {
      const m = catTrang(bang.dong[i][cMaDv]);
      const t = catTrang(bang.dong[i][cTenDv]);
      if (!m || !t) continue;
      if (!theoMaDv.has(m)) theoMaDv.set(m, new Set());
      theoMaDv.get(m).add(t);
    }
    const lech = [];
    for (const [m, tap] of theoMaDv) {
      if (tap.size > 1) lech.push(`mã ${m} ứng với ${tap.size} tên: ${[...tap].slice(0, 3).join(", ")}`);
    }
    if (!lech.length) continue;
    phat(ds, {
      ma: "Y10.6",
      mucDo: MUC.CAN_XAC_MINH,
      cot: `${bang.tieuDe[cMaDv]} → ${bang.tieuDe[cTenDv]}`,
      chiSoCot: cMaDv,
      soDong: lech.length,
      moTa:
        `${lech.length} mã ứng với nhiều tên khác nhau. Một mã đơn vị hành chính phải ` +
        "ứng với đúng một tên, nên tổng hợp theo mã và tổng hợp theo tên sẽ ra hai kết quả khác nhau.",
      viDu: lech.slice(0, 5),
      deXuat: "Chốt cột mã làm chuẩn rồi điền lại cột tên theo danh mục, hoặc ngược lại.",
    });
  }

  return ds;
}
