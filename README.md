# DA Assist

Công cụ rà soát và làm sạch tệp Excel số liệu phòng, chống HIV/AIDS, dành cho cán bộ
CDC tuyến tỉnh.

**Chạy hoàn toàn trong máy. Không gọi mô hình ngôn ngữ. Không gửi dữ liệu đi đâu.**

## Dùng ngay

**Không cài gì** — mở [`codelabr.github.io/da-assist/docs/`](https://codelabr.github.io/da-assist/docs/)
rồi kéo tệp `.xlsx` vào trang. Tệp được đọc ngay trong trình duyệt trên máy bạn; ngắt
mạng sau khi trang đã mở thì công cụ vẫn chạy.

**Cài thành add-in Excel trên Windows** — một dòng trong PowerShell, không cần quyền
quản trị. Đóng hẳn Excel trước:

```powershell
irm https://codelabr.github.io/da-assist/cai-dat.ps1 | iex
```

Gỡ ra:

```powershell
irm https://codelabr.github.io/da-assist/go-cai-dat.ps1 | iex
```

Nên mở [`cai-dat.ps1`](cai-dat.ps1) đọc trước khi chạy — dán một địa chỉ lạ vào
PowerShell rồi chạy ngay là thói quen nguy hiểm, kể cả khi lần này an toàn.

Hướng dẫn đầy đủ, kèm macOS và cách phát cho cả lớp:
[`tai-lieu/cai-dat.md`](tai-lieu/cai-dat.md).

## Công cụ kiểm những gì

**51 quy tắc**, chia năm nhóm:

| Nhóm | Số quy tắc | Nội dung |
|---|---:|---|
| `KC` | 13 | Cấu trúc cột, kiểu dữ liệu, cách ghi giá trị, dòng trùng — chạy với mọi bảng |
| `Y1` | 15 | Thứ tự thời gian: kết thúc trước khi bắt đầu, tử vong trước chẩn đoán… |
| `Y2` | 8 | Mâu thuẫn trạng thái: đang điều trị mà có ngày tử vong… |
| `Y10` | 6 | Định danh: một mã ứng với nhiều người, căn cước thiếu chữ số… |
| `BB` | 9 | Số học của biểu đã cộng: dòng con vượt dòng cha, cột tổng không khớp… |

Nhóm `Y` chỉ chạy khi công cụ nhận ra ý nghĩa của cột; không nhận ra thì quy tắc liên
quan không chạy, chứ không đoán bừa.

Mỗi phát hiện xếp một trong ba mức: **chắc chắn · cần xác minh · ghi nhận**. Không bao
giờ chỉ có hai mức.

Danh sách đầy đủ từng quy tắc, viết cho cán bộ dùng: xem tài liệu hướng dẫn sử dụng của
khoá tập huấn. Phần thiết kế kỹ thuật: [`tai-lieu/thiet-ke.md`](tai-lieu/thiet-ke.md).

## Kết quả ghi ra

Bốn trang tính mới trong cùng tệp. **Trang gốc không bị đổi một ô nào**, kể cả màu nền.

| Trang | Nội dung |
|---|---|
| Đã làm sạch | Dữ liệu sau khi sửa. Ô đã sửa tô xanh, ô còn vấn đề tô vàng |
| Danh sách vấn đề | Mỗi phát hiện một dòng: mã, mức, địa chỉ ô, lý do. Lọc và sắp xếp được |
| Nhóm trùng | Các bản ghi trùng xếp liền nhau |
| Nhật ký | Từng ô đã đổi: trước, sau, và quy tắc nào sinh ra phép sửa |

Màu không bao giờ là tín hiệu duy nhất — mọi ô có màu đều có mặt dưới dạng chữ ở trang
Nhật ký hoặc trang Danh sách vấn đề.

## Năm nguyên tắc không được vi phạm

1. **Không gửi dữ liệu ra khỏi máy.** Chỉ tải chính trang giao diện ở lần mở đầu.
2. **Không bao giờ đè lên bản gốc.** Thay đổi do add-in gây ra không vào được ngăn xếp
   hoàn tác của Excel, nên ghi sang trang mới là đường lùi duy nhất.
3. **Máy khoanh vùng, người quyết định.** Không kết luận một tệp đã sạch.
4. **Không nhận bừa loại tệp.** Dưới ngưỡng tin cậy thì lùi về tầng kiểm chung và nói
   rõ là đang ở tầng chung.
5. **Không viện dẫn sai điều luật.** Viện sai tai hại hơn không viện: cán bộ mang điều
   khoản ấy đi họp, bị bác lại, rồi thôi tin cả công cụ.

## Phát triển

Cần Node 18 trở lên. Không phải cài gói nào.

```bash
node bo-thu/chay.js          # 202 ca chọn tay
node bo-thu/chay-nhieu.js    # 770 ca sinh theo tổ hợp
```

Chạy lõi trên một tệp thật:

```bash
TEP_THU="D:/duong/dan/tep.xlsx" node bo-thu/thu-tep-that.js
```

Xem giao diện. Mô-đun ES không mở được qua `file://` nên cần một máy chủ tĩnh:

```bash
python -m http.server 8731
```

Rồi mở `/docs/index.html` (vỏ HTML) hoặc `/docs/xem-thu-addin.html` (bảng điều khiển
add-in với bộ Excel giả, không cần Excel).

**Vỏ chỉ có một việc:** đưa vùng ô thô vào `raSoat()` rồi hiển thị kết quả. Mọi suy
luận nằm trong lõi, nên bộ thử chạy không cần Excel và không cần trình duyệt.

## Cấu trúc thư mục

```
da-assist/
├─ cai-dat.ps1 · go-cai-dat.ps1   Cài và gỡ add-in bằng một dòng lệnh
├─ docs/        Trang GitHub Pages phục vụ: vỏ HTML, bảng điều khiển add-in, phông
├─ src/         Lõi — mọi suy luận nằm ở đây, không phụ thuộc Excel hay trình duyệt
│  ├─ doc-tep/ · ghi-tep/   Đọc và ghi .xlsx, không dùng thư viện ngoài
│  ├─ bang/                 Nhận hình dạng tệp, hàng tiêu đề, suy kiểu cột
│  ├─ kiem/                 51 quy tắc
│  ├─ ho-so/ · tu-dien/     Nhận dạng loại tệp và ý nghĩa cột
│  ├─ phong-van/            Sinh câu hỏi từ bằng chứng đo trong dữ liệu
│  ├─ sua/ · xuat/          Đề xuất phép sửa; dựng bộ trang kết quả
│  ├─ vo-addin/             Đọc, ghi, chọn ô và tô màu qua Office.js
│  └─ phan-tich/ · bieu-mau/   Phần của bản cũ, chờ xoá
├─ vo-addin/    Bản kê khai add-in
├─ bo-thu/      Bộ thử tự động, bộ sinh tệp mẫu, bộ Excel giả
└─ tai-lieu/    Hướng dẫn cài đặt và tài liệu thiết kế
```
