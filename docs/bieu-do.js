/**
 * Vẽ biểu đồ bằng SVG thuần, không thư viện.
 *
 * Ba loại đủ cho mọi phân tích hiện có: đường (xu hướng theo năm), cột (so sánh
 * giữa các nhóm), cột chồng (cơ cấu trong từng năm).
 *
 * Nhãn trục ngang tự thưa ra khi có quá nhiều mốc — chồng chữ lên nhau thì thà
 * bỏ bớt còn hơn.
 */

const MAU = ["#7fb3ff", "#56d364", "#e3b341", "#ff7b72", "#c297ff", "#5fd0c5", "#ff9d5c"];

function thoat(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function nhanSo(n) {
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("vi-VN");
}

/** Chọn mốc trục dọc tròn trịa. */
function mocTruc(max) {
  if (max <= 0) return [0, 1];
  const buoc = Math.pow(10, Math.floor(Math.log10(max)));
  for (const k of [1, 2, 2.5, 5, 10]) {
    const b = buoc * k;
    if (max / b <= 5) {
      const ds = [];
      for (let v = 0; v <= max + b / 2; v += b) ds.push(Math.round(v * 1000) / 1000);
      return ds;
    }
  }
  return [0, max];
}

/**
 * @param {object} spec { loai, nhan, chuoi:[{ten,gt}] }
 * @param {object} tuyChon { rong, cao, mauNen, mauChu, mauMo, mauVien }
 */
export function veBieuDo(spec, tuyChon = {}) {
  if (!spec || !spec.chuoi || !spec.chuoi.length || !spec.nhan || !spec.nhan.length) return "";
  const W = tuyChon.rong || 720;
  const H = tuyChon.cao || 260;
  const chu = tuyChon.mauChu || "#e6ebf2";
  const mo = tuyChon.mauMo || "#9aa7b8";
  const vien = tuyChon.mauVien || "#2f3947";

  const coChuThich = spec.chuoi.length > 1;
  const leTren = 12;
  const leDuoi = 34;
  const leTrai = 52;
  const lePhai = 10;
  const caoChuThich = coChuThich ? 22 : 0;
  const vungCao = H - leTren - leDuoi - caoChuThich;
  const vungRong = W - leTrai - lePhai;

  const chong = spec.loai === "cot-chong";
  const soMoc = spec.nhan.length;
  const gtTai = (k) =>
    chong
      ? spec.chuoi.reduce((t, c) => t + (Number(c.gt[k]) || 0), 0)
      : Math.max(...spec.chuoi.map((c) => Number(c.gt[k]) || 0));
  let max = 0;
  for (let k = 0; k < soMoc; k++) max = Math.max(max, gtTai(k));
  const moc = mocTruc(max);
  const dinh = moc[moc.length - 1] || 1;
  const y = (v) => leTren + vungCao - (v / dinh) * vungCao;

  const p = [];
  // Lưới ngang và nhãn trục dọc
  for (const m of moc) {
    p.push(`<line x1="${leTrai}" y1="${y(m)}" x2="${W - lePhai}" y2="${y(m)}"
      stroke="${vien}" stroke-width="1"/>`);
    p.push(`<text x="${leTrai - 7}" y="${y(m) + 4}" fill="${mo}" font-size="11"
      text-anchor="end">${nhanSo(m)}</text>`);
  }

  const buocX = vungRong / soMoc;
  // Nhãn trục ngang, thưa ra nếu chật
  const buocNhan = Math.max(1, Math.ceil((soMoc * 46) / vungRong));
  for (let k = 0; k < soMoc; k++) {
    if (k % buocNhan !== 0) continue;
    const x = leTrai + buocX * (k + 0.5);
    p.push(`<text x="${x}" y="${H - caoChuThich - 14}" fill="${mo}" font-size="11"
      text-anchor="middle">${thoat(String(spec.nhan[k]).slice(0, 12))}</text>`);
  }

  if (spec.loai === "duong") {
    spec.chuoi.forEach((c, ci) => {
      const diem = c.gt.map((v, k) => `${leTrai + buocX * (k + 0.5)},${y(Number(v) || 0)}`);
      p.push(`<polyline points="${diem.join(" ")}" fill="none"
        stroke="${MAU[ci % MAU.length]}" stroke-width="2.5"
        stroke-linejoin="round" stroke-linecap="round"/>`);
      c.gt.forEach((v, k) => {
        p.push(`<circle cx="${leTrai + buocX * (k + 0.5)}" cy="${y(Number(v) || 0)}" r="3"
          fill="${MAU[ci % MAU.length]}"/>`);
      });
    });
  } else {
    const soChuoi = chong ? 1 : spec.chuoi.length;
    const rongCot = Math.max(3, (buocX * 0.72) / soChuoi);
    for (let k = 0; k < soMoc; k++) {
      if (chong) {
        let day = 0;
        spec.chuoi.forEach((c, ci) => {
          const v = Number(c.gt[k]) || 0;
          if (v <= 0) return;
          const cao = (v / dinh) * vungCao;
          const yy = y(day + v);
          p.push(`<rect x="${leTrai + buocX * k + buocX * 0.14}" y="${yy}"
            width="${buocX * 0.72}" height="${Math.max(0, cao)}"
            fill="${MAU[ci % MAU.length]}"/>`);
          day += v;
        });
      } else {
        spec.chuoi.forEach((c, ci) => {
          const v = Number(c.gt[k]) || 0;
          const cao = (v / dinh) * vungCao;
          const x = leTrai + buocX * k + buocX * 0.14 + rongCot * ci;
          p.push(`<rect x="${x}" y="${y(v)}" width="${rongCot - 1}"
            height="${Math.max(0, cao)}" fill="${MAU[ci % MAU.length]}"/>`);
        });
      }
    }
  }

  if (coChuThich) {
    let x = leTrai;
    spec.chuoi.forEach((c, ci) => {
      const nhan = String(c.ten).slice(0, 22);
      p.push(`<rect x="${x}" y="${H - 14}" width="10" height="10" rx="2"
        fill="${MAU[ci % MAU.length]}"/>`);
      p.push(`<text x="${x + 14}" y="${H - 5}" fill="${chu}" font-size="11">${thoat(nhan)}</text>`);
      x += 24 + nhan.length * 6.2;
    });
  }

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}"
    xmlns="http://www.w3.org/2000/svg" role="img">${p.join("")}</svg>`;
}

/** Định dạng một ô theo gợi ý của bảng. */
export function veO(v, dang) {
  if (v === null || v === undefined || v === "") return "";
  // Cột nhãn phải giữ nguyên mặt chữ. Nếu không thì năm 2001 hiện thành "2.001"
  // vì dấu phân cách hàng nghìn được áp lên một con số vốn không phải số đếm.
  if (dang === "chu") return String(v);
  if (dang === "ty-le" && typeof v === "number") {
    return (v * 100).toFixed(1).replace(".", ",") + "%";
  }
  if (dang === "so-le" && typeof v === "number") {
    return v.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  }
  if (typeof v === "number") return v.toLocaleString("vi-VN");
  return String(v);
}
