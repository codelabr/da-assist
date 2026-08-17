/**
 * Danh mục phân tích — bốn nhóm A, B, C, D.
 *
 * Mỗi phân tích khai rõ những VAI TRÒ CỘT nó cần. Bộ chạy đối chiếu với hồ sơ
 * nhận dạng rồi xếp vào một trong ba tình trạng:
 *
 *   chạy được          → có đủ cột và cột có dữ liệu
 *   cột có nhưng trống → hệ thống nguồn không xuất ra trường này
 *   thiếu cột          → tệp không có trường này
 *
 * Phân biệt hai tình trạng sau là điều bắt buộc. Bản xuất HIV-INFO thật có đủ
 * cột tải lượng vi rút và CD4 nhưng TRỐNG HOÀN TOÀN — nói "thiếu cột" là đổ lỗi
 * cho người dùng chọn nhầm tệp, trong khi lỗi nằm ở hệ thống nguồn.
 *
 * Mọi tỷ lệ đều kèm tử số và mẫu số. Không bao giờ đưa ra một tỷ lệ trần trụi.
 */

import { catTrang, chuanHoa } from "../tien-ich/chuoi.js";
import { KIEU } from "../bang/suy-kieu.js";
import { khoangKy, trongKhoang } from "../tien-ich/ngay.js";
import { docNgay } from "../ho-so/hivinfo-giam-sat-ca-benh.js";
import {
  bangCheo, bangDem, banDoGopCap, KHONG_RO, khoaPhanLoai,
  NHOM_TUOI, thongKe, tuoiTheoNam, xepNhomTuoi,
} from "./tien-ich.js";

const NAM = new Set(["nam", "m", "male", "1"]);
const NU = new Set(["nu", "f", "female", "2"]);

/** Bộ phụ trợ dựng một lần cho mỗi lượt chạy. */
export function phuTro(bang, vt, qd = {}) {
  const cot = (v) => (vt.get(v) == null ? -1 : vt.get(v));
  const o = (v, i) => {
    const c = cot(v);
    return c < 0 ? "" : bang.dong[i][c];
  };
  const ngay = (v, i) => docNgay(o(v, i));
  const namKd = (i) => {
    const d = ngay("ngay_khang_dinh", i);
    return d ? d.getUTCFullYear() : null;
  };
  const gioi = (i) => {
    const t = chuanHoa(o("gioi_tinh", i));
    if (NAM.has(t)) return "Nam";
    if (NU.has(t)) return "Nữ";
    return KHONG_RO;
  };
  const soDong = bang.dong.length;
  const moiDong = () => Array.from({ length: soDong }, (_, i) => i);

  return {
    bang, vt, qd, cot, o, ngay, namKd, gioi, soDong, moiDong,
    /** Chỉ những dòng có ngày khẳng định đọc được. */
    dongCoNam: () => moiDong().filter((i) => namKd(i) != null),
    kieuCot: (v) => {
      const c = cot(v);
      return c < 0 ? null : bang.cot[c] && bang.cot[c].kieu;
    },
    tenCot: (v) => {
      const c = cot(v);
      return c < 0 ? null : bang.tieuDe[c];
    },
  };
}

const sxNam = (a, b) => Number(a) - Number(b);
const GHI_CHU_TUOI =
  "Tuổi tính theo năm (năm phát hiện trừ năm sinh) vì tệp chỉ có năm sinh, " +
  "không có ngày sinh. Sai số tới một tuổi.";

/* ══════════════════════════════════════════════════════════════════
   NHÓM A — mô tả dịch tễ theo thời gian, con người, địa điểm
   ══════════════════════════════════════════════════════════════════ */

const NHOM_A = [
  {
    ma: "A1",
    nhom: "A",
    ten: "Số ca phát hiện theo năm",
    moTa: "Đếm ca theo năm của ngày xét nghiệm khẳng định, kèm đường xu hướng.",
    vaiTro: ["ngay_khang_dinh"],
    chay(p) {
      const b = bangDem(p.dongCoNam(), (i) => p.namKd(i), { tenCot: "Năm", sapTheoSo: false });
      return {
        bang: b,
        bieuDo: {
          loai: "duong",
          nhan: b.hang.map((h) => String(h[0])),
          chuoi: [{ ten: "Số ca phát hiện", gt: b.hang.map((h) => h[1]) }],
        },
        ghiChu: [
          `Mẫu số: ${p.dongCoNam().length} trên ${p.soDong} dòng có ngày khẳng định đọc được.`,
        ],
      };
    },
  },
  {
    ma: "A2",
    nhom: "A",
    ten: "Số ca phát hiện theo quý",
    moTa:
      "Cắt kỳ theo Thông tư 07 Điều 11 khoản 2 — từ ngày đầu đến ngày cuối của " +
      "quý dương lịch. KHÔNG dùng quy tắc 15 tháng trước đến 14 tháng cuối quý " +
      "của Thông tư 05, đó là chế độ báo cáo khác.",
    vaiTro: ["ngay_khang_dinh"],
    chay(p) {
      const b = bangCheo(
        p.dongCoNam(),
        (i) => p.namKd(i),
        (i) => `Quý ${Math.floor(p.ngay("ngay_khang_dinh", i).getUTCMonth() / 3) + 1}`,
        { sapHang: sxNam }
      );
      return {
        bang: b,
        bieuDo: {
          loai: "cot-chong",
          nhan: b.hang.map((h) => String(h[0])),
          chuoi: b.tieuDe.slice(1, -1).map((c, k) => ({
            ten: c, gt: b.hang.map((h) => h[k + 1]),
          })),
        },
        ghiChu: ["Căn cứ cắt kỳ: Thông tư 07/2023/TT-BYT Điều 11 khoản 2."],
        canCu: "Thông tư 07/2023/TT-BYT, Điều 11 khoản 2",
      };
    },
  },
  {
    ma: "A3",
    nhom: "A",
    ten: "Số ca phát hiện theo năm và giới tính",
    moTa: "Bảng chéo năm × giới tính.",
    vaiTro: ["ngay_khang_dinh", "gioi_tinh"],
    chay(p) {
      const b = bangCheo(p.dongCoNam(), (i) => p.namKd(i), (i) => p.gioi(i), { sapHang: sxNam });
      const khongRo = b.hang.reduce((t, h) => {
        const k = b.tieuDe.indexOf(KHONG_RO);
        return t + (k > 0 ? h[k] : 0);
      }, 0);
      return {
        bang: b,
        bieuDo: {
          loai: "cot-chong",
          nhan: b.hang.map((h) => String(h[0])),
          chuoi: b.tieuDe.slice(1, -1).map((c, k) => ({
            ten: c, gt: b.hang.map((h) => h[k + 1]),
          })),
        },
        ghiChu: khongRo
          ? [`Có ${khongRo} ca không đọc được giới tính, xếp vào cột “${KHONG_RO}”.`]
          : [],
      };
    },
  },
  {
    ma: "A4",
    nhom: "A",
    ten: "Số ca phát hiện theo năm và nhóm tuổi",
    moTa:
      "Nhóm tuổi mặc định lấy theo Phụ lục 9 Thông tư 07. Đổi được sang cách chia " +
      "của Thông tư 05, hoặc nhóm năm tuổi chi tiết.",
    vaiTro: ["ngay_khang_dinh", "nam_sinh"],
    tuyChon: {
      nhomTuoi: {
        ten: "Cách chia nhóm tuổi",
        macDinh: "tt07",
        muc: Object.values(NHOM_TUOI).map((x) => ({ ma: x.ma, ten: x.ten, canCu: x.canCu })),
      },
    },
    chay(p, tuyChon = {}) {
      const kieu = Object.values(NHOM_TUOI).find((x) => x.ma === (tuyChon.nhomTuoi || "tt07"))
        || NHOM_TUOI.TT07_PL9;
      const nhanTheoThuTu = [...kieu.nhan, KHONG_RO];
      const b = bangCheo(
        p.dongCoNam(),
        (i) => p.namKd(i),
        (i) => xepNhomTuoi(tuoiTheoNam(p.o("nam_sinh", i), p.namKd(i)), kieu),
        {
          sapHang: sxNam,
          sapCot: (a, z) => nhanTheoThuTu.indexOf(a) - nhanTheoThuTu.indexOf(z),
        }
      );
      return {
        bang: b,
        bieuDo: {
          loai: "cot-chong",
          nhan: b.hang.map((h) => String(h[0])),
          chuoi: b.tieuDe.slice(1, -1).map((c, k) => ({
            ten: c, gt: b.hang.map((h) => h[k + 1]),
          })),
        },
        ghiChu: [GHI_CHU_TUOI, `Cách chia nhóm: ${kieu.ten} — căn cứ ${kieu.canCu}.`],
        canCu: kieu.canCu,
      };
    },
  },
  {
    ma: "A5",
    nhom: "A",
    ten: "Số ca phát hiện theo năm và đường lây",
    moTa: "Bảng chéo năm × đường lây, có gộp mã con về mã cha nếu cột dùng mã phân cấp.",
    vaiTro: ["ngay_khang_dinh", "duong_lay"],
    chay(p) {
      const c = p.cot("duong_lay");
      const tap = [...new Set(p.bang.dong.map((d) => catTrang(d[c])).filter(Boolean))];
      const banDo = banDoGopCap(tap);
      const coGop = [...banDo.entries()].some(([k, v]) => k !== v);
      const b = bangCheo(
        p.dongCoNam(),
        (i) => p.namKd(i),
        (i) => banDo.get(catTrang(p.o("duong_lay", i))) || KHONG_RO,
        { sapHang: sxNam }
      );
      return {
        bang: b,
        bieuDo: {
          loai: "cot-chong",
          nhan: b.hang.map((h) => String(h[0])),
          chuoi: b.tieuDe.slice(1, -1).map((x, k) => ({
            ten: x, gt: b.hang.map((h) => h[k + 1]),
          })),
        },
        ghiChu: coGop
          ? ["Cột này dùng mã phân cấp, đã gộp mã con về mã cha để không đếm hai lần. Xem phân tích A10 để đối chiếu hai cách."]
          : [],
      };
    },
  },
  {
    ma: "A6",
    nhom: "A",
    ten: "Số ca phát hiện theo năm và đối tượng nguy cơ",
    moTa: "Bảng chéo năm × đối tượng.",
    vaiTro: ["ngay_khang_dinh", "doi_tuong"],
    chay(p) {
      const b = bangCheo(p.dongCoNam(), (i) => p.namKd(i),
        (i) => khoaPhanLoai(p.o("doi_tuong", i)), { sapHang: sxNam });
      return { bang: b, ghiChu: [] };
    },
  },
  {
    ma: "A7",
    nhom: "A",
    ten: "Phân bố ca theo địa bàn",
    moTa: "Xếp hạng xã, phường theo số ca. Dùng nơi ở hiện tại.",
    vaiTro: ["xa_hien_tai"],
    chay(p) {
      const b = bangDem(p.moiDong(), (i) => khoaPhanLoai(p.o("xa_hien_tai", i)),
        { tenCot: "Xã, phường", toiDa: 25 });
      return {
        bang: b,
        bieuDo: {
          loai: "cot",
          nhan: b.hang.slice(0, 12).map((h) => String(h[0])),
          chuoi: [{ ten: "Số ca", gt: b.hang.slice(0, 12).map((h) => h[1]) }],
        },
        ghiChu: [
          b.ghiChu,
          "Đối chiếu địa bàn nên theo MÃ XÃ chứ không theo tên — trùng tên xã giữa các tỉnh là chuyện bình thường.",
        ].filter(Boolean),
      };
    },
  },
  {
    ma: "A8",
    nhom: "A",
    ten: "Đối chiếu nơi thường trú với nơi hiện tại",
    moTa: "Bao nhiêu ca đang ở nơi khác với nơi thường trú, và cờ ngoại tỉnh đánh dấu bao nhiêu.",
    vaiTro: ["tinh_thuong_tru", "tinh_hien_tai"],
    chay(p) {
      let giong = 0;
      let khac = 0;
      let thieu = 0;
      for (const i of p.moiDong()) {
        const a = catTrang(p.o("tinh_thuong_tru", i));
        const b = catTrang(p.o("tinh_hien_tai", i));
        if (!a || !b) thieu++;
        else if (chuanHoa(a) === chuanHoa(b)) giong++;
        else khac++;
      }
      const tong = giong + khac + thieu;
      const hang = [
        ["Cùng tỉnh thường trú và hiện tại", giong, tong ? giong / tong : 0],
        ["Khác tỉnh", khac, tong ? khac / tong : 0],
        ["Thiếu một trong hai thông tin", thieu, tong ? thieu / tong : 0],
      ];
      const ra = {
        bang: { tieuDe: ["Tình trạng", "Số ca", "Tỷ lệ"], dinhDang: ["chu", "so", "ty-le"],
          hang, tongCot: ["Tổng", tong, 1], tongChung: tong },
        ghiChu: [],
      };
      if (p.cot("ngoai_tinh") >= 0) {
        let coDau = 0;
        for (const i of p.moiDong()) {
          const t = chuanHoa(p.o("ngoai_tinh", i));
          if (t === "x" || t === "co" || t === "1") coDau++;
        }
        ra.bangPhu = [{
          ten: `Cột “${p.tenCot("ngoai_tinh")}”`,
          bang: {
            tieuDe: ["Giá trị", "Số ca", "Tỷ lệ"],
            dinhDang: ["chu", "so", "ty-le"],
            hang: [
              ["Có đánh dấu", coDau, p.soDong ? coDau / p.soDong : 0],
              ["Không đánh dấu", p.soDong - coDau, p.soDong ? (p.soDong - coDau) / p.soDong : 0],
            ],
            tongCot: ["Tổng", p.soDong, 1],
            tongChung: p.soDong,
          },
        }];
        ra.ghiChu.push(
          "Công cụ chỉ đếm cột này, không diễn giải nó. Ý nghĩa của cột do bạn cho biết ở phần hỏi đáp."
        );
      }
      return ra;
    },
  },
  {
    ma: "A9",
    nhom: "A",
    ten: "Cơ cấu nghề nghiệp và dân tộc",
    moTa: "Hai bảng đếm, xếp theo số ca giảm dần.",
    vaiTro: ["nghe_nghiep"],
    chay(p) {
      const b = bangDem(p.moiDong(), (i) => khoaPhanLoai(p.o("nghe_nghiep", i)),
        { tenCot: "Nghề nghiệp", toiDa: 20 });
      const ra = { bang: b, ghiChu: [b.ghiChu].filter(Boolean), bangPhu: [] };
      if (p.cot("dan_toc") >= 0) {
        ra.bangPhu.push({
          ten: "Dân tộc",
          bang: bangDem(p.moiDong(), (i) => khoaPhanLoai(p.o("dan_toc", i)),
            { tenCot: "Dân tộc", toiDa: 15 }),
        });
      }
      return ra;
    },
  },
  {
    ma: "A10",
    nhom: "A",
    ten: "Đối chiếu hai cách tổng hợp mã phân cấp",
    moTa:
      "Cột dùng mã phân cấp cho ra hai kết quả khác nhau tuỳ cách tổng hợp. " +
      "Bảng này đặt hai cách cạnh nhau để bạn thấy chênh lệch trước khi chọn.",
    vaiTro: ["duong_lay"],
    chay(p) {
      const c = p.cot("duong_lay");
      const tap = [...new Set(p.bang.dong.map((d) => catTrang(d[c])).filter(Boolean))];
      const banDo = banDoGopCap(tap);
      const coGop = [...banDo.entries()].some(([k, v]) => k !== v);
      const tho = bangDem(p.moiDong(), (i) => khoaPhanLoai(p.o("duong_lay", i)),
        { tenCot: "Giá trị nguyên trong tệp" });
      if (!coGop) {
        return {
          bang: tho,
          ghiChu: ["Cột này không dùng mã phân cấp, hai cách tổng hợp cho cùng một kết quả."],
        };
      }
      const gop = bangDem(p.moiDong(),
        (i) => banDo.get(catTrang(p.o("duong_lay", i))) || KHONG_RO,
        { tenCot: "Sau khi gộp về mã cha" });
      return {
        bang: tho,
        bangPhu: [{ ten: "Sau khi gộp mã con về mã cha", bang: gop }],
        ghiChu: [
          `Cột này có ${tap.length} giá trị nguyên, gộp lại còn ${gop.hang.length} nhóm.`,
          "Tổng hợp thẳng theo giá trị nguyên sẽ đếm song song hai cấp và ra bảng sai.",
        ],
      };
    },
  },
  {
    ma: "A11",
    nhom: "A",
    ten: "Dấu hiệu chùm ca theo thời gian và địa điểm",
    moTa:
      "Tìm những tháng mà một địa bàn có số ca vượt hẳn mức thường thấy của chính " +
      "địa bàn đó. Đây là DẤU HIỆU CẦN ĐIỀU TRA, không phải kết luận có chùm ca.",
    vaiTro: ["ngay_khang_dinh", "xa_hien_tai"],
    chay(p) {
      const theoDiaBan = new Map();
      let thangDau = null;
      let thangCuoi = null;
      for (const i of p.dongCoNam()) {
        const d = p.ngay("ngay_khang_dinh", i);
        const xa = khoaPhanLoai(p.o("xa_hien_tai", i));
        const moc = d.getUTCFullYear() * 12 + d.getUTCMonth();
        if (thangDau == null || moc < thangDau) thangDau = moc;
        if (thangCuoi == null || moc > thangCuoi) thangCuoi = moc;
        const thang = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        if (!theoDiaBan.has(xa)) theoDiaBan.set(xa, new Map());
        const m = theoDiaBan.get(xa);
        m.set(thang, (m.get(thang) || 0) + 1);
      }

      // Mức nền phải tính trên TOÀN BỘ khoảng quan sát, không phải chỉ những
      // tháng có ca. Chia cho số tháng có ca sẽ đẩy mức nền lên xấp xỉ 1 ca mỗi
      // tháng dù thực tế thưa hơn nhiều, và khi đó ngưỡng cao đến mức không bao
      // giờ có cảnh báo nào — đo trên bản xuất thật thì ra đúng không dòng nào.
      const soThangQuanSat = Math.max(1, (thangCuoi - thangDau) + 1);

      const hang = [];
      for (const [xa, m] of theoDiaBan) {
        const tong = [...m.values()].reduce((a, b) => a + b, 0);
        if (tong < 6) continue;
        const tb = tong / soThangQuanSat;
        const nguong = tb + 2 * Math.sqrt(tb);
        for (const [thang, n] of m) {
          if (n >= 3 && n > nguong) {
            hang.push([xa, thang, n, Number(tb.toFixed(2)), Number(nguong.toFixed(2))]);
          }
        }
      }
      hang.sort((a, b) => b[2] - a[2] || String(b[1]).localeCompare(String(a[1])));

      return {
        bang: {
          tieuDe: ["Địa bàn", "Tháng", "Số ca", "Mức thường thấy", "Ngưỡng cảnh báo"],
          dinhDang: ["chu", "chu", "so", "so-le", "so-le"],
          hang,
          tongCot: null,
          tongChung: hang.length,
        },
        ghiChu: [
          "Định nghĩa chùm ca theo thời gian và địa điểm: số người được chẩn đoán HIV " +
            "vượt quá số dự tính bình thường trong một khoảng thời gian xác định tại một " +
            "khu vực địa lý nhất định — Quyết định 286/QĐ-BYT ngày 22/01/2025.",
          "Cách tính của công cụ: với mỗi địa bàn có từ 6 ca trở lên, mức thường thấy là số " +
            "ca trung bình mỗi tháng của chính địa bàn đó tính trên TOÀN BỘ khoảng thời gian " +
            "tệp bao phủ; ngưỡng cảnh báo bằng mức thường thấy cộng hai lần căn bậc hai của " +
            "nó; chỉ nêu tháng có từ 3 ca trở lên.",
          "Đây là dấu hiệu để rà soát, KHÔNG phải kết luận. Xác định chùm ca phải qua điều " +
            "tra dịch tễ học theo hướng dẫn chuyên môn.",
          "Chùm ca theo đặc điểm sinh học phân tử không tính được từ tệp Excel, vì cần kết " +
            "quả giải trình tự gen.",
        ],
        canCu: "Quyết định 286/QĐ-BYT ngày 22/01/2025",
      };
    },
  },
];

/* ══════════════════════════════════════════════════════════════════
   NHÓM B — chất lượng và độ trễ của hệ thống giám sát
   ══════════════════════════════════════════════════════════════════ */

function bangDoTre(p, tuVaiTro, denVaiTro, { moc = [7, 30, 90] } = {}) {
  const ngay = [];
  let thieu = 0;
  let am = 0;
  for (const i of p.moiDong()) {
    const a = p.ngay(tuVaiTro, i);
    const b = p.ngay(denVaiTro, i);
    if (!a || !b) { thieu++; continue; }
    const d = Math.round((b.getTime() - a.getTime()) / 86400000);
    if (d < 0) { am++; continue; }
    ngay.push(d);
  }
  const tk = thongKe(ngay);
  const nhan = [];
  const dem = [];
  let truoc = -1;
  for (const m of moc) {
    nhan.push(truoc < 0 ? `Trong ${m} ngày` : `${truoc + 1}–${m} ngày`);
    dem.push(ngay.filter((x) => x > truoc && x <= m).length);
    truoc = m;
  }
  nhan.push(`Trên ${truoc} ngày`);
  dem.push(ngay.filter((x) => x > truoc).length);

  const tong = ngay.length;
  return {
    tk,
    tong,
    thieu,
    am,
    bang: {
      tieuDe: ["Khoảng độ trễ", "Số ca", "Tỷ lệ"],
      dinhDang: ["chu", "so", "ty-le"],
      hang: nhan.map((n, k) => [n, dem[k], tong ? dem[k] / tong : 0]),
      tongCot: ["Tổng", tong, tong ? 1 : 0],
      tongChung: tong,
    },
    bieuDo: { loai: "cot", nhan, chuoi: [{ ten: "Số ca", gt: dem }] },
  };
}

function ghiChuDoTre(p, r, tenTu, tenDen) {
  const g = [];
  if (r.tk.soCa) {
    g.push(
      `Trung vị ${r.tk.trungVi} ngày · tứ phân vị ${r.tk.q1}–${r.tk.q3} ngày · ` +
      `ngắn nhất ${r.tk.nhoNhat} · dài nhất ${r.tk.lonNhat} ngày.`
    );
  }
  g.push(`Mẫu số: ${r.tong} ca có đủ cả hai mốc “${tenTu}” và “${tenDen}”.`);
  if (r.thieu) g.push(`${r.thieu} ca thiếu một trong hai mốc nên không tính được.`);
  if (r.am) {
    g.push(
      `${r.am} ca có mốc sau nằm TRƯỚC mốc đầu — đã loại khỏi phép tính. ` +
      "Đây là mâu thuẫn ngày tháng, xem phần rà soát."
    );
  }
  return g;
}

const NHOM_B = [
  {
    ma: "B1",
    nhom: "B",
    ten: "Độ trễ từ xét nghiệm khẳng định đến chuyển giám sát ca bệnh",
    moTa: "Trung vị, tứ phân vị và phân nhóm theo khoảng độ trễ.",
    vaiTro: ["ngay_khang_dinh", "ngay_chuyen_giam_sat"],
    chay(p) {
      const r = bangDoTre(p, "ngay_khang_dinh", "ngay_chuyen_giam_sat");
      return {
        bang: r.bang,
        bieuDo: r.bieuDo,
        ghiChu: ghiChuDoTre(p, r, p.tenCot("ngay_khang_dinh"), p.tenCot("ngay_chuyen_giam_sat")),
      };
    },
  },
  {
    ma: "B2",
    nhom: "B",
    ten: "Độ trễ từ xét nghiệm khẳng định đến ngày nhập liệu",
    moTa: "Đo khoảng cách giữa lúc có kết quả và lúc bản ghi vào hệ thống.",
    vaiTro: ["ngay_khang_dinh", "ngay_nhap_lieu"],
    chay(p) {
      const r = bangDoTre(p, "ngay_khang_dinh", "ngay_nhap_lieu", { moc: [30, 90, 365] });
      return {
        bang: r.bang,
        bieuDo: r.bieuDo,
        ghiChu: ghiChuDoTre(p, r, p.tenCot("ngay_khang_dinh"), p.tenCot("ngay_nhap_lieu")),
      };
    },
  },
  {
    ma: "B3",
    nhom: "B",
    ten: "Tính kịp thời: ca phát hiện trong năm có được nhập ngay trong năm đó không",
    moTa:
      "Chỉ số then chốt của giám sát bệnh truyền nhiễm. Số liệu một năm chỉ dùng " +
      "được nếu phần lớn ca của năm ấy đã vào hệ thống trước khi năm kết thúc.",
    vaiTro: ["ngay_khang_dinh", "ngay_nhap_lieu"],
    chay(p) {
      const hang = [];
      const theoNam = new Map();
      for (const i of p.dongCoNam()) {
        const kd = p.ngay("ngay_khang_dinh", i);
        const nl = p.ngay("ngay_nhap_lieu", i);
        const n = kd.getUTCFullYear();
        if (!theoNam.has(n)) theoNam.set(n, { trong: 0, sau: 0, thieu: 0 });
        const o = theoNam.get(n);
        if (!nl) o.thieu++;
        else if (nl <= khoangKy({ nam: n }).den) o.trong++;
        else o.sau++;
      }
      for (const n of [...theoNam.keys()].sort(sxNam)) {
        const o = theoNam.get(n);
        const tong = o.trong + o.sau + o.thieu;
        hang.push([n, o.trong, o.sau, o.thieu, tong, tong ? o.trong / tong : 0]);
      }
      return {
        bang: {
          tieuDe: ["Năm phát hiện", "Nhập trong năm", "Nhập sau khi năm kết thúc",
            "Thiếu ngày nhập liệu", "Tổng", "Tỷ lệ kịp thời"],
          dinhDang: ["chu", "so", "so", "so", "so", "ty-le"],
          hang,
          tongCot: null,
          tongChung: hang.reduce((t, h) => t + h[4], 0),
        },
        bieuDo: {
          loai: "cot-chong",
          nhan: hang.map((h) => String(h[0])),
          chuoi: [
            { ten: "Nhập trong năm", gt: hang.map((h) => h[1]) },
            { ten: "Nhập sau", gt: hang.map((h) => h[2]) },
            { ten: "Thiếu ngày", gt: hang.map((h) => h[3]) },
          ],
        },
        ghiChu: [
          "Năm gần nhất luôn có tỷ lệ kịp thời cao giả tạo, vì những ca nhập muộn của " +
            "năm ấy còn chưa xảy ra. Đọc cột này theo xu hướng nhiều năm, đừng đọc một năm lẻ.",
        ],
      };
    },
  },
  {
    ma: "B4",
    nhom: "B",
    ten: "Độ đầy đủ của từng cột",
    moTa:
      "Tỷ lệ ô có dữ liệu ở từng cột, chia ba nhóm. Cột trống hoàn toàn trong một " +
      "bản xuất thường là đặc điểm của hệ thống nguồn, KHÔNG phải lỗi nhập liệu.",
    vaiTro: [],
    chay(p) {
      const n = p.soDong;
      const hang = p.bang.cot.map((c) => {
        const ty = n ? c.soODay / n : 0;
        const xep = c.soODay === 0 ? "Trống hoàn toàn"
          : ty >= 0.999 ? "Đầy đủ" : "Điền một phần";
        return [c.ten || `cột ${c.chiSo + 1}`, c.soODay, n - c.soODay, ty, xep];
      });
      hang.sort((a, b) => a[3] - b[3]);
      const dem = (x) => hang.filter((h) => h[4] === x).length;
      return {
        bang: {
          tieuDe: ["Cột", "Số ô có dữ liệu", "Số ô trống", "Tỷ lệ điền", "Xếp loại"],
          dinhDang: ["chu", "so", "so", "ty-le", "chu"],
          hang,
          tongCot: null,
          tongChung: hang.length,
        },
        ghiChu: [
          `${dem("Đầy đủ")} cột đầy đủ · ${dem("Điền một phần")} cột điền một phần · ` +
            `${dem("Trống hoàn toàn")} cột trống hoàn toàn.`,
          "Ba trường hợp KHÔNG phải lỗi, cần phân biệt: cột trống hoàn toàn là đặc điểm " +
            "của bản tải về; ô trống trong khối điều trị nghĩa là chưa có thông tin, không " +
            "phải “chưa điều trị”; và ô trống ở nhóm xét nghiệm nghĩa là chưa làm xét nghiệm.",
        ],
      };
    },
  },
  {
    ma: "B5",
    nhom: "B",
    ten: "Bản ghi trùng và nghi trùng",
    moTa: "Đối chiếu số dòng trùng máy tìm được với cột trạng thái nghi trùng của hệ thống.",
    vaiTro: [],
    chay(p, tuyChon, phatHien = []) {
      const kc12 = phatHien.find((x) => x.ma === "KC12");
      const hang = [["Dòng trùng trên mọi cột mang thông tin", kc12 ? kc12.soDong : 0]];
      if (p.cot("nghi_trung") >= 0) {
        let co = 0;
        for (const i of p.moiDong()) {
          const t = chuanHoa(p.o("nghi_trung", i));
          if (t && t !== "khong" && t !== "0") co++;
        }
        hang.push([`Dòng được hệ thống đánh dấu nghi trùng`, co]);
      }
      return {
        bang: { tieuDe: ["Loại", "Số dòng"], dinhDang: ["chu", "so"], hang, tongCot: null, tongChung: hang.length },
        ghiChu: [
          "Trùng hoàn toàn và nghi trùng là hai chuyện khác nhau: trùng hoàn toàn máy " +
            "chắc chắn và sửa được; nghi trùng cần người xem từng cặp.",
          "Muốn chọn bộ cột làm căn cứ nhận dạng người, dùng mục Tìm bản ghi trùng.",
        ],
      };
    },
  },
  {
    ma: "B6",
    nhom: "B",
    ten: "Mâu thuẫn logic ngày tháng",
    moTa: "Tổng hợp các cặp mốc thời gian sai thứ tự mà phần rà soát đã tìm ra.",
    vaiTro: [],
    chay(p, tuyChon, phatHien = []) {
      const hang = phatHien
        .filter((x) => /^LC0[1-6]$/.test(x.ma))
        .map((x) => [x.cot, x.soDong, x.moTa]);
      return {
        bang: {
          tieuDe: ["Cặp mốc", "Số dòng", "Mô tả"],
          dinhDang: ["chu", "so", "chu"],
          hang,
          tongCot: null,
          tongChung: hang.reduce((t, h) => t + h[1], 0),
        },
        ghiChu: hang.length ? [] : ["Không tìm thấy mâu thuẫn thứ tự ngày tháng nào."],
      };
    },
  },
  {
    ma: "B7",
    nhom: "B",
    ten: "Giá trị nằm ngoài bảng mã của văn bản",
    moTa: "Tổng hợp các cột có giá trị ngoài danh mục quy định.",
    vaiTro: [],
    chay(p, tuyChon, phatHien = []) {
      const hang = phatHien
        .filter((x) => x.ma === "HS-TGT")
        .map((x) => [x.cot, x.soDong, (x.viDu || []).slice(0, 3).join(" · "), x.canCu || ""]);
      return {
        bang: {
          tieuDe: ["Cột", "Số dòng", "Ví dụ giá trị lạ", "Căn cứ"],
          dinhDang: ["chu", "so", "chu", "chu"],
          hang,
          tongCot: null,
          tongChung: hang.reduce((t, h) => t + h[1], 0),
        },
        ghiChu: [
          "Giá trị ngoài bảng mã KHÔNG chắc chắn là lỗi — hệ thống nguồn có thể dùng " +
            "danh mục mở rộng hợp lệ. Cần người đối chiếu.",
        ],
      };
    },
  },
  {
    ma: "B8",
    nhom: "B",
    ten: "Đối chiếu các cột nói về tử vong",
    moTa: "Ba cột cùng nói về tử vong thường cho ba con số khác nhau.",
    vaiTro: ["trang_thai_nguoi_nhiem"],
    chay(p) {
      const hang = [];
      const dem = (vaiTro, hop) => {
        if (p.cot(vaiTro) < 0) return null;
        let n = 0;
        for (const i of p.moiDong()) if (hop(p, i)) n++;
        return n;
      };
      const them = (ten, vaiTro, hop) => {
        const n = dem(vaiTro, hop);
        if (n != null) hang.push([ten, n]);
      };
      them(`Cột “${p.tenCot("trang_thai_nguoi_nhiem")}” = tử vong`, "trang_thai_nguoi_nhiem",
        (q, i) => ["tu vong", "da tu vong"].includes(chuanHoa(q.o("trang_thai_nguoi_nhiem", i))));
      them(`Cột “${p.tenCot("trang_thai_dieu_tri")}” = tử vong`, "trang_thai_dieu_tri",
        (q, i) => chuanHoa(q.o("trang_thai_dieu_tri", i)) === "tu vong");
      them(`Cột “${p.tenCot("ly_do_ket_thuc")}” = tử vong`, "ly_do_ket_thuc",
        (q, i) => ["death", "tu vong"].includes(chuanHoa(q.o("ly_do_ket_thuc", i))));
      them(`Cột “${p.tenCot("ngay_tu_vong")}” có giá trị`, "ngay_tu_vong",
        (q, i) => !!q.ngay("ngay_tu_vong", i));

      const so = hang.map((h) => h[1]);
      const lech = so.length > 1 && Math.max(...so) !== Math.min(...so);
      return {
        bang: { tieuDe: ["Cách đếm", "Số ca"], dinhDang: ["chu", "so"], hang, tongCot: null, tongChung: hang.length },
        ghiChu: lech
          ? [
              `Bốn cách đếm cho ra số khác nhau, chênh lệch lớn nhất ${Math.max(...so) - Math.min(...so)} ca.`,
              "Phụ lục 4 Thông tư 07 đếm theo trạng thái người nhiễm. Chọn một cột làm chuẩn " +
                "rồi rà soát các dòng lệch.",
            ]
          : ["Các cách đếm khớp nhau."],
      };
    },
  },
  {
    ma: "B9",
    nhom: "B",
    ten: "Đối chiếu trạng thái điều trị với ngày và lý do kết thúc",
    moTa: "Bảng chéo giữa trạng thái điều trị và việc có hay không có ngày kết thúc.",
    vaiTro: ["trang_thai_dieu_tri", "ngay_ket_thuc"],
    chay(p) {
      const b = bangCheo(p.moiDong(),
        (i) => khoaPhanLoai(p.o("trang_thai_dieu_tri", i)),
        (i) => (p.ngay("ngay_ket_thuc", i) ? "Có ngày kết thúc" : "Không có ngày kết thúc"));
      return {
        bang: b,
        ghiChu: [
          "Dòng “Đang điều trị” mà lại có ngày kết thúc, hoặc dòng đã kết thúc mà không có " +
            "ngày, đều là chỗ cần rà lại.",
        ],
      };
    },
  },
];

/* ══════════════════════════════════════════════════════════════════
   NHÓM C — điều trị và kết cục
   ══════════════════════════════════════════════════════════════════ */

const NHOM_C = [
  {
    ma: "C1",
    nhom: "C",
    ten: "Tỷ lệ ca có hồ sơ điều trị và cơ cấu trạng thái điều trị",
    moTa: "Bao nhiêu ca có thông tin điều trị, và họ đang ở trạng thái nào.",
    vaiTro: ["trang_thai_dieu_tri"],
    chay(p) {
      let co = 0;
      for (const i of p.moiDong()) if (catTrang(p.o("trang_thai_dieu_tri", i))) co++;
      const b = bangDem(p.moiDong().filter((i) => catTrang(p.o("trang_thai_dieu_tri", i))),
        (i) => khoaPhanLoai(p.o("trang_thai_dieu_tri", i)), { tenCot: "Trạng thái điều trị" });
      return {
        bang: b,
        ghiChu: [
          `${co} trên ${p.soDong} ca có thông tin điều trị (${p.soDong ? Math.round((co / p.soDong) * 1000) / 10 : 0}%).`,
          "Ô trống ở khối điều trị nghĩa là CHƯA CÓ THÔNG TIN, không phải “chưa điều trị”.",
        ],
      };
    },
  },
  {
    ma: "C2",
    nhom: "C",
    ten: "Độ trễ từ xét nghiệm khẳng định đến khi bắt đầu ARV",
    moTa: "Trung vị và tỷ lệ bắt đầu điều trị trong 7 ngày, 30 ngày.",
    vaiTro: ["ngay_khang_dinh", "ngay_arv"],
    chay(p) {
      const r = bangDoTre(p, "ngay_khang_dinh", "ngay_arv", { moc: [7, 30, 90] });
      const g = ghiChuDoTre(p, r, p.tenCot("ngay_khang_dinh"), p.tenCot("ngay_arv"));
      if (r.tong) {
        const trong7 = r.bang.hang[0][1];
        const trong30 = trong7 + r.bang.hang[1][1];
        g.unshift(
          `Bắt đầu ARV trong 7 ngày: ${trong7}/${r.tong} ca (${Math.round((trong7 / r.tong) * 1000) / 10}%) · ` +
          `trong 30 ngày: ${trong30}/${r.tong} ca (${Math.round((trong30 / r.tong) * 1000) / 10}%).`
        );
      }
      return { bang: r.bang, bieuDo: r.bieuDo, ghiChu: g };
    },
  },
  {
    ma: "C3",
    nhom: "C",
    ten: "Cơ cấu phác đồ ARV đang dùng",
    moTa: "Đếm ca theo phác đồ hiện tại.",
    vaiTro: ["phac_do"],
    chay(p) {
      const ds = p.moiDong().filter((i) => catTrang(p.o("phac_do", i)));
      const b = bangDem(ds, (i) => khoaPhanLoai(p.o("phac_do", i)),
        { tenCot: "Phác đồ", toiDa: 20 });
      return {
        bang: b,
        ghiChu: [
          `Mẫu số: ${ds.length} ca có ghi phác đồ.`,
          b.ghiChu,
        ].filter(Boolean),
      };
    },
  },
  {
    ma: "C4",
    nhom: "C",
    ten: "Kết thúc điều trị, lý do, và tử vong theo năm",
    moTa: "Cơ cấu lý do kết thúc, và số ca tử vong theo từng năm.",
    vaiTro: ["ly_do_ket_thuc"],
    chay(p) {
      const ds = p.moiDong().filter((i) => catTrang(p.o("ly_do_ket_thuc", i)));
      const b = bangDem(ds, (i) => khoaPhanLoai(p.o("ly_do_ket_thuc", i)),
        { tenCot: "Lý do kết thúc" });
      const ra = { bang: b, ghiChu: [`Mẫu số: ${ds.length} ca đã kết thúc điều trị.`], bangPhu: [] };

      if (p.cot("ngay_tu_vong") >= 0) {
        const tv = p.moiDong().filter((i) => p.ngay("ngay_tu_vong", i));
        ra.bangPhu.push({
          ten: "Tử vong theo năm",
          bang: bangDem(tv, (i) => p.ngay("ngay_tu_vong", i).getUTCFullYear(),
            { tenCot: "Năm tử vong", sapTheoSo: false }),
        });
        ra.ghiChu.push(`${tv.length} ca có ngày tử vong.`);
      }
      return ra;
    },
  },
  {
    ma: "C5",
    nhom: "C",
    ten: "Ức chế vi rút",
    moTa:
      "Tỷ lệ ca có tải lượng dưới 1.000 và dưới 200 bản sao mỗi mililít. Ngưỡng " +
      "1.000 là ngưỡng báo cáo của Thông tư 05; ngưỡng 200 là ngưỡng không lây " +
      "truyền qua đường tình dục theo Quyết định 5968.",
    vaiTro: ["tai_luong_gan_nhat"],
    chay(p) {
      const so = [];
      for (const i of p.moiDong()) {
        const v = Number(String(p.o("tai_luong_gan_nhat", i)).replace(/[^\d.]/g, ""));
        if (Number.isFinite(v) && String(p.o("tai_luong_gan_nhat", i)).trim() !== "") so.push(v);
      }
      const duoi = (n) => so.filter((x) => x < n).length;
      const hang = [
        ["Dưới 200 bản sao/mL", duoi(200), so.length ? duoi(200) / so.length : 0],
        ["Dưới 1.000 bản sao/mL", duoi(1000), so.length ? duoi(1000) / so.length : 0],
        ["Từ 1.000 bản sao/mL trở lên", so.length - duoi(1000),
          so.length ? (so.length - duoi(1000)) / so.length : 0],
      ];
      return {
        bang: { tieuDe: ["Mức", "Số ca", "Tỷ lệ"], dinhDang: ["chu", "so", "ty-le"],
          hang, tongCot: ["Có kết quả", so.length, 1], tongChung: so.length },
        ghiChu: [
          `Mẫu số: ${so.length} trên ${p.soDong} ca có kết quả tải lượng.`,
          "Ngưỡng 1.000 bản sao/mL: Thông tư 05/2023/TT-BYT, Bảng 4 mục II — chỉ số của mục tiêu 95 thứ ba.",
          "Ngưỡng 200 bản sao/mL: Quyết định 5968/QĐ-BYT — mức không lây truyền qua đường tình dục.",
          "Thất bại điều trị về vi rút học là trên 1.000 bản sao/mL, theo Quyết định 5968.",
        ],
        canCu: "Thông tư 05/2023/TT-BYT Bảng 4; Quyết định 5968/QĐ-BYT",
      };
    },
  },
  {
    ma: "C6",
    nhom: "C",
    ten: "Bệnh HIV tiến triển theo CD4",
    moTa: "Tỷ lệ ca có CD4 dưới 200 tế bào mỗi milimét khối.",
    vaiTro: ["cd4_gan_nhat"],
    chay(p) {
      const so = [];
      for (const i of p.moiDong()) {
        const t = String(p.o("cd4_gan_nhat", i)).trim();
        if (!t) continue;
        const v = Number(t.replace(/[^\d.]/g, ""));
        if (Number.isFinite(v)) so.push(v);
      }
      const duoi = (n) => so.filter((x) => x < n).length;
      const hang = [
        ["Dưới 200 tế bào/mm³", duoi(200), so.length ? duoi(200) / so.length : 0],
        ["200–349", so.filter((x) => x >= 200 && x < 350).length,
          so.length ? so.filter((x) => x >= 200 && x < 350).length / so.length : 0],
        ["Từ 350 trở lên", so.filter((x) => x >= 350).length,
          so.length ? so.filter((x) => x >= 350).length / so.length : 0],
      ];
      return {
        bang: { tieuDe: ["Mức CD4", "Số ca", "Tỷ lệ"], dinhDang: ["chu", "so", "ty-le"],
          hang, tongCot: ["Có kết quả", so.length, 1], tongChung: so.length },
        ghiChu: [
          `Mẫu số: ${so.length} trên ${p.soDong} ca có kết quả CD4.`,
          "Ngưỡng dưới 200 tế bào/mm³: Quyết định 5968/QĐ-BYT — mức suy giảm miễn dịch nặng.",
          "Mốc 350 dùng làm mốc chẩn đoán muộn trong tài liệu quốc tế, KHÔNG có trong hướng dẫn Việt Nam; đưa vào đây để tham khảo.",
        ],
        canCu: "Quyết định 5968/QĐ-BYT",
      };
    },
  },
];

/* ══════════════════════════════════════════════════════════════════
   NHÓM D — xét nghiệm nhiễm mới
   ══════════════════════════════════════════════════════════════════ */

const NHOM_D = [
  {
    ma: "D1",
    nhom: "D",
    ten: "Tỷ lệ ca được xét nghiệm nhiễm mới, theo năm phát hiện",
    moTa: "Bao nhiêu ca có kết luận chẩn đoán nhiễm mới, tách theo năm.",
    vaiTro: ["ngay_khang_dinh", "ket_luan_nhiem_moi"],
    chay(p) {
      const hang = [];
      const theoNam = new Map();
      for (const i of p.dongCoNam()) {
        const n = p.namKd(i);
        if (!theoNam.has(n)) theoNam.set(n, { co: 0, khong: 0 });
        const o = theoNam.get(n);
        if (catTrang(p.o("ket_luan_nhiem_moi", i))) o.co++;
        else o.khong++;
      }
      for (const n of [...theoNam.keys()].sort(sxNam)) {
        const o = theoNam.get(n);
        const tong = o.co + o.khong;
        hang.push([n, o.co, tong, tong ? o.co / tong : 0]);
      }
      const tongCo = hang.reduce((t, h) => t + h[1], 0);
      const tongCa = hang.reduce((t, h) => t + h[2], 0);
      return {
        bang: {
          tieuDe: ["Năm phát hiện", "Có kết luận nhiễm mới", "Tổng ca", "Tỷ lệ được xét nghiệm"],
          dinhDang: ["chu", "so", "so", "ty-le"],
          hang,
          tongCot: ["Tổng", tongCo, tongCa, tongCa ? tongCo / tongCa : 0],
          tongChung: tongCa,
        },
        bieuDo: {
          loai: "cot",
          nhan: hang.map((h) => String(h[0])),
          chuoi: [{ ten: "Có kết luận nhiễm mới", gt: hang.map((h) => h[1]) }],
        },
        ghiChu: [
          "Xét nghiệm nhiễm mới chỉ triển khai từ một mốc thời gian nhất định, nên các " +
            "năm trước đó có tỷ lệ bằng không là bình thường, không phải thiếu dữ liệu.",
          "Mọi tỷ lệ nhiễm mới tính trên mẫu số này, không phải trên toàn bộ ca phát hiện.",
        ],
      };
    },
  },
  {
    ma: "D2",
    nhom: "D",
    ten: "Kết quả nhiễm mới theo nhóm tuổi và đường lây",
    moTa:
      "Trong số ca có kết luận, bao nhiêu là nhiễm mới. Chỉ dấu về lây truyền " +
      "đang diễn ra trong cộng đồng.",
    vaiTro: ["ket_luan_nhiem_moi"],
    chay(p) {
      const ds = p.moiDong().filter((i) => catTrang(p.o("ket_luan_nhiem_moi", i)));
      const ra = { ghiChu: [`Mẫu số: ${ds.length} ca có kết luận chẩn đoán nhiễm mới.`], bangPhu: [] };

      if (p.cot("nam_sinh") >= 0 && p.cot("ngay_khang_dinh") >= 0) {
        ra.bang = bangCheo(ds.filter((i) => p.namKd(i) != null),
          (i) => xepNhomTuoi(tuoiTheoNam(p.o("nam_sinh", i), p.namKd(i)), NHOM_TUOI.TT07_PL9),
          (i) => khoaPhanLoai(p.o("ket_luan_nhiem_moi", i)));
        ra.ghiChu.push(GHI_CHU_TUOI);
      } else {
        ra.bang = bangDem(ds, (i) => khoaPhanLoai(p.o("ket_luan_nhiem_moi", i)),
          { tenCot: "Kết luận" });
      }

      if (p.cot("duong_lay") >= 0) {
        const c = p.cot("duong_lay");
        const tap = [...new Set(p.bang.dong.map((d) => catTrang(d[c])).filter(Boolean))];
        const banDo = banDoGopCap(tap);
        ra.bangPhu.push({
          ten: "Theo đường lây",
          bang: bangCheo(ds,
            (i) => banDo.get(catTrang(p.o("duong_lay", i))) || KHONG_RO,
            (i) => khoaPhanLoai(p.o("ket_luan_nhiem_moi", i))),
        });
      }
      if (ds.length < 30) {
        ra.ghiChu.push(
          "Số ca có kết luận quá ít để đọc ra xu hướng. Bảng này chỉ dùng để biết hiện trạng."
        );
      }
      return ra;
    },
  },
];

export const DANH_MUC = [...NHOM_A, ...NHOM_B, ...NHOM_C, ...NHOM_D];

export const TEN_NHOM = {
  A: "Mô tả dịch tễ theo thời gian, con người, địa điểm",
  B: "Chất lượng và độ trễ của hệ thống giám sát",
  C: "Điều trị và kết cục",
  D: "Xét nghiệm nhiễm mới",
};

/** Cột có mặt nhưng trống hoàn toàn — khác hẳn với thiếu cột. */
export function tinhTrangVaiTro(p, vaiTro) {
  if (p.cot(vaiTro) < 0) return "thieu-cot";
  return p.kieuCot(vaiTro) === KIEU.TRONG ? "cot-trong" : "co";
}
