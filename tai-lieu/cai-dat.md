# Hướng dẫn cài đặt

Công cụ có **hai cách dùng**. Cách thứ nhất không phải cài gì; hãy thử cách đó trước.

---

## Cách 1 — Dùng ngay trên trình duyệt, không cài đặt

Mở địa chỉ sau bằng Microsoft Edge hoặc Google Chrome:

```
https://codelabr.github.io/da-assist/docs/
```

Kéo tệp `.xlsx` của bạn vào khung giữa trang. Xong.

**Tệp của bạn không được tải lên đâu cả.** Trang web này chỉ là một chương trình
chạy trong trình duyệt trên chính máy bạn; nó đọc tệp ngay tại chỗ. Bạn có thể
kiểm chứng bằng cách ngắt mạng sau khi trang đã mở — công cụ vẫn chạy bình thường.

Cách này chạy trên cả Windows và macOS, không cần quyền quản trị máy, và không
phụ thuộc phiên bản Excel.

**Hạn chế:** công cụ đọc tệp nhưng không sửa trực tiếp vào bảng tính đang mở.
Kết quả tải về thành tệp mới.

---

## Cách 2 — Cài thành add-in trong Excel

Cách này cho phép công cụ hiện ngay trong dải lệnh Excel và ghi kết quả thẳng vào
bảng tính. Đổi lại, phải cài một lần.

Cần: Microsoft 365, Office 2021 hoặc Office 2019 trở lên. Office 2016 và các bản
cũ hơn không chạy được add-in loại này — hãy dùng Cách 1.

### Bước chung: tải tệp kê khai

Tải tệp `manifest.xml` từ kho:

```
https://raw.githubusercontent.com/codelabr/da-assist/main/vo-addin/manifest.xml
```

Mở địa chỉ trên rồi lưu trang lại bằng `Ctrl+S`. Nếu trình duyệt hiện nội dung tệp
thay vì tải về, hãy bấm chuột phải chọn *Lưu thành*. Khi kho đã có bản phát hành thì
tải ở mục Phát hành cho gọn hơn: `https://github.com/codelabr/da-assist/releases`.

Lưu vào một thư mục cố định, **không phải** thư mục Tải xuống — nếu sau này bạn
xoá tệp ấy thì add-in biến mất khỏi Excel.

Ví dụ nên dùng: `D:\CongCu\DaAssist\` trên Windows.

### Cách nhanh nhất để thử: Excel trên web

Đường này **không cần chia sẻ thư mục và không cần quyền quản trị máy**, nên dùng để
thử xem add-in chạy được không trước khi cài lên Excel trên máy.

1. Mở `https://excel.cloud.microsoft` và đăng nhập bằng tài khoản Microsoft 365 của
   bạn, rồi mở một bảng tính bất kỳ.
2. Vào **Chèn** → **Add-in** → **Add-in của tôi**.
3. Bấm **Tải lên add-in của tôi** ở góc trên bên phải hộp thoại.
4. Chọn tệp `manifest.xml`, bấm **Tải lên**.

Add-in hiện ngay ở thẻ **Trang đầu**, nhóm **DA Assist**, không phải mở lại Excel.

Cách này chỉ giữ trong phiên làm việc: đóng trình duyệt là add-in mất, tải lên lại là
xong. Vì vậy nó tốt cho việc thử chứ không dùng để phát cho học viên.

### Trên Windows — một dòng lệnh

Cách này **không cần quyền quản trị** và không phải chia sẻ thư mục qua mạng.

Mở **Windows PowerShell** (bấm phím Windows, gõ `powershell`, Enter) rồi dán dòng sau:

```powershell
irm https://codelabr.github.io/da-assist/cai-dat.ps1 | iex
```

Kịch bản in ra từng bước nó làm. Xong thì **đóng hẳn Excel rồi mở lại**; add-in hiện
ở thẻ **Trang đầu**, nhóm **DA Assist**.

Gỡ ra cũng một dòng:

```powershell
irm https://codelabr.github.io/da-assist/go-cai-dat.ps1 | iex
```

**Nên đọc kịch bản trước khi chạy.** Dán một địa chỉ lạ vào PowerShell rồi chạy ngay
là thói quen nguy hiểm, kể cả khi lần này an toàn. Mở hai địa chỉ sau trong trình
duyệt để đọc — mỗi tệp khoảng bảy mươi dòng, có chú thích tiếng Việt:

- `https://codelabr.github.io/da-assist/cai-dat.ps1`
- `https://codelabr.github.io/da-assist/go-cai-dat.ps1`

Kịch bản cài làm đúng ba việc: tải `manifest.xml` về `%LOCALAPPDATA%\DaAssist`, kiểm
tệp ấy có phải XML hợp lệ và có đúng mã định danh của add-in, rồi khai đường dẫn tệp
vào một mục trong sổ đăng ký của **riêng tài khoản Windows của bạn**
(`HKEY_CURRENT_USER`). Nó không cài dịch vụ, không mở cổng mạng, không đụng đến tệp
dữ liệu nào. Kịch bản gỡ xoá đúng hai thứ ấy — và nếu bạn có lưu tệp riêng vào thư
mục đó thì nó giữ lại, chỉ xoá bản kê khai.

### Trên Windows — cách thủ công, khi cần phát cho cả lớp

Cách một dòng lệnh khai một đường dẫn cố định trên từng máy, phù hợp khi mỗi người tự
cài. Nếu bạn muốn phát cho cả lớp từ một thư mục dùng chung thì dùng cách dưới đây.

1. Tạo thư mục chứa tệp kê khai, ví dụ `D:\CongCu\DaAssist\`, rồi chép
   `manifest.xml` vào đó.
2. Bấm chuột phải vào thư mục ấy, chọn **Thuộc tính** → thẻ **Chia sẻ** →
   **Chia sẻ nâng cao** → tích **Chia sẻ thư mục này** → **OK**.
   Ghi lại đường dẫn mạng hiện ra, dạng `\\TEN-MAY\DaAssist`.
3. Mở Excel. Vào **Tệp** → **Tuỳ chọn** → **Trung tâm tin cậy** →
   **Thiết đặt Trung tâm tin cậy** → **Danh mục add-in tin cậy**.
4. Dán đường dẫn mạng ở bước 2 vào ô **Đường dẫn danh mục**, bấm **Thêm danh mục**.
5. Tích vào ô **Hiển thị trong Menu**, bấm **OK** hai lần.
6. **Đóng hẳn Excel rồi mở lại.**
7. Vào **Chèn** → **Add-in của tôi** → thẻ **THƯ MỤC ĐÃ CHIA SẺ** → chọn
   **DA Assist** → **Thêm**.

Sau khi cài, add-in hiện ở thẻ **Trang đầu**, nhóm **DA Assist**.

### Trên macOS

1. Mở **Finder**.
2. Bấm **Đi** trên thanh menu, giữ phím **Option**, chọn **Thư viện**.
   *(Thư mục Thư viện bị ẩn; không giữ Option thì không thấy.)*
3. Đi tiếp theo đường: `Containers` → `com.microsoft.Excel` → `Data` →
   `Documents` → `wef`.
   Nếu chưa có thư mục `wef` thì tự tạo một thư mục đúng tên đó.
4. Chép `manifest.xml` vào thư mục `wef`.
5. **Đóng hẳn Excel rồi mở lại.**
6. Vào **Chèn** → **Add-in của tôi** → chọn **DA Assist**.

---

## Khi gặp trục trặc

| Hiện tượng | Nguyên nhân thường gặp |
|---|---|
| Không thấy DA Assist trong **Add-in của tôi** | Chưa đóng hẳn Excel rồi mở lại. Đóng mọi cửa sổ Excel, kể cả cửa sổ ẩn ở thanh tác vụ |
| Windows: không thấy thẻ **Thư mục đã chia sẻ** | Thư mục chưa được chia sẻ thật ở bước 2, hoặc đường dẫn nhập là `D:\...` thay vì `\\TEN-MAY\...` |
| Bảng điều khiển hiện ra trắng trơn | Máy đang không vào được mạng ở **lần mở đầu tiên**. Trang giao diện tải về một lần rồi lưu đệm; sau đó chạy được cả khi mất mạng |
| macOS: không tìm thấy thư mục `wef` | Chưa giữ phím Option khi bấm menu **Đi**, nên thư mục Thư viện vẫn ẩn |
| Excel báo add-in không hợp lệ | Tệp `manifest.xml` tải về bị hỏng — tải lại từ kho, và mở ra xem dòng đầu có đúng là `<?xml version="1.0"...` chứ không phải trang HTML báo lỗi |
| Dòng lệnh báo `Unable to connect` hoặc lỗi về SSL | Máy dùng Windows bản cũ nên PowerShell chưa bật TLS 1.2. Chạy `[Net.ServicePointManager]::SecurityProtocol = 'Tls12'` trước, rồi dán lại dòng lệnh cài |
| Dòng lệnh chạy xong nhưng Excel vẫn không thấy add-in | Chưa đóng hẳn Excel. Hoặc máy bị chính sách của cơ quan chặn add-in kiểu này — khi đó dùng Cách 1, bản chạy trên trình duyệt |
| Tên add-in trong Excel hiện ký tự lạ | Bản kê khai đã bị một công cụ nào đó ghi lại sai bảng mã. Gỡ rồi cài lại bằng dòng lệnh — kịch bản tải theo byte nên không làm hỏng dấu tiếng Việt |

---

## Câu hỏi hay gặp

**Công cụ có gửi dữ liệu của tôi đi đâu không?**
Không. Công cụ không gọi mô hình ngôn ngữ, không gửi tệp lên máy chủ nào. Thứ duy
nhất tải về từ mạng là chính trang giao diện, và chỉ ở lần mở đầu tiên. Toàn bộ mã
nguồn công khai, ai cũng đọc kiểm được.

**Tôi có phải xin phép đơn vị trước khi cài không?**
Việc cài một add-in không cần quyền quản trị máy. Nhưng nếu đơn vị bạn có quy định
riêng về phần mềm trên máy công vụ thì hãy theo quy định đó.

**Công cụ có sửa hỏng tệp gốc của tôi không?**
Không. Công cụ không bao giờ ghi đè lên tệp gốc. Kết quả luôn ra một trang tính
mới hoặc một tệp mới, kèm một trang nhật ký ghi rõ đã đổi gì ở dòng nào.
