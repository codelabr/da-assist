/**
 * Thu thập BẰNG CHỨNG từ dữ liệu, để tầng câu hỏi biết cần hỏi gì.
 *
 * Đây là phần thay thế cho một mô hình ngôn ngữ. Máy không hiểu ý nghĩa cột,
 * nhưng nó đo được những dấu hiệu mà từ đó sinh ra đúng câu hỏi cần hỏi:
 *
 *   - cột nào trống ở cùng những dòng  → cùng một khối nghiệp vụ, hỏi một lần
 *   - cột nào xác định lẫn nhau        → cặp mã và nhãn của cùng một thứ
 *   - bộ cột nào cho ra bao nhiêu nhóm → để hỏi bằng hệ quả chứ không bằng thuật ngữ
 *   - cột nào thật sự mập mờ           → chỉ hỏi khi dữ liệu không tự phân giải được
 */

import { catTrang, chuanHoa } from "../tien-ich/chuoi.js";
import { KIEU } from "../bang/suy-kieu.js";
import { DANG } from "../tien-ich/ngay.js";

const TOI_DA_DONG_SO = 20000;

function oChuoi(bang, c) {
  return bang.dong.map((d) => {
    const v = d[c];
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return catTrang(v);
  });
}

function mauLay(bang) {
  const n = bang.dong.length;
  if (n <= TOI_DA_DONG_SO) return null;
  const buoc = Math.ceil(n / TOI_DA_DONG_SO);
  const ds = [];
  for (let i = 0; i < n; i += buoc) ds.push(i);
  return ds;
}

/**
 * Gom cột theo MẪU Ô TRỐNG giống hệt nhau.
 * Cột trống ở đúng những dòng giống nhau gần như chắc chắn thuộc cùng một khối
 * nghiệp vụ, nên hỏi một câu cho cả nhóm thay vì hỏi từng cột.
 */
export function nhomTheoMauTrong(bang) {
  const n = bang.dong.length;
  if (!n) return [];
  const nhom = new Map();
  for (const c of bang.cot) {
    if (c.soOTrong === 0 || c.soODay === 0) continue;
    let khoa = "";
    for (let i = 0; i < n; i++) {
      const v = bang.dong[i][c.chiSo];
      khoa += v === "" || v == null ? "0" : "1";
    }
    if (!nhom.has(khoa)) nhom.set(khoa, []);
    nhom.get(khoa).push(c);
  }
  return [...nhom.values()]
    .map((cot) => ({
      cot,
      soTrong: cot[0].soOTrong,
      tyLeTrong: cot[0].soOTrong / n,
    }))
    .sort((a, b) => b.cot.length - a.cot.length || b.soTrong - a.soTrong);
}

/**
 * Tìm cặp cột xác định lẫn nhau — dấu hiệu của cặp mã và nhãn.
 * Chỉ xét cột phân loại có số giá trị vừa phải, và chỉ ghép những cột có số giá
 * trị gần bằng nhau, để phép so không nổ theo bình phương số cột.
 */
export function capMaNhan(bang, { toiDaGiaTri = 500 } = {}) {
  const ung = bang.cot.filter(
    (c) => c.kieu !== KIEU.TRONG && c.soGiaTriKhacNhau > 1 && c.soGiaTriKhacNhau <= toiDaGiaTri
  );
  const mau = mauLay(bang);
  const gt = new Map(ung.map((c) => [c.chiSo, oChuoi(bang, c.chiSo)]));
  const chiSoDong = mau || bang.dong.map((_, i) => i);

  const xacDinh = (a, b) => {
    const m = new Map();
    const va = gt.get(a);
    const vb = gt.get(b);
    for (const i of chiSoDong) {
      if (!va[i] || !vb[i]) continue;
      const co = m.get(va[i]);
      if (co !== undefined) {
        if (co !== vb[i]) return false;
      } else m.set(va[i], vb[i]);
    }
    return m.size > 1;
  };

  const ra = [];
  for (let i = 0; i < ung.length; i++) {
    for (let j = i + 1; j < ung.length; j++) {
      const a = ung[i];
      const b = ung[j];
      if (Math.abs(a.soGiaTriKhacNhau - b.soGiaTriKhacNhau) > 2) continue;
      if (xacDinh(a.chiSo, b.chiSo) && xacDinh(b.chiSo, a.chiSo)) {
        ra.push({ a, b, soGiaTri: a.soGiaTriKhacNhau });
      }
    }
  }
  return ra;
}

/** Đếm hệ quả của một bộ khoá: bao nhiêu nhóm trùng, bao nhiêu dòng thừa. */
export function heQuaKhoa(bang, chiSoCot) {
  const cot = chiSoCot.map((c) => oChuoi(bang, c));
  const dem = new Map();
  let thieu = 0;
  for (let i = 0; i < bang.dong.length; i++) {
    const phan = cot.map((v) => v[i]);
    if (phan.some((x) => !x)) {
      thieu++;
      continue;
    }
    const k = phan.join("¦");
    if (!dem.has(k)) dem.set(k, []);
    dem.get(k).push(i);
  }
  const nhom = [...dem.values()].filter((v) => v.length > 1);
  return {
    chiSoCot,
    soNhom: nhom.length,
    soDongThua: nhom.reduce((t, v) => t + v.length - 1, 0),
    soDongThieu: thieu,
    nhom: nhom.slice(0, 50),
  };
}

/**
 * Dựng danh sách ứng viên bộ khoá nhận dạng.
 * Có hồ sơ thì dùng vai trò đã biết; không có thì suy từ chính dữ liệu.
 */
export function ungVienKhoa(bang, vaiTro = new Map()) {
  const ten = (i) => bang.tieuDe[i];
  const ungVien = [];
  const daCo = new Set();
  const them = (chiSo) => {
    if (chiSo.some((c) => c == null || c < 0)) return;
    const k = chiSo.slice().sort((a, b) => a - b).join(",");
    if (daCo.has(k)) return;
    daCo.add(k);
    ungVien.push(chiSo);
  };

  const v = (x) => (vaiTro.get(x) == null ? null : vaiTro.get(x));

  if (vaiTro.size) {
    them([v("ma_benh_nhan")].filter((x) => x != null));
    them([v("so_cccd")].filter((x) => x != null));
    them([v("ho_ten"), v("nam_sinh")].filter((x) => x != null));
    them([v("ho_ten"), v("nam_sinh"), v("gioi_tinh")].filter((x) => x != null));
    them([v("ho_ten"), v("nam_sinh"), v("gioi_tinh"), v("xa_thuong_tru")].filter((x) => x != null));
    them(
      [v("ho_ten"), v("nam_sinh"), v("gioi_tinh"), v("ngay_khang_dinh")].filter((x) => x != null)
    );
  }

  // Không có hồ sơ thì suy từ dữ liệu: cột gần như duy nhất là ứng viên đơn;
  // tổ hợp văn bản đa dạng + số nguyên hẹp + phân loại ít giá trị là ứng viên ghép.
  if (ungVien.length < 2) {
    const ganDuyNhat = bang.cot.filter(
      (c) => c.soODay >= 10 && c.soGiaTriKhacNhau / c.soODay > 0.8
    );
    for (const c of ganDuyNhat.slice(0, 4)) them([c.chiSo]);

    const tenNguoi = bang.cot.filter(
      (c) =>
        (c.kieu === KIEU.VAN_BAN || c.kieu === KIEU.MA_DINH_DANH) &&
        c.soGiaTriKhacNhau / Math.max(1, c.soODay) > 0.5
    );
    const namLike = bang.cot.filter(
      (c) => c.kieu === KIEU.SO_NGUYEN || (c.kieu === KIEU.PHAN_LOAI && c.soGiaTriKhacNhau > 10)
    );
    const itGiaTri = bang.cot.filter(
      (c) => c.kieu === KIEU.PHAN_LOAI && c.soGiaTriKhacNhau <= 4
    );
    if (tenNguoi.length && namLike.length) {
      them([tenNguoi[0].chiSo, namLike[0].chiSo]);
      if (itGiaTri.length) them([tenNguoi[0].chiSo, namLike[0].chiSo, itGiaTri[0].chiSo]);
    }
  }

  const ra = ungVien
    .filter((x) => x.length)
    .map((chiSo) => ({ ...heQuaKhoa(bang, chiSo), ten: chiSo.map(ten) }));

  // Đánh dấu cột không giúp phân biệt thêm: bộ dài hơn mà cho cùng số nhóm.
  for (const r of ra) {
    r.cotThua = [];
    for (const khac of ra) {
      if (khac === r) continue;
      if (khac.chiSoCot.length >= r.chiSoCot.length) continue;
      const con = khac.chiSoCot.every((c) => r.chiSoCot.includes(c));
      if (con && khac.soNhom === r.soNhom && khac.soDongThieu === r.soDongThieu) {
        r.cotThua = r.chiSoCot.filter((c) => !khac.chiSoCot.includes(c)).map(ten);
      }
    }
  }
  return ra.sort((a, b) => a.soNhom - b.soNhom || a.chiSoCot.length - b.chiSoCot.length);
}

/**
 * Cột ngày mà thứ tự ngày–tháng thật sự mập mờ.
 * Chỉ mập mờ khi KHÔNG có giá trị nào trong cột có thành phần đầu lớn hơn 12 —
 * chỉ cần một giá trị như vậy là dữ liệu tự phân giải, khỏi phải hỏi.
 */
export function thuTuNgayMapHo(bang) {
  const ra = [];
  for (const c of bang.cot) {
    if (c.kieu !== KIEU.NGAY) continue;
    const soMapHo = c.dangNgay[DANG.NGAY_TRUOC] || 0;
    if (!soMapHo) continue;
    let tuPhanGiai = false;
    for (const k of c.tanSuat.keys()) {
      const m = /^(\d{1,2})[-/.](\d{1,2})[-/.]\d{4}$/.exec(catTrang(k));
      if (m && +m[1] > 12) {
        tuPhanGiai = true;
        break;
      }
    }
    if (!tuPhanGiai) ra.push({ cot: c, soO: soMapHo });
  }
  return ra;
}

/** Cột trông như thông tin định danh trực tiếp — cần xác nhận vì chạm quyền riêng tư. */
export function cotNghiDinhDanh(bang) {
  const dau = ["ho ten", "ho va ten", "cccd", "cmnd", "can cuoc", "dien thoai", "dia chi", "email", "so the"];
  return bang.cot.filter((c) => {
    if (c.kieu === KIEU.TRONG) return false;
    const t = chuanHoa(c.ten);
    return dau.some((x) => t.includes(x));
  });
}

/**
 * Giá trị hiếm nằm cạnh vài giá trị phổ biến trong một cột phân loại.
 *
 * Đây là chỗ máy nhìn thấy vấn đề nhưng KHÔNG được tự quyết. Cột giới tính của
 * bản xuất thật có “M” 14 dòng và “F” 2 dòng bên cạnh “Nam” và “Nữ”. Người đọc
 * đoán ngay M là Nam, nhưng máy mà tự gán thì lần sau gặp “M” nghĩa là “Mẹ
 * truyền con” nó cũng gán bừa như vậy. Phải hỏi.
 *
 * Đếm theo cách đã gộp hoa thường, vì lệch hoa thường là thứ máy tự sửa được;
 * không gộp trước thì “nam”, “NAM” lấn hết chỗ của “M” và “F”.
 *
 * ĐỘ HIẾM KHÔNG PHẢI LÀ DẤU HIỆU. Đo trên bản xuất thật, chỉ lọc theo tần suất
 * thì máy hỏi 18 câu, trong đó 17 câu về những giá trị hoàn toàn hợp lệ chỉ tình
 * cờ ít gặp: “Người bán dâm”, “Tỉnh An Giang”, “Mã 2 - Lái xe”. Người dùng gặp
 * mười bảy câu vô nghĩa thì bỏ luôn cả câu thứ mười tám.
 *
 * Dấu hiệu thật là HÌNH THỨC KHÁC HẲN: giá trị hiếm trông như một MÃ VIẾT TẮT
 * (toàn chữ in hoa hoặc chữ số, không dấu, rất ngắn) nằm giữa những nhãn viết
 * bằng chữ thường có dấu. Đó là dạng “M”, “F”, “Y”, “N” lọt vào cột giới tính.
 *
 * KHÔNG dùng độ dài làm thước đo: “Nữ” chỉ dài hai ký tự mà là một nhãn hoàn
 * toàn bình thường. Cũng không hỏi khi CHÍNH các giá trị phổ biến đã là mã —
 * cột mã tỉnh toàn “96”, “92” thì một giá trị “89” chẳng có gì bất thường.
 */
const LA_VIET_TAT = /^[A-Z0-9]{1,4}$/;

export function giaTriHiem(bang, { toiDaGiaTri = 30, toiDaHiem = 3 } = {}) {
  const ra = [];
  for (const c of bang.cot) {
    if (c.kieu !== KIEU.PHAN_LOAI && c.kieu !== KIEU.DUNG_SAI) continue;
    if (c.soGiaTriKhacNhau < 2 || c.soGiaTriKhacNhau > toiDaGiaTri) continue;

    const gop = new Map();
    for (const [mat, dem] of c.tanSuat) {
      const k = catTrang(mat).toLowerCase();
      const co = gop.get(k);
      if (co) {
        co.dem += dem;
        if (dem > co.demMat) {
          co.mat = catTrang(mat);
          co.demMat = dem;
        }
      } else gop.set(k, { mat: catTrang(mat), dem, demMat: dem });
    }

    const ds = [...gop.values()].sort((a, b) => b.dem - a.dem);
    if (ds.length < 2) continue;
    const lon = ds[0].dem;
    const troi = ds.filter((x) => x.dem >= lon * 0.1);
    if (troi.length < 1 || troi.length > 6) continue;

    // Phải có ít nhất một giá trị phổ biến là NHÃN BẰNG CHỮ, không phải mã.
    // Cột mà giá trị phổ biến cũng là mã thì một mã lạ chẳng có gì bất thường.
    if (!troi.some((t) => !LA_VIET_TAT.test(t.mat))) continue;

    const hiem = ds.filter(
      (x) => x.dem < lon * 0.05 && x.dem < c.soODay * 0.02 && LA_VIET_TAT.test(x.mat)
    );
    if (!hiem.length || hiem.length > toiDaHiem) continue;
    ra.push({ cot: c, troi, hiem });
  }
  return ra;
}

export function gomBangChung(bang, vaiTro = new Map()) {
  return {
    nhomTrong: nhomTheoMauTrong(bang),
    capMaNhan: capMaNhan(bang),
    ungVienKhoa: ungVienKhoa(bang, vaiTro),
    ngayMapHo: thuTuNgayMapHo(bang),
    nghiDinhDanh: cotNghiDinhDanh(bang),
    giaTriHiem: giaTriHiem(bang),
  };
}
