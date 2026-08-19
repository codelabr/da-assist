# Thiết kế DA Assist

Tài liệu này giữ phần lý do phía sau các quyết định thiết kế. `README.md` chỉ nói công
cụ làm gì và dùng thế nào; những chỗ "vì sao lại làm thế" nằm ở đây.

---

## Hỏi người dùng, không cần mô hình ngôn ngữ

Máy không cần *hiểu* ý nghĩa cột — nó cần *hỏi đúng câu*. Câu đúng sinh ra từ bằng
chứng đo trong chính dữ liệu, ở `src/phong-van/`.

### Ba kỷ luật

Vi phạm cái nào thì việc phỏng vấn thành một biểu mẫu 90 câu mà không ai điền.

1. **Chỉ hỏi khi câu trả lời làm đổi một quyết định cụ thể.** Mỗi câu phải khai rõ nó
   phục vụ việc gì; không khai được thì không hỏi. Bộ thử kiểm điều này trên từng câu.
2. **Chỉ hỏi khi dữ liệu không tự phân giải được.** Thứ tự ngày–tháng chỉ hỏi khi trong
   cột không có giá trị nào có thành phần đầu lớn hơn 12; chỉ cần một giá trị như vậy
   là khỏi hỏi.
3. **Hỏi bằng ví dụ thật và hệ quả, không bằng thuật ngữ.** Cán bộ trả lời được "gộp 12
   hay gộp 27 bản ghi", chứ khó trả lời "khoá định danh là gì".

### Bốn kỹ thuật thay cho đọc hiểu ngữ nghĩa

| Kỹ thuật | Làm được gì |
|---|---|
| Gom cột theo **mẫu ô trống giống hệt** | Cột trống ở đúng những dòng giống nhau thì thuộc cùng một khối nghiệp vụ. Trên bản xuất thật, 20 cột gom thành 7 câu hỏi |
| **Phụ thuộc hàm** hai chiều | A xác định B và B xác định A → cặp mã và nhãn của cùng một thứ |
| Tính sẵn **hệ quả** của mỗi bộ khoá | Hỏi "hai dòng thế nào là cùng một người" bằng cách hiện số nhóm trùng của từng lựa chọn |
| **Hồ sơ nhận dạng trả lời sẵn** | Với tệp đã biết, câu hỏi hiện ra ở dạng đã điền, người dùng chỉ xác nhận |

### Lọc theo cột mà thao tác chạm tới

Đây là chỗ quyết định công cụ dùng được hay không. Đo trên bản xuất thật 90 cột:

| Thao tác | Số câu hiện ra |
|---|---:|
| Làm sạch một cột cụ thể | 0–1 |
| Tìm bản ghi trùng | 1 |
| Nếu hỏi hết một lượt (không làm thế) | 27 |

### Hồ sơ đơn vị

Câu trả lời lưu thành một tệp JSON: lần sau mở tệp cùng loại thì không hỏi lại, tệp ấy
chia sẻ được cho đồng nghiệp, và nó tự trở thành một hồ sơ nhận dạng mới. Công cụ học
được, nhưng học từ người dùng chứ không từ mô hình nào.

**Tệp hồ sơ chỉ chứa câu trả lời về ý nghĩa các cột, không chứa dữ liệu.** Đó là lý do
gửi được cho đồng nghiệp mà không vướng gì về bảo mật.

Nạp một hồ sơ không khớp cấu trúc tệp đang mở thì công cụ báo độ khớp rồi từ chối, thay
vì nạp bừa.

### Chỗ mô hình ngôn ngữ vẫn hơn, nói thẳng

Một cột tên lạ hoàn toàn mà dữ liệu bên trong không gợi ý gì thì mô hình đoán được từ
tên cột, còn phỏng vấn thì phải hỏi. Nhưng với cột lạ, người dùng mới là bên có thẩm
quyền. Còn với cột ghi chú tự do, hành vi đúng của công cụ này là cảnh báo có thể chứa
thông tin định danh, chứ không phải đọc hiểu nội dung.

---

## Thêm một loại tệp mới

Viết thêm một tệp mô tả trong `src/ho-so/`, rồi thêm nó vào `DS_HO_SO` trong
`src/index.js`. **Không sửa mã lõi.**

### Ba dạng khoá tên cột

| Dạng | Nghĩa |
|---|---|
| `"a b"` | tên cột chứa cụm này |
| `"abc"` | tên cột có đúng từ này |
| `"=abc"` | tên cột đúng bằng chuỗi này |

Cả ba dạng đều so theo **ranh giới từ**, không so chứa chuỗi. Nếu không thì khoá `name`
nuốt `facility_name`, và khoá `tam tru` nuốt `huyết áp tâm trương`.

Ranh giới từ phải dùng lookbehind `(?<![\p{L}\p{N}_])` với cờ `u`, **không dùng `\b`** —
`\b` tính theo bảng chữ ASCII nên không có ranh giới sau một chữ có dấu.

**Không đưa vào từ điển những khoá mà bản bỏ dấu trùng một từ thông dụng.** Bỏ dấu thì
`nam` (giới tính) và `năm` (thời gian) thành một.

**Khoá loại trừ** chặn cột của bệnh khác: "Ngày bắt đầu điều trị Lao tiềm ẩn" từng suýt
bị nhận thành ngày bắt đầu ARV.

---

## Tám điều đã trả giá mới biết

**Bỏ dấu tiếng Việt để so tên cột thì đúng, để so giá trị dữ liệu thì sai.** Trên tệp
thật, `Xã Vĩnh Thanh` và `Xã Vĩnh Thạnh` bị gộp làm một — có thể là hai xã khác nhau
thật. Vì vậy biến thể *hoa thường* xếp mức chắc chắn, còn biến thể *về dấu* chỉ xếp mức
cần xác minh và máy không tự gộp.

**So trùng trên toàn bộ cột thì bỏ lọt hết.** Cột số thứ tự dòng luôn khác nhau nên nó
che mất mọi cặp trùng. Trên tệp thật, 12 cặp trùng giống nhau ở cả 89 cột và chỉ khác
đúng cột số thứ tự; so toàn dòng bỏ lọt cả 12 cặp.

**So hai giá trị theo mặt chữ thì bỏ lọt ngày dạng ISO.** Chuỗi `"2019-05-26"` hiển thị
y hệt ô ngày cùng ngày ấy, nên chốt chặn "không đổi thì bỏ qua" mà so theo chuỗi sẽ
lặng lẽ bỏ qua đúng nhóm này. Hậu quả nặng hơn bỏ lọt: cột lẫn hai định dạng được sửa
một nửa rồi trông như đã xong. Phải so cả kiểu, không chỉ mặt chữ.

**Độ hiếm không phải dấu hiệu của lỗi.** Bộ dò giá trị bất thường lọc theo tần suất
sinh ra 18 câu hỏi trên tệp thật, trong đó 17 câu về những giá trị hoàn toàn hợp lệ chỉ
tình cờ ít gặp. Người dùng gặp mười bảy câu vô nghĩa thì bỏ luôn câu thứ mười tám. Dấu
hiệu thật là **hình thức khác hẳn** — một mã viết tắt nằm giữa những nhãn bằng chữ. Và
không dùng độ dài làm thước đo: `Nữ` chỉ dài hai ký tự.

**Nhận ra hình dạng biểu rồi không kiểm gì cả cũng là một cách sai.** Bản đầu, gặp biểu
đã cộng thì công cụ báo "đây là biểu đã cộng, không đề xuất phép làm sạch nào" rồi dừng.
Câu ấy đúng về phần làm sạch nhưng để người dùng tưởng công cụ đã xem hết biểu. Từ chối
làm việc nguy hiểm thì phải kèm theo việc làm được: ở đây là chín phép kiểm số học.

**Mã phân cấp phải được đánh theo từng phần La Mã.** Biểu mẫu nào cũng có mục "1, 2, 3"
ở phần I rồi lặp lại đúng dãy ấy ở phần II. Không ghi phần thì mục 1.1 của phần II đi
tìm dòng cha ở phần I, và một biểu điền đúng bị báo là dòng con vượt dòng cha.

**Bộ thử chạy được không có nghĩa là add-in cài được.** Bộ Excel giả đo lớp Office.js
nhưng **không đọc bản kê khai**, nên nó không thấy `<VersionOverrides>` đang khai không
gian tên `mailappversionoverrides` của add-in thư điện tử. Trong không gian tên ấy,
`<Host xsi:type="Workbook">` không hợp lệ; Excel loại cả tệp và chỉ báo một câu chung
chung. Đúng phải là `taskpaneappversionoverrides`.

**Bộ đệm web của Office không tôn trọng `Cache-Control`.** Đẩy bản mới lên máy chủ rồi
cài lại add-in vẫn ra bản cũ, vì cài lại chỉ ghi sổ đăng ký chứ không đụng bộ đệm ở
`%LOCALAPPDATA%\Microsoft\Office\16.0\Wef\`. Kịch bản cài đặt nay tự xoá bộ đệm khi
Excel đã đóng hẳn.

---

## Tô màu trên trang kết quả

Ba chốt chặn, cả ba đều do người dùng chỉ ra hoặc do bộ thử bắt được.

**Chỉ tô khi biết đích xác ô nào.** Phép kiểm chỉ trả về số đếm thì lớp tô đành tô cả
cột, mà một cột vàng rực không chỉ ra được gì. Vì vậy mọi phép kiểm theo ô đều phải
khai `dongLoi`; phát hiện nào không định vị được thì không tô, và vỏ **nói ra số phát
hiện thuộc loại ấy** chứ không im lặng.

**Cột đã được phép sửa xử lý thì phát hiện sửa được ở cột ấy hết vàng.** Phép sửa chạy
trên cả cột chứ không trên từng ô. Thiếu chốt này thì cột giới tính lẫn `"Nam "` với
`"nam"` được thống nhất xong, những ô vốn đã đúng dạng vẫn hiện ra vàng như thể còn lỗi.

**Ngược lại, không loại một ô chỉ vì nó đã được đổi.** Ô ngày lưu dạng văn bản được
chuẩn hoá thành ô ngày thật là xong việc định dạng, nhưng ngày kết thúc vẫn có thể đứng
trước ngày bắt đầu — lỗi thứ hai còn nguyên. Vàng tô sau cùng nên thắng khi chồng lên
xanh.

Toạ độ ô trải qua **hai phép dịch** không thấy được bằng mắt: bỏ dòng trùng làm mọi
dòng phía sau dồn lên một bậc, và trang kết quả có thêm hàng tiêu đề. Lệch một dòng thì
màu chỉ sang ô bên cạnh ô thật sự có vấn đề, mà bảng vẫn trông như đúng — nên `apDung()`
trả về toạ độ đã quy đổi sẵn, và có ba ca thử riêng đo đúng việc quy đổi ấy.

---

## Đã đo được gì

Chạy trên bản xuất giám sát ca bệnh thật, **2.000 dòng × 90 cột**:

- Đọc tệp **0,11 giây**, rà soát **0,23 giây**.
- Toàn bộ **180.090 ô đọc ra khớp tuyệt đối** với `openpyxl` — hai đường đọc hoàn toàn
  độc lập.
- Nhận dạng hồ sơ **khớp 100%** số cột đặc trưng.
- Tự tìm ra đúng các khiếm khuyết đã biết của tệp: 40 dòng lẫn định dạng ngày, 12 cặp
  bản ghi trùng, 25 dòng ngày chuyển giám sát trước ngày khẳng định, giới tính ghi bốn
  kiểu khác nhau.
- Làm sạch: sửa **12.635 ô**, bỏ 12 dòng, còn **1.988 dòng**. `openpyxl` mở lại được
  tệp kết quả, mã CRC đúng ở mọi mục.
- Ba con số khớp với đáp án có sẵn của bộ dữ liệu, tính bằng đường hoàn toàn khác:
  **1.988** dòng sau làm sạch · **7** ca phát hiện năm 2026 · độ trễ trung vị từ khẳng
  định đến nhập liệu **483 ngày**.

Bộ thử: **202 ca chọn tay** cộng **770 ca sinh theo tổ hợp**, đạt hết, không bỏ lọt và
không báo nhầm ca nào.

---

## Triển khai lên GitHub Pages

**Nguồn Pages phải là gốc nhánh, KHÔNG phải thư mục `docs/`.** Cả hai vỏ nạp lõi bằng
`../src/index.js`, tức một cấp trên `docs/`. Trỏ Pages vào `docs/` thì `src/` nằm ngoài
phạm vi trang, mọi phép nạp mô-đun trả 404 — mà trang vẫn mở ra bình thường nên rất dễ
tưởng đã xong.

Trong *Settings › Pages*: **Source** = `Deploy from a branch`, **Branch** = `main`,
**Folder** = `/ (root)`.

Dựng bản dùng riêng ở kho khác thì thay tài khoản và tên kho ở `vo-addin/manifest.xml`
và `tai-lieu/cai-dat.md`. **Giữ nguyên thẻ `<Id>`** qua mọi lần cập nhật — đổi nó thì
Excel coi đây là add-in khác và người dùng phải cài lại từ đầu.

**Không commit bất kỳ tệp dữ liệu nào**, thật hay mô phỏng. `.gitignore` đã chặn
`*.xlsx`, `*.xls`, `*.xlsm`, `*.csv`; tệp mẫu của bộ thử sinh ra lúc chạy.
