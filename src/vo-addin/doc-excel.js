/**
 * Vỏ add-in — đọc bảng tính đang mở qua Office.js.
 *
 * Ba điều khác hẳn với đường đọc tệp, và cả ba đều dễ sai:
 *
 *   1. Ô ngày của Excel trả về là MỘT CON SỐ. Chỉ định dạng ô mới cho biết đó là
 *      ngày, nên phải đọc kèm numberFormat. Bỏ qua thì mọi ngày thành dãy số.
 *   2. Đọc một lần cả trăm nghìn ô thì treo giao diện Excel. Phải đọc theo khối
 *      và nhường quyền điều khiển giữa các khối.
 *   3. Vùng đã dùng KHÔNG bắt đầu từ ô A1. Người ta hay để trống vài dòng đầu.
 *      Phải lấy rowIndex và columnIndex chứ không giả định bằng 0.
 *
 * Hàm nhận `Excel` làm tham số thay vì dùng biến toàn cục, để bộ thử chạy được
 * với một bộ Excel giả mà không cần mở Excel thật.
 */

const MOC = Date.UTC(1899, 11, 30);

/** Định dạng ô có phải định dạng ngày không. */
export function dinhDangLaNgay(dd) {
  if (!dd || typeof dd !== "string") return false;
  if (dd === "General" || dd === "@") return false;
  // Bỏ phần trong ngoặc kép và trong ngoặc vuông trước khi tìm ký tự ngày, để
  // chữ "y" nằm trong một chuỗi văn bản không biến định dạng tiền tệ thành ngày.
  const sach = dd.replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "");
  return /[ymd]/i.test(sach);
}

export function tuSoThuTu(n) {
  return new Date(MOC + Math.round(n) * 86400000);
}

/**
 * Đọc trang tính đang mở thành vùng ô thô.
 *
 * @param {object} Excel        không gian tên Excel của Office.js
 * @param {object} tuyChon
 *   moiKhoi   số hàng đọc mỗi lượt
 *   tienTrinh hàm nhận (đãĐọc, tổngSố) để hiện thanh tiến trình
 * @returns {Promise<{ten:string, hang:Array}>}
 */
export async function docTrangHienTai(Excel, { moiKhoi = 2000, tienTrinh = null } = {}) {
  return Excel.run(async (ctx) => {
    const ws = ctx.workbook.worksheets.getActiveWorksheet();
    ws.load("name");
    const vung = ws.getUsedRange();
    vung.load(["rowIndex", "columnIndex", "rowCount", "columnCount"]);
    await ctx.sync();

    const hangDau = vung.rowIndex;
    const cotDau = vung.columnIndex;
    const soHang = vung.rowCount;
    const soCot = vung.columnCount;

    if (!soHang || !soCot) {
      return { ten: ws.name, hang: [] };
    }

    const hang = [];
    for (let r = 0; r < soHang; r += moiKhoi) {
      const cao = Math.min(moiKhoi, soHang - r);
      const khoi = ws.getRangeByIndexes(hangDau + r, cotDau, cao, soCot);
      khoi.load(["values", "numberFormat"]);
      await ctx.sync();

      const gt = khoi.values;
      const dd = khoi.numberFormat;
      for (let i = 0; i < gt.length; i++) {
        const o = new Array(soCot);
        for (let c = 0; c < soCot; c++) {
          const v = gt[i][c];
          if (v === null || v === undefined || v === "") {
            o[c] = "";
          } else if (typeof v === "number" && dinhDangLaNgay(dd[i] && dd[i][c])) {
            o[c] = tuSoThuTu(v);
          } else {
            o[c] = v;
          }
        }
        hang.push(o);
      }
      if (tienTrinh) tienTrinh(Math.min(r + cao, soHang), soHang);
    }

    return { ten: ws.name, hang };
  });
}

/** Tên các trang tính hiện có — dùng để đặt tên trang mới không trùng. */
export async function danhSachTrang(Excel) {
  return Excel.run(async (ctx) => {
    const ds = ctx.workbook.worksheets;
    ds.load("items/name");
    await ctx.sync();
    return ds.items.map((x) => x.name);
  });
}
