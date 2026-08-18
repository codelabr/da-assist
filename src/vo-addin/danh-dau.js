/**
 * Chọn ô và tô màu qua Office.js.
 *
 * RANH GIỚI QUAN TRỌNG NHẤT CỦA TỆP NÀY:
 *
 *   chonVung()  chỉ DI CHUYỂN con trỏ trên trang gốc. Không sửa gì, không tô gì,
 *               nên tệp không thành "đã sửa" và người dùng không phải lưu.
 *   toVung()    chỉ tô trên trang MỚI do công cụ tạo ra. Không bao giờ nhận trang
 *               gốc làm đích.
 *
 * Vì sao không tô lên trang gốc dù chỉ tô định dạng: nó xoá mất màu người dùng đã
 * tự tô để đánh dấu việc của mình; nó làm tệp thành đã sửa buộc phải lưu; và
 * Ctrl+Z không lấy lại được, vì thay đổi do add-in gây ra không vào ngăn xếp hoàn
 * tác của Excel.
 */

import { gomVung } from "../tien-ich/vung.js";

/**
 * Chọn một ô hoặc một dòng trên trang tính, và cuộn tới.
 *
 * @param {object} Excel  đối tượng Excel của Office.js
 * @param {object} viTri  { tenTrang, hang, cot, caDong }
 *                        hang và cot là chỉ số 0-based trên trang tính
 */
export async function chonVung(Excel, { tenTrang, hang, cot, caDong = false }) {
  return Excel.run(async (ctx) => {
    const ws = tenTrang
      ? ctx.workbook.worksheets.getItem(tenTrang)
      : ctx.workbook.worksheets.getActiveWorksheet();

    // Kích hoạt trang trước, nếu không thì lệnh chọn không đưa người dùng tới nơi.
    ws.activate();

    let vung;
    if (caDong) {
      const dong = ws.getRangeByIndexes(hang, 0, 1, 1).getEntireRow();
      vung = dong;
    } else {
      vung = ws.getRangeByIndexes(hang, cot || 0, 1, 1);
    }
    vung.select();
    await ctx.sync();
    return true;
  });
}

/**
 * Tô màu các ô trên MỘT TRANG DO CÔNG CỤ TẠO RA.
 *
 * @param {object} Excel
 * @param {string} tenTrang tên trang đích — phải là trang do công cụ tạo
 * @param {Array}  dsO      [{hang, cot}] chỉ số 0-based trên trang tính
 * @param {object} tuyChon  { mau, toiDa, moiKhoi }
 * @returns {{soVung, soVungBo, soODaBo}}
 *
 * Trả về số vùng đã bỏ để người gọi CÓ THỂ NÓI RA. Cắt bớt trong im lặng thì bảng
 * thiếu mà trông như đủ.
 */
export async function toVung(Excel, tenTrang, dsO, tuyChon = {}) {
  const { mau = "#FFF3CD", toiDa = 2000, moiKhoi = 200 } = tuyChon;
  const gom = gomVung(dsO, { toiDa });
  if (!gom.vung.length) return { soVung: 0, soVungBo: 0, soODaBo: 0 };

  // Chia thành khối để mỗi lần sync không gánh quá nhiều lệnh.
  for (let i = 0; i < gom.vung.length; i += moiKhoi) {
    const khoi = gom.vung.slice(i, i + moiKhoi);
    await Excel.run(async (ctx) => {
      const ws = ctx.workbook.worksheets.getItem(tenTrang);
      for (const dc of khoi) {
        ws.getRange(dc).format.fill.color = mau;
      }
      await ctx.sync();
    });
  }

  return { soVung: gom.vung.length, soVungBo: gom.soVungBo, soODaBo: gom.soODaBo };
}
