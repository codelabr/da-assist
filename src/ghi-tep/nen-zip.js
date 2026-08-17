/**
 * Đóng gói tệp zip, không dùng thư viện ngoài.
 *
 * Bộ nén lấy từ chính nền tảng như bên đọc: trình duyệt có CompressionStream,
 * Node có mô-đun zlib dựng sẵn.
 *
 * Excel KIỂM mã CRC của từng mục khi mở tệp. Ghi sai CRC thì Excel báo tệp hỏng
 * và đòi sửa chữa, nên phần này không được làm ẩu.
 */

const BANG_CRC = (() => {
  const b = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    b[n] = c >>> 0;
  }
  return b;
})();

export function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = BANG_CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function nenDeflate(khoi) {
  if (typeof CompressionStream === "function") {
    const luong = new Blob([khoi]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(luong).arrayBuffer());
  }
  const zlib = await import("node:zlib");
  return new Uint8Array(zlib.deflateRawSync(Buffer.from(khoi), { level: 6 }));
}

/**
 * Đóng gói một tập tệp thành zip.
 * @param {Array<{ten:string, noiDung:string|Uint8Array}>} muc
 */
export async function dongZip(muc) {
  const maHoa = new TextEncoder();
  const cuc = [];
  const mucLuc = [];
  let viTri = 0;

  const d16 = (a, n) => a.push(n & 255, (n >> 8) & 255);
  const d32 = (a, n) => a.push(n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255);

  for (const m of muc) {
    const thoc = typeof m.noiDung === "string" ? maHoa.encode(m.noiDung) : m.noiDung;
    const ten = maHoa.encode(m.ten);
    const ma = crc32(thoc);
    const nen = await nenDeflate(thoc);
    // Dữ liệu nén mà lớn hơn dữ liệu gốc thì lưu nguyên, đỡ phí.
    const dungNen = nen.length < thoc.length;
    const than = dungNen ? nen : thoc;
    const pp = dungNen ? 8 : 0;

    const dau = [];
    d32(dau, 0x04034b50);
    d16(dau, 20);
    d16(dau, 0);
    d16(dau, pp);
    d16(dau, 0);
    d16(dau, 0);
    d32(dau, ma);
    d32(dau, than.length);
    d32(dau, thoc.length);
    d16(dau, ten.length);
    d16(dau, 0);
    cuc.push(new Uint8Array(dau), ten, than);

    const ml = [];
    d32(ml, 0x02014b50);
    d16(ml, 20);
    d16(ml, 20);
    d16(ml, 0);
    d16(ml, pp);
    d16(ml, 0);
    d16(ml, 0);
    d32(ml, ma);
    d32(ml, than.length);
    d32(ml, thoc.length);
    d16(ml, ten.length);
    d16(ml, 0);
    d16(ml, 0);
    d16(ml, 0);
    d16(ml, 0);
    d32(ml, 0);
    d32(ml, viTri);
    mucLuc.push(new Uint8Array(ml), ten);

    viTri += dau.length + ten.length + than.length;
  }

  const batDauMucLuc = viTri;
  let coMucLuc = 0;
  for (const x of mucLuc) coMucLuc += x.length;

  const cuoi = [];
  d32(cuoi, 0x06054b50);
  d16(cuoi, 0);
  d16(cuoi, 0);
  d16(cuoi, muc.length);
  d16(cuoi, muc.length);
  d32(cuoi, coMucLuc);
  d32(cuoi, batDauMucLuc);
  d16(cuoi, 0);

  const phan = [...cuc, ...mucLuc, new Uint8Array(cuoi)];
  let tong = 0;
  for (const p of phan) tong += p.length;
  const ra = new Uint8Array(tong);
  let o = 0;
  for (const p of phan) {
    ra.set(p, o);
    o += p.length;
  }
  return ra;
}
