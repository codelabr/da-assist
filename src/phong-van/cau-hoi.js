/**
 * Sinh câu hỏi phỏng vấn từ bằng chứng.
 *
 * BA KỶ LUẬT, vi phạm cái nào thì việc phỏng vấn thành một biểu mẫu 90 câu mà
 * không ai điền:
 *
 *   1. Chỉ hỏi khi câu trả lời LÀM ĐỔI MỘT QUYẾT ĐỊNH CỤ THỂ. Mỗi câu hỏi phải
 *      khai rõ nó phục vụ việc gì; không khai được thì không hỏi.
 *   2. Chỉ hỏi khi dữ liệu KHÔNG TỰ PHÂN GIẢI ĐƯỢC. Có một giá trị đủ để suy ra
 *      là khỏi hỏi.
 *   3. Hỏi bằng VÍ DỤ THẬT và HỆ QUẢ, không bằng thuật ngữ. Cán bộ trả lời được
 *      "gộp 12 hay gộp 27 bản ghi", chứ khó trả lời "khoá định danh là gì".
 */

import { gomBangChung } from "./bang-chung.js";

/** Các việc có thể kích hoạt phỏng vấn. */
export const VIEC = {
  GOP_TRUNG: "gop-trung",
  SUA_DU_LIEU: "sua-du-lieu",
  DUNG_BIEU_MAU: "dung-bieu-mau",
  PHAN_TICH: "phan-tich",
};

const NGHIA_O_TRONG = [
  {
    ma: "chua-xay-ra",
    nhan: "Việc này chưa xảy ra với những ca đó",
    moTa: "Ô trống là bình thường, không phải thiếu dữ liệu. Không đếm vào mẫu số.",
  },
  {
    ma: "chua-nhap",
    nhan: "Đã xảy ra nhưng chưa nhập vào hệ thống",
    moTa: "Ô trống là dữ liệu còn thiếu. Cần đưa vào danh sách phải bổ sung.",
  },
  {
    ma: "khong-ap-dung",
    nhan: "Không áp dụng cho những ca đó",
    moTa: "Ô trống là đúng và không bao giờ có giá trị. Loại khỏi mọi phép tính tỷ lệ.",
  },
  {
    ma: "khong-biet",
    nhan: "Chưa rõ",
    moTa: "Công cụ sẽ dùng cách xử lý an toàn nhất và ghi rõ là chưa xác định.",
  },
];

function viDuCua(c, soLuong = 3) {
  return c.mau.slice(0, soLuong);
}

/* ── Sinh câu hỏi theo từng loại bằng chứng ────────────────────────────── */

function hoiONgTrong(bc) {
  const ra = [];
  for (const nhom of bc.nhomTrong) {
    // Trống dưới 2% hoặc trên 99% thì gần như không đổi kết quả nào — không hỏi.
    if (nhom.tyLeTrong < 0.02 || nhom.tyLeTrong > 0.995) continue;
    const ten = nhom.cot.map((c) => c.ten);
    const nhieu = nhom.cot.length > 1;
    ra.push({
      ma: `TRONG:${nhom.cot.map((c) => c.chiSo).join("-")}`,
      loai: "o-trong",
      chiSoCot: nhom.cot.map((c) => c.chiSo),
      // KHÔNG gắn vào việc làm sạch: nghĩa của ô trống không làm đổi phép sửa nào,
      // nó chỉ đổi mẫu số khi tổng hợp. Gắn vào đó là hỏi thừa.
      viec: [VIEC.DUNG_BIEU_MAU, VIEC.PHAN_TICH],
      cot: ten,
      tieuDe: nhieu
        ? `${ten.length} cột luôn cùng trống hoặc cùng có giá trị`
        : `Cột “${ten[0]}” trống ở ${Math.round(nhom.tyLeTrong * 100)}% số dòng`,
      moTa: nhieu
        ? `Các cột ${ten.map((t) => `“${t}”`).join(", ")} trống ở đúng những dòng giống nhau — ` +
          `${Math.round(nhom.tyLeTrong * 100)}% số dòng. Ô trống ở nhóm này nghĩa là gì?`
        : `Ô trống ở cột này nghĩa là gì?`,
      viDu: viDuCua(nhom.cot[0]),
      luaChon: NGHIA_O_TRONG,
      goiY: null,
      viSaoHoi:
        "Trả lời khác nhau cho ra mẫu số khác nhau ở mọi phép tính tỷ lệ, và quyết định " +
        "ô trống có bị coi là lỗi thiếu dữ liệu hay không.",
    });
  }
  return ra;
}

function hoiKhoaNhanDang(bc, bang) {
  if (bc.ungVienKhoa.length < 2) return [];
  const luaChon = bc.ungVienKhoa.slice(0, 6).map((u) => ({
    ma: u.chiSoCot.join(","),
    nhan: u.ten.join(" + "),
    moTa:
      `${u.soNhom} nhóm nghi trùng · ${u.soDongThua} dòng thừa` +
      (u.soDongThieu ? ` · ${u.soDongThieu} dòng không đủ thông tin để so` : "") +
      (u.cotThua && u.cotThua.length
        ? ` · cột ${u.cotThua.join(", ")} không giúp phân biệt thêm`
        : ""),
    heQua: { soNhom: u.soNhom, soDongThua: u.soDongThua, soDongThieu: u.soDongThieu },
  }));
  luaChon.push({
    ma: "khong-gop",
    nhan: "Chưa gộp gì cả",
    moTa: "Chỉ đánh dấu các nhóm nghi trùng để xem, không thay đổi dữ liệu.",
  });

  const it = bc.ungVienKhoa[0];
  const nhieu = bc.ungVienKhoa[bc.ungVienKhoa.length - 1];
  return [
    {
      ma: "KHOA:nhan-dang",
      loai: "khoa-nhan-dang",
      chiSoCot: [...new Set(bc.ungVienKhoa.flatMap((u) => u.chiSoCot))],
      viec: [VIEC.GOP_TRUNG],
      cot: [],
      tieuDe: "Hai dòng thế nào thì được coi là cùng một người?",
      moTa:
        it.soDongThua === nhieu.soDongThua
          ? `Mọi bộ cột dưới đây đều cho ra ${it.soDongThua} dòng thừa trên tổng ` +
            `${bang.dong.length} — chọn bộ nào cũng ra cùng kết quả trên tệp này. ` +
            "Hãy chọn bộ mà đơn vị bạn coi là căn cứ nhận dạng, vì tệp sau có thể khác."
          : `Tuỳ bộ cột bạn chọn, số bản ghi bị gộp thay đổi từ ${it.soDongThua} đến ` +
            `${nhieu.soDongThua} dòng trên tổng ${bang.dong.length}. ` +
            "Hãy chọn theo hệ quả bên dưới.",
      viDu: [],
      luaChon,
      goiY: null,
      viSaoHoi:
        "Đây là quyết định làm đổi số ca sau khi làm sạch. Máy không được tự chọn thay bạn " +
        "vì gộp nhầm hai người khác nhau là mất một ca ra khỏi báo cáo.",
    },
  ];
}

function hoiCapMaNhan(bc) {
  return bc.capMaNhan.map((cap) => ({
    ma: `MANHAN:${cap.a.chiSo}-${cap.b.chiSo}`,
    loai: "cap-ma-nhan",
    chiSoCot: [cap.a.chiSo, cap.b.chiSo],
    viec: [VIEC.PHAN_TICH, VIEC.DUNG_BIEU_MAU],
    cot: [cap.a.ten, cap.b.ten],
    tieuDe: `“${cap.a.ten}” và “${cap.b.ten}” có phải cùng một thứ không?`,
    moTa:
      `Mỗi giá trị ở cột này luôn đi kèm đúng một giá trị ở cột kia, trên cả ${cap.soGiaTri} ` +
      "giá trị. Đó thường là cặp mã và tên của cùng một thứ.",
    viDu: cap.a.mau.slice(0, 2).map((x, i) => `${x}  →  ${cap.b.mau[i] ?? ""}`),
    luaChon: [
      { ma: "cap-ma-nhan", nhan: "Đúng, là mã và tên của cùng một thứ", moTa: "Công cụ chỉ dùng một cột khi tổng hợp, và hiện tên chứ không hiện mã." },
      { ma: "hai-thu-khac", nhan: "Không, là hai thứ khác nhau", moTa: "Công cụ giữ cả hai cột riêng biệt." },
    ],
    goiY: "cap-ma-nhan",
    viSaoHoi: "Nếu là cặp mã và tên mà tổng hợp cả hai thì cùng một thứ bị đếm hai lần.",
  }));
}

function hoiThuTuNgay(bc) {
  return bc.ngayMapHo.map((x) => ({
    ma: `NGAY:${x.cot.chiSo}`,
    loai: "thu-tu-ngay",
    chiSoCot: [x.cot.chiSo],
    viec: [VIEC.SUA_DU_LIEU, VIEC.DUNG_BIEU_MAU, VIEC.PHAN_TICH],
    cot: [x.cot.ten],
    tieuDe: `Cột “${x.cot.ten}” ghi ngày theo thứ tự nào?`,
    moTa:
      `Trong cột này không có giá trị nào có thành phần đầu lớn hơn 12, nên máy không tự ` +
      "phân giải được. Đọc sai thứ tự thì ngày và tháng đảo nhau ở toàn bộ cột.",
    viDu: viDuCua(x.cot),
    luaChon: [
      { ma: "ngay-truoc", nhan: "Ngày trước, tháng sau", moTa: "Ví dụ 05/06/2026 là ngày 5 tháng 6. Cách ghi thông dụng ở Việt Nam." },
      { ma: "thang-truoc", nhan: "Tháng trước, ngày sau", moTa: "Ví dụ 05/06/2026 là ngày 6 tháng 5. Thường gặp ở tệp xuất từ hệ thống nước ngoài." },
    ],
    goiY: "ngay-truoc",
    viSaoHoi: "Đọc sai thứ tự làm sai mọi phép tính theo thời gian và mọi bảng theo năm.",
  }));
}

function hoiDinhDanh(bc) {
  if (!bc.nghiDinhDanh.length) return [];
  const ten = bc.nghiDinhDanh.map((c) => c.ten);
  return [
    {
      ma: `DINHDANH:${bc.nghiDinhDanh.map((c) => c.chiSo).join("-")}`,
      loai: "dinh-danh",
      chiSoCot: bc.nghiDinhDanh.map((c) => c.chiSo),
      viec: [VIEC.PHAN_TICH, VIEC.DUNG_BIEU_MAU],
      cot: ten,
      tieuDe: `${ten.length} cột có thể chứa thông tin định danh trực tiếp`,
      moTa:
        `Các cột ${ten.map((t) => `“${t}”`).join(", ")} trông như thông tin xác định được ` +
        "một người cụ thể. Xác nhận để công cụ nhắc bạn trước khi kết quả rời khỏi máy.",
      viDu: [],
      luaChon: [
        { ma: "co", nhan: "Đúng, có thông tin định danh", moTa: "Công cụ cảnh báo trước khi xuất, và đề nghị tách bản làm việc đã bỏ các cột này." },
        { ma: "khong", nhan: "Không, đã khử danh tính rồi", moTa: "Công cụ không nhắc nữa cho tệp loại này." },
      ],
      goiY: "co",
      viSaoHoi:
        "Dữ liệu HIV thuộc nhóm nhạy cảm theo Nghị định 356 Điều 4 khoản 1 điểm d. " +
        "Biết cột nào định danh thì công cụ mới nhắc đúng lúc.",
    },
  ];
}

function hoiGiaTriHiem(bc) {
  const ra = [];
  for (const g of bc.giaTriHiem) {
    for (const h of g.hiem) {
      const troi = g.troi.map((t) => ({
        ma: "=" + t.mat,
        nhan: `Cùng nghĩa với “${t.mat}”`,
        moTa: `Đổi ${h.dem} dòng mang “${h.mat}” thành “${t.mat}” (${t.dem.toLocaleString("vi-VN")} dòng).`,
      }));
      ra.push({
        ma: `HIEM:${g.cot.chiSo}:${encodeURIComponent(h.mat)}`,
        loai: "gia-tri-hiem",
        chiSoCot: [g.cot.chiSo],
        viec: [VIEC.SUA_DU_LIEU, VIEC.DUNG_BIEU_MAU, VIEC.PHAN_TICH],
        cot: [g.cot.ten],
        tieuDe: `Giá trị “${h.mat}” ở cột “${g.cot.ten}” nghĩa là gì?`,
        moTa:
          `Giá trị này chỉ có ở ${h.dem} dòng, trong khi các giá trị phổ biến là ` +
          g.troi.map((t) => `“${t.mat}” (${t.dem.toLocaleString("vi-VN")} dòng)`).join(", ") +
          ". Máy không tự gán được, vì cùng một chữ viết tắt ở tệp khác lại mang nghĩa khác.",
        viDu: [],
        luaChon: [
          ...troi,
          { ma: "giu-rieng", nhan: "Là một giá trị riêng, giữ nguyên", moTa: "Không đổi gì. Bảng tổng hợp sẽ có thêm một nhóm." },
          { ma: "de-trong", nhan: "Là lỗi nhập, nên để trống", moTa: `Xoá giá trị ở ${h.dem} dòng, coi như chưa có thông tin.` },
        ],
        goiY: null,
        viSaoHoi:
          "Giá trị hiếm không được gộp thì bảng tổng hợp có thêm một nhóm nhỏ vô nghĩa; " +
          "gộp nhầm thì số liệu sai. Chỉ người biết nghiệp vụ mới quyết được.",
      });
    }
  }
  return ra;
}

/**
 * Sinh toàn bộ câu hỏi cho một bảng, rồi lọc theo việc đang làm và theo những
 * câu đã có trả lời trong hồ sơ đơn vị.
 *
 * @param {object} bang
 * @param {Map}    vaiTro     bản đồ vai trò từ hồ sơ nhận dạng, có thể rỗng
 * @param {object} tuyChon    { viec, daTraLoi }
 */
export function sinhCauHoi(
  bang,
  vaiTro = new Map(),
  { viec = null, cotLienQuan = null, daTraLoi = {} } = {}
) {
  const bc = gomBangChung(bang, vaiTro);
  const tatCa = [
    ...hoiKhoaNhanDang(bc, bang),
    ...hoiThuTuNgay(bc),
    ...hoiGiaTriHiem(bc),
    ...hoiONgTrong(bc),
    ...hoiCapMaNhan(bc),
    ...hoiDinhDanh(bc),
  ];
  // Lọc theo CỘT MÀ THAO TÁC THỰC SỰ CHẠM TỚI. Thiếu bộ lọc này thì bấm "sửa dữ
  // liệu" ở một cột lại phải trả lời câu hỏi về hai chục cột khác, và người dùng
  // bỏ giữa chừng. Kỷ luật số 1 nằm ở đây.
  const tap = cotLienQuan == null ? null : new Set(cotLienQuan);
  const canHoi = tatCa.filter((c) => {
    if (viec && !c.viec.includes(viec)) return false;
    if (daTraLoi[c.ma] !== undefined) return false;
    if (tap && !(c.chiSoCot || []).some((x) => tap.has(x))) return false;
    return true;
  });

  return { bangChung: bc, tatCa, canHoi };
}
