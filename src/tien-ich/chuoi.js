/**
 * Xử lý chuỗi tiếng Việt.
 *
 * Điểm phải nhớ: ký tự \b của biểu thức chính quy tính theo bảng chữ ASCII, nên
 * nó KHÔNG có ranh giới sau một chữ có dấu. Mọi phép so theo ranh giới từ trong
 * tệp này dùng lookbehind và lookahead với lớp \p{L} và cờ u.
 */

/** Bỏ dấu tiếng Việt, kể cả chữ đ. */
export function boDau(s) {
  return String(s == null ? "" : s)
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** Chuẩn hoá để so khớp: bỏ dấu, thường hoá, gộp khoảng trắng. */
export function chuanHoa(s) {
  return boDau(s).toLowerCase().replace(/\s+/g, " ").trim();
}

/** Chuẩn hoá nhẹ để so giá trị: chỉ cắt khoảng trắng thừa. */
export function catTrang(s) {
  return String(s == null ? "" : s).replace(/\s+/g, " ").trim();
}

function thoat(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * So một khoá từ điển với một tên cột. Ba dạng khoá:
 *   "a b"   có dấu cách  → tên cột CHỨA CỤM này
 *   "abc"   một từ       → tên cột phải có ĐÚNG TỪ này, so theo ranh giới từ
 *   "=abc"                → tên cột ĐÚNG BẰNG chuỗi này
 *
 * Dạng một từ phải so theo ranh giới từ, không so hậu tố chuỗi. Nếu không thì
 * khoá "name" nuốt "facility_name" và khoá ngắn nuốt tên cột dài hơn.
 */
export function khopKhoa(khoa, tenCot) {
  const ten = chuanHoa(tenCot);
  if (!ten) return false;
  if (khoa.startsWith("=")) return ten === chuanHoa(khoa.slice(1));
  const k = chuanHoa(khoa);
  if (!k) return false;
  // Cả khoá một từ lẫn khoá cụm đều so theo ranh giới từ, KHÔNG so chứa chuỗi.
  // Hai lý do, cả hai đều đã trả giá:
  //   - dấu gạch dưới phải nằm trong lớp ranh giới, nếu không thì khoá "name"
  //     khớp được "facility_name";
  //   - khoá cụm mà so chứa chuỗi thì "tam tru" nuốt "huyết áp tâm trương".
  return new RegExp(`(?<![\\p{L}\\p{N}_])${thoat(k)}(?![\\p{L}\\p{N}_])`, "u").test(ten);
}

/** Khớp tên cột với một danh sách khoá; trả về true nếu khớp bất kỳ khoá nào. */
export function khopBatKy(dsKhoa, tenCot) {
  return dsKhoa.some((k) => khopKhoa(k, tenCot));
}

/**
 * Phơi ra khoảng trắng ĐÁNG NGỜ để mắt người thấy được.
 *
 * Đáng ngờ nghĩa là: thừa ở đầu dòng, thừa ở cuối dòng, hoặc từ hai dấu cách liền
 * nhau. Đó là những chỗ mắt không thấy mà máy tính là giá trị khác — `"Hà Nội "`
 * và `"Hà Nội"` là hai nhóm riêng khi tổng hợp.
 *
 * KHÔNG đánh dấu mọi dấu cách. Bản đầu làm thế và hỏng cả hai đường: chữ thành khó
 * đọc (`dòng␣2:␣ngày␣kết␣thúc`), và cả dòng mất hết chỗ ngắt nên thành một từ dài
 * 1.614 điểm ảnh trong khung rộng 326 — task pane phải cuộn ngang mới đọc hết.
 */
export function hienKhoangTrang(s) {
  const dau = (m) => "␣".repeat(m.length);
  return String(s == null ? "" : s)
    .replace(/^[ \t]+/gm, dau)
    .replace(/[ \t]+$/gm, dau)
    .replace(/ {2,}/g, dau)
    .replace(/\t/g, "→");
}

/** Có phải chuỗi mang nghĩa không, hay chỉ là ký tự rác. */
export function coNghia(s) {
  return /[A-Za-z0-9À-ỹ]{3}/.test(String(s == null ? "" : s));
}
