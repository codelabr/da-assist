/**
 * Gom các ô rời rạc thành vùng liền nhau, và đổi sang địa chỉ kiểu A1.
 *
 * Vì sao cần: tô màu từng ô một qua Office.js sẽ treo task pane. Trên bản xuất
 * thật, một phát hiện có thể chạm 2.000 ô trong cùng một cột — tô theo vùng thì
 * đó là MỘT lệnh, tô từng ô là hai nghìn lệnh.
 *
 * Cách gom: theo từng cột, gộp các dòng liên tiếp thành một dải dọc. Chọn cách này
 * vì phần lớn phát hiện chạm trọn một cột hoặc một mảng dòng liền nhau, nên dải dọc
 * gom được gần hết. Gom thành hình chữ nhật hai chiều thì tối ưu hơn chút nhưng
 * phức tạp hơn nhiều, mà lợi ích không đáng.
 */

/** Đổi chỉ số cột 0-based sang chữ cái cột của Excel: 0 → A, 26 → AA. */
export function chuCot(c) {
  let s = "";
  let n = c;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

/** Địa chỉ A1 của một vùng, nhận chỉ số 0-based trên trang tính. */
export function diaChi(hangDau, cotDau, hangCuoi, cotCuoi) {
  const a = `${chuCot(cotDau)}${hangDau + 1}`;
  if (hangDau === hangCuoi && cotDau === cotCuoi) return a;
  return `${a}:${chuCot(cotCuoi)}${hangCuoi + 1}`;
}

/**
 * Gom danh sách ô thành các dải dọc liền nhau.
 *
 * @param {Array} dsO  [{hang, cot}] — chỉ số 0-based TRÊN TRANG TÍNH
 * @param {object} tuyChon { toiDa } số vùng tối đa
 * @returns {{vung: string[], soVungBo: number, soODaBo: number}}
 *
 * Vượt ngưỡng thì giữ những vùng LỚN NHẤT và trả về số vùng đã bỏ. Không bao giờ
 * cắt bớt trong im lặng — bảng thiếu mà trông như đủ thì tệ hơn bảng nói thẳng là
 * mình thiếu.
 */
export function gomVung(dsO, { toiDa = 2000 } = {}) {
  const theoCot = new Map();
  for (const o of dsO) {
    if (!theoCot.has(o.cot)) theoCot.set(o.cot, []);
    theoCot.get(o.cot).push(o.hang);
  }

  const dai = [];
  for (const [cot, dsHang] of theoCot) {
    const h = [...new Set(dsHang)].sort((a, b) => a - b);
    let dau = h[0];
    let truoc = h[0];
    for (let i = 1; i <= h.length; i++) {
      const nay = h[i];
      if (nay === truoc + 1) {
        truoc = nay;
        continue;
      }
      dai.push({ cot, dau, cuoi: truoc, soO: truoc - dau + 1 });
      dau = nay;
      truoc = nay;
    }
  }

  if (dai.length <= toiDa) {
    return {
      vung: dai.map((d) => diaChi(d.dau, d.cot, d.cuoi, d.cot)),
      soVungBo: 0,
      soODaBo: 0,
    };
  }

  dai.sort((a, b) => b.soO - a.soO);
  const giu = dai.slice(0, toiDa);
  const bo = dai.slice(toiDa);
  return {
    vung: giu.map((d) => diaChi(d.dau, d.cot, d.cuoi, d.cot)),
    soVungBo: bo.length,
    soODaBo: bo.reduce((t, d) => t + d.soO, 0),
  };
}
