/**
 * Tầng 1 — các phép kiểm chạy được với MỌI tệp bảng, không cần biết chuyên môn.
 *
 * Ba mức kết luận, không bao giờ chỉ có hai:
 *   CHAC_CHAN     máy nhìn ra chắc chắn, sửa được mà không cần phán đoán
 *   CAN_XAC_MINH  có dấu hiệu nhưng cần người xem, máy không tự quyết
 *   GHI_NHAN      không phải lỗi, chỉ là đặc điểm của tệp cần biết
 *
 * Mức GHI_NHAN quan trọng không kém hai mức kia. Cột trống hoàn toàn trong một
 * bản xuất là đặc điểm của hệ thống nguồn, không phải lỗi nhập liệu. Gắn cờ đỏ
 * cho nó là dạy người dùng bỏ qua cảnh báo.
 */

import { catTrang, chuanHoa } from "../tien-ich/chuoi.js";
import { KIEU } from "../bang/suy-kieu.js";
import { DANG } from "../tien-ich/ngay.js";

export const MUC = {
  CHAC_CHAN: "chac-chan",
  CAN_XAC_MINH: "can-xac-minh",
  GHI_NHAN: "ghi-nhan",
};

function phat(ds, o) {
  ds.push({ viDu: [], suaDuoc: false, ...o });
}

function lay(tanSuat, n) {
  return [...tanSuat.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

/** Tách phần mã số phân cấp trong một giá trị, ví dụ "Mã 2.1 - Tình dục" → "2.1". */
function machSo(s) {
  const m = /(\d+(?:\.\d+)+|\d+)/.exec(catTrang(s));
  return m ? m[1] : null;
}

/**
 * Cột số thứ tự dòng: số nguyên, duy nhất trên mọi dòng, và tăng dần. Cột này
 * không mang thông tin nào nên phải loại khỏi phép so trùng.
 */
function laCotSoThuTu(bang, mo) {
  if (mo.soODay !== bang.dong.length || mo.soODay < 3) return false;
  if (mo.soGiaTriKhacNhau !== mo.soODay) return false;
  let truoc = -Infinity;
  for (const d of bang.dong) {
    const v = Number(d[mo.chiSo]);
    if (!Number.isInteger(v) || v <= truoc) return false;
    truoc = v;
  }
  return true;
}

export function kiemChung(bang) {
  const ds = [];
  const cot = bang.cot || [];

  for (const c of cot) {
    const nhan = c.ten || `cột ${c.chiSo + 1}`;

    if (!c.ten) {
      phat(ds, {
        ma: "KC02",
        mucDo: MUC.CAN_XAC_MINH,
        cot: nhan,
        chiSoCot: c.chiSo,
        soDong: c.soODay,
        moTa: "Cột không có tiêu đề.",
        deXuat: "Đặt tên cột, hoặc xoá nếu không dùng.",
      });
    }

    if (c.kieu === KIEU.TRONG) {
      phat(ds, {
        ma: "KC01",
        mucDo: MUC.GHI_NHAN,
        cot: nhan,
        chiSoCot: c.chiSo,
        soDong: 0,
        moTa: "Cột trống hoàn toàn. Với một bản xuất từ hệ thống, đây thường là đặc điểm của hệ thống nguồn chứ không phải lỗi nhập liệu.",
        deXuat: "Kiểm tra xem hệ thống nguồn có thu thập trường này không trước khi kết luận là thiếu dữ liệu.",
      });
      continue;
    }

    if (c.kieu === KIEU.LAN_LON) {
      phat(ds, {
        ma: "KC03",
        mucDo: MUC.CAN_XAC_MINH,
        cot: nhan,
        chiSoCot: c.chiSo,
        soDong: c.soODay,
        moTa: "Cột lẫn lộn kiểu dữ liệu — có cả số, chữ và ngày trong cùng một cột.",
        viDu: lay(c.tanSuat, 4).map((x) => x[0]),
        deXuat: "Tách thành nhiều cột, hoặc thống nhất một kiểu.",
      });
    }

    // Ngày lưu dạng văn bản.
    if (c.kieu === KIEU.NGAY && c.soNgayVanBan > 0) {
      phat(ds, {
        ma: "KC04",
        mucDo: MUC.CHAC_CHAN,
        cot: nhan,
        chiSoCot: c.chiSo,
        soDong: c.soNgayVanBan,
        moTa: `Có ${c.soNgayVanBan} ô ngày đang lưu dưới dạng văn bản. Excel không sắp xếp và không tính toán được trên các ô này.`,
        deXuat: "Chuyển sang ô ngày thật.",
        suaDuoc: true,
      });
    }

    // Hai định dạng ngày lẫn nhau — nguy hiểm nhất trong nhóm ngày tháng.
    if (c.kieu === KIEU.NGAY) {
      const dangVanBan = [DANG.ISO, DANG.NGAY_TRUOC, DANG.THANG_TRUOC].filter(
        (d) => (c.dangNgay[d] || 0) > 0
      );
      if (dangVanBan.length > 1) {
        const keKhai = dangVanBan.map((d) => `${d}: ${c.dangNgay[d]} ô`).join("; ");
        phat(ds, {
          ma: "KC05",
          mucDo: MUC.CHAC_CHAN,
          cot: nhan,
          chiSoCot: c.chiSo,
          soDong: dangVanBan.reduce((t, d) => t + c.dangNgay[d], 0),
          moTa: `Cột chứa hai định dạng ngày lẫn nhau (${keKhai}). Mọi cách cắt chuỗi để lấy năm đều sai với một trong hai nhóm.`,
          viDu: lay(c.tanSuat, 4).map((x) => x[0]),
          deXuat: "Đưa cả cột về một định dạng ngày thống nhất trước khi tạo cột năm.",
          suaDuoc: true,
        });
      }
      if ((c.dangNgay[DANG.SO_THU_TU] || 0) > 0) {
        phat(ds, {
          ma: "KC06",
          mucDo: MUC.CHAC_CHAN,
          cot: nhan,
          chiSoCot: c.chiSo,
          soDong: c.dangNgay[DANG.SO_THU_TU],
          moTa: `Có ${c.dangNgay[DANG.SO_THU_TU]} ô là số thứ tự ngày của Excel chưa được định dạng, nên hiển thị ra một dãy số thay vì ngày.`,
          deXuat: "Định dạng lại các ô này thành ngày.",
          suaDuoc: true,
        });
      }
    }

    // Số lưu dạng văn bản, nhưng bỏ qua cột mã định danh vì ở đó giữ dạng văn bản
    // mới đúng — cắt số 0 đứng đầu là làm hỏng mã.
    if (c.soSoLuuVanBan > 0 && c.kieu !== KIEU.MA_DINH_DANH && c.kieu !== KIEU.NGAY) {
      // Cột tên bắt đầu bằng "Mã" hoặc "Số" gần như luôn là mã định danh, mà mã
      // định danh thì giữ dạng văn bản mới ĐÚNG — chuyển sang số là cắt mất số 0
      // đứng đầu. Báo đỏ ở đây là mắng oan, và mắng oan vài lần thì người dùng
      // thôi đọc cảnh báo.
      const laCotMa = /^(ma|so) /.test(chuanHoa(nhan));
      phat(ds, {
        ma: "KC07",
        mucDo: laCotMa ? MUC.GHI_NHAN : MUC.CAN_XAC_MINH,
        cot: nhan,
        chiSoCot: c.chiSo,
        soDong: c.soSoLuuVanBan,
        moTa: laCotMa
          ? `Có ${c.soSoLuuVanBan} ô số lưu dưới dạng văn bản. Tên cột cho thấy đây là mã định danh, nên lưu dạng văn bản là đúng — ghi nhận để bạn biết, không cần sửa.`
          : `Có ${c.soSoLuuVanBan} ô số đang lưu dưới dạng văn bản.`,
        deXuat: laCotMa
          ? "Giữ nguyên dạng văn bản để không mất số 0 đứng đầu."
          : "Nếu là số để tính toán thì chuyển sang kiểu số. Nếu là mã định danh thì giữ nguyên dạng văn bản.",
      });
    }

    if (c.soKhoangTrangThua > 0) {
      phat(ds, {
        ma: "KC08",
        mucDo: MUC.CHAC_CHAN,
        cot: nhan,
        chiSoCot: c.chiSo,
        soDong: c.soKhoangTrangThua,
        moTa: `Có ${c.soKhoangTrangThua} ô thừa khoảng trắng ở đầu, cuối hoặc giữa. Các ô này bị coi là giá trị khác khi tổng hợp.`,
        deXuat: "Cắt khoảng trắng thừa.",
        suaDuoc: true,
      });
    }

    const demBienThe = (loai) => {
      const nhomBt = c.bienThe.filter((b) => b.loai === loai);
      const tong = nhomBt.reduce(
        (t, b) => t + b.matChu.reduce((s, m) => s + (c.tanSuatCat.get(m) || 0), 0),
        0
      );
      return { nhomBt, tong };
    };

    const ht = demBienThe("hoa-thuong");
    if (ht.nhomBt.length > 0) {
      phat(ds, {
        ma: "KC09",
        mucDo: MUC.CHAC_CHAN,
        cot: nhan,
        chiSoCot: c.chiSo,
        soDong: ht.tong,
        moTa: `Có ${ht.nhomBt.length} giá trị được ghi theo nhiều cách khác nhau về hoa thường. Tổng hợp sẽ tách chúng thành nhiều nhóm riêng.`,
        viDu: ht.nhomBt.slice(0, 3).map((b) => b.matChu.join(" / ")),
        deXuat: "Thống nhất một cách viết hoa cho mỗi giá trị.",
        suaDuoc: true,
      });
    }

    const dau = demBienThe("dau");
    if (dau.nhomBt.length > 0) {
      phat(ds, {
        ma: "KC13",
        mucDo: MUC.CAN_XAC_MINH,
        cot: nhan,
        chiSoCot: c.chiSo,
        soDong: dau.tong,
        moTa:
          `Có ${dau.nhomBt.length} nhóm giá trị chỉ khác nhau ở dấu tiếng Việt. ` +
          "Có thể là cùng một giá trị bị gõ thiếu dấu, nhưng cũng có thể là hai giá trị " +
          "khác nhau thật — nhiều địa danh Việt Nam chỉ phân biệt bằng dấu. Máy không tự gộp.",
        viDu: dau.nhomBt.slice(0, 3).map((b) => b.matChu.join(" / ")),
        deXuat: "Người dùng xem từng nhóm rồi quyết định gộp hay giữ riêng.",
      });
    }

    // Mã phân cấp: có cả mã cha và mã con trong cùng một cột.
    if (c.kieu === KIEU.PHAN_LOAI) {
      const ma = new Map();
      for (const k of c.tanSuat.keys()) {
        const m = machSo(k);
        if (m) ma.set(m, k);
      }
      const cap = [];
      for (const a of ma.keys()) {
        for (const b of ma.keys()) {
          if (b !== a && b.startsWith(a + ".")) cap.push([ma.get(a), ma.get(b)]);
        }
      }
      if (cap.length > 0) {
        phat(ds, {
          ma: "KC10",
          mucDo: MUC.CAN_XAC_MINH,
          cot: nhan,
          chiSoCot: c.chiSo,
          soDong: c.soODay,
          moTa: `Cột chứa đồng thời mã cha và mã con (${cap.length} cặp). Tổng hợp thẳng theo cột này sẽ đếm song song hai cấp và ra bảng sai.`,
          viDu: cap.slice(0, 3).map((p) => `${p[0]}  ↔  ${p[1]}`),
          deXuat: "Chọn một cấp để tổng hợp: gộp mã con về mã cha, hoặc tách riêng hai cấp.",
        });
      }

      const motLan = [...c.tanSuat.entries()].filter((x) => x[1] === 1);
      if (motLan.length > 0 && c.soODay >= 50 && motLan.length <= 10) {
        phat(ds, {
          ma: "KC11",
          mucDo: MUC.CAN_XAC_MINH,
          cot: nhan,
          chiSoCot: c.chiSo,
          soDong: motLan.length,
          moTa: `Có ${motLan.length} giá trị chỉ xuất hiện đúng một lần trong một cột phân loại. Thường là lỗi gõ hoặc giá trị ngoài danh mục.`,
          viDu: motLan.slice(0, 4).map((x) => x[0]),
          deXuat: "Đối chiếu với danh mục giá trị hợp lệ.",
        });
      }
    }
  }

  // Dòng trùng.
  //
  // KHÔNG so toàn bộ cột. Cột số thứ tự dòng luôn khác nhau nên nó che mất mọi
  // cặp trùng thật — đo trên bản xuất thật cho thấy 12 cặp trùng giống nhau ở cả
  // 89 cột và chỉ khác đúng cột số thứ tự. So toàn dòng bỏ lọt hết cả 12 cặp.
  const cotBoQua = new Set();
  for (const c of cot) if (laCotSoThuTu(bang, c)) cotBoQua.add(c.chiSo);
  const tenBoQua = [...cotBoQua].map((k) => bang.tieuDe[k]).filter(Boolean);
  const thay = new Map();
  const trung = [];
  for (let i = 0; i < bang.dong.length; i++) {
    const khoa = bang.dong[i]
      .map((v, k) =>
        cotBoQua.has(k) ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : catTrang(v)
      )
      .join("");
    if (thay.has(khoa)) trung.push([thay.get(khoa), i]);
    else thay.set(khoa, i);
  }
  if (trung.length > 0) {
    phat(ds, {
      ma: "KC12",
      mucDo: MUC.CHAC_CHAN,
      cot: "(toàn dòng)",
      chiSoCot: -1,
      soDong: trung.length,
      moTa:
        `Có ${trung.length} dòng trùng với một dòng khác trên mọi cột mang thông tin` +
        (tenBoQua.length ? `, chỉ khác ở cột số thứ tự dòng (${tenBoQua.join(", ")})` : "") +
        ".",
      viDu: trung.slice(0, 3).map((p) => `dòng ${p[0] + 2} và dòng ${p[1] + 2}`),
      deXuat: "Giữ lại một dòng trong mỗi nhóm trùng.",
      suaDuoc: true,
      dongTrung: trung,
    });
  }

  return ds;
}
