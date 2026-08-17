/**
 * Đọc tệp .xlsx thành vùng ô thô, không phụ thuộc thư viện ngoài trừ fflate để
 * giải nén. Chạy được cả trong trình duyệt lẫn trong Node, nên bộ thử đo được
 * chính đoạn mã mà người dùng chạy.
 *
 * Ba chỗ dễ sai, đều đã xử lý ở đây:
 *   - Ô ngày trong xlsx là MỘT CON SỐ. Chỉ định dạng ô mới cho biết đó là ngày.
 *     Không đọc bảng định dạng thì mọi ngày biến thành dãy số năm chữ số.
 *   - Ô rỗng không được ghi ra tệp. Phải đọc toạ độ A1 của từng ô để đặt đúng
 *     cột, nếu không thì cả hàng bị dồn sang trái.
 *   - Chuỗi nằm trong bảng dùng chung, ô chỉ giữ chỉ số. Bỏ qua bảng này thì
 *     mọi ô chữ ra một con số.
 */

import { chuoiTuByte, moZip } from "./giai-nen.js";

/* Định dạng ngày dựng sẵn của Excel. */
const DANG_NGAY_SAN = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47]);
const MOC = Date.UTC(1899, 11, 30);

function goEntity(s) {
  if (s.indexOf("&") < 0) return s;
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");
}

/** Toạ độ kiểu "AB12" → chỉ số cột bắt đầu từ 0. */
export function cotTuToaDo(toaDo) {
  let n = 0;
  for (let i = 0; i < toaDo.length; i++) {
    const m = toaDo.charCodeAt(i);
    if (m < 65 || m > 90) break;
    n = n * 26 + (m - 64);
  }
  return n - 1;
}

function docBangChuoi(xml) {
  if (!xml) return [];
  const ra = [];
  const re = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const than = m[1] || "";
    let s = "";
    const rt = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
    let k;
    while ((k = rt.exec(than)) !== null) s += goEntity(k[1]);
    ra.push(s);
  }
  return ra;
}

/** Trả về mảng: chỉ số kiểu ô → có phải định dạng ngày không. */
function docKieuNgay(xml) {
  if (!xml) return [];
  const tuyChinh = new Map();
  const reFmt = /<numFmt\b[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g;
  let m;
  while ((m = reFmt.exec(xml)) !== null) {
    const ma = goEntity(m[2]);
    // Bỏ phần trong ngoặc kép rồi mới tìm ký tự ngày, để "y" trong một chuỗi
    // chữ không biến định dạng tiền tệ thành định dạng ngày.
    const sach = ma.replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "");
    tuyChinh.set(+m[1], /[ymdhs]/i.test(sach));
  }

  const khoiXfs = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml);
  if (!khoiXfs) return [];
  const ra = [];
  const reXf = /<xf\b[^>]*>|<xf\b[^>]*\/>/g;
  let x;
  while ((x = reXf.exec(khoiXfs[1])) !== null) {
    const id = /numFmtId="(\d+)"/.exec(x[0]);
    const n = id ? +id[1] : 0;
    ra.push(DANG_NGAY_SAN.has(n) || tuyChinh.get(n) === true);
  }
  return ra;
}

function docTrangTinh(xml, chuoi, kieuNgay) {
  const hang = [];
  const reHang = /<row\b([^>]*)>([\s\S]*?)<\/row>|<row\b[^>]*\/>/g;
  let mh;
  while ((mh = reHang.exec(xml)) !== null) {
    const thuoc = mh[1] || "";
    const than = mh[2] || "";
    const sr = /\br="(\d+)"/.exec(thuoc);
    const chiSoHang = sr ? +sr[1] - 1 : hang.length;

    const o = [];
    const reO = /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g;
    let mc;
    let tiep = 0;
    while ((mc = reO.exec(than)) !== null) {
      const th = mc[1] || mc[3] || "";
      const noi = mc[2] || "";
      const st = /\br="([A-Z]+\d+)"/.exec(th);
      const c = st ? cotTuToaDo(st[1]) : tiep;
      tiep = c + 1;

      const kieu = (/\bt="([^"]+)"/.exec(th) || [])[1] || "n";
      const sIdx = (/\bs="(\d+)"/.exec(th) || [])[1];

      let gt = "";
      if (kieu === "inlineStr") {
        let s = "";
        const rt = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
        let k;
        while ((k = rt.exec(noi)) !== null) s += goEntity(k[1]);
        gt = s;
      } else {
        const mv = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(noi);
        const v = mv ? goEntity(mv[1]) : "";
        if (v === "") gt = "";
        else if (kieu === "s") gt = chuoi[+v] == null ? "" : chuoi[+v];
        else if (kieu === "str" || kieu === "e") gt = v;
        else if (kieu === "b") gt = v === "1";
        else {
          const so = Number(v);
          if (Number.isFinite(so) && sIdx != null && kieuNgay[+sIdx] && so > 0) {
            gt = new Date(MOC + Math.round(so) * 86400000);
          } else {
            gt = Number.isFinite(so) ? so : v;
          }
        }
      }
      o[c] = gt;
    }

    for (let i = 0; i < o.length; i++) if (o[i] === undefined) o[i] = "";
    hang[chiSoHang] = o;
  }

  for (let i = 0; i < hang.length; i++) if (!hang[i]) hang[i] = [];
  return hang;
}

/**
 * Đọc toàn bộ sổ tính.
 * @param {Uint8Array} duLieu nội dung tệp .xlsx
 * @returns {{ten:string, hang:Array}[]} danh sách trang tính
 */
export async function docXlsx(duLieu) {
  const canDoc = (ten) =>
    ten === "xl/workbook.xml" ||
    ten === "xl/_rels/workbook.xml.rels" ||
    ten === "xl/sharedStrings.xml" ||
    ten === "xl/styles.xml" ||
    ten.startsWith("xl/worksheets/");
  const tep = await moZip(duLieu, canDoc);
  const lay = (ten) => (tep[ten] ? chuoiTuByte(tep[ten]) : "");

  const chuoi = docBangChuoi(lay("xl/sharedStrings.xml"));
  const kieuNgay = docKieuNgay(lay("xl/styles.xml"));

  const rels = lay("xl/_rels/workbook.xml.rels");
  const banDo = new Map();
  const reRel = /<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  let mr;
  while ((mr = reRel.exec(rels)) !== null) {
    let t = mr[2].replace(/^\/?xl\//, "").replace(/^\.\//, "");
    banDo.set(mr[1], `xl/${t}`);
  }

  const wb = lay("xl/workbook.xml");
  const ra = [];
  const reSheet = /<sheet\b([^>]*)\/?>/g;
  let ms;
  let stt = 0;
  while ((ms = reSheet.exec(wb)) !== null) {
    stt++;
    const ten = goEntity((/\bname="([^"]*)"/.exec(ms[1]) || [])[1] || `Trang ${stt}`);
    const rid = (/\br:id="([^"]+)"/.exec(ms[1]) || [])[1];
    const duong = (rid && banDo.get(rid)) || `xl/worksheets/sheet${stt}.xml`;
    const xml = lay(duong);
    if (!xml) continue;
    ra.push({ ten, hang: docTrangTinh(xml, chuoi, kieuNgay) });
  }
  return ra;
}
