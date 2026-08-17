/** Khung chạy thử tối giản. Không phụ thuộc thư viện ngoài. */

const ds = [];
let nhom = "";

export function nhomCa(ten) {
  nhom = ten;
}

export function ca(ten, ham) {
  ds.push({ nhom, ten, ham });
}

export function bang(thuc, mong, ghiChu = "") {
  const a = JSON.stringify(thuc);
  const b = JSON.stringify(mong);
  if (a !== b) throw new Error(`${ghiChu}\n   nhận:  ${a}\n   mong:  ${b}`);
}

export function dung(dieuKien, ghiChu = "") {
  if (!dieuKien) throw new Error(ghiChu || "điều kiện sai");
}

export function sai(dieuKien, ghiChu = "") {
  if (dieuKien) throw new Error(ghiChu || "điều kiện lẽ ra phải sai");
}

export async function chayTatCa() {
  let dat = 0;
  const truot = [];
  let nhomTruoc = "";
  for (const c of ds) {
    if (c.nhom !== nhomTruoc) {
      process.stdout.write(`\n── ${c.nhom}\n`);
      nhomTruoc = c.nhom;
    }
    try {
      await c.ham();
      dat++;
      process.stdout.write(`   ĐẠT   ${c.ten}\n`);
    } catch (e) {
      truot.push({ ...c, loi: e });
      process.stdout.write(`   TRƯỢT ${c.ten}\n          ${e.message}\n`);
    }
  }
  process.stdout.write(`\n${"═".repeat(60)}\n`);
  process.stdout.write(`Tổng ${ds.length} ca — đạt ${dat}, trượt ${truot.length}\n`);
  return truot.length === 0;
}
