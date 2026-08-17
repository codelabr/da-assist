/**
 * Hồ sơ nhận dạng — BIỂU BÁO CÁO ĐỊNH KỲ theo Thông tư 05/2023/TT-BYT.
 *
 * Khác hẳn hồ sơ của một danh sách ca bệnh: ở danh sách, ý nghĩa nằm trong TÊN
 * CỘT; ở biểu đã cộng, ý nghĩa nằm trong NHÃN DÒNG và trong tên biểu ghi phía
 * trên hàng tiêu đề. Vì vậy hồ sơ này chấm điểm theo nhãn dòng, không theo cột.
 *
 * Hồ sơ khai hai thứ mà tầng kiểm chung không thể tự suy ra:
 *
 *   1. QUAN HỆ GIỮA CÁC DÒNG NGANG CẤP. Tầng chung chỉ biết dòng con không được
 *      vượt dòng cha theo mã phân cấp. Nhưng Bảng 2 báo cáo năm cấp huyện khai
 *      "số bắt đầu PrEP trong năm duy trì 3 tháng" (mục 2) là tập con của "số bắt
 *      đầu PrEP trong năm" (mục 1) — hai mục cùng cấp, mã số không hề nói lên
 *      quan hệ ấy. Và ở Bảng Methadone, mục 1.2 (trên 12 tháng) nằm TRONG mục 1.1
 *      (trên 6 tháng), là quan hệ giữa hai dòng con của cùng một cha.
 *
 *   2. CÁCH CẮT KỲ, vốn là chỗ dễ sai nhất và không nhìn ra được từ số liệu.
 *      Thông tư 05 Điều 3 cắt kỳ từ ngày 15 tháng trước kỳ đến ngày 14 tháng cuối
 *      kỳ — KHÁC với giám sát ca bệnh theo Thông tư 07 Điều 11 khoản 2, vốn cắt
 *      trọn quý dương lịch. Riêng biểu duy trì PrEP báo cáo năm lại có mốc thứ
 *      ba: từ 15/9 năm trước đến 14/9 năm báo cáo.
 *
 * Nguồn: Phụ lục biểu mẫu ban hành kèm Thông tư 05/2023/TT-BYT — 5 phụ lục, 29
 * bảng. Cấp tỉnh dùng Phụ lục 4 (báo cáo quý, 9 bảng) và Phụ lục 5 (báo cáo năm,
 * 6 bảng). Mọi nội dung dưới đây đọc từ chính phụ lục, không viết theo trí nhớ.
 */

import { khopKhoa } from "../tien-ich/chuoi.js";
import { MUC } from "../kiem/kiem-chung.js";
import { docCauTrucBieu, docSoBieu } from "../kiem/kiem-bieu.js";
import { NGUONG_CO_THE, NGUONG_NHAN } from "./nhan-dang.js";

/** Cách cắt kỳ chung của Thông tư 05. Nhắc ở mọi biểu vì đây là chỗ dễ sai nhất. */
const KY_TT05 =
  "Thông tư 05/2023/TT-BYT Điều 3: kỳ báo cáo quý tính từ ngày 15 tháng trước kỳ " +
  "báo cáo đến ngày 14 của tháng cuối kỳ. Đây KHÔNG phải quý dương lịch — biểu " +
  "giám sát ca bệnh theo Thông tư 07/2023/TT-BYT Điều 11 khoản 2 mới cắt trọn quý " +
  "dương lịch. Dùng lẫn hai cách cắt kỳ thì số liệu hai chế độ báo cáo không khớp nhau.";

/**
 * Danh mục biểu. Mỗi mục:
 *   ma        mã nội bộ
 *   ten       tên biểu theo phụ lục
 *   phuLuc    phụ lục và số bảng
 *   ky        kỳ báo cáo
 *   dauHieu   [{khoa, trongSo}] — khớp với nhãn dòng và khối tiêu đề
 *   rangBuoc  quan hệ giữa các dòng mà mã phân cấp không nói lên được
 *   luuY      những điều cần biết khi đọc hoặc điền biểu
 */
export const DS_BIEU_TT05 = [
  {
    ma: "tt05-can-thiep-giam-tac-hai",
    ten: "Hoạt động can thiệp giảm tác hại",
    phuLuc: "Phụ lục 1/2/4 — Bảng 1",
    ky: "quý",
    dauHieu: [
      { khoa: "bơm kim tiêm", trongSo: 3 },
      { khoa: "bao cao su", trongSo: 3 },
      { khoa: "chất bôi trơn", trongSo: 3 },
      { khoa: "người bán dâm", trongSo: 1 },
      { khoa: "người sử dụng ma túy", trongSo: 1 },
      { khoa: "người chuyển đổi giới tính", trongSo: 1 },
    ],
    rangBuoc: [],
    luuY: [
      "Số liệu biểu này là LŨY TÍCH từ đầu năm đến kỳ báo cáo, không phải số phát sinh " +
        "trong quý. Quý II = số người quý I cộng người mới quý II, bất kể người của quý I " +
        "có nhận lại dịch vụ hay không. Vì vậy KHÔNG được cộng bốn quý lại thành số năm — " +
        "số cả năm chính là số tính đến cuối quý IV.",
      "Nguồn số liệu là Sổ UIC hoặc Phiếu ghi chép hoạt động tiếp cận cộng đồng, không " +
        "phải danh sách ca bệnh. Danh sách ca bệnh không dựng ra được biểu này.",
    ],
  },
  {
    ma: "tt05-tu-van-xet-nghiem",
    ten: "Tư vấn xét nghiệm HIV",
    phuLuc: "Phụ lục 1/2/4 — Bảng 2",
    ky: "quý",
    dauHieu: [
      { khoa: "thanh niên khám tuyển nghĩa vụ quân sự", trongSo: 3 },
      { khoa: "can phạm", trongSo: 2 },
      { khoa: "phụ nữ mang thai", trongSo: 2 },
      { khoa: "giai đoạn chuyển dạ", trongSo: 2 },
      { khoa: "bệnh nhân lao", trongSo: 1 },
      { khoa: "trẻ em dưới 15 tuổi", trongSo: 1 },
    ],
    rangBuoc: [
      {
        loai: "bang",
        cha: "6",
        con: ["6.1", "6.2"],
        vi: "mục 6 (phụ nữ mang thai) bằng đúng mục 6.1 (thời kỳ mang thai) cộng mục 6.2 (giai đoạn chuyển dạ, đẻ) — phụ lục ghi rõ 6 = 6.1 + 6.2",
      },
    ],
    luuY: [
      "Đơn vị tính là SỐ LƯỢT NGƯỜI, không phải số người. Một người xét nghiệm hai lần " +
        "trong kỳ được tính hai lượt, nên không so trực tiếp con số này với số người trong " +
        "danh sách ca bệnh.",
      "Mục 6.1 lấy từ Sổ khám thai tại trạm y tế xã, mục 6.2 lấy từ Sổ đẻ tại khoa sản " +
        "(Thông tư 37/2019/TT-BYT), còn các mục khác lấy từ Sổ quản lý tư vấn xét nghiệm " +
        "và Sổ xét nghiệm HIV. Nhiều nguồn nên phải rà tránh đếm trùng.",
      "Báo cáo năm bằng tổng bốn quý.",
    ],
  },
  {
    ma: "tt05-methadone",
    ten: "Điều trị nghiện chất dạng thuốc phiện bằng Methadone",
    phuLuc: "Phụ lục 2/4 — Bảng 3",
    ky: "quý",
    dauHieu: [
      { khoa: "methadone", trongSo: 4 },
      { khoa: "cấp phát thuốc nhiều ngày", trongSo: 2 },
      { khoa: "nhận thuốc tại cơ sở điều trị", trongSo: 2 },
      { khoa: "bỏ điều trị", trongSo: 1 },
    ],
    rangBuoc: [
      {
        loai: "khong-vuot",
        nho: "1.2",
        lon: "1.1",
        vi: "mục 1.2 (điều trị trên 12 tháng) là một phần của mục 1.1 (điều trị trên 6 tháng) — ai đã điều trị trên 12 tháng thì đương nhiên đã trên 6 tháng",
      },
    ],
    luuY: [
      "Ba mục con 1.1, 1.2, 1.3 KHÔNG cộng lại thành mục 1: chúng lồng vào nhau và " +
        "chồng lên nhau (một bệnh nhân điều trị trên 12 tháng và có HIV dương tính được " +
        "đếm ở cả ba). Cộng ba mục rồi so với mục 1 là hiểu sai biểu.",
      "Mục 1 là số hiện đang điều trị tại thời điểm cuối kỳ, nên báo cáo năm lấy đúng " +
        "số của quý IV, KHÔNG cộng bốn quý. Riêng mục 5 (bỏ điều trị trong kỳ) là số " +
        "phát sinh nên báo cáo năm bằng tổng bốn quý.",
    ],
  },
  {
    ma: "tt05-arv",
    ten: "Quản lý điều trị ARV và xét nghiệm tải lượng vi rút",
    phuLuc: "Phụ lục 2/4 — Bảng 4",
    ky: "quý",
    dauHieu: [
      { khoa: "điều trị arv", trongSo: 3 },
      { khoa: "tải lượng", trongSo: 3 },
      { khoa: "bắt đầu điều trị lần đầu", trongSo: 2 },
      { khoa: "điều trị lại", trongSo: 2 },
      { khoa: "chuyển đến", trongSo: 1 },
      { khoa: "bỏ điều trị", trongSo: 1 },
    ],
    rangBuoc: [],
    luuY: [
      "Mục 2.7 (đang điều trị cuối kỳ) có công thức riêng: số đầu kỳ cộng bắt đầu lần " +
        "đầu, điều trị lại, chuyển đến, rồi trừ chuyển đi, chuyển nhóm tuổi, tử vong và " +
        "bỏ trị. Máy không kiểm được vì thiếu số đầu kỳ của kỳ trước.",
      "Một bệnh nhân vừa bỏ trị vừa quay lại trong cùng một quý được đếm ở CẢ mục 2.5 " +
        "và mục 2.2. Đây là quy định của phụ lục, không phải lỗi đếm trùng.",
      "Ngưỡng dưới 1.000 bản sao/mL trong phần tải lượng là chỉ số báo cáo của chính " +
        "Thông tư 05. Không lẫn với ngưỡng dưới 200 (không lây truyền qua đường tình dục) " +
        "hay dưới 50 (dưới ngưỡng phát hiện) theo Quyết định 5968/QĐ-BYT.",
      "Bỏ điều trị nghĩa là không đến nhận thuốc hoặc tái khám từ 3 tháng trở lên; " +
        "người đang nhận thuốc theo đợt 3 tháng thì không tính.",
    ],
  },
  {
    ma: "tt05-dong-nhiem-lao",
    ten: "Quản lý điều trị đồng nhiễm HIV và lao",
    phuLuc: "Phụ lục 2/4 — Bảng 5",
    ky: "quý",
    dauHieu: [
      { khoa: "lao tiềm ẩn", trongSo: 4 },
      { khoa: "chẩn đoán mắc lao", trongSo: 2 },
      { khoa: "điều trị lao", trongSo: 1 },
    ],
    rangBuoc: [
      {
        loai: "khong-vuot",
        phan: "I",
        nho: "2",
        lon: "1",
        vi: "mục I.2 (hoàn thành điều trị lao tiềm ẩn) không thể lớn hơn mục I.1 (bắt đầu điều trị lao tiềm ẩn) trong cùng kỳ",
      },
      {
        loai: "khong-vuot",
        phan: "I",
        nho: "4",
        lon: "3",
        vi: "mục I.4 (hoàn thành) không thể lớn hơn mục I.3 (được điều trị lao tiềm ẩn)",
      },
    ],
    luuY: [
      "Riêng mục I.3 báo cáo năm lấy số của quý IV; các mục còn lại báo cáo năm bằng " +
        "tổng bốn quý.",
      "Mục II.3 phải rà cả Sổ đăng ký trước điều trị ARV và phối hợp với đơn vị phòng " +
        "chống lao trên địa bàn, nên số liệu thường về muộn hơn các mục khác.",
    ],
  },
  {
    ma: "tt05-me-con",
    ten: "Dự phòng lây truyền HIV từ mẹ sang con",
    phuLuc: "Phụ lục 2/4 — Bảng 6",
    ky: "quý",
    dauHieu: [
      { khoa: "trẻ đẻ sống", trongSo: 4 },
      { khoa: "co-trimoxazole", trongSo: 3 },
      { khoa: "trước khi có thai", trongSo: 2 },
      { khoa: "sinh học phân tử", trongSo: 2 },
    ],
    rangBuoc: [
      {
        loai: "bang",
        cha: "1",
        con: ["1.1", "1.2", "1.3"],
        vi: "mục 1 bằng đúng tổng ba mục con, vì ba mục là ba thời điểm bắt đầu ARV rời nhau: trước khi có thai, trong thời kỳ mang thai, trong khi chuyển dạ và đẻ",
      },
    ],
    luuY: [
      "Các mục về mẹ lấy từ Sổ điều trị bằng thuốc kháng HIV, các mục về trẻ lấy từ Sổ " +
        "theo dõi phơi nhiễm với HIV (Thông tư 28/2018/TT-BYT). Hai nguồn khác nhau nên " +
        "số trẻ không suy ra được từ số mẹ.",
      "Ba mục con của mục 2 là ba loại dự phòng khác nhau trên cùng nhóm trẻ, KHÔNG rời " +
        "nhau, nên không cộng lại thành mục 2.",
      "Báo cáo năm bằng tổng bốn quý.",
    ],
  },
  {
    ma: "tt05-pcr-tre",
    ten: "Chẩn đoán sớm nhiễm HIV cho trẻ dưới 18 tháng tuổi",
    phuLuc: "Phụ lục 4 — Bảng 7 (đặc thù cấp tỉnh)",
    ky: "quý",
    dauHieu: [
      { khoa: "dưới 18 tháng", trongSo: 4 },
      { khoa: "trong vòng 2 tháng tuổi", trongSo: 3 },
      { khoa: "sinh học phân tử", trongSo: 2 },
      { khoa: "không xác định", trongSo: 1 },
    ],
    rangBuoc: [
      {
        loai: "bang",
        cha: "1",
        con: ["1.1", "1.2"],
        vi: "mục 1 bằng đúng mục 1.1 (xét nghiệm trong vòng 2 tháng tuổi) cộng mục 1.2 (từ 2 đến 18 tháng tuổi) — hai khoảng tuổi rời nhau",
      },
    ],
    luuY: [
      "Đây là bảng đặc thù của cấp tỉnh, cơ sở chăm sóc điều trị HIV báo cáo.",
      "Phân tổ theo kết quả gồm bốn cột: tổng, âm tính, dương tính và không xác định. " +
        "Cột tổng phải bằng tổng ba cột kết quả.",
      "Xếp trẻ vào mục 1.1 hay 1.2 dựa vào ngày sinh và ngày làm xét nghiệm PCR; có kết " +
        "quả PCR lần 1 vào kỳ nào thì báo cáo vào kỳ đó.",
    ],
  },
  {
    ma: "tt05-prep-quy",
    ten: "Dự phòng trước phơi nhiễm HIV (PrEP) — báo cáo quý",
    phuLuc: "Phụ lục 2/4 — Bảng 7/8",
    ky: "quý",
    dauHieu: [
      { khoa: "prep", trongSo: 4 },
      { khoa: "điều trị prep lần đầu", trongSo: 3 },
      { khoa: "ít nhất 1 lần", trongSo: 2 },
      { khoa: "ncmt", trongSo: 1 },
      { khoa: "pnbd", trongSo: 1 },
    ],
    rangBuoc: [
      {
        loai: "khong-vuot",
        nho: "1",
        lon: "2",
        vi: "mục 1 (điều trị PrEP lần đầu trong kỳ) là một phần của mục 2 (điều trị PrEP ít nhất 1 lần trong kỳ)",
      },
      {
        loai: "khong-vuot",
        nho: "3",
        lon: "2",
        vi: "mục 3 (đang điều trị cuối kỳ) bằng mục 2 trừ số bỏ trị và chuyển đi, nên không thể lớn hơn mục 2",
      },
    ],
    luuY: [
      "Mục 1 là khách hàng LẦN ĐẦU TIÊN TRONG ĐỜI dùng PrEP, chưa từng dùng thuốc kháng " +
        "HIV để dự phòng ở bất cứ chương trình nào — không phải lần đầu trong kỳ này.",
      "Báo cáo năm: mục 1 bằng tổng bốn quý, còn mục 2 và mục 3 lấy đúng số của quý IV.",
      "Người chưa đến kỳ tái khám vẫn tính là đang sử dụng.",
    ],
  },
  {
    ma: "tt05-prep-nam",
    ten: "Duy trì điều trị PrEP — báo cáo năm",
    phuLuc: "Phụ lục 3/5 — Bảng 1",
    ky: "năm",
    dauHieu: [
      { khoa: "duy trì điều trị", trongSo: 3 },
      { khoa: "3 tháng liên tục", trongSo: 4 },
      { khoa: "prep", trongSo: 2 },
      { khoa: "bỏ trị", trongSo: 1 },
    ],
    rangBuoc: [
      {
        loai: "khong-vuot",
        nho: "2",
        lon: "1",
        vi: "mục 2 (duy trì điều trị 3 tháng liên tục) là một phần của mục 1 (bắt đầu điều trị PrEP trong năm)",
      },
      {
        loai: "khong-vuot",
        nho: "3",
        lon: "1",
        vi: "mục 3 (bỏ trị) là một phần của mục 1 (bắt đầu điều trị PrEP trong năm)",
      },
    ],
    luuY: [
      "MỐC THỐNG KÊ RIÊNG, không giống bất kỳ biểu nào khác: từ ngày 15/9 của năm trước " +
        "năm báo cáo đến ngày 14/9 của năm báo cáo. Đây là cách cắt kỳ thứ ba trong hệ " +
        "thống báo cáo HIV, khác cả quý dương lịch của Thông tư 07 lẫn mốc 15–14 hằng " +
        "quý của Thông tư 05. Lấy số theo năm dương lịch sẽ ra con số khác.",
      "Khách hàng tham gia lần đầu, bỏ trị rồi điều trị lại nhiều lần trong năm chỉ tính " +
        "MỘT lần.",
      "Mục 2 là đã điều trị liên tục 90 ngày. Mục 3 không tính người đã quay lại và đang " +
        "duy trì điều trị tại thời điểm báo cáo.",
    ],
  },
  {
    ma: "tt05-viem-gan-c",
    ten: "Điều trị đồng nhiễm HIV và viêm gan C",
    phuLuc: "Phụ lục 3/5 — Bảng 2",
    ky: "năm",
    dauHieu: [
      { khoa: "viêm gan c", trongSo: 4 },
      { khoa: "đồng nhiễm", trongSo: 2 },
    ],
    rangBuoc: [
      {
        loai: "khong-vuot",
        nho: "2",
        lon: "1",
        vi: "mục 2 (được bắt đầu điều trị viêm gan C) là một phần của mục 1 (đồng nhiễm viêm gan C)",
      },
    ],
    luuY: ["Báo cáo năm. Nguồn: bệnh án ngoại trú HIV, Sổ điều trị ARV và sổ sách điều trị viêm gan C."],
  },
  {
    ma: "tt05-doi-tuong-nguy-co",
    ten: "Số lượng đối tượng nguy cơ cao",
    phuLuc: "Phụ lục 3/5 — Bảng 3",
    ky: "năm",
    dauHieu: [
      { khoa: "số ước tính", trongSo: 4 },
      { khoa: "phương pháp ước tính", trongSo: 4 },
      { khoa: "nghiện chích ma túy", trongSo: 2 },
      { khoa: "phụ nữ bán dâm", trongSo: 1 },
    ],
    rangBuoc: [],
    luuY: [
      "Hai cột mang hai nghĩa khác nhau và KHÔNG so sánh trực tiếp được: số quản lý là " +
        "số của công an hoặc lao động thương binh xã hội, còn số ước tính là kết quả của " +
        "một phương pháp ước tính. Số ước tính lớn hơn số quản lý là bình thường, không " +
        "phải lỗi.",
      "Chỉ điền số ước tính khi trong năm thực sự có làm hoạt động ước tính. Ô trống ở " +
        "cột này nghĩa là năm đó không ước tính, không phải bằng không.",
      "Số quản lý người nghiện không tính người đang ở trung tâm, trường giáo dưỡng, " +
        "trại giam, tạm giam, cơ sở cải tạo, hoặc đã tử vong.",
    ],
  },
  {
    ma: "tt05-diem-dich-vu",
    ten: "Điểm cung cấp dịch vụ",
    phuLuc: "Phụ lục 5 — Bảng 4",
    ky: "năm",
    dauHieu: [
      { khoa: "phòng khám ngoại trú", trongSo: 4 },
      { khoa: "cơ sở cấp phát thuốc methadone", trongSo: 3 },
      { khoa: "tư vấn xét nghiệm tự nguyện", trongSo: 2 },
      { khoa: "cơ sở điều trị prep", trongSo: 2 },
    ],
    rangBuoc: [],
    luuY: [
      "Đơn vị tính là SỐ CƠ SỞ, không phải số người. Thống kê toàn bộ cơ sở từng loại " +
        "trên địa bàn tính đến cuối kỳ.",
      "Một cơ sở làm nhiều loại dịch vụ được đếm ở nhiều dòng, nên cộng các dòng lại " +
        "không ra số cơ sở trên địa bàn.",
    ],
  },
  {
    ma: "tt05-kinh-phi",
    ten: "Kinh phí triển khai các dịch vụ phòng, chống HIV/AIDS",
    phuLuc: "Phụ lục 5 — Bảng 5",
    ky: "năm",
    dauHieu: [
      { khoa: "ngân sách địa phương", trongSo: 3 },
      { khoa: "xã hội hóa", trongSo: 3 },
      { khoa: "đồng chi trả", trongSo: 3 },
      { khoa: "thu phí dịch vụ", trongSo: 2 },
      { khoa: "viện trợ", trongSo: 1 },
    ],
    rangBuoc: [],
    luuY: [
      "Đơn vị tính là ĐỒNG. Số lớn nên hay bị ghi kèm dấu phân cách rồi thành ô chuỗi; " +
        "khi đó hàm SUM bỏ qua mà không báo lỗi.",
      "Mỗi nguồn kinh phí phân tổ theo năm chương trình, trừ mục 5 (đồng chi trả ARV) " +
        "chỉ ghi một tổng cho toàn tỉnh.",
    ],
  },
  {
    ma: "tt05-bhyt",
    ten: "Bảo hiểm y tế",
    phuLuc: "Phụ lục 5 — Bảng 6",
    ky: "năm",
    dauHieu: [
      { khoa: "thẻ bhyt", trongSo: 3 },
      { khoa: "chi trả 100%", trongSo: 3 },
      { khoa: "chi trả 95%", trongSo: 3 },
      { khoa: "chi trả 80%", trongSo: 3 },
    ],
    rangBuoc: [],
    luuY: [
      "Ba dòng là ba mức chi trả rời nhau trên cùng nhóm người đang điều trị ARV có thẻ " +
        "BHYT, nên tổng ba dòng không vượt số người đang điều trị ARV cuối kỳ ở biểu ARV.",
    ],
  },
  {
    ma: "tt05-truyen-thong",
    ten: "Truyền thông phòng, chống HIV/AIDS",
    phuLuc: "Phụ lục 1/2/4 — Bảng 3/8/9",
    ky: "quý",
    dauHieu: [
      { khoa: "số lượt truyền thông", trongSo: 4 },
      { khoa: "được truyền thông", trongSo: 3 },
    ],
    rangBuoc: [],
    luuY: [
      "Đơn vị tính là SỐ LƯỢT: mục 1 là số lần truyền thông, mục 2 là số người tham dự. " +
        "Hai mục đếm hai thứ khác nhau nên không so tỷ lệ giữa chúng.",
      "Nguồn: Sổ A11/YTCS theo Thông tư 37/2019/TT-BYT, hoặc Sổ UIC.",
    ],
  },
];

/** Ghép nhãn dòng và khối tiêu đề thành một khối chữ để chấm điểm. */
function khoiChu(bang) {
  const phan = [...(bang.dongTren || [])];
  const ct = docCauTrucBieu(bang);
  for (const m of ct.mucDong) if (m.nhan) phan.push(m.nhan);
  // Tên cột cũng mang dấu hiệu: "Bơm kim tiêm", "Số ước tính", "Nam/Nữ".
  for (const t of bang.tieuDe) if (t) phan.push(t);
  return phan.join(" ; ");
}

/**
 * Nhận dạng biểu. Chấm theo dấu hiệu tìm được trong nhãn dòng và khối tiêu đề.
 * Không nhận bừa: dưới ngưỡng thì nói rõ chưa nhận ra.
 */
export function nhanDangBieu(bang, ds = DS_BIEU_TT05) {
  const chu = khoiChu(bang);
  const cham = ds
    .map((b) => {
      let duoc = 0;
      let tong = 0;
      const thay = [];
      for (const dh of b.dauHieu) {
        const ts = dh.trongSo == null ? 1 : dh.trongSo;
        tong += ts;
        if (khopKhoa(dh.khoa, chu)) {
          duoc += ts;
          thay.push(dh.khoa);
        }
      }
      return { bieu: b, diem: tong ? duoc / tong : 0, thay };
    })
    .sort((a, b) => b.diem - a.diem);

  const tot = cham[0];
  if (!tot || tot.diem < NGUONG_CO_THE) {
    return { ketQua: "khong-nhan-ra", cham };
  }
  if (tot.diem < NGUONG_NHAN) {
    return {
      ketQua: "co-the",
      bieu: tot.bieu,
      diem: tot.diem,
      thay: tot.thay,
      moTa:
        `Biểu này giống “${tot.bieu.ten}” (${tot.bieu.phuLuc}) nhưng chỉ khớp ` +
        `${Math.round(tot.diem * 100)}% số dấu hiệu, chưa đủ để kết luận. Công cụ chỉ nêu ` +
        "các phép kiểm số học chung, không áp quan hệ riêng của biểu.",
      cham,
    };
  }
  return {
    ketQua: "nhan-ra",
    bieu: tot.bieu,
    diem: tot.diem,
    thay: tot.thay,
    moTa:
      `Nhận ra “${tot.bieu.ten}” — ${tot.bieu.phuLuc}, báo cáo ${tot.bieu.ky}, ` +
      `khớp ${Math.round(tot.diem * 100)}% số dấu hiệu (${tot.thay.slice(0, 3).join(", ")}).`,
    cham,
  };
}

function phat(ds, o) {
  ds.push({ viDu: [], suaDuoc: false, ...o });
}

/**
 * Kiểm các quan hệ mà hồ sơ biểu khai, cộng các ghi chú về cách cắt kỳ và cách
 * đọc biểu. Chỉ chạy khi đã nhận ra biểu.
 */
export function kiemBieuTT05(bang, bieu) {
  const ds = [];
  if (!bieu) return ds;
  const ct = docCauTrucBieu(bang);
  const { cotSo, mucDong } = ct;
  const tenCot = (c) => bang.tieuDe[c] || `cột ${c + 1}`;

  const tim = (ma, phan) =>
    mucDong.find((m) => m.ma === ma && (phan == null || m.phan === phan));

  for (const rb of bieu.rangBuoc) {
    if (rb.loai === "khong-vuot") {
      const a = tim(rb.nho, rb.phan);
      const b = tim(rb.lon, rb.phan);
      if (!a || !b) continue;
      const lech = [];
      for (const c of cotSo) {
        const va = docSoBieu(bang.dong[a.i][c]);
        const vb = docSoBieu(bang.dong[b.i][c]);
        if (!va || !vb) continue;
        if (va.so > vb.so) lech.push(`“${tenCot(c)}”: ${va.so} so với ${vb.so}`);
      }
      if (lech.length) {
        phat(ds, {
          ma: "T501",
          mucDo: MUC.CHAC_CHAN,
          cot: "",
          chiSoCot: -1,
          soDong: lech.length,
          moTa:
            `Dòng ${a.hang} lớn hơn dòng ${b.hang} ở ${lech.length} cột, trong khi ${rb.vi}. ` +
            `Căn cứ: ${bieu.phuLuc} của Thông tư 05/2023/TT-BYT.`,
          viDu: lech.slice(0, 5),
          deXuat: "Đối chiếu lại hai dòng với sổ nguồn.",
        });
      }
    }

    if (rb.loai === "bang") {
      const cha = tim(rb.cha, rb.phan);
      if (!cha) continue;
      const con = rb.con.map((m) => tim(m, rb.phan)).filter(Boolean);
      if (con.length !== rb.con.length) continue;
      const lech = [];
      for (const c of cotSo) {
        const vc = docSoBieu(bang.dong[cha.i][c]);
        if (!vc) continue;
        let s = 0;
        let co = false;
        for (const k of con) {
          const v = docSoBieu(bang.dong[k.i][c]);
          if (v) {
            s += v.so;
            co = true;
          }
        }
        if (!co) continue;
        if (Math.abs(s - vc.so) > 1e-6) {
          lech.push(`“${tenCot(c)}”: dòng ${cha.hang} ghi ${vc.so}, cộng các dòng con được ${s}`);
        }
      }
      if (lech.length) {
        phat(ds, {
          ma: "T502",
          mucDo: MUC.CHAC_CHAN,
          cot: "",
          chiSoCot: -1,
          soDong: lech.length,
          moTa:
            `Quan hệ cộng không khớp ở ${lech.length} cột: ${rb.vi}. ` +
            `Căn cứ: ${bieu.phuLuc} của Thông tư 05/2023/TT-BYT.`,
          viDu: lech.slice(0, 5),
          deXuat: `Cộng lại dòng ${cha.hang} từ các dòng con, hoặc rà lại từng dòng con.`,
        });
      }
    }
  }

  // Cách cắt kỳ — nêu ở mọi biểu nhận ra được, vì đây là chỗ sai không nhìn thấy
  // trong số liệu và chỉ lộ ra khi hai chế độ báo cáo không khớp nhau.
  phat(ds, {
    ma: "T503",
    mucDo: MUC.GHI_NHAN,
    cot: "",
    chiSoCot: -1,
    soDong: 0,
    moTa: KY_TT05,
    deXuat: "Đối chiếu mốc lấy số liệu của biểu này với Điều 3 trước khi gửi.",
  });

  for (const ly of bieu.luuY) {
    phat(ds, {
      ma: "T504",
      mucDo: MUC.GHI_NHAN,
      cot: "",
      chiSoCot: -1,
      soDong: 0,
      moTa: ly,
      deXuat: "",
    });
  }

  return ds;
}

export default DS_BIEU_TT05;
