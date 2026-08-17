/**
 * Từ điển khái niệm cột.
 *
 * Khác hẳn hồ sơ nhận dạng loại tệp: từ điển này nhận **từng cột một, độc lập**.
 * Không cần biết cả tệp là loại gì; nhận được cột nào thì chạy quy tắc của cột
 * ấy, không nhận được thì im lặng bỏ qua. Nhờ vậy nó chạy được cả với bảng tự làm
 * tại đơn vị, miễn có cột nào tên gần đúng.
 *
 * Nội dung là **khái niệm y học**, không phải danh mục hành chính: "ngày tử vong",
 * "kết quả khẳng định", "mã bệnh nhân". Những khái niệm này không hết hiệu lực khi
 * một thông tư được thay, nên từ điển không phải bảo dưỡng theo văn bản.
 *
 * BỐN CHỐT CHẶN chống nhận nhầm cột, vì một quy tắc đúng áp lên cột sai còn tệ
 * hơn không có quy tắc — nó báo hàng loạt trên dữ liệu đúng:
 *
 *   1. Khoá so theo RANH GIỚI TỪ, không so chứa chuỗi.
 *   2. Không đưa vào từ điển khoá mà bản bỏ dấu trùng một từ thông dụng.
 *   3. KIỂM KIỂU DỮ LIỆU trước khi nhận cột — cột tên có chữ "ngày" mà toàn số
 *      nguyên nhỏ thì không phải cột ngày.
 *   4. Khoá càng dài càng thắng, để "ngày báo tử vong" không bị "ngày tử vong" giành.
 *   5. KHOÁ LOẠI TRỪ. Đo trên tệp thật cho thấy chốt chặn 3 không đủ: cột
 *      "Ngày bắt đầu điều trị Lao tiềm ẩn" khớp khoá "ngày bắt đầu điều trị" của
 *      khái niệm ngày bắt đầu ARV, và nó chỉ thoát nhờ TÌNH CỜ RỖNG. Có dữ liệu
 *      là nhận sai ngay, rồi mọi quy tắc thứ tự ngày báo sai theo. Vì vậy mỗi
 *      khái niệm khai thêm danh sách khoá mà nếu tên cột có thì KHÔNG nhận.
 */

import { khopKhoa } from "../tien-ich/chuoi.js";
import { KIEU } from "../bang/suy-kieu.js";

/** Kiểu dữ liệu mà một khái niệm bắt buộc phải có, nếu không thì không nhận. */
export const DOI = {
  NGAY: "ngay",
  SO: "so",
  CHU: "chu",
  MA: "ma",
  BAT_KY: "bat-ky",
};

/**
 * Bệnh và chương trình khác dùng lại đúng những cụm từ của điều trị HIV: "ngày bắt
 * đầu điều trị", "ngày kết thúc điều trị", "ngày chẩn đoán". Tên cột có một trong
 * các chữ này thì không phải cột của khái niệm HIV tương ứng.
 */
// Khoá một từ, KHÔNG dùng dạng "=hcv": dấu bằng nghĩa là tên cột đúng bằng chuỗi
// ấy, nên nó không bao giờ khớp "Ngày XN tải lượng HCV".
const KHAC_HIV = ["lao", "viêm gan", "hcv", "hbv", "methadone", "prep", "pep",
  "viêm phổi", "nấm", "giang mai", "lậu"];

/**
 * Danh mục khái niệm.
 *   ma        mã khái niệm dùng trong các phép kiểm
 *   ten       tên đọc được, hiện ra trên giao diện
 *   doi       kiểu dữ liệu bắt buộc
 *   khoa      danh sách khoá tên cột
 *   khongKhoa tên cột có bất kỳ khoá nào trong đây thì KHÔNG nhận
 *   suKien    true nếu đây là ngày của một việc ĐÃ xảy ra, nên không thể ở tương lai
 */
export const KHAI_NIEM = [
  // ------------------------------------------------------------ ngày tháng
  {
    ma: "NGAY_SINH",
    ten: "ngày sinh",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày sinh", "=dob", "date of birth"],
    khongKhoa: ["dự sinh", "dự kiến sinh"],
  },
  {
    ma: "NAM_SINH",
    ten: "năm sinh",
    doi: DOI.SO,
    khoa: ["=nam sinh", "năm sinh"],
  },
  {
    ma: "NGAY_KHANG_DINH",
    ten: "ngày xét nghiệm khẳng định",
    doi: DOI.NGAY,
    suKien: true,
    khoa: [
      "ngày xn khẳng định", "ngày xét nghiệm khẳng định", "ngày khẳng định",
      "ngày chẩn đoán", "ngày phát hiện", "ngày có kết quả khẳng định",
    ],
    khongKhoa: KHAC_HIV,
  },
  {
    ma: "NGAY_XN_SANG_LOC",
    ten: "ngày xét nghiệm sàng lọc",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày xn sàng lọc", "ngày xét nghiệm sàng lọc", "ngày lấy máu", "ngày xn nhanh",
      "ngày xn bằng sinh phẩm nhanh"],
    khongKhoa: KHAC_HIV,
  },
  {
    ma: "NGAY_ARV_DAU",
    ten: "ngày bắt đầu điều trị ARV",
    doi: DOI.NGAY,
    suKien: true,
    khoa: [
      "ngày điều trị arv lần đầu", "ngày bắt đầu arv", "ngày bắt đầu điều trị arv",
      "ngày đăng ký điều trị arv", "ngày bắt đầu điều trị",
    ],
    khongKhoa: KHAC_HIV,
  },
  {
    ma: "NGAY_KET_THUC",
    ten: "ngày kết thúc điều trị",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày kết thúc", "ngày ra khỏi chương trình", "ngày dừng điều trị",
      "ngày ngừng điều trị"],
    khongKhoa: KHAC_HIV,
  },
  {
    ma: "NGAY_TU_VONG",
    ten: "ngày tử vong",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày tử vong", "ngày mất", "ngày chết"],
    khongKhoa: ["báo"],
  },
  {
    ma: "NGAY_BAO_TU_VONG",
    ten: "ngày báo tử vong",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày báo tử vong", "ngày nhận báo tử vong", "ngày ghi nhận tử vong"],
  },
  {
    ma: "NGAY_NHAP_LIEU",
    ten: "ngày nhập liệu",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày nhập liệu", "ngày nhập máy", "ngày vào sổ", "ngày tạo bản ghi"],
  },
  {
    ma: "NGAY_CAP_NHAT",
    ten: "ngày cập nhật",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày cập nhật", "ngày sửa gần nhất"],
  },
  {
    ma: "NGAY_CHUYEN_DEN",
    ten: "ngày chuyển đến",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày chuyển đến", "ngày tiếp nhận"],
  },
  {
    ma: "NGAY_CHUYEN_DI",
    ten: "ngày chuyển đi",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày chuyển đi", "ngày chuyển tuyến"],
  },
  {
    ma: "NGAY_CHUYEN_GIAM_SAT",
    ten: "ngày chuyển giám sát ca bệnh",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày chuyển giám sát"],
  },
  {
    // KHÔNG đưa "ngày hẹn khám lại" vào đây: ngày hẹn là ngày ở TƯƠNG LAI, còn
    // ngày khám gần nhất là việc đã xảy ra. Trộn hai thứ vào một khái niệm thì
    // quy tắc "ngày trong tương lai" sẽ báo nhầm toàn bộ cột lịch hẹn.
    ma: "NGAY_KHAM_CUOI",
    ten: "ngày khám gần nhất",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày khám gần nhất", "ngày khám cuối", "ngày lĩnh thuốc gần nhất"],
    khongKhoa: ["hẹn", "dự kiến", ...KHAC_HIV],
  },
  {
    ma: "NGAY_XN_TAI_LUONG",
    ten: "ngày xét nghiệm tải lượng",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày xn tải lượng", "ngày xét nghiệm tải lượng"],
    khongKhoa: KHAC_HIV,
  },
  {
    ma: "NGAY_XN_CD4",
    ten: "ngày xét nghiệm CD4",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày xn cd4", "ngày xét nghiệm cd4"],
  },
  {
    ma: "NGAY_RA_SOAT",
    ten: "ngày rà soát lại",
    doi: DOI.NGAY,
    suKien: true,
    khoa: ["ngày rà soát"],
  },

  // ------------------------------------------------------------ trạng thái
  {
    ma: "TRANG_THAI_DIEU_TRI",
    ten: "trạng thái điều trị",
    doi: DOI.CHU,
    khoa: ["trạng thái điều trị", "tình trạng điều trị", "trạng thái điều trị hiện tại"],
  },
  {
    ma: "TRANG_THAI_NGUOI",
    ten: "trạng thái người nhiễm",
    doi: DOI.CHU,
    khoa: ["trạng thái người nhiễm", "tình trạng người nhiễm", "trạng thái hiện tại"],
  },
  {
    ma: "LY_DO_KET_THUC",
    ten: "lý do kết thúc",
    doi: DOI.CHU,
    khoa: ["lý do kết thúc", "lý do ra khỏi chương trình", "lý do dừng điều trị"],
  },
  {
    // KHÔNG dùng khoá "kết luận chẩn đoán": trên bản xuất thật nó khớp cột
    // "Kết luận chẩn đoán nhiễm mới", vốn là phân loại nhiễm mới hay nhiễm lâu,
    // KHÔNG phải kết quả khẳng định HIV. Nhận sai cột này thì hai quy tắc Y2.3
    // và Y2.4 đem so với cột hoàn toàn khác việc.
    ma: "KET_QUA_KHANG_DINH",
    ten: "kết quả xét nghiệm khẳng định",
    doi: DOI.CHU,
    khoa: ["kết quả khẳng định", "kết quả xn khẳng định", "kết quả xét nghiệm khẳng định"],
    khongKhoa: ["nhiễm mới", ...KHAC_HIV],
  },
  {
    ma: "NGUYEN_NHAN_TU_VONG",
    ten: "nguyên nhân tử vong",
    doi: DOI.BAT_KY,
    khoa: ["nguyên nhân tử vong"],
  },

  // ------------------------------------------------------------ định danh
  {
    ma: "MA_BENH_NHAN",
    ten: "mã bệnh nhân",
    doi: DOI.MA,
    khoa: ["mã bệnh nhân", "mã bn", "mã hồ sơ", "mã người bệnh", "mã đối tượng",
      "mã bệnh án"],
  },
  {
    // Căn cước và chứng minh nhân dân là HAI khái niệm, không phải một: 12 chữ số
    // và 9 chữ số. Gộp lại thì chỉ một trong hai cột được kiểm, và kiểm bằng một
    // khuôn dạng nới rộng chấp nhận cả hai độ dài — tức không kiểm được gì.
    ma: "SO_CCCD",
    ten: "số căn cước",
    doi: DOI.MA,
    soChuSo: [12],
    khoa: ["số cccd", "=cccd", "căn cước"],
  },
  {
    ma: "SO_CMND",
    ten: "số chứng minh nhân dân",
    doi: DOI.MA,
    soChuSo: [9],
    khoa: ["số cmnd", "=cmnd", "=cmt", "chứng minh nhân dân"],
  },
  {
    ma: "SO_DIEN_THOAI",
    ten: "số điện thoại",
    doi: DOI.MA,
    soChuSo: [10],
    khoa: ["số điện thoại", "=đt", "=sđt", "điện thoại"],
  },
  {
    ma: "HO_TEN",
    ten: "họ tên",
    doi: DOI.CHU,
    khoa: ["họ tên", "họ và tên", "=ten", "tên người bệnh"],
  },
  {
    // Khoá "=gioi tinh" dùng dạng đúng-bằng-chuỗi, KHÔNG dùng khoá trần "nam":
    // bỏ dấu thì "nam" giới tính trùng "năm" thời gian.
    ma: "GIOI_TINH",
    ten: "giới tính",
    doi: DOI.CHU,
    khoa: ["giới tính", "=gioi", "=sex", "=gender"],
  },
];

/** Kiểu cột có thoả yêu cầu của khái niệm không. */
function thoaKieu(doi, mo) {
  if (doi === DOI.BAT_KY) return true;

  // Cột trống hoàn toàn VẪN được nhận khái niệm. Bản đầu tôi loại chúng, và hệ quả
  // là hai quy tắc không chạy được đúng lúc cần nhất: "trạng thái ghi tử vong mà
  // cột ngày tử vong rỗng" và "có lý do kết thúc mà cột ngày kết thúc rỗng" —
  // chính những ca ấy làm cột rỗng. Mọi quy tắc đọc giá trị đều tự bỏ qua ô rỗng,
  // nên nhận thêm một cột rỗng không sinh ra phát hiện sai nào.
  if (mo.kieu === KIEU.TRONG) return true;

  if (doi === DOI.NGAY) {
    // Cột ngày phải thật sự có ô đọc ra được thành ngày. Một cột tên có chữ
    // "ngày" mà toàn số nguyên nhỏ là cột đếm số ngày, không phải cột ngày.
    const soNgay = Object.values(mo.dangNgay || {}).reduce((a, b) => a + b, 0);
    return soNgay > 0 && soNgay >= mo.soODay * 0.5;
  }
  if (doi === DOI.SO) {
    return mo.kieu === KIEU.SO_NGUYEN || mo.kieu === KIEU.SO_THUC;
  }
  if (doi === DOI.CHU) {
    return mo.kieu === KIEU.PHAN_LOAI || mo.kieu === KIEU.VAN_BAN ||
      mo.kieu === KIEU.DUNG_SAI || mo.kieu === KIEU.MA_DINH_DANH;
  }
  if (doi === DOI.MA) {
    // Mã có thể là chuỗi hoặc số; chỉ loại cột ngày.
    return mo.kieu !== KIEU.NGAY;
  }
  return true;
}

/**
 * Độ dài khoá khớp dài nhất, dùng để phân xử khi nhiều khái niệm cùng khớp.
 * Trả về 0 nếu tên cột trúng một khoá loại trừ.
 */
function diemKhop(khaiNiem, ten) {
  for (const k of khaiNiem.khongKhoa || []) {
    if (khopKhoa(k, ten)) return 0;
  }
  let dai = 0;
  for (const k of khaiNiem.khoa) {
    if (khopKhoa(k, ten)) {
      const d = k.startsWith("=") ? k.length + 100 : k.length;
      if (d > dai) dai = d;
    }
  }
  return dai;
}

/** Khái niệm này là ngày của một việc đã xảy ra không. */
export function laSuKien(ma) {
  const kn = KHAI_NIEM.find((k) => k.ma === ma);
  return !!(kn && kn.suKien);
}

/** Số chữ số hợp lệ mà khái niệm này khai, nếu có. */
export function soChuSoCua(ma) {
  const kn = KHAI_NIEM.find((k) => k.ma === ma);
  return kn && kn.soChuSo ? kn.soChuSo : null;
}

/**
 * Nhận khái niệm cho từng cột của bảng.
 *
 * Trả về:
 *   theoMa    Map khái niệm → chỉ số cột (cột khớp mạnh nhất)
 *   theoCot   Map chỉ số cột → mã khái niệm
 *   nhieuCot  Map khái niệm → mọi chỉ số cột khớp, khi có hơn một
 *   loaiViKieu  danh sách cột khớp tên nhưng bị loại vì sai kiểu dữ liệu
 *
 * @param {object} bang bảng đã chạy suyKieuBang
 */
export function nhanKhaiNiem(bang) {
  const cot = bang.cot || [];
  const theoMa = new Map();
  const theoCot = new Map();
  const nhieuCot = new Map();
  const loaiViKieu = [];

  // Điểm của từng cặp (cột, khái niệm) — chọn khái niệm khớp mạnh nhất cho mỗi cột.
  for (const mo of cot) {
    const ten = mo.ten || "";
    if (!ten) continue;

    let tot = null;
    let diemTot = 0;
    for (const kn of KHAI_NIEM) {
      const d = diemKhop(kn, ten);
      if (d <= diemTot) continue;
      if (!thoaKieu(kn.doi, mo)) {
        loaiViKieu.push({ cot: ten, chiSoCot: mo.chiSo, khaiNiem: kn.ma, kieu: mo.kieu });
        continue;
      }
      tot = kn;
      diemTot = d;
    }
    if (!tot) continue;

    theoCot.set(mo.chiSo, tot.ma);
    if (!nhieuCot.has(tot.ma)) nhieuCot.set(tot.ma, []);
    nhieuCot.get(tot.ma).push(mo.chiSo);
  }

  // Với mỗi khái niệm, chọn cột khớp mạnh nhất làm cột chính.
  for (const [ma, dsCot] of nhieuCot) {
    const kn = KHAI_NIEM.find((k) => k.ma === ma);
    let tot = dsCot[0];
    let diemTot = -1;
    for (const c of dsCot) {
      const d = diemKhop(kn, bang.tieuDe[c] || "");
      if (d > diemTot) {
        diemTot = d;
        tot = c;
      }
    }
    theoMa.set(ma, tot);
  }

  return { theoMa, theoCot, nhieuCot, loaiViKieu };
}

/** Tên đọc được của một khái niệm. */
export function tenKhaiNiem(ma) {
  const kn = KHAI_NIEM.find((k) => k.ma === ma);
  return kn ? kn.ten : ma;
}
