/**
 * Đọc tệp zip và giải nén, KHÔNG dùng thư viện ngoài.
 *
 * Bộ giải nén lấy từ chính nền tảng: trình duyệt có DecompressionStream, Node có
 * mô-đun zlib dựng sẵn. Nhờ vậy kho không phải mang theo thư viện của bên thứ
 * ba, mà bộ thử chạy trong Node vẫn đo đúng đoạn mã người dùng chạy.
 */

const KY_HIEU_CUOI = 0x06054b50;
const KY_HIEU_MUC = 0x02014b50;

function u16(d, i) {
  return d[i] | (d[i + 1] << 8);
}
function u32(d, i) {
  return (d[i] | (d[i + 1] << 8) | (d[i + 2] << 16) | (d[i + 3] << 24)) >>> 0;
}

/** Giải nén một khối deflate thô. */
export async function xaDeflate(khoi) {
  if (typeof DecompressionStream === "function") {
    const luong = new Blob([khoi]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(luong).arrayBuffer());
  }
  const zlib = await import("node:zlib");
  return new Uint8Array(zlib.inflateRawSync(Buffer.from(khoi)));
}

/**
 * Mở một tệp zip thành bản đồ tên tệp → nội dung.
 * Chỉ giải nén những tệp mà hàm `can` trả về true, để không tốn công với ảnh và
 * các phần không dùng đến của sổ tính.
 */
export async function moZip(duLieu, can = () => true) {
  const d = duLieu instanceof Uint8Array ? duLieu : new Uint8Array(duLieu);
  let cuoi = -1;
  const somNhat = Math.max(0, d.length - 65557);
  for (let i = d.length - 22; i >= somNhat; i--) {
    if (u32(d, i) === KY_HIEU_CUOI) {
      cuoi = i;
      break;
    }
  }
  if (cuoi < 0) throw new Error("Tệp không phải định dạng zip hợp lệ (không tìm thấy mục lục).");

  const soMuc = u16(d, cuoi + 10);
  let vt = u32(d, cuoi + 16);
  if (vt === 0xffffffff) {
    throw new Error("Tệp dùng định dạng zip64, bản này chưa đọc được. Hãy lưu lại bằng Excel.");
  }

  const giaiMa = new TextDecoder("utf-8");
  const ra = {};
  for (let k = 0; k < soMuc; k++) {
    if (u32(d, vt) !== KY_HIEU_MUC) break;
    const pp = u16(d, vt + 10);
    const coNen = u32(d, vt + 20);
    const daiTen = u16(d, vt + 28);
    const daiThem = u16(d, vt + 30);
    const daiChu = u16(d, vt + 32);
    const viTriCuc = u32(d, vt + 42);
    const ten = giaiMa.decode(d.subarray(vt + 46, vt + 46 + daiTen));
    vt += 46 + daiTen + daiThem + daiChu;

    if (!can(ten)) continue;

    const daiTenCuc = u16(d, viTriCuc + 26);
    const daiThemCuc = u16(d, viTriCuc + 28);
    const batDau = viTriCuc + 30 + daiTenCuc + daiThemCuc;
    const khoi = d.subarray(batDau, batDau + coNen);
    ra[ten] = pp === 0 ? khoi.slice() : await xaDeflate(khoi);
  }
  return ra;
}

export function chuoiTuByte(u8) {
  return new TextDecoder("utf-8").decode(u8);
}
