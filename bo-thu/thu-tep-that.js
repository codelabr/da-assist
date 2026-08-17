/**
 * Chạy lõi trên một tệp .xlsx thật.
 *
 *   TEP_THU="C:\\đường\\dẫn\\tep.xlsx" node bo-thu/thu-tep-that.js
 *
 * Không có tệp thật nào nằm trong kho, nên phép thử này do người chạy tự trỏ
 * tới tệp của mình. Đây cũng là cách kiểm nhanh khi người dùng báo công cụ bỏ
 * sót hoặc báo nhầm: lấy đúng tệp của họ chạy lại, rồi biến ca đó thành một ca
 * mới trong bo-thu/chay.js.
 */

import fs from "node:fs";
import { docXlsx } from "../src/doc-tep/doc-xlsx.js";
import { raSoat, dungPhuLuc4 } from "../src/index.js";

const duong = process.env.TEP_THU;
if (!duong) {
  console.error("Chưa đặt biến TEP_THU trỏ tới tệp .xlsx cần thử.");
  process.exit(2);
}

const t0 = Date.now();
const trang = await docXlsx(new Uint8Array(fs.readFileSync(duong)));
console.log(`Đọc ${trang.length} trang tính trong ${((Date.now() - t0) / 1000).toFixed(2)} giây\n`);

for (const t of trang) {
  const kq = raSoat(t);
  console.log(`━━ ${t.ten} — ${kq.tomTat.soDong} dòng × ${kq.tomTat.soCot} cột`);
  console.log(`   hình dạng: ${kq.tomTat.hinhDang} (${kq.bang.lyDoHinhDang.join("; ")})`);
  console.log(`   ${kq.nhanDang.moTa}`);
  console.log(
    `   phát hiện: ${kq.tomTat.soChacChan} chắc chắn · ` +
      `${kq.tomTat.soCanXacMinh} cần xác minh · ${kq.tomTat.soGhiNhan} ghi nhận`
  );
  for (const c of kq.canhBaoLuong) console.log(`   ! ${c}`);
  for (const p of kq.phatHien) {
    if (p.mucDo === "ghi-nhan") continue;
    console.log(`   [${p.ma}] ${p.cot} (${p.soDong} dòng) — ${p.moTa}`);
  }

  if (kq.nhanDang.ketQua === "nhan-ra" && kq.nhanDang.hoSo.ma === "hivinfo-giam-sat-ca-benh") {
    const nam = Number(process.env.NAM_BAO_CAO || new Date().getUTCFullYear());
    const r = dungPhuLuc4(kq.bang, kq.nhanDang.theoVaiTro, { nam });
    console.log(`\n   ── Phụ lục 4 Thông tư 07, năm ${nam}`);
    for (const d of r.dong) {
      if (d.tieuDeMuc) {
        console.log(`   ${d.muc}. ${d.noiDung}`);
        continue;
      }
      const nhan = "     " + (d.muc ? `${d.muc}. ` : "   ") + d.noiDung;
      console.log(
        `${nhan.padEnd(68).slice(0, 68)} ${String(d.nam).padStart(6)} ${String(d.nu).padStart(6)} ${String(d.tong).padStart(7)}`
      );
    }
    for (const g of r.ghiChu) console.log(`   • ${g}`);
  }
  console.log("");
}
