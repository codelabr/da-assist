/**
 * Vỏ add-in — ghi kết quả sang TRANG TÍNH MỚI trong chính sổ tính đang mở.
 *
 * Ràng buộc số 3 của phần làm sạch vẫn giữ nguyên ở đây: KHÔNG BAO GIỜ ghi đè
 * dữ liệu gốc. Add-in có quyền sửa bảng tính, nên chỗ này là chỗ nguy hiểm nhất
 * của cả công cụ — nó chỉ được phép TẠO trang mới, không được chạm vào trang cũ.
 *
 * Tên trang mới luôn được đặt sao cho không trùng trang nào đang có. Trùng tên
 * thì Office ném lỗi và người dùng mất hết kết quả vừa dựng.
 */

const MOC = Date.UTC(1899, 11, 30);
const DANG_NGAY = "dd/mm/yyyy";

function soThuTuNgay(d) {
  return Math.round((d.getTime() - MOC) / 86400000);
}

/** Excel giới hạn tên trang 31 ký tự và cấm : \ / ? * [ ] */
export function tenTrangHopLe(ten, daCo = []) {
  let s = String(ten || "Trang moi").replace(/[:\\/?*[\]]/g, "-").slice(0, 31).trim();
  if (!s) s = "Trang moi";
  const co = new Set(daCo.map((x) => String(x).toLowerCase()));
  if (!co.has(s.toLowerCase())) return s;
  for (let i = 2; i < 200; i++) {
    const hau = ` (${i})`;
    const t = s.slice(0, 31 - hau.length) + hau;
    if (!co.has(t.toLowerCase())) return t;
  }
  return s.slice(0, 26) + " " + String(Math.floor(performance.now() % 10000));
}

/**
 * Ghi một bảng sang trang tính mới.
 *
 * @param {object} Excel
 * @param {{ten:string, hang:Array}} trang
 * @param {object} tuyChon  moiKhoi, tienTrinh, kichHoat
 * @returns {Promise<string>} tên trang đã tạo
 */
export async function ghiTrangMoi(Excel, trang, { moiKhoi = 2000, tienTrinh = null, kichHoat = true } = {}) {
  return Excel.run(async (ctx) => {
    const dsTrang = ctx.workbook.worksheets;
    dsTrang.load("items/name");
    await ctx.sync();

    const ten = tenTrangHopLe(trang.ten, dsTrang.items.map((x) => x.name));
    const ws = dsTrang.add(ten);
    await ctx.sync();

    const hang = trang.hang || [];
    if (!hang.length) {
      if (kichHoat) ws.activate();
      await ctx.sync();
      return ten;
    }

    let soCot = 0;
    for (const h of hang) if (h.length > soCot) soCot = h.length;
    if (!soCot) soCot = 1;

    for (let r = 0; r < hang.length; r += moiKhoi) {
      const cao = Math.min(moiKhoi, hang.length - r);
      const gt = new Array(cao);
      const dd = new Array(cao);
      let coNgay = false;

      for (let i = 0; i < cao; i++) {
        const nguon = hang[r + i] || [];
        const dongGt = new Array(soCot);
        const dongDd = new Array(soCot);
        for (let c = 0; c < soCot; c++) {
          const v = nguon[c];
          if (v instanceof Date && !Number.isNaN(v.getTime())) {
            dongGt[c] = soThuTuNgay(v);
            dongDd[c] = DANG_NGAY;
            coNgay = true;
          } else if (v === null || v === undefined) {
            dongGt[c] = "";
            dongDd[c] = "General";
          } else if (typeof v === "number" || typeof v === "boolean" || typeof v === "string") {
            dongGt[c] = v;
            // Chuỗi dài toàn chữ số phải giữ nguyên dạng văn bản, nếu không Excel
            // đổi thành số và cắt mất số 0 đứng đầu của mã định danh.
            dongDd[c] = typeof v === "string" && /^\d{6,}$/.test(v) ? "@" : "General";
          } else {
            dongGt[c] = String(v);
            dongDd[c] = "General";
          }
        }
        gt[i] = dongGt;
        dd[i] = dongDd;
      }

      const vung = ws.getRangeByIndexes(r, 0, cao, soCot);
      vung.numberFormat = dd;
      vung.values = gt;
      await ctx.sync();
      if (tienTrinh) tienTrinh(Math.min(r + cao, hang.length), hang.length);
      if (!coNgay) { /* không có gì thêm phải làm */ }
    }

    if (kichHoat) ws.activate();
    await ctx.sync();
    return ten;
  });
}

/** Ghi nhiều trang một lượt; trả về danh sách tên đã tạo. */
export async function ghiNhieuTrang(Excel, dsTrang, tuyChon = {}) {
  const ten = [];
  for (let i = 0; i < dsTrang.length; i++) {
    ten.push(
      await ghiTrangMoi(Excel, dsTrang[i], { ...tuyChon, kichHoat: i === 0 })
    );
  }
  return ten;
}
