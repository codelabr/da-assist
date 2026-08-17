/**
 * Tầng 1b — các phép kiểm dành riêng cho BIỂU ĐÃ CỘNG.
 *
 * Biểu đã cộng không kiểm được bằng bộ phép kiểm của danh sách: không có bản ghi
 * trùng, không có định danh, phần lớn ô là số đếm. Nhưng nó có một thứ mà danh
 * sách không có — CÁC QUAN HỆ SỐ HỌC. Một dòng tổng không khớp, hay một dòng con
 * lớn hơn dòng cha, là lỗi nhìn thấy được mà không cần biết biểu này là biểu gì.
 *
 * Nguyên tắc chi phối cả tệp này: KHÔNG SUY RA QUAN HỆ CỘNG mà biểu không tự
 * khai. Trong biểu mẫu Thông tư 05, chữ "Trong đó" đứng trước các dòng con mang
 * ba nghĩa khác nhau:
 *   - phân hoạch:   Bảng 6 — 1 = 1.1 + 1.2 + 1.3 (ba thời điểm bắt đầu ARV, rời nhau)
 *   - tập con rời:  Bảng 2 — 6 = 6.1 + 6.2 (mang thai / chuyển dạ)
 *   - tập lồng:     Bảng 3 — 1.2 (trên 12 tháng) NẰM TRONG 1.1 (trên 6 tháng)
 * Cộng các dòng con của tập lồng rồi so với dòng cha sẽ báo nhầm ngay trên một
 * biểu điền đúng. Vì vậy phép kiểm duy nhất áp cho mọi biểu là quan hệ BAO HÀM:
 * mỗi dòng con không được lớn hơn dòng cha. Quan hệ bằng chỉ được kiểm khi hồ sơ
 * biểu mẫu khai rõ, xem src/ho-so/tt05-bieu-bao-cao.js.
 */

import { catTrang, chuanHoa } from "../tien-ich/chuoi.js";
import { MUC } from "./kiem-chung.js";

const TU_TONG = ["tong", "tong so", "tong cong", "cong", "toan tinh", "chung"];

function rong(v) {
  return v == null || (typeof v === "string" && v.trim() === "");
}

/**
 * Đọc một ô của biểu thành số.
 *
 * Dấu chấm trong tiếng Việt là dấu phân cách hàng nghìn, nên "1.234" là một nghìn
 * hai trăm ba mươi tư, không phải một phẩy hai. Chỉ nhận cách hiểu ấy khi chuỗi
 * đúng dạng nhóm ba chữ số; ngoài ra thì không đoán.
 *
 * @returns {{so:number, tuChuoi:boolean}|null}
 */
export function docSoBieu(v) {
  if (typeof v === "number") return Number.isFinite(v) ? { so: v, tuChuoi: false } : null;
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  // Gạch ngang là cách ghi "không có số liệu" trên biểu mẫu giấy.
  if (/^[-–—]$/.test(s)) return null;

  const am = /^\(.*\)$/.test(s) ? -1 : 1;
  let t = s.replace(/^\(|\)$/g, "").replace(/\s/g, "");
  if (/^[-–—]/.test(t)) {
    t = t.replace(/^[-–—]/, "");
    return dung(am * -1, t);
  }
  return dung(am, t);

  function dung(dau, x) {
    if (/^\d{1,3}(\.\d{3})+$/.test(x)) return { so: dau * Number(x.replace(/\./g, "")), tuChuoi: true };
    if (/^\d{1,3}(,\d{3})+$/.test(x)) return { so: dau * Number(x.replace(/,/g, "")), tuChuoi: true };
    if (/^\d+,\d+$/.test(x)) return { so: dau * Number(x.replace(",", ".")), tuChuoi: true };
    if (/^\d+(\.\d+)?$/.test(x)) return { so: dau * Number(x), tuChuoi: true };
    return null;
  }
}

/** Mã phân cấp của một dòng: "1", "2.1", hoặc số La Mã. */
function machMuc(v) {
  const s = catTrang(v);
  if (!s) return null;
  if (/^[IVX]{1,5}$/.test(s)) return { ma: s, laMa: true, cap: 0 };
  const m = /^(\d+(?:\.\d+)*)[.)]?$/.exec(s);
  if (!m) return null;
  return { ma: m[1], laMa: false, cap: m[1].split(".").length };
}

/** Nhãn dòng là chữ "Tổng", "Tổng số", "Cộng"… */
function laDongTong(v) {
  const t = chuanHoa(v);
  return !!t && TU_TONG.includes(t);
}

/** Số hàng thật trên trang tính của dòng dữ liệu thứ i. */
export function soHang(bang, i) {
  return bang.chiSoHangTieuDe + 2 + i;
}

/**
 * Đọc cấu trúc một biểu: cột nào là cột mã, cột nào là cột nhãn, cột nào là cột
 * số, và mỗi dòng mang mã gì.
 */
export function docCauTrucBieu(bang) {
  const soCot = bang.soCot;
  const dong = bang.dong;

  // Cột mã: cột có nhiều dòng mang mã phân cấp nhất, và phải nằm ở ba cột đầu.
  let cotMa = -1;
  let maNhieuNhat = 0;
  for (let c = 0; c < Math.min(3, soCot); c++) {
    let d = 0;
    for (const h of dong) if (machMuc(h[c])) d++;
    if (d > maNhieuNhat) {
      maNhieuNhat = d;
      cotMa = c;
    }
  }
  if (maNhieuNhat < 2) cotMa = -1;

  // Cột nhãn: cột chữ dài nhất trong ba cột đầu, không phải cột mã.
  let cotNhan = -1;
  let daiNhat = 0;
  for (let c = 0; c < Math.min(4, soCot); c++) {
    if (c === cotMa) continue;
    let tong = 0;
    let d = 0;
    for (const h of dong) {
      if (typeof h[c] === "string" && h[c].trim()) {
        tong += h[c].trim().length;
        d++;
      }
    }
    const tb = d ? tong / d : 0;
    if (d >= 2 && tb > daiNhat) {
      daiNhat = tb;
      cotNhan = c;
    }
  }

  // Cột số: phần lớn ô không rỗng đọc được thành số. Cột mã và cột nhãn bị loại
  // trước, vì cột mã "1, 2, 3" cũng đọc được thành số.
  const cotSo = [];
  for (let c = 0; c < soCot; c++) {
    if (c === cotMa || c === cotNhan) continue;
    let day = 0;
    let la = 0;
    for (const h of dong) {
      if (rong(h[c])) continue;
      day++;
      if (docSoBieu(h[c])) la++;
    }
    if (la >= 1 && la >= day * 0.5) cotSo.push(c);
  }

  // Mã dòng phải được đánh theo từng phần La Mã. Biểu mẫu nào cũng có mục "1, 2,
  // 3" lặp lại ở phần I rồi lặp lại ở phần II; không ghi phần thì mục 1.1 của
  // phần II sẽ đi tìm dòng cha ở phần I.
  let phanHienTai = "";
  const mucDong = dong.map((h, i) => {
    const mm = cotMa >= 0 ? machMuc(h[cotMa]) : null;
    const nhan = cotNhan >= 0 ? h[cotNhan] : "";
    const tongTheoMa = cotMa >= 0 && laDongTong(h[cotMa]);
    if (mm && mm.laMa) phanHienTai = mm.ma;
    return {
      i,
      hang: soHang(bang, i),
      phan: phanHienTai,
      ma: mm && !mm.laMa ? mm.ma : null,
      laMa: mm ? mm.laMa : false,
      maLaMa: mm && mm.laMa ? mm.ma : null,
      nhan: typeof nhan === "string" ? nhan.trim() : String(nhan == null ? "" : nhan),
      laTong: tongTheoMa || laDongTong(nhan),
    };
  });

  return { cotMa, cotNhan, cotSo, mucDong };
}

/**
 * Gom các cột phân tổ quanh một cột tổng.
 *
 * Chỉ nhận khi thấy ĐỦ CẶP "Nam" và "Nữ" cạnh một cột tổng. Đòi đủ cặp là cách
 * chặn một bẫy tiếng Việt: bỏ dấu thì "Năm" (thời gian) trùng "Nam" (giới tính),
 * nên một cột năm đứng lẻ sẽ bị hiểu thành cột nam. Cặp Nam–Nữ thì không lẫn
 * được. Vì lý do đó phép so ở đây GIỮ NGUYÊN DẤU chứ không chuẩn hoá.
 */
export function nhomPhanTo(bang) {
  const ten = bang.tieuDe.map((t) => catTrang(t).toLowerCase());
  const laNam = (s) => s === "nam";
  const laNu = (s) => s === "nữ" || s === "nu";
  const laTong = (s) => TU_TONG.includes(chuanHoa(s));

  const nhom = [];
  for (let c = 0; c < ten.length; c++) {
    if (!laNam(ten[c])) continue;
    // Cột nữ phải kề ngay sau cột nam — đó là cách mọi biểu mẫu xếp.
    if (!(c + 1 < ten.length && laNu(ten[c + 1]))) continue;
    const phan = [c, c + 1];
    let tong = -1;
    if (c - 1 >= 0 && laTong(ten[c - 1])) tong = c - 1;
    else if (c + 2 < ten.length && laTong(ten[c + 2])) tong = c + 2;
    if (tong < 0) continue;
    nhom.push({ tong, phan, ten: `${bang.tieuDe[tong]} = ${bang.tieuDe[c]} + ${bang.tieuDe[c + 1]}` });
    c += 2;
  }
  return nhom;
}

function phat(ds, o) {
  ds.push({ viDu: [], suaDuoc: false, ...o });
}

/**
 * Các phép kiểm cho biểu đã cộng.
 * @param {object} bang bảng đã chuẩn hoá
 * @returns {Array} danh sách phát hiện
 */
export function kiemBieu(bang) {
  const ds = [];
  const ct = docCauTrucBieu(bang);
  const { cotSo, mucDong } = ct;

  if (!cotSo.length) {
    phat(ds, {
      ma: "BB00",
      mucDo: MUC.GHI_NHAN,
      cot: "",
      chiSoCot: -1,
      soDong: bang.soDong,
      moTa:
        "Không tìm được cột số liệu nào trong biểu này, nên các phép kiểm số học không chạy. " +
        "Biểu chưa điền số cũng cho kết quả như vậy.",
      deXuat: "Kiểm tra lại xem vùng chọn có bao đủ phần bảng số liệu không.",
    });
    return ds;
  }

  const tenCot = (c) => bang.tieuDe[c] || `cột ${c + 1}`;
  const so = (i, c) => docSoBieu(bang.dong[i][c]);

  // ---------------------------------------------------------------- BB01
  // Dòng con lớn hơn dòng cha. Đây là phép kiểm chắc chắn duy nhất áp được cho
  // mọi biểu, vì "Trong đó" luôn nghĩa là tập con — dù các dòng con có rời nhau
  // hay lồng vào nhau thì từng dòng con vẫn không thể lớn hơn dòng cha.
  const theoMa = new Map();
  for (const m of mucDong) if (m.ma) theoMa.set(khoaMa(m), m);

  const viPham = [];
  for (const m of mucDong) {
    if (!m.ma || !m.ma.includes(".")) continue;
    const cha = theoMa.get(khoaMaCha(m));
    if (!cha) continue;
    for (const c of cotSo) {
      const a = so(m.i, c);
      const b = so(cha.i, c);
      if (!a || !b) continue;
      if (a.so > b.so) {
        viPham.push({
          hang: m.hang,
          moTa: `dòng ${m.hang} (mã ${m.ma}) là ${a.so}, lớn hơn dòng cha ${cha.hang} (mã ${cha.ma}) là ${b.so} tại “${tenCot(c)}”`,
        });
      }
    }
  }
  if (viPham.length) {
    phat(ds, {
      ma: "BB01",
      mucDo: MUC.CHAC_CHAN,
      cot: "",
      chiSoCot: -1,
      soDong: viPham.length,
      moTa:
        `Có ${viPham.length} chỗ dòng con lớn hơn dòng cha. Dòng con của một mục là phần ` +
        "nằm trong mục đó, nên không thể lớn hơn.",
      viDu: viPham.slice(0, 5).map((v) => v.moTa),
      deXuat: "Đối chiếu lại với sổ nguồn: hoặc dòng cha bị ghi thiếu, hoặc dòng con bị ghi lẫn số của mục khác.",
    });
  }

  // ---------------------------------------------------------------- BB02
  // Cột tổng không khớp cột phân tổ.
  //
  // Hai chiều lệch mang hai nghĩa khác nhau và phải xếp hai mức khác nhau. Tổng
  // NHỎ HƠN Nam + Nữ là mâu thuẫn logic: nam và nữ là hai nhóm rời nhau nên tổng
  // không thể nhỏ hơn phần của chúng. Tổng LỚN HƠN thì chưa chắc lỗi — biểu có
  // thể còn nhóm không xác định giới tính mà không in thành cột.
  for (const nh of nhomPhanTo(bang)) {
    const thieu = [];
    const thua = [];
    for (const m of mucDong) {
      if (m.laMa) continue;
      const t = so(m.i, nh.tong);
      if (!t) continue;
      let tongPhan = 0;
      let coPhan = false;
      for (const c of nh.phan) {
        const p = so(m.i, c);
        if (p) {
          tongPhan += p.so;
          coPhan = true;
        }
      }
      if (!coPhan) continue;
      if (t.so < tongPhan) thieu.push(`dòng ${m.hang}: ${t.so} < ${tongPhan}`);
      else if (t.so > tongPhan) thua.push(`dòng ${m.hang}: ${t.so} > ${tongPhan}`);
    }
    if (thieu.length) {
      phat(ds, {
        ma: "BB02",
        mucDo: MUC.CHAC_CHAN,
        cot: bang.tieuDe[nh.tong] || "",
        chiSoCot: nh.tong,
        soDong: thieu.length,
        moTa:
          `Cột tổng nhỏ hơn tổng các cột phân tổ ở ${thieu.length} dòng (${nh.ten}). ` +
          "Nam và nữ là hai nhóm rời nhau nên cột tổng không thể nhỏ hơn.",
        viDu: thieu.slice(0, 5),
        deXuat: "Cộng lại cột tổng từ các cột phân tổ.",
      });
    }
    if (thua.length) {
      phat(ds, {
        ma: "BB03",
        mucDo: MUC.CAN_XAC_MINH,
        cot: bang.tieuDe[nh.tong] || "",
        chiSoCot: nh.tong,
        soDong: thua.length,
        moTa:
          `Cột tổng lớn hơn tổng các cột phân tổ ở ${thua.length} dòng (${nh.ten}). ` +
          "Đây chưa chắc là lỗi: biểu có thể còn nhóm không xác định được giới tính mà " +
          "không in thành cột riêng. Máy không tự sửa.",
        viDu: thua.slice(0, 5),
        deXuat: "Xác nhận phần chênh có phải nhóm không rõ giới tính hay không; nếu không thì cộng lại.",
      });
    }
  }

  // ---------------------------------------------------------------- BB04
  // Dòng tổng không khớp các dòng thành phần.
  //
  // Cách gom thành phần của một dòng tổng thì mỗi biểu một khác, nên thay vì áp
  // một cách gom duy nhất rồi báo nhầm, máy thử vài phạm vi hợp lý; khớp được
  // MỘT phạm vi nào đó thì im lặng. Chỉ khi không phạm vi nào khớp mới nêu ra,
  // và nêu ở mức cần xác minh chứ không phải chắc chắn — vì có thể còn cách gom
  // khác mà máy chưa nghĩ tới.
  for (const t of mucDong) {
    if (!t.laTong) continue;
    const pham = phamViThanhPhan(mucDong, t);
    if (!pham.length) continue;

    const lech = [];
    for (const c of cotSo) {
      const tv = so(t.i, c);
      if (!tv) continue;
      let khop = false;
      const daThu = [];
      for (const p of pham) {
        let s = 0;
        let co = false;
        for (const m of p.dong) {
          const v = so(m.i, c);
          if (v) {
            s += v.so;
            co = true;
          }
        }
        if (!co) continue;
        daThu.push(`${p.ten} = ${s}`);
        if (gan(s, tv.so)) {
          khop = true;
          break;
        }
      }
      if (!khop && daThu.length) {
        lech.push(`“${tenCot(c)}”: dòng tổng ghi ${tv.so}, cộng lại được ${daThu.join("; ")}`);
      }
    }
    if (lech.length) {
      phat(ds, {
        ma: "BB04",
        mucDo: MUC.CAN_XAC_MINH,
        cot: "",
        chiSoCot: -1,
        soDong: lech.length,
        moTa:
          `Dòng tổng ở hàng ${t.hang} không khớp với tổng các dòng thành phần theo bất kỳ cách ` +
          "gom nào máy thử. Cách gom của mỗi biểu một khác nên đây có thể là cách gom máy chưa biết.",
        viDu: lech.slice(0, 4),
        deXuat: "Xem lại dòng tổng bao gồm những mục nào; nếu bao cả mục lũy tích thì con số lệch là bình thường.",
      });
    }
  }

  // ---------------------------------------------------------------- BB05
  // Số âm trong cột số liệu.
  const am = [];
  for (const c of cotSo) {
    for (const m of mucDong) {
      const v = so(m.i, c);
      if (v && v.so < 0) am.push(`dòng ${m.hang}, “${tenCot(c)}”: ${v.so}`);
    }
  }
  if (am.length) {
    phat(ds, {
      ma: "BB05",
      mucDo: MUC.CAN_XAC_MINH,
      cot: "",
      chiSoCot: -1,
      soDong: am.length,
      moTa:
        `Có ${am.length} ô mang số âm. Biểu báo cáo đếm số người, số cơ sở hay số tiền thì ` +
        "không có giá trị âm; nếu đây là cột chênh lệch thì bỏ qua.",
      viDu: am.slice(0, 5),
      deXuat: "Kiểm tra lại ô ghi âm; thường là do gõ dấu trừ hoặc do công thức trừ ra số âm.",
    });
  }

  // ---------------------------------------------------------------- BB06
  // Số ghi dưới dạng chuỗi. Excel không cộng được ô chuỗi, mà hàm SUM lại lặng
  // lẽ bỏ qua chứ không báo lỗi, nên dòng tổng ra thiếu mà trông như đã xong.
  for (const c of cotSo) {
    const chuoi = [];
    for (const m of mucDong) {
      const v = bang.dong[m.i][c];
      if (typeof v === "string" && docSoBieu(v)) chuoi.push(`dòng ${m.hang}: “${v.trim()}”`);
    }
    if (chuoi.length) {
      phat(ds, {
        ma: "BB06",
        mucDo: MUC.CHAC_CHAN,
        cot: tenCot(c),
        chiSoCot: c,
        soDong: chuoi.length,
        moTa:
          `Cột “${tenCot(c)}” có ${chuoi.length} ô ghi số dưới dạng chuỗi. Hàm SUM bỏ qua ô ` +
          "chuỗi mà không báo lỗi, nên dòng tổng sẽ thiếu trong khi bảng trông như đã xong.",
        viDu: chuoi.slice(0, 5),
        deXuat: "Đổi các ô này thành số. Trên Excel: chọn cột, Data > Text to Columns > Finish.",
        suaDuoc: true,
      });
    }
  }

  // ---------------------------------------------------------------- BB07
  // Ô trống lẫn ô ghi 0. Trên biểu báo cáo hai cách ghi này mang hai nghĩa khác
  // nhau: 0 là "có rà soát và không có ca", trống là "chưa thu thập được". Người
  // đọc biểu không phân biệt được nếu trong cùng một cột dùng cả hai.
  for (const c of cotSo) {
    let soTrong = 0;
    let soKhong = 0;
    for (const m of mucDong) {
      if (m.laMa || m.laTong) continue;
      const v = bang.dong[m.i][c];
      if (rong(v)) soTrong++;
      else {
        const n = docSoBieu(v);
        if (n && n.so === 0) soKhong++;
      }
    }
    if (soTrong > 0 && soKhong > 0) {
      phat(ds, {
        ma: "BB07",
        mucDo: MUC.GHI_NHAN,
        cot: tenCot(c),
        chiSoCot: c,
        soDong: soTrong,
        moTa:
          `Cột “${tenCot(c)}” dùng cả ô trống (${soTrong} ô) và số 0 (${soKhong} ô). Trên biểu ` +
          "báo cáo, số 0 nghĩa là đã rà soát và không có, còn ô trống nghĩa là chưa thu thập " +
          "được — người đọc biểu không phân biệt được nếu trong cùng một cột dùng lẫn hai cách.",
        deXuat: "Thống nhất một cách ghi cho cả cột, và nêu ở phần ghi chú biểu nghĩa của ô trống.",
      });
    }
  }

  // ---------------------------------------------------------------- BB08
  // Dòng có nhãn nhưng chưa điền số nào.
  const chuaDien = [];
  for (const m of mucDong) {
    if (m.laMa || !m.nhan) continue;
    let co = false;
    for (const c of cotSo) if (so(m.i, c)) co = true;
    if (!co) chuaDien.push(`dòng ${m.hang}: ${m.nhan.slice(0, 48)}`);
  }
  if (chuaDien.length) {
    phat(ds, {
      ma: "BB08",
      mucDo: MUC.CAN_XAC_MINH,
      cot: "",
      chiSoCot: -1,
      soDong: chuaDien.length,
      moTa:
        `Có ${chuaDien.length} dòng có nhãn chỉ tiêu nhưng chưa điền số nào. Trên biểu định kỳ, ` +
        "dòng bỏ trống và dòng ghi 0 được hiểu khác nhau.",
      viDu: chuaDien.slice(0, 5),
      deXuat: "Điền 0 cho chỉ tiêu đã rà soát và không có số, để trống chỉ khi thật chưa thu thập được.",
    });
  }

  return ds;
}

function khoaMa(m) {
  return `${m.phan || ""}|${m.ma}`;
}

function khoaMaCha(m) {
  const p = m.ma.split(".");
  p.pop();
  return `${m.phan || ""}|${p.join(".")}`;
}

function gan(a, b) {
  return Math.abs(a - b) < 1e-6;
}

/**
 * Các phạm vi thành phần hợp lý của một dòng tổng, xếp từ hẹp đến rộng.
 * Trả về [{ten, dong:[muc]}].
 */
function phamViThanhPhan(mucDong, dongTong) {
  const truoc = mucDong.filter((m) => m.i < dongTong.i && !m.laTong);
  if (!truoc.length) return [];
  const pham = [];

  // Phạm vi 1 — các mục cấp một của phần La Mã ngay trên dòng tổng.
  let batDau = 0;
  for (let k = truoc.length - 1; k >= 0; k--) {
    if (truoc[k].laMa) {
      batDau = k + 1;
      break;
    }
  }
  const phanCuoi = truoc.slice(batDau).filter((m) => m.ma && !m.ma.includes("."));
  if (phanCuoi.length) pham.push({ ten: "các mục của phần cuối", dong: phanCuoi });

  // Phạm vi 2 — toàn bộ mục cấp một của biểu.
  const capMot = truoc.filter((m) => m.ma && !m.ma.includes("."));
  if (capMot.length && capMot.length !== phanCuoi.length) {
    pham.push({ ten: "toàn bộ mục cấp một", dong: capMot });
  }

  // Phạm vi 3 — các dòng La Mã, nếu chính chúng mang số.
  const laMa = truoc.filter((m) => m.laMa);
  if (laMa.length) pham.push({ ten: "các phần La Mã", dong: laMa });

  return pham;
}
