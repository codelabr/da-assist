/**
 * Đề xuất và áp dụng phép sửa.
 *
 * BỐN RÀNG BUỘC, không được nới cái nào:
 *
 *   1. Đề xuất theo NHÓM LỖI, không theo từng ô rời rạc. Người dùng quyết định
 *      trên nhóm, không phải bấm hai nghìn lần.
 *   2. Mỗi nhóm phải có bảng XEM TRƯỚC giá trị cũ → giá trị mới trên từng ô.
 *   3. KHÔNG BAO GIỜ ghi đè bản gốc. Kết quả ra một bảng mới; hàm ở đây không
 *      chạm vào bảng đầu vào.
 *   4. Mọi thay đổi vào NHẬT KÝ: dòng nào, cột nào, giá trị trước, giá trị sau,
 *      thuộc nhóm nào. Không có nhật ký thì không giải trình và không lần ngược
 *      được.
 *
 * Chỉ những nhóm mà máy chắc chắn mới được đưa vào đây. Biến thể về dấu tiếng
 * Việt KHÔNG có mặt: Vĩnh Thanh và Vĩnh Thạnh có thể là hai xã khác nhau thật,
 * nên việc gộp phải do người quyết định từng nhóm một.
 */

import { catTrang } from "../tien-ich/chuoi.js";
import { KIEU } from "../bang/suy-kieu.js";
import { doanNgay } from "../tien-ich/ngay.js";

export const NHOM = {
  NGAY: "S-NGAY",
  TRANG: "S-TRANG",
  HOA: "S-HOA",
  GOP: "S-GOP",
  TRUNG: "S-TRUNG",
};

/** Đọc một ô thành ngày, tôn trọng câu trả lời về thứ tự ngày–tháng. */
export function docNgayTheo(v, thuTu = "ngay-truoc") {
  const r = doanNgay(v, { nhanSoThuTu: true });
  if (!r) return null;
  if (thuTu === "thang-truoc" && r.mapHo) {
    const d = r.ngay;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCDate() - 1, d.getUTCMonth() + 1));
  }
  return r.ngay;
}

function hienThi(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (v == null) return "";
  return String(v);
}

/** Hai giá trị có thật sự như nhau không — xét cả kiểu, không chỉ mặt chữ. */
function khongDoi(a, b) {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Date || b instanceof Date) return false;
  return a === b;
}

/* ── Dựng đề xuất ──────────────────────────────────────────────────── */

function deXuatNgay(bang, qd) {
  const ra = [];
  for (const c of bang.cot) {
    if (c.kieu !== KIEU.NGAY) continue;
    const thuTu = (qd.thuTuNgay && qd.thuTuNgay[c.chiSo]) || "ngay-truoc";
    const thayDoi = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const v = bang.dong[i][c.chiSo];
      if (v == null || v === "" || v instanceof Date) continue;
      const d = docNgayTheo(v, thuTu);
      if (!d) continue;
      thayDoi.push({ dong: i, cot: c.chiSo, tenCot: c.ten, cu: hienThi(v), moi: d });
    }
    if (thayDoi.length) {
      ra.push({
        ma: `${NHOM.NGAY}:${c.chiSo}`,
        nhom: NHOM.NGAY,
        nhan: `Chuẩn hoá cột ngày “${c.ten}”`,
        moTa:
          "Đưa về ô ngày thật của Excel. Sau khi sửa thì sắp xếp, lọc theo khoảng " +
          "thời gian và tính khoảng cách ngày mới chạy đúng.",
        canhBao:
          thuTu === "thang-truoc"
            ? "Đang đọc theo thứ tự tháng trước, ngày sau — theo câu trả lời của bạn."
            : null,
        cot: [c.ten],
        thayDoi,
      });
    }
  }
  return ra;
}

function deXuatKhoangTrang(bang) {
  const ra = [];
  for (const c of bang.cot) {
    if (!c.soKhoangTrangThua) continue;
    const thayDoi = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const v = bang.dong[i][c.chiSo];
      if (typeof v !== "string") continue;
      const s = catTrang(v);
      if (s !== v) thayDoi.push({ dong: i, cot: c.chiSo, tenCot: c.ten, cu: v, moi: s });
    }
    if (thayDoi.length) {
      ra.push({
        ma: `${NHOM.TRANG}:${c.chiSo}`,
        nhom: NHOM.TRANG,
        nhan: `Cắt khoảng trắng thừa ở cột “${c.ten}”`,
        moTa:
          "Khoảng trắng thừa làm cùng một giá trị bị tách thành nhiều nhóm khi tổng hợp.",
        cot: [c.ten],
        thayDoi,
      });
    }
  }
  return ra;
}

function deXuatHoaThuong(bang) {
  const ra = [];
  for (const c of bang.cot) {
    const nhomBt = (c.bienThe || []).filter((b) => b.loai === "hoa-thuong");
    if (!nhomBt.length) continue;

    const chuan = new Map();
    for (const b of nhomBt) {
      let tot = null;
      let demTot = -1;
      for (const m of b.matChu) {
        const d = c.tanSuatCat.get(m) || 0;
        if (d > demTot) {
          demTot = d;
          tot = m;
        }
      }
      for (const m of b.matChu) if (m !== tot) chuan.set(m, tot);
    }

    const thayDoi = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const v = bang.dong[i][c.chiSo];
      if (typeof v !== "string") continue;
      const s = catTrang(v);
      const moi = chuan.get(s);
      if (moi && moi !== v) {
        thayDoi.push({ dong: i, cot: c.chiSo, tenCot: c.ten, cu: v, moi });
      }
    }
    if (thayDoi.length) {
      const viDu = nhomBt.slice(0, 3).map((b) => {
        const dich = b.matChu.find((m) => !chuan.has(m));
        return `${b.matChu.filter((m) => m !== dich).join(", ")} → ${dich}`;
      });
      ra.push({
        ma: `${NHOM.HOA}:${c.chiSo}`,
        nhom: NHOM.HOA,
        nhan: `Thống nhất cách viết hoa ở cột “${c.ten}”`,
        moTa:
          `Đưa về dạng phổ biến nhất trong tệp: ${viDu.join(" · ")}. ` +
          "Chỉ gộp những giá trị khác nhau đúng ở chữ hoa chữ thường.",
        cot: [c.ten],
        thayDoi,
      });
    }
  }
  return ra;
}

/**
 * Gộp giá trị theo câu trả lời của người dùng.
 * Nhóm này CHỈ tồn tại khi người dùng đã trả lời — máy không tự sinh ra nó.
 */
function deXuatGopGiaTri(bang, qd) {
  const ds = qd.gopGiaTri || [];
  const theoCot = new Map();
  for (const g of ds) {
    if (!theoCot.has(g.cot)) theoCot.set(g.cot, []);
    theoCot.get(g.cot).push(g);
  }

  const ra = [];
  for (const [cot, dsGop] of theoCot) {
    const c = bang.cot[cot];
    if (!c) continue;
    const banDo = new Map(dsGop.map((g) => [catTrang(g.tu).toLowerCase(), g.den]));
    const thayDoi = [];
    for (let i = 0; i < bang.dong.length; i++) {
      const v = bang.dong[i][cot];
      if (typeof v !== "string") continue;
      const k = catTrang(v).toLowerCase();
      if (!banDo.has(k)) continue;
      const moi = banDo.get(k);
      if (moi === catTrang(v)) continue;
      thayDoi.push({ dong: i, cot, tenCot: c.ten, cu: v, moi });
    }
    if (!thayDoi.length) continue;
    ra.push({
      ma: `${NHOM.GOP}:${cot}`,
      nhom: NHOM.GOP,
      nhan: `Gộp giá trị hiếm ở cột “${c.ten}”`,
      moTa:
        "Theo câu trả lời của bạn: " +
        dsGop.map((g) => `“${g.tu}” → ${g.den === "" ? "để trống" : `“${g.den}”`}`).join(" · ") + ".",
      canhBao: "Nhóm này dựa trên câu trả lời của bạn, không phải suy luận của máy.",
      cot: [c.ten],
      thayDoi,
    });
  }
  return ra;
}

function deXuatBoTrung(bang, phatHien) {
  const p = (phatHien || []).find((x) => x.ma === "KC12" && x.dongTrung);
  if (!p) return [];
  const bo = [...new Set(p.dongTrung.map((c) => c[1]))].sort((a, b) => a - b);
  if (!bo.length) return [];
  return [
    {
      ma: NHOM.TRUNG,
      nhom: NHOM.TRUNG,
      nhan: "Bỏ dòng trùng",
      moTa:
        "Những dòng trùng với một dòng khác trên mọi cột mang thông tin. " +
        "Giữ lại dòng xuất hiện trước trong mỗi nhóm.",
      canhBao:
        "Đây chỉ là những dòng GIỐNG HỆT nhau. Các cặp nghi trùng — cùng người nhưng " +
        "khác vài ô — không nằm ở đây; xem mục Tìm bản ghi trùng.",
      cot: ["(toàn dòng)"],
      thayDoi: [],
      boDong: bo,
      capTrung: p.dongTrung,
    },
  ];
}

/**
 * Dựng toàn bộ đề xuất sửa.
 * @param {object} bang
 * @param {Array}  phatHien  kết quả rà soát
 * @param {object} qd        quyết định rút từ hồ sơ đơn vị
 */
export function deXuatSua(bang, phatHien = [], qd = {}) {
  const ds = [
    ...deXuatKhoangTrang(bang),
    ...deXuatHoaThuong(bang),
    ...deXuatGopGiaTri(bang, qd),
    ...deXuatNgay(bang, qd),
    ...deXuatBoTrung(bang, phatHien),
  ];
  for (const d of ds) {
    d.soO = d.thayDoi.length;
    d.soDong = d.boDong ? d.boDong.length : new Set(d.thayDoi.map((x) => x.dong)).size;
    d.xemTruoc = d.thayDoi.slice(0, 8).map((x) => ({
      dong: x.dong + 2,
      cot: x.tenCot,
      cu: x.cu,
      moi: hienThi(x.moi),
    }));
  }
  return ds;
}

/* ── Áp dụng ───────────────────────────────────────────────────────── */

/**
 * Áp dụng các nhóm được chọn lên một BẢN SAO của dữ liệu.
 * Không chạm vào `bang`.
 *
 * @returns {{hang:Array, nhatKy:Array, oDaSua:Array, dongGiuTrung:Array, anhXaDong:Array, tomTat:object}}
 */
export function apDung(bang, deXuat, maDaChon) {
  const chon = new Set(maDaChon);
  const dsChon = deXuat.filter((d) => chon.has(d.ma));

  // Sao chép sâu phần dữ liệu.
  const dong = bang.dong.map((d) => d.slice());
  const nhatKy = [];
  // Toạ độ ô đã đổi, theo chỉ số dòng TRƯỚC khi bỏ dòng trùng. Quy đổi sang
  // chỉ số trên trang kết quả ở cuối hàm, khi đã biết dòng nào bị bỏ.
  const oGoc = [];

  // Thứ tự cố định: cắt khoảng trắng → thống nhất hoa thường → chuẩn hoá ngày.
  // Ngược thứ tự này thì phép sau không nhận ra giá trị mà phép trước vừa sửa.
  const thuTu = [NHOM.TRANG, NHOM.HOA, NHOM.GOP, NHOM.NGAY];
  for (const nhom of thuTu) {
    for (const d of dsChon.filter((x) => x.nhom === nhom)) {
      for (const t of d.thayDoi) {
        const hienTai = dong[t.dong][t.cot];
        const cu = hienThi(hienTai);
        // So theo KIỂU chứ không theo chuỗi hiển thị. Chuỗi "2019-05-26" hiển
        // thị y hệt ô ngày cùng ngày ấy, nên so theo hiển thị thì mọi ngày dạng
        // ISO bị bỏ qua và cột lẫn hai định dạng chỉ được sửa một nửa — nhìn thì
        // tưởng xong, thực ra vẫn hỏng.
        if (khongDoi(hienTai, t.moi)) continue;
        dong[t.dong][t.cot] = t.moi;
        oGoc.push({ dong: t.dong, cot: t.cot });
        nhatKy.push({
          dong: t.dong + 2,
          cot: t.tenCot,
          cu,
          moi: hienThi(t.moi),
          nhom: d.nhan,
        });
      }
    }
  }

  // Bỏ dòng làm sau cùng, để số dòng trong nhật ký còn khớp bản gốc.
  let boDong = [];
  const dongGiuLai = [];
  const dTrung = dsChon.find((x) => x.nhom === NHOM.TRUNG);
  if (dTrung) {
    boDong = dTrung.boDong;
    const tap = new Set(boDong);
    const giu = new Map((dTrung.capTrung || []).map((c) => [c[1], c[0]]));
    dongGiuLai.push(...giu.values());
    for (const i of boDong) {
      nhatKy.push({
        dong: i + 2,
        cot: "(toàn dòng)",
        cu: "giữ lại",
        moi: `bỏ — trùng với dòng ${giu.has(i) ? giu.get(i) + 2 : "?"}`,
        nhom: dTrung.nhan,
      });
    }
    for (let i = dong.length - 1; i >= 0; i--) if (tap.has(i)) dong.splice(i, 1);
  }

  // Quy đổi toạ độ ô đã đổi sang chỉ số trên TRANG KẾT QUẢ.
  //
  // Hai phép dịch, cả hai đều dễ quên và cả hai đều làm lệch màu đúng một dòng
  // nếu bỏ sót: bỏ dòng trùng làm mọi dòng phía sau dồn lên, và trang kết quả có
  // thêm hàng tiêu đề ở trên cùng.
  const boTap = new Set(boDong);
  const anhXa = new Map();
  let k = 0;
  for (let i = 0; i < bang.dong.length; i++) {
    if (boTap.has(i)) continue;
    anhXa.set(i, k);
    k++;
  }
  const oDaSua = [];
  for (const o of oGoc) {
    if (!anhXa.has(o.dong)) continue; // ô nằm trên dòng đã bị bỏ
    oDaSua.push({ hang: anhXa.get(o.dong) + 1, cot: o.cot });
  }

  // Dòng ĐƯỢC GIỮ của mỗi nhóm trùng, tính theo chỉ số trên trang kết quả.
  //
  // Dòng bị bỏ thì không còn trên trang ấy nữa nên không đánh dấu được; thứ đáng
  // đánh dấu là dòng ở lại, để người dùng biết dòng này đã nuốt một bản ghi trùng
  // chứ không phải một dòng bình thường.
  const dongGiuTrung = [];
  for (const i of new Set(dongGiuLai)) {
    if (anhXa.has(i)) dongGiuTrung.push(anhXa.get(i) + 1);
  }
  dongGiuTrung.sort((a, b) => a - b);

  // Ánh xạ dòng gốc sang dòng kết quả, để lớp tô quy đổi được toạ độ của những
  // phát hiện CHƯA được sửa. Trả về mảng thay cho Map để dùng lại được ở mọi vỏ.
  const anhXaDong = new Array(bang.dong.length).fill(-1);
  for (const [goc, moi] of anhXa) anhXaDong[goc] = moi;

  return {
    hang: [bang.tieuDe.slice(), ...dong],
    nhatKy,
    oDaSua,
    dongGiuTrung,
    anhXaDong,
    tomTat: {
      soNhomApDung: dsChon.length,
      soODaSua: nhatKy.filter((x) => x.cot !== "(toàn dòng)").length,
      soDongDaBo: boDong.length,
      soDongTruoc: bang.dong.length,
      soDongSau: dong.length,
    },
  };
}

/** Dựng trang nhật ký để ghi kèm vào tệp kết quả. */
export function trangNhatKy(nhatKy, tomTat, tenTepGoc = "") {
  const hang = [
    ["NHẬT KÝ LÀM SẠCH DỮ LIỆU"],
    ["Tệp gốc", tenTepGoc],
    ["Số ô đã sửa", tomTat.soODaSua],
    ["Số dòng đã bỏ", tomTat.soDongDaBo],
    ["Số dòng trước khi sửa", tomTat.soDongTruoc],
    ["Số dòng sau khi sửa", tomTat.soDongSau],
    [],
    ["Tệp gốc không bị thay đổi. Đây là bản sao đã sửa."],
    [],
    ["Dòng ở tệp gốc", "Cột", "Giá trị trước", "Giá trị sau", "Thuộc nhóm sửa"],
    ...nhatKy.map((x) => [x.dong, x.cot, x.cu, x.moi, x.nhom]),
  ];
  return { ten: "Nhat ky lam sach", hang };
}
