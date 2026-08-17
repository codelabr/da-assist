/**
 * Sinh tệp mẫu cho bộ thử.
 *
 * KHÔNG lưu tệp dữ liệu vào kho. Mọi dữ liệu thử đều sinh ra lúc chạy, ở đây.
 * Họ tên dùng trong tệp này là chuỗi ghép máy móc, không lấy từ bất kỳ danh sách
 * thật nào.
 */

export const TIEU_DE_HIVINFO = [
  "TT", "Mã bệnh nhân", "Họ tên", "Năm sinh", "Giới tính", "Dân tộc",
  "Số CMND", "Số CCCD", "Số điện thoại", "Nghề nghiệp", "Đối tượng",
  "Hành vi nguy cơ lây nhiễm", "Đường lây",
  "Mã Tỉnh/TP thường trú", "Tỉnh/TP thường trú",
  "Mã Phường/Xã thường trú", "Phường/Xã thường trú",
  "Hiện trạng cư trú - Tỉnh Thường trú",
  "Mã Tỉnh/TP hiện tại", "Tỉnh/TP hiện tại",
  "Mã Phường/Xã hiện tại", "Phường/Xã hiện tại",
  "Tỉnh/TP phát hiện", "Cơ sở khẳng định đầu tiên", "Ngày XN khẳng định đầu tiên",
  "Kết luận chẩn đoán nhiễm mới",
  "Tỉnh điều trị", "Trạng thái điều trị hiện tại", "Ngày điều trị ARV lần đầu",
  "Ngày kết thúc", "Lý do kết thúc",
  "Ngày chuyển giám sát ca bệnh", "Ngày nhập liệu",
  "Ngày báo tử vong", "Ngày tử vong", "Nguyên nhân tử vong",
  "Ngoại tỉnh", "Phân loại ca (Ca chính/phụ)", "Trạng thái người nhiễm",
  "Trạng thái nghi trùng", "Ghi chú",
];

const XA = ["Xã Khánh Lâm", "Phường Tân Thành", "Xã Trí Phải", "Phường An Bình"];
const NGHE = [
  "Mã 10 - Lao động tự do", "Mã 5 - Công nhân", "Mã 4 - Người làm nông nghiệp",
  "Mã 8 - Học sinh, sinh viên",
];
const DOI_TUONG = [
  "Người có quan hệ tình dục đồng giới", "Người sử dụng ma túy",
  "Người mắc các bệnh lây truyền qua đường tình dục",
];
const DUONG_LAY = ["Mã 2 - Lây qua đường tình dục", "Mã 1 - Lây qua đường máu"];

function hai(n) {
  return String(n).padStart(2, "0");
}

/**
 * Sinh danh sách giám sát ca bệnh.
 * Tham số điều khiển đúng những khiếm khuyết cần đo, để mỗi ca thử biết trước
 * đáp án của mình.
 */
export function sinhDanhSach({
  soDong = 60,
  namTu = 2023,
  namDen = 2026,
  soDongIso = 0, // số dòng ghi ngày theo yyyy-mm-dd, phần còn lại dd/mm/yyyy
  bienTheGioi = 0, // số dòng ghi giới tính lệch hoa thường
  soCapTrung = 0, // số cặp dòng trùng hoàn toàn
  maPhanCap = false, // trộn mã cha và mã con ở cột Đường lây
  cotTrong = true, // để cột Ghi chú trống hoàn toàn
  khoangTrangThua = 0,
  tyLeNgoaiTinh = 0.1,
  giaTriLaNgheNghiep = 0,
  trungKhacTT = 0, // số cặp trùng giống nhau mọi cột TRỪ cột số thứ tự dòng
  ngayThat = false, // ghi ô ngày thật của Excel thay vì chuỗi
  lechTuVong = 0, // số dòng tử vong bị bỏ trống lý do kết thúc
} = {}) {
  const hang = [TIEU_DE_HIVINFO.slice()];
  const soNam = namDen - namTu + 1;
  const dt = (y, m, d) =>
    ngayThat ? new Date(Date.UTC(y, m - 1, d)) : `${hai(d)}/${hai(m)}/${y}`;
  let daLech = 0;

  for (let i = 0; i < soDong; i++) {
    const nam = namTu + (i % soNam);
    const thang = (i % 12) + 1;
    const ngay = (i % 27) + 1;
    const dungIso = i < soDongIso;
    const ngayKd = dungIso ? `${nam}-${hai(thang)}-${hai(ngay)}` : dt(nam, thang, ngay);

    let gioi = i % 3 === 0 ? "Nữ" : "Nam";
    if (i < bienTheGioi) gioi = gioi === "Nam" ? "nam" : "nữ";

    let duongLay = DUONG_LAY[i % DUONG_LAY.length];
    if (maPhanCap && i % 5 === 0) duongLay = "Mã 2.1 - Tình dục đồng giới";

    let nghe = NGHE[i % NGHE.length];
    if (i < giaTriLaNgheNghiep) nghe = "Nghề khác";

    let xa = XA[i % XA.length];
    if (i < khoangTrangThua) xa = `  ${xa} `;

    const tuVong = i % 10 === 3;
    const ngoaiTinh = i / soDong < tyLeNgoaiTinh;
    const boLyDo = tuVong && daLech < lechTuVong && ++daLech >= 0;

    hang.push([
      i + 1,
      `BN${String(100000 + i)}`,
      `Người Thử ${i + 1}`,
      1980 + (i % 30),
      gioi,
      "Kinh",
      "",
      `0960${String(80000000 + i)}`,
      `09${String(10000000 + i)}`,
      nghe,
      DOI_TUONG[i % DOI_TUONG.length],
      "",
      duongLay,
      96,
      "Tỉnh Cà Mau",
      32062,
      xa,
      "Hiện đang sinh sống tại địa phương",
      96,
      "Tỉnh Cà Mau",
      32062,
      xa,
      "Tỉnh Cà Mau",
      "CDC Cà Mau",
      ngayKd,
      i % 12 === 0 ? "Nhiễm mới" : "",
      "Tỉnh Cà Mau",
      tuVong ? "Tử vong" : "Đang điều trị",
      dt(nam, thang, ngay),
      tuVong ? dt(nam, thang, ngay) : "",
      tuVong && !boLyDo ? "Death" : "",
      dt(nam, thang, ngay),
      dt(nam, thang, ngay),
      tuVong ? dt(nam, thang, ngay) : "",
      tuVong ? dt(nam, thang, ngay) : "",
      tuVong ? "1" : "",
      ngoaiTinh ? "X" : "",
      "Ca chính",
      tuVong ? "Tử vong" : "còn sống",
      "Không",
      cotTrong ? "" : `ghi chú ${i}`,
    ]);
  }

  for (let k = 0; k < soCapTrung; k++) {
    hang.push(hang[1 + k].slice());
  }

  // Dạng trùng khó bắt hơn hẳn, và là dạng có thật trong bản xuất: giống nhau ở
  // mọi cột mang thông tin, chỉ khác đúng cột số thứ tự dòng.
  for (let k = 0; k < trungKhacTT; k++) {
    const ban = hang[1 + k].slice();
    ban[0] = soDong + k + 1;
    hang.push(ban);
  }

  return { ten: "Danh sach GSCB", hang };
}

/** Biểu đã cộng — dùng để đo công cụ có phân biệt được hình dạng không. */
export function sinhBieuTongHop() {
  return {
    ten: "Phu luc 4",
    oGop: [{ hangDau: 0, hangCuoi: 0, cotDau: 0, cotCuoi: 4 }],
    hang: [
      ["BÁO CÁO TỔNG HỢP SỐ LIỆU GIÁM SÁT CA BỆNH HIV/AIDS", "", "", "", ""],
      ["Quý III năm 2026", "", "", "", ""],
      ["STT", "Nội dung báo cáo", "Nam", "Nữ", "Tổng"],
      ["I", "Số liệu báo cáo quý", "", "", ""],
      ["1", "Số người nhiễm HIV phát hiện mới trong quý", 12, 5, 17],
      ["2", "Số người phát hiện nhiễm mới HIV theo phương cách", 2, 1, 3],
      ["3", "Số người nhiễm HIV tử vong trong quý", 1, 0, 1],
      ["II", "Số liệu từ đầu năm đến cuối kỳ báo cáo", "", "", ""],
      ["1", "Số người nhiễm HIV phát hiện mới", 40, 16, 56],
      ["2", "Số người phát hiện nhiễm mới HIV theo phương cách", 6, 2, 8],
      ["3", "Số người nhiễm HIV tử vong", 4, 1, 5],
      ["Tổng", "", 65, 25, 90],
    ],
  };
}

/** Bảng không thuộc ngành y tế — dùng để đo báo nhầm khi nhận dạng hồ sơ. */
export function sinhBangKhongLienQuan() {
  const hang = [["Mã hàng", "Tên hàng", "Số lượng", "Đơn giá", "Ngày nhập", "Kho"]];
  for (let i = 0; i < 80; i++) {
    hang.push([
      `H${1000 + i}`,
      `Vật tư số ${i}`,
      (i % 17) + 1,
      12000 + i * 25,
      `${String((i % 27) + 1).padStart(2, "0")}/0${(i % 9) + 1}/2026`,
      i % 2 ? "Kho A" : "Kho B",
    ]);
  }
  return { ten: "Nhap kho", hang };
}

/**
 * Danh sách nhỏ cho các quy tắc chuyên ngành Y1, Y2, Y10.
 *
 * Cột đặt tên đúng như bản xuất thật để đo luôn cả bộ nhận khái niệm. Bản mặc định
 * điền ĐÚNG, dùng làm ca âm; mỗi tuỳ chọn bơm đúng một loại lỗi để từng ca thử biết
 * trước đáp án của mình.
 */
export function sinhDanhSachY(tuyChon = {}) {
  const {
    soDong = 30,
    dangNgay = "chuoi", // "chuoi" dd/mm/yyyy · "iso" yyyy-mm-dd · "o-ngay" ô ngày thật
    cachViet = 0, // chọn biến thể cách viết trạng thái, 0..3
    ketThucTruocBatDau = 0, // Y1.1
    tuVongTruocKhangDinh = 0, // Y1.2
    baoTruocTuVong = 0, // Y1.4
    khamSauTuVong = 0, // Y1.5a
    ngayTuongLai = 0, // Y1.9
    arvTruocKhangDinh = 0, // Y1.10
    dangDieuTriMaCoNgayTuVong = 0, // Y2.1
    tuVongMaThieuNgay = 0, // Y2.2
    amTinhMaCoArv = 0, // Y2.3
    coLyDoThieuNgayKetThuc = 0, // Y2.5
    haiTrangThaiNguoc = 0, // Y2.8
    maTrungKhacGioi = 0, // Y10.1
    cccdTrungKhacMa = 0, // Y10.2
    maLechKhuon = 0, // Y10.3
    dtThieuSoKhong = 0, // Y10.5
    maDvLechTen = 0, // Y10.6
  } = tuyChon;

  const hai = (n) => String(n).padStart(2, "0");
  const d = (y, m, ng) => {
    if (dangNgay === "o-ngay") return new Date(Date.UTC(y, m - 1, ng));
    if (dangNgay === "iso") return `${y}-${hai(m)}-${hai(ng)}`;
    return `${hai(ng)}/${hai(m)}/${y}`;
  };

  // Bốn cách viết cùng một trạng thái. Bộ nhận phải hiểu cả bốn, vì mỗi đơn vị
  // ghi một kiểu và không đơn vị nào sai.
  const VIET = [
    { song: "Còn sống", tuVong: "Tử vong", dangDT: "Đang điều trị", ketThuc: "Đã kết thúc" },
    { song: "con song", tuVong: "tu vong", dangDT: "dang dieu tri", ketThuc: "da ket thuc" },
    { song: "CÒN SỐNG", tuVong: "TỬ VONG", dangDT: "ĐANG ĐIỀU TRỊ", ketThuc: "ĐÃ KẾT THÚC" },
    { song: "Còn sống", tuVong: "Đã tử vong", dangDT: "Còn điều trị", ketThuc: "Ra khỏi chương trình" },
  ];
  const V = VIET[cachViet % VIET.length];

  const hang = [[
    "TT", "Mã bệnh nhân", "Họ tên", "Năm sinh", "Giới tính",
    "Số CCCD", "Số điện thoại",
    "Mã Tỉnh/TP thường trú", "Tỉnh/TP thường trú",
    "Ngày XN khẳng định đầu tiên", "Kết quả khẳng định",
    "Ngày điều trị ARV lần đầu", "Ngày khám gần nhất",
    "Ngày kết thúc", "Lý do kết thúc",
    "Trạng thái điều trị hiện tại", "Trạng thái người nhiễm",
    "Ngày tử vong", "Ngày báo tử vong",
  ]];

  for (let i = 0; i < soDong; i++) {
    const nam = 2020 + (i % 4);
    const kd = d(nam, (i % 12) + 1, (i % 27) + 1);
    const arv = d(nam, (i % 12) + 1, (i % 27) + 2);
    const kham = d(nam + 1, (i % 12) + 1, (i % 27) + 1);

    const h = [
      i + 1,
      `BN${10000 + i}`,
      `Người bệnh ${i + 1}`,
      1980 + (i % 30),
      i % 3 === 0 ? "Nữ" : "Nam",
      String(100000000000 + i), // 12 chữ số
      `09${String(10000000 + i).slice(0, 8)}`, // 10 chữ số
      `0${hai((i % 9) + 1)}`,
      `Tỉnh số ${(i % 9) + 1}`,
      kd,
      "Dương tính",
      arv,
      kham,
      "", "",
      V.dangDT,
      V.song,
      "", "",
    ];
    hang.push(h);
  }

  const C = {
    ma: 1, gioi: 4, cccd: 5, dt: 6, maDv: 7, tenDv: 8,
    kd: 9, ketQua: 10, arv: 11, kham: 12, ketThuc: 13, lyDo: 14,
    ttDieuTri: 15, ttNguoi: 16, tuVong: 17, baoTuVong: 18,
  };
  const R = (i) => hang[i + 1];

  // Năm nền của dòng i, để mọi ngày bơm vào tính TƯƠNG ĐỐI theo chính dòng ấy.
  // Bản đầu tôi bơm ngày cố định (2015, 2024…) và bộ thử sinh theo tổ hợp phát
  // hiện ngay: một tệp thử mang hai lỗi cùng lúc, nên không đo được quy tắc nào
  // đứng riêng. Ví dụ ngày tử vong cố định 2021 lại đứng trước ngày khẳng định
  // của những dòng năm 2022, thành ra bơm lỗi Y1.5a mà kéo theo cả Y1.2.
  const namCua = (i) => 2020 + (i % 4);

  // Người đã tử vong thì xoá ngày khám: giữ lại thì chính bộ sinh tạo thêm lỗi
  // "khám sau khi tử vong", làm nhiễu mọi ca khác.
  const datTuVong = (i, namTV, ngayBao) => {
    R(i)[C.tuVong] = d(namTV, 5, 20);
    R(i)[C.baoTuVong] = ngayBao || d(namTV, 5, 25);
    R(i)[C.ttNguoi] = V.tuVong;
    R(i)[C.ttDieuTri] = V.ketThuc;
    R(i)[C.kham] = "";
  };

  for (let i = 0; i < ketThucTruocBatDau; i++) {
    R(i)[C.ketThuc] = d(namCua(i) - 1, 1, 5);
    R(i)[C.lyDo] = "Chuyển đi"; // nếu không thì kéo theo Y2.6, thiếu lý do kết thúc
  }
  for (let i = 0; i < tuVongTruocKhangDinh; i++) {
    // Trước mọi ngày khẳng định mà bộ sinh tạo ra.
    R(i)[C.tuVong] = d(2015, 3, 3);
    R(i)[C.baoTuVong] = d(2015, 3, 8);
    R(i)[C.ttNguoi] = V.tuVong;
    R(i)[C.ttDieuTri] = V.ketThuc;
    R(i)[C.kham] = "";
  }
  for (let i = 0; i < baoTruocTuVong; i++) {
    datTuVong(i, namCua(i) + 2, d(namCua(i) + 2, 5, 11));
  }
  for (let i = 0; i < khamSauTuVong; i++) {
    datTuVong(i, namCua(i) + 1);
    R(i)[C.kham] = d(namCua(i) + 3, 5, 5); // sau ngày tử vong
  }
  for (let i = 0; i < ngayTuongLai; i++) R(i)[C.kd] = d(2030, 4, 4);
  for (let i = 0; i < arvTruocKhangDinh; i++) R(i)[C.arv] = d(namCua(i) - 2, 2, 2);
  for (let i = 0; i < dangDieuTriMaCoNgayTuVong; i++) {
    // Có ngày tử vong mà trạng thái vẫn là đang điều trị.
    R(i)[C.tuVong] = d(namCua(i) + 2, 5, 20);
    R(i)[C.baoTuVong] = d(namCua(i) + 2, 5, 25);
    R(i)[C.kham] = "";
  }
  for (let i = 0; i < tuVongMaThieuNgay; i++) {
    R(i)[C.ttNguoi] = V.tuVong;
    R(i)[C.ttDieuTri] = V.ketThuc;
    R(i)[C.kham] = "";
  }
  for (let i = 0; i < amTinhMaCoArv; i++) R(i)[C.ketQua] = "Âm tính";
  for (let i = 0; i < coLyDoThieuNgayKetThuc; i++) R(i)[C.lyDo] = "Chuyển đi";
  for (let i = 0; i < haiTrangThaiNguoc; i++) {
    R(i)[C.ttNguoi] = V.tuVong;
    R(i)[C.ttDieuTri] = V.dangDT;
    R(i)[C.tuVong] = d(namCua(i) + 2, 3, 3);
    R(i)[C.baoTuVong] = d(namCua(i) + 2, 3, 8);
    R(i)[C.kham] = "";
  }
  for (let i = 0; i < maTrungKhacGioi; i++) {
    // Hai dòng cùng mã, khác giới tính.
    R(soDong - 1 - i)[C.ma] = R(i)[C.ma];
    R(soDong - 1 - i)[C.gioi] = R(i)[C.gioi] === "Nam" ? "Nữ" : "Nam";
  }
  for (let i = 0; i < cccdTrungKhacMa; i++) {
    R(soDong - 1 - i)[C.cccd] = R(i)[C.cccd];
  }
  for (let i = 0; i < maLechKhuon; i++) R(i)[C.ma] = `BN${100 + i}`;
  for (let i = 0; i < dtThieuSoKhong; i++) R(i)[C.dt] = 912345670 + i; // số, 9 chữ số
  for (let i = 0; i < maDvLechTen; i++) R(i)[C.tenDv] = "Tỉnh ghi khác";

  return { ten: "DS Y", hang };
}

/**
 * Biểu Tư vấn xét nghiệm HIV — Bảng 2 Phụ lục 1/2/4 Thông tư 05.
 *
 * Bản mặc định điền ĐÚNG, dùng làm ca âm. Các tuỳ chọn bơm vào từng loại lỗi một
 * để đo đúng phép kiểm cần đo, không trộn nhiều lỗi vào một tệp.
 */
export function sinhBieuTuVanXetNghiem(tuyChon = {}) {
  const {
    lechSauChia = false, // mục 6 khác 6.1 + 6.2
    tongNhoHon = false, // cột tổng nhỏ hơn nam + nữ
    tongLonHon = false, // cột tổng lớn hơn nam + nữ
    soDangChuoi = false, // một ô ghi số dưới dạng chuỗi
    tronTrongVaKhong = false, // cùng một cột dùng cả ô trống và số 0
    conVuotCha = false, // mục 6.1 lớn hơn mục 6
  } = tuyChon;

  const d = (ma, nhan, nam, nu) => {
    let tong = nam == null ? "" : nam + nu;
    if (tong !== "" && tongNhoHon && ma === "1") tong = tong - 3;
    if (tong !== "" && tongLonHon && ma === "2") tong = tong + 4;
    return [ma, nhan, tong, nam == null ? "" : nam, nu == null ? "" : nu];
  };

  const sauMotNam = lechSauChia ? 9 : 7;
  const hang = [
    ["BÁO CÁO KẾT QUẢ HOẠT ĐỘNG PHÒNG, CHỐNG HIV/AIDS - CẤP TỈNH", "", "", "", ""],
    ["BẢNG 2: Tư vấn xét nghiệm HIV — Quý III/2026", "", "", "", ""],
    ["TT", "Nội dung báo cáo", "Tổng số", "Nam", "Nữ"],
    ["I", "Người từ 15 tuổi trở lên", "", "", ""],
    d("1", "Người sử dụng ma túy", 140, 12),
    d("2", "Người bán dâm", 3, 88),
    d("3", "Người có quan hệ tình dục đồng giới", 96, 0),
    d("4", "Người chuyển đổi giới tính (TG)", 4, 11),
    d("5", "Vợ, chồng, bạn tình, bạn chích của người nhiễm HIV", 31, 45),
    d("6", "Phụ nữ mang thai", 0, 12),
    d("6.1", "Thời kỳ mang thai", 0, conVuotCha ? 19 : sauMotNam),
    d("6.2", "Giai đoạn chuyển dạ, đẻ", 0, 5),
    d("7", "Bệnh nhân lao", 22, 9),
    d("8", "Can phạm, phạm nhân", 51, 2),
    d("9", "Bệnh nhân mắc các nhiễm trùng LTQĐTD", 17, 20),
    d("10", "Thanh niên khám tuyển nghĩa vụ quân sự", 63, 0),
    d("11", "Các đối tượng khác", 210, 180),
    ["II", "Trẻ em dưới 15 tuổi", 6, 4, 2],
  ];

  // Mục 6 phải bằng 6.1 + 6.2 theo phụ lục: 7 + 5 = 12.
  // Tìm dòng theo mã thay vì theo chỉ số, để thêm bớt dòng không làm lệch ca thử.
  const dongMa = (ma) => hang.find((h) => h[0] === ma);
  if (soDangChuoi) dongMa("10")[3] = "1.240"; // cột Nam ghi số dưới dạng chuỗi
  if (tronTrongVaKhong) {
    const h = dongMa("7");
    h[2] = "";
    h[3] = ""; // cột Nam để trống
    h[4] = 0; // cột Nữ ghi 0 — cùng cột với các ô trống ở dòng khác
  }

  return { ten: "TT05 Bang 2", oGop: [{ hangDau: 0, hangCuoi: 0, cotDau: 0, cotCuoi: 4 }], hang };
}

/**
 * Biểu Methadone — Bảng 3 Phụ lục 2/4 Thông tư 05.
 *
 * Biểu này là ca thử quan trọng nhất của quan hệ TẬP LỒNG: mục 1.2 (điều trị trên
 * 12 tháng) nằm trong mục 1.1 (trên 6 tháng). Ba mục con KHÔNG cộng lại thành mục
 * cha, nên bản đúng ở đây có tổng ba mục con lớn hơn mục cha — và máy không được
 * coi đó là lỗi.
 */
export function sinhBieuMethadone({ lechLong = false } = {}) {
  const hang = [
    ["BÁO CÁO QUÝ - CẤP TỈNH", "", "", "", ""],
    ["BẢNG 3: Điều trị nghiện các chất dạng thuốc phiện bằng thuốc thay thế (Methadone)", "", "", "", ""],
    ["TT", "Nội dung báo cáo", "Tổng", "Nam", "Nữ"],
    ["1", "Số bệnh nhân hiện đang điều trị Methadone tại thời điểm báo cáo", 420, 402, 18],
    ["1.1", "Số bệnh nhân điều trị trên 6 tháng", 380, 364, 16],
    ["1.2", "Số bệnh nhân điều trị trên 12 tháng", lechLong ? 395 : 351, lechLong ? 380 : 337, lechLong ? 15 : 14],
    ["1.3", "Số bệnh nhân HIV (+)", 64, 60, 4],
    ["2", "Số bệnh nhân nhận thuốc tại cơ sở điều trị", 300, 288, 12],
    ["3", "Số bệnh nhân nhận thuốc tại cơ sở cấp phát thuốc", 120, 114, 6],
    ["4", "Số bệnh nhân được cấp phát thuốc nhiều ngày", 96, 92, 4],
    ["5", "Số bệnh nhân bỏ điều trị trong kỳ báo cáo", 11, 10, 1],
  ];
  return { ten: "TT05 Bang 3", oGop: [{ hangDau: 0, hangCuoi: 0, cotDau: 0, cotCuoi: 4 }], hang };
}

/** Biểu duy trì PrEP báo cáo năm — Bảng 1 Phụ lục 3/5, có mốc thống kê 15/9–14/9. */
export function sinhBieuPrepNam({ duyTriVuot = false } = {}) {
  const hang = [
    ["BÁO CÁO NĂM - CẤP TỈNH", "", "", ""],
    ["BẢNG 1: Duy trì điều trị dự phòng trước phơi nhiễm HIV (PrEP) — Năm 2026", "", "", ""],
    ["TT", "Nội dung báo cáo", "Tổng", "MSM"],
    ["1", "Số khách hàng bắt đầu điều trị PrEP trong năm", 640, 520],
    ["2", "Số khách hàng bắt đầu điều trị PrEP trong năm duy trì điều trị trong 3 tháng liên tục", duyTriVuot ? 700 : 415, duyTriVuot ? 560 : 350],
    ["3", "Số khách hàng bắt đầu điều trị PrEP trong năm bỏ trị", 130, 96],
  ];
  return { ten: "TT05 PL5 Bang 1", oGop: [{ hangDau: 0, hangCuoi: 0, cotDau: 0, cotCuoi: 3 }], hang };
}

/**
 * Biểu hai phần La Mã dùng lại cùng dãy mã. Ca âm cho phép so dòng con với dòng
 * cha: mục 1.1 của phần II lớn hơn mục 1 của phần I, nhưng vẫn nhỏ hơn mục 1 của
 * chính phần II, nên không phải lỗi.
 */
export function sinhBieuHaiPhan() {
  return {
    ten: "Hai phan",
    oGop: [{ hangDau: 0, hangCuoi: 0, cotDau: 0, cotCuoi: 2 }],
    hang: [
      ["BÁO CÁO TỔNG HỢP HAI PHẦN", "", ""],
      ["TT", "Nội dung", "Số lượng"],
      ["I", "Số liệu trong quý", ""],
      ["1", "Chỉ tiêu thứ nhất", 10],
      ["1.1", "Trong đó phần chi tiết", 6],
      ["II", "Số liệu lũy tích từ đầu năm", ""],
      ["1", "Chỉ tiêu thứ nhất", 40],
      ["1.1", "Trong đó phần chi tiết", 25],
    ],
  };
}

/**
 * Danh sách nhân sự — trông giống danh sách cá nhân (có họ tên, năm sinh, giới
 * tính) nhưng KHÔNG phải tệp giám sát ca bệnh. Ca âm quan trọng nhất.
 */
export function sinhDanhSachNhanSu() {
  const hang = [["STT", "Họ tên", "Năm sinh", "Giới tính", "Chức vụ", "Đơn vị", "Ngày vào làm"]];
  for (let i = 0; i < 70; i++) {
    hang.push([
      i + 1,
      `Cán bộ ${i + 1}`,
      1975 + (i % 25),
      i % 2 ? "Nam" : "Nữ",
      i % 5 ? "Chuyên viên" : "Trưởng phòng",
      "Trung tâm Kiểm soát bệnh tật",
      `${String((i % 27) + 1).padStart(2, "0")}/0${(i % 9) + 1}/2019`,
    ]);
  }
  return { ten: "Nhan su", hang };
}
