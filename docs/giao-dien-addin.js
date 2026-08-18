import { raSoat, deXuatSua, apDung, trangNhatKy, MUC } from "../src/index.js";
import { hienKhoangTrang } from "../src/tien-ich/chuoi.js";
import { sinhCauHoi, VIEC } from "../src/phong-van/cau-hoi.js";
import { hoSoMoi, ghiTraLoi, quyetDinhTu } from "../src/phong-van/ho-so-don-vi.js";
import { docTrangHienTai } from "../src/vo-addin/doc-excel.js";
import { ghiNhieuTrang } from "../src/vo-addin/ghi-excel.js";
import { chonVung, toVung } from "../src/vo-addin/danh-dau.js";
import { dungBoTrang, nhomTuCap, oToMau } from "../src/xuat/bo-trang.js";

const than = document.getElementById("than");
const thanhBuoc = document.getElementById("thanh-buoc");

/**
 * Đối tượng Excel dùng trong cả tệp.
 *
 * Bình thường là Excel thật của Office.js. Trang xem thử `xem-thu-addin.html` đặt
 * sẵn một bộ Excel giả vào `window.__DA_EXCEL` trước khi nạp mô-đun này, để xem
 * được giao diện mà không cần mở Excel — dùng khi giảng bài, và cũng là cách tôi
 * nhìn được giao diện bằng mắt trước khi bàn giao.
 *
 * Bộ giả KHÔNG đi kèm bản phát hành: nó nằm ở trang xem thử riêng, còn tệp này chỉ
 * đọc biến ấy nếu có.
 */
const XL = () => (typeof window !== "undefined" && window.__DA_EXCEL) || Excel;
const laXemThu = () => !!(typeof window !== "undefined" && window.__DA_EXCEL);

/**
 * Hai màu tô trên trang Đã làm sạch.
 *
 * Lấy đúng cặp màu mà Excel dùng sẵn cho định dạng có điều kiện — Good và Neutral.
 * Cán bộ đã quen cặp này từ chính Excel, nên không phải học thêm quy ước nào; và cả
 * hai đều nhạt, chữ đen trên nền vẫn đọc rõ khi in trắng đen.
 *
 * Màu KHÔNG BAO GIỜ là tín hiệu duy nhất: mọi ô xanh đều có mặt ở trang Nhật ký,
 * mọi ô vàng đều có mặt ở trang Danh sách vấn đề, cả hai đều dưới dạng chữ.
 */
const MAU_XANH = "#C6EFCE"; // ô đã sửa, dòng giữ lại của nhóm trùng
const MAU_VANG = "#FFEB9C"; // ô còn vấn đề, chưa sửa

const BUOC = [
  { so: 1, ten: "Rà soát" },
  { so: 2, ten: "Chọn phép sửa" },
  { so: 3, ten: "Xem trước và ghi" },
];

let buoc = 1;
let kq = null;          // kết quả raSoat
let tenTrangGoc = "";
let deXuat = [];
let daChon = new Set();
let hoSo = null;
let ketQuaSua = null;
let cauHoiConLai = [];

/* ── Giao diện sáng hay tối theo Excel ─────────────────────────────── */

/**
 * Đọc màu nền thân của Office rồi tính độ sáng mà quyết, KHÔNG đọc tên giao diện.
 * Excel có bốn giao diện — Trắng, Nhiều màu, Xám đậm, Đen — và tên không nói được
 * độ sáng của thân task pane. Khi Office không cung cấp màu, lùi về thiết đặt của
 * hệ điều hành.
 */
function datGiaoDien() {
  let toi = null;
  try {
    const t = Office.context && Office.context.officeTheme;
    const nen = t && t.bodyBackgroundColor;
    if (nen) {
      const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(nen.trim());
      if (m) {
        const [r, g, b] = [1, 2, 3].map((k) => parseInt(m[k], 16) / 255);
        // Độ sáng cảm nhận: mắt người nhạy với lục hơn lam.
        toi = 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
      }
    }
  } catch (e) { toi = null; }
  if (toi === null) {
    toi = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.documentElement.dataset.giaoDien = toi ? "toi" : "sang";
}

/* ── Tiện ích ──────────────────────────────────────────────────────── */

const thoat = (s) => String(s == null ? "" : s)
  .replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const soVN = (n) => Number(n || 0).toLocaleString("vi-VN");

/**
 * Phơi khoảng trắng đáng ngờ rồi thoát HTML. Phần đánh dấu nằm ở hienKhoangTrang
 * trong src/tien-ich/chuoi.js để bộ thử đo được — nó từng gây một lỗi bố cục thật.
 */
function hienRo(s) {
  return thoat(hienKhoangTrang(s)).replace(/\n/g, "↵\n");
}

function veThanhBuoc() {
  thanhBuoc.innerHTML = BUOC.map((b) => {
    const lop = b.so === buoc ? "dang" : (b.so < buoc ? "xong" : "");
    return `<div class="buoc-o ${lop}"><span class="so">${b.so}</span>${thoat(b.ten)}</div>`;
  }).join("");
}

function ve(html) {
  than.innerHTML = html;
  veThanhBuoc();
}

function bao(s) {
  than.innerHTML = `<p class="giua dang-chay">${thoat(s)}</p>`;
}

/* ── Chờ Office ────────────────────────────────────────────────────── */

if (laXemThu()) {
  datGiaoDien();
  veBuoc1();
} else if (typeof Office === "undefined") {
  ve(`<div class="luu-y">Không nạp được thư viện Office. Add-in này chỉ chạy trong Excel.</div>`);
} else {
  Office.onReady((tin) => {
    datGiaoDien();
    if (!tin || tin.host !== Office.HostType.Excel) {
      ve(`<div class="luu-y">Add-in này chỉ chạy trong Excel.</div>`);
      return;
    }
    veBuoc1();
  });
}

/* ── Bước 1 · Rà soát ──────────────────────────────────────────────── */

function veBuoc1() {
  buoc = 1;
  if (!kq) {
    ve(`
      <div class="the">
        <h2>Bắt đầu</h2>
        <p class="mo" style="margin:0 0 10px">
          Mở trang tính cần rà soát rồi bấm nút dưới đây. Công cụ đọc vùng dữ liệu
          đang có, không sửa gì cả.</p>
        <div class="hang-nut"><button class="chinh" id="nut-doc">Rà soát trang tính</button></div>
      </div>`);
    document.getElementById("nut-doc").onclick = chayRaSoat;
    return;
  }
  veKetQuaRaSoat();
}

async function chayRaSoat() {
  bao("Đang đọc trang tính…");
  try {
    const t0 = performance.now();
    const vung = await docTrangHienTai(XL(), {
      tienTrinh: (n) => bao(`Đang đọc… ${soVN(n)} dòng`),
    });
    tenTrangGoc = vung.ten || "";
    kq = raSoat(vung);
    deXuat = [];
    daChon = new Set();
    ketQuaSua = null;
    hoSo = hoSoMoi(kq.bang);
    const giay = ((performance.now() - t0) / 1000).toFixed(2);
    veKetQuaRaSoat(giay);
  } catch (e) {
    ve(`<div class="luu-y loi">Không đọc được trang tính: ${thoat(e.message)}</div>
        <div class="hang-nut"><button id="thu-lai">Thử lại</button></div>`);
    document.getElementById("thu-lai").onclick = chayRaSoat;
  }
}

function veBao(p, choBam) {
  const dem = p.soDong ? `<span class="dem-dong">${soVN(p.soDong)} dòng</span>` : "";
  const viDu = (p.viDu && p.viDu.length)
    ? `<p class="vi-du">${hienRo(p.viDu.slice(0, 3).join("\n"))}</p>` : "";
  const deXuatHtml = p.deXuat ? `<p class="de-xuat">→ ${thoat(p.deXuat)}</p>` : "";
  const chiDan = choBam ? `<p class="chi-dan">Bấm để nhảy tới ô trên trang gốc.</p>` : "";
  return `<div class="bao ${p.mucDo}" data-cot="${p.chiSoCot == null ? -1 : p.chiSoCot}">
    <div class="dau">
      <span class="ma">${thoat(p.ma)}</span>
      <span class="cot">${thoat(p.cot || "")}</span>
      ${dem}
    </div>
    <p>${thoat(p.moTa)}</p>
    ${viDu}${deXuatHtml}${chiDan}
  </div>`;
}

function veKetQuaRaSoat(giay) {
  buoc = 1;
  const t = kq.tomTat;
  const laBieu = t.hinhDang === "bieu-tong-hop";
  const nhom = (muc, ten) => {
    const ds = kq.phatHien.filter((p) => p.mucDo === muc);
    if (!ds.length) return "";
    const choBam = muc !== MUC.GHI_NHAN;
    return `<div class="muc-tieu-de">${ten}<span class="dem">${ds.length}</span></div>` +
      ds.map((p) => veBao(p, choBam)).join("");
  };

  ve(`
    <div class="the">
      <h2>${thoat(tenTrangGoc)}</h2>
      <div class="luoi">
        <div class="so-lieu"><b>${soVN(t.soDong)}</b><small>dòng</small></div>
        <div class="so-lieu"><b>${soVN(t.soCot)}</b><small>cột</small></div>
        <div class="so-lieu"><b>${t.hangTieuDe}</b><small>dòng tiêu đề</small></div>
        ${giay ? `<div class="so-lieu"><b>${giay}s</b><small>đọc xong</small></div>` : ""}
      </div>
      <div class="luoi">
        <div class="so-lieu"><b>${t.soChacChan}</b><small>chắc chắn</small></div>
        <div class="so-lieu"><b>${t.soCanXacMinh}</b><small>cần xác minh</small></div>
        <div class="so-lieu"><b>${t.soGhiNhan}</b><small>ghi nhận</small></div>
      </div>
      ${kq.canhBaoLuong.map((c) => `<div class="luu-y">${thoat(c)}</div>`).join("")}
      <div class="hang-nut" style="margin-top:10px">
        <button id="nut-lai">Đọc lại</button>
        ${laBieu ? "" : `<button class="chinh" id="nut-tiep">Tiếp: chọn phép sửa</button>`}
      </div>
    </div>
    ${nhom(MUC.CHAC_CHAN, "Cần sửa — máy chắc chắn")}
    ${nhom(MUC.CAN_XAC_MINH, "Cần người xem lại")}
    ${nhom(MUC.GHI_NHAN, "Ghi nhận — không phải lỗi")}
  `);

  document.getElementById("nut-lai").onclick = chayRaSoat;
  const nutTiep = document.getElementById("nut-tiep");
  if (nutTiep) nutTiep.onclick = () => veBuoc2();

  // Bấm một phát hiện thì CHỌN ô trên trang gốc. Chỉ di chuyển con trỏ, không sửa gì.
  for (const el of than.querySelectorAll(".bao[data-cot]")) {
    const cot = Number(el.dataset.cot);
    if (cot < 0 || el.classList.contains("ghi-nhan")) continue;
    el.onclick = async () => {
      try {
        await chonVung(XL(), {
          tenTrang: tenTrangGoc,
          hang: kq.bang.chiSoHangTieuDe + 1,
          cot,
        });
      } catch (e) { /* chọn ô hỏng thì không làm hỏng cả giao diện */ }
    };
  }
}

/* ── Bước 2 · Chọn phép sửa ────────────────────────────────────────── */

function veBuoc2() {
  buoc = 2;
  const qd = quyetDinhTu(hoSo, kq.bang);
  deXuat = deXuatSua(kq.bang, kq.phatHien, qd);

  // Chỉ hỏi những câu phục vụ ĐÚNG VIỆC đang làm, và chỉ về CỘT mà phép sửa chạm
  // tới. Thiếu một trong hai bộ lọc là người dùng phải trả lời hai chục câu về
  // những cột chẳng liên quan, rồi bỏ giữa chừng.
  //
  // Việc suy từ chính các phép sửa được chào: có nhóm bỏ dòng trùng thì mới hỏi
  // câu về khoá nhận dạng.
  const cotLienQuan = new Set();
  for (const d of deXuat) {
    for (const t of d.thayDoi) cotLienQuan.add(t.cot);
    if (d.nhom === "S-TRUNG") for (let c = 0; c < kq.bang.soCot; c++) cotLienQuan.add(c);
  }
  const dsViec = [VIEC.SUA_DU_LIEU];
  if (deXuat.some((d) => d.nhom === "S-TRUNG")) dsViec.push(VIEC.GOP_TRUNG);

  const daCo = new Set();
  cauHoiConLai = [];
  for (const v of dsViec) {
    const r = sinhCauHoi(kq.bang, kq.nhanDang && kq.nhanDang.theoVaiTro, {
      viec: v,
      cotLienQuan: [...cotLienQuan],
      daTraLoi: hoSo && hoSo.traLoi,
    });
    for (const c of r.canHoi || []) {
      if (daCo.has(c.ma)) continue;
      daCo.add(c.ma);
      cauHoiConLai.push(c);
    }
  }

  if (cauHoiConLai.length) { veCauHoi(); return; }
  veDanhSachPhepSua();
}

function veCauHoi() {
  const c = cauHoiConLai[0];
  ve(`
    <div class="the hoi">
      <h2>Cần bạn cho biết</h2>
      <p class="cau">${thoat(c.tieuDe)}</p>
      ${c.moTa ? `<p class="vi-sao">${thoat(c.moTa)}</p>` : ""}
      ${(c.viDu && c.viDu.length)
        ? `<p class="vi-du">${hienRo(c.viDu.slice(0, 3).join("\n"))}</p>` : ""}
      <div class="hang-nut" id="dap-an"></div>
      <p class="chi-dan mo" style="margin-top:8px">
        ${thoat(c.viSaoHoi || "")}<br>
        Còn ${cauHoiConLai.length} câu. Trả lời rồi thì lần sau không hỏi lại.</p>
    </div>`);
  // luaChon là danh sách phương án; goiY chỉ là MÃ của phương án nên gợi ý sẵn.
  // Mỗi phương án kèm moTa nói rõ hệ quả — hỏi bằng hệ quả chứ không bằng thuật ngữ.
  const o = document.getElementById("dap-an");
  for (const lc of c.luaChon || []) {
    const b = document.createElement("button");
    if (c.goiY && lc.ma === c.goiY) b.className = "chinh";
    b.innerHTML = `<span>${thoat(lc.nhan || lc.ma)}</span>` +
      (lc.moTa ? `<br><span class="mo" style="font-weight:400">${thoat(lc.moTa)}</span>` : "");
    b.style.textAlign = "left";
    b.style.flex = "1 1 100%";
    b.onclick = () => {
      ghiTraLoi(hoSo, c.ma, lc.ma);
      cauHoiConLai.shift();
      if (cauHoiConLai.length) veCauHoi();
      else veBuoc2();
    };
    o.appendChild(b);
  }
  if (!o.childElementCount) {
    // Không có phương án nào thì không được để người dùng kẹt ở màn hình trắng.
    const b = document.createElement("button");
    b.textContent = "Bỏ qua câu này";
    b.onclick = () => {
      cauHoiConLai.shift();
      if (cauHoiConLai.length) veCauHoi();
      else veBuoc2();
    };
    o.appendChild(b);
  }
}

function veDanhSachPhepSua() {
  buoc = 2;
  if (!deXuat.length) {
    ve(`<div class="the">
      <h2>Không có phép sửa nào</h2>
      <p class="mo">Công cụ không tìm thấy chỗ nào sửa được tự động trên trang này.</p>
      <div class="hang-nut"><button id="ve-1">Quay lại</button></div>
    </div>`);
    document.getElementById("ve-1").onclick = veBuoc1;
    return;
  }

  ve(`
    <div class="the">
      <h2>Chọn phép sửa</h2>
      <p class="mo" style="margin:0 0 10px">
        Bỏ chọn những phép bạn chưa muốn áp dụng. Bước sau còn xem trước từng ô.</p>
      ${deXuat.map((d) => `
        <label class="chon-nhom">
          <input type="checkbox" value="${thoat(d.ma)}" ${daChon.has(d.ma) || !daChon.size ? "checked" : ""}>
          <span>
            <span class="ten">${thoat(d.nhan)}</span>
            <span class="mo-ta">${soVN(d.soO)} ô · ${soVN(d.soDong)} dòng${
              d.nhom === "S-TRUNG" ? " · sẽ BỎ dòng" : ""}</span>
          </span>
        </label>`).join("")}
      <div class="hang-nut" style="margin-top:10px">
        <button id="ve-1">Quay lại</button>
        <button class="chinh" id="nut-xem">Tiếp: xem trước</button>
      </div>
    </div>`);

  document.getElementById("ve-1").onclick = veBuoc1;
  document.getElementById("nut-xem").onclick = () => {
    daChon = new Set([...than.querySelectorAll("input:checked")].map((i) => i.value));
    veBuoc3();
  };
}

/* ── Bước 3 · Xem trước và ghi ─────────────────────────────────────── */

function veBuoc3() {
  buoc = 3;
  ketQuaSua = apDung(kq.bang, deXuat, [...daChon]);
  const nk = ketQuaSua.nhatKy;
  const t = ketQuaSua.tomTat;

  // Gom theo CỘT thay vì mỗi dòng một ô tên cột.
  //
  // Bản đầu để tên cột thành một cột riêng, và trên khổ task pane 380 điểm ảnh thì
  // riêng cột ấy chiếm 175 — đẩy cột "Sau" ra ngoài khung. Người dùng thấy giá trị
  // cũ mà không thấy giá trị mới, tức mất đúng nửa thông tin của một bảng xem trước.
  const theoCot = new Map();
  for (const x of nk.slice(0, 60)) {
    const k = x.cot || "";
    if (!theoCot.has(k)) theoCot.set(k, []);
    theoCot.get(k).push(x);
  }
  const hangXem = [...theoCot.entries()].map(([ten, ds]) => `
    <tbody>
      <tr><th colspan="3" style="text-align:left">${thoat(ten)}</th></tr>
      ${ds.slice(0, 12).map((x) => `<tr>
        <td>${x.dong}</td>
        <td class="cu">${hienRo(x.cu)}</td>
        <td class="moi">${hienRo(x.moi)}</td>
      </tr>`).join("")}
      ${ds.length > 12 ? `<tr><td colspan="3" class="mo">…còn ${soVN(ds.length - 12)} ô ở cột này</td></tr>` : ""}
    </tbody>`).join("");

  ve(`
    <div class="the">
      <h2>Xem trước</h2>
      <div class="luoi">
        <div class="so-lieu"><b>${soVN(t.soODaSua)}</b><small>ô sẽ đổi</small></div>
        <div class="so-lieu"><b>${soVN(t.soDongDaBo)}</b><small>dòng sẽ bỏ</small></div>
        <div class="so-lieu"><b>${soVN(t.soDongSau)}</b><small>dòng còn lại</small></div>
      </div>
      <div class="cuon">
        <table>
          <thead><tr><th>Dòng</th><th>Trước</th><th>Sau</th></tr></thead>
          ${hangXem || `<tbody><tr><td colspan="3">Không có ô nào đổi.</td></tr></tbody>`}
        </table>
      </div>
      ${nk.length > 60 ? `<p class="mo" style="margin-top:6px">Bảng trên chỉ hiện một phần; trang Nhật ký sẽ có đủ ${soVN(nk.length)} ô.</p>` : ""}
      <div class="luu-y" style="margin-top:10px">
        Kết quả ghi sang <b>trang tính mới</b>. Trang gốc giữ nguyên, không đổi một ô nào.
      </div>
      <div class="hang-nut">
        <button id="ve-2">Quay lại</button>
        <button class="chinh" id="nut-ghi">Ghi sang trang tính mới</button>
      </div>
    </div>`);

  document.getElementById("ve-2").onclick = veDanhSachPhepSua;
  document.getElementById("nut-ghi").onclick = ghiKetQua;
}

async function ghiKetQua() {
  bao("Đang ghi…");
  try {
    // Nhóm sửa mang các CẶP dòng trùng; gom thành nhóm để người dùng thấy cả cụm.
    const capTrung = deXuat
      .filter((d) => d.nhom === "S-TRUNG" && d.capTrung)
      .flatMap((d) => d.capTrung);
    const nhomTrung = nhomTuCap(capTrung);

    const trang = dungBoTrang({
      bang: kq.bang,
      phatHien: kq.phatHien,
      ketQuaSua,
      dsNhomTrung: nhomTrung.length ? nhomTrung : null,
      tenTrangGoc,
      nhatKy: trangNhatKy(ketQuaSua.nhatKy, ketQuaSua.tomTat, tenTrangGoc),
    });

    const ten = await ghiNhieuTrang(XL(), trang, {
      tienTrinh: (n) => bao(`Đang ghi… ${soVN(n)} dòng`),
    });

    // Tô trang Đã làm sạch, sau khi đã ghi xong dữ liệu.
    //
    // Vàng tô sau cùng để thắng khi chồng lên xanh: một ô vừa được sửa một lỗi vừa
    // còn lỗi khác thì việc còn lại quan trọng hơn việc đã xong.
    const mau = oToMau(kq.bang, kq.phatHien, ketQuaSua);
    const tenDaSach = ten.find((x) => /Da lam sach/i.test(x));
    let boQua = 0;
    if (tenDaSach) {
      // Ngân sách vùng dùng chung cho cả hai lượt tô, vì chặn 2.000 vùng là chặn
      // để Excel không đứng, mà Excel thì không phân biệt vùng màu nào.
      let conLai = 2000;
      if (mau.xanh.length) {
        bao("Đang tô những ô đã sửa…");
        const r = await toVung(XL(), tenDaSach, mau.xanh, { toiDa: conLai, mau: MAU_XANH });
        conLai -= r.soVung;
        boQua += r.soVungBo;
      }
      if (mau.vang.length && conLai > 0) {
        bao("Đang tô những ô còn vấn đề…");
        const r = await toVung(XL(), tenDaSach, mau.vang, { toiDa: conLai, mau: MAU_VANG });
        boQua += r.soVungBo;
      }
    }

    ve(`
      <div class="the">
        <h2>Đã ghi xong</h2>
        <p>Đã tạo ${ten.length} trang tính mới:</p>
        <ul class="mo">${ten.map((x) => `<li>${thoat(x)}</li>`).join("")}</ul>
        <div class="chu-giai">
          <span><i style="background:${MAU_XANH}"></i> ô đã sửa, và dòng giữ lại của nhóm trùng</span>
          <span><i style="background:${MAU_VANG}"></i> ô còn vấn đề, chưa sửa</span>
        </div>
        ${mau.soKhongDinhVi
          ? `<div class="luu-y">${soVN(mau.soKhongDinhVi)} phát hiện nói về cả cột chứ không
             chỉ ra được ô nào, nên KHÔNG tô màu. Xem đầy đủ ở trang Danh sách vấn đề.</div>` : ""}
        ${boQua
          ? `<div class="luu-y">Còn ${soVN(boQua)} vùng KHÔNG được tô, vì tô quá nhiều vùng
             sẽ làm Excel đứng. Trang Danh sách vấn đề và trang Nhật ký vẫn có đủ.</div>` : ""}
        <div class="luu-y">Trang gốc <b>${thoat(tenTrangGoc)}</b> không bị đổi một ô nào.</div>
        <div class="hang-nut"><button class="chinh" id="ve-dau">Rà soát trang khác</button></div>
      </div>`);
    document.getElementById("ve-dau").onclick = () => { kq = null; veBuoc1(); };
  } catch (e) {
    ve(`<div class="luu-y loi">Không ghi được: ${thoat(e.message)}</div>
        <div class="hang-nut"><button id="ve-3">Quay lại</button></div>`);
    document.getElementById("ve-3").onclick = veBuoc3;
  }
}
