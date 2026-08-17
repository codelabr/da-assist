/**
 * Ghi tệp .xlsx, không dùng thư viện ngoài.
 *
 * Giữ tối thiểu những gì Excel cần: bảng kiểu ô để ngày hiện ra là ngày chứ
 * không phải một dãy số, và chuỗi ghi thẳng trong ô để khỏi phải dựng bảng chuỗi
 * dùng chung.
 *
 * Toạ độ cột phải ghi đúng: ô rỗng không được ghi ra, nên thiếu toạ độ thì cả
 * hàng dồn sang trái khi mở lại.
 */

import { dongZip } from "./nen-zip.js";

const MOC = Date.UTC(1899, 11, 30);

function thoatXml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c])
  );
}

/** Chỉ số cột 0 → "A", 25 → "Z", 26 → "AA". */
export function toaDoCot(n) {
  let s = "";
  n += 1;
  while (n > 0) {
    const d = (n - 1) % 26;
    s = String.fromCharCode(65 + d) + s;
    n = Math.floor((n - d) / 26);
  }
  return s;
}

function soThuTuNgay(d) {
  return Math.round((d.getTime() - MOC) / 86400000);
}

function veO(giaTri, hang, cot) {
  const td = `${toaDoCot(cot)}${hang + 1}`;
  if (giaTri == null || giaTri === "") return "";
  if (giaTri instanceof Date && !Number.isNaN(giaTri.getTime())) {
    return `<c r="${td}" s="1"><v>${soThuTuNgay(giaTri)}</v></c>`;
  }
  if (typeof giaTri === "number" && Number.isFinite(giaTri)) {
    return `<c r="${td}"><v>${giaTri}</v></c>`;
  }
  if (typeof giaTri === "boolean") {
    return `<c r="${td}" t="b"><v>${giaTri ? 1 : 0}</v></c>`;
  }
  return `<c r="${td}" t="inlineStr"><is><t xml:space="preserve">${thoatXml(giaTri)}</t></is></c>`;
}

function veTrang(hang) {
  const ds = [];
  for (let r = 0; r < hang.length; r++) {
    const o = hang[r] || [];
    const cai = [];
    for (let c = 0; c < o.length; c++) {
      const x = veO(o[c], r, c);
      if (x) cai.push(x);
    }
    ds.push(`<row r="${r + 1}">${cai.join("")}</row>`);
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${ds.join("")}</sheetData></worksheet>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
</styleSheet>`;

/**
 * Dựng nội dung tệp .xlsx.
 * @param {Array<{ten:string, hang:Array<Array>}>} trang
 * @returns {Promise<Uint8Array>}
 */
export async function ghiXlsx(trang) {
  if (!trang.length) throw new Error("Phải có ít nhất một trang tính.");

  const tenTrang = trang.map((t, i) => {
    // Excel cấm : \ / ? * [ ] trong tên trang tính và giới hạn 31 ký tự.
    const s = String(t.ten || `Trang ${i + 1}`).replace(/[:\\/?*[\]]/g, "-").slice(0, 31);
    return s || `Trang ${i + 1}`;
  });

  const muc = [
    {
      ten: "[Content_Types].xml",
      noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${trang.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      ten: "_rels/.rels",
      noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      ten: "xl/workbook.xml",
      noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${tenTrang.map((t, i) => `<sheet name="${thoatXml(t)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>
</workbook>`,
    },
    {
      ten: "xl/_rels/workbook.xml.rels",
      noiDung: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${trang.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}
<Relationship Id="rId${trang.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    { ten: "xl/styles.xml", noiDung: STYLES },
    ...trang.map((t, i) => ({
      ten: `xl/worksheets/sheet${i + 1}.xml`,
      noiDung: veTrang(t.hang),
    })),
  ];

  return dongZip(muc);
}
