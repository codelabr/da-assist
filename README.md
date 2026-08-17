# DA Assist — công cụ rà soát, làm sạch và phân tích tệp Excel

Công cụ hỗ trợ cán bộ CDC tuyến tỉnh rà soát, làm sạch và phân tích các tệp Excel
của công tác phòng, chống HIV/AIDS.

**Chạy hoàn toàn trong máy. Không gọi mô hình ngôn ngữ. Không gửi dữ liệu đi đâu.**

- Phương án đầy đủ: [`../../PHUONG_AN_CONG_CU_EXCEL.md`](../../PHUONG_AN_CONG_CU_EXCEL.md)
- Hướng dẫn cài đặt: [`tai-lieu/cai-dat.md`](tai-lieu/cai-dat.md)

---

## Tình trạng

**Công cụ đã làm được trọn năm việc trong cả hai vỏ, và đã đo trên dữ liệu thật.**
Việc lớn còn lại là **chạy thử trên Excel thật** — cần một máy có Excel, thứ mà máy
dựng không có. Ngoài ra còn hồ sơ nhận dạng cho các loại danh sách khác (PrEP,
Methadone, tải lượng vi rút, danh sách xét nghiệm), chờ hàng tiêu đề thật.

| Phần | Tình trạng |
|---|---|
| Đọc tệp `.xlsx` | ✅ Xong, không dùng thư viện ngoài |
| Tầng 0 — nhận hình dạng tệp và hàng tiêu đề | ✅ Xong |
| Tầng 1 — suy kiểu cột và 13 phép kiểm chung | ✅ Xong |
| Tầng 1b — 8 phép kiểm số học cho biểu đã cộng | ✅ Xong |
| Tầng 2 — nhận dạng hồ sơ, hồ sơ HIV-INFO đầu tiên | ✅ Xong |
| Tầng 2 — danh mục 15 biểu mẫu Thông tư 05, nhận theo nhãn dòng | ✅ Xong |
| Biểu mẫu Phụ lục 4 Thông tư 07 | ✅ Xong |
| Phỏng vấn người dùng về ý nghĩa cột | ✅ Xong, đã nối vào giao diện |
| Hồ sơ đơn vị — nhớ câu trả lời, lưu ra tệp, nạp lại | ✅ Xong |
| Ghi tệp `.xlsx` | ✅ Xong, không dùng thư viện ngoài |
| Áp dụng phép sửa, xem trước và ghi ra tệp mới kèm nhật ký | ✅ Xong |
| 28 phân tích nhóm A, B, C, D kèm biểu đồ | ✅ Xong |
| Che ô nhỏ trước khi bảng rời khỏi màn hình | ✅ Xong |
| Vỏ HTML | ✅ Chạy được đủ năm việc |
| Vỏ add-in Office.js | ✅ Xong — **chưa chạy thử trên Excel thật**, xem mục dưới |
| Hồ sơ cho các loại danh sách còn lại | ⏳ Chờ hàng tiêu đề mẫu |

### Đã đo được gì

Chạy trên bản xuất giám sát ca bệnh thật, **2.000 dòng × 90 cột**:

- Đọc tệp **0,11 giây**, rà soát **0,23 giây**.
- Toàn bộ **180.090 ô đọc ra khớp tuyệt đối** với `openpyxl` — hai đường đọc
  hoàn toàn độc lập.
- Nhận dạng hồ sơ **khớp 100%** số cột đặc trưng.
- Mọi ô của Phụ lục 4 **khớp tuyệt đối** với phép tính độc lập viết bằng Python.
- Tự tìm ra đúng các khiếm khuyết đã biết của tệp: 40 dòng lẫn định dạng ngày,
  12 cặp bản ghi trùng, 25 dòng ngày chuyển giám sát trước ngày khẳng định,
  giới tính ghi bốn kiểu khác nhau.
- Làm sạch: sửa **12.635 ô**, bỏ 12 dòng, còn **1.988 dòng**. `openpyxl` mở lại được
  tệp kết quả, mã CRC đúng ở mọi mục.
- Phân tích: **26 trên 28** phân tích chạy được, cả 26 trong **0,10 giây**.
- Ba con số khớp với đáp án đã có sẵn của bộ dữ liệu, tính bằng đường hoàn toàn khác:
  **1.988** dòng sau làm sạch · **7** ca phát hiện năm 2026 · độ trễ trung vị từ
  khẳng định đến nhập liệu **483 ngày**.

---

## Chạy thử

Cần Node phiên bản 18 trở lên. Không cần cài gói nào.

```bash
node bo-thu/chay.js
```

Chạy lõi trên một tệp thật của bạn:

```bash
TEP_THU="D:/duong/dan/tep.xlsx" node bo-thu/thu-tep-that.js
```

Xem vỏ HTML. Mô-đun ES không mở được qua `file://`, nên cần một máy chủ tĩnh:

```bash
python -m http.server 8731
```

Rồi mở `http://127.0.0.1:8731/docs/index.html`.

---

## Triển khai lên GitHub Pages

**Nguồn Pages phải là gốc nhánh, KHÔNG phải thư mục `docs/`.** Đây là chỗ dễ làm sai
nhất của kho này: cả hai vỏ nạp lõi bằng `../src/index.js`, tức một cấp **trên**
`docs/`. Trỏ Pages vào `docs/` thì `docs/` thành gốc trang, `src/` nằm ngoài phạm vi,
mọi phép nạp mô-đun trả về 404 và công cụ không chạy được một dòng nào — mà trang vẫn
mở ra bình thường nên rất dễ tưởng là đã xong.

Trong *Settings › Pages* của kho: **Source** = `Deploy from a branch`, **Branch** =
`main`, **Folder** = `/ (root)`.

Ba địa chỉ sau đó:

| Dùng để | Địa chỉ |
|---|---|
| Vỏ HTML, không cần cài | `https://codelabr.github.io/da-assist/docs/` |
| Bảng điều khiển add-in | `https://codelabr.github.io/da-assist/docs/khung-addin.html` |
| Địa chỉ trần | chuyển hướng sang vỏ HTML nhờ `index.html` ở gốc |

Nếu bạn tạo bản dùng riêng ở kho khác, thay tài khoản và tên kho ở `vo-addin/manifest.xml`
và `tai-lieu/cai-dat.md`. Giữ nguyên thẻ `<Id>` trong bản kê khai qua mọi lần cập
nhật — đổi nó thì Excel coi đây là add-in khác và người dùng phải cài lại từ đầu.

**Đừng commit tệp dữ liệu.** `.gitignore` đã chặn `*.xlsx`, `*.xls`, `*.xlsm`, `*.csv`.
Mọi tệp mẫu của bộ thử đều sinh ra lúc chạy.

---

## Cấu trúc thư mục

```
da-assist/
├─ index.html       Trang gốc, chuyển hướng sang docs/index.html
├─ docs/            Trang GitHub Pages phục vụ
│  ├─ index.html       vỏ HTML — kéo tệp vào là chạy, không cài đặt
│  ├─ khung-addin.html bảng điều khiển của add-in trong Excel
│  ├─ ham-nen.html     trang nền Office bắt buộc phải có
│  └─ bieu-tuong-*.png biểu tượng 16, 32, 80 điểm ảnh
├─ src/
│  ├─ tien-ich/        Xử lý chuỗi tiếng Việt và ngày tháng
│  ├─ doc-tep/         Giải nén zip và đọc .xlsx
│  ├─ bang/            Tầng 0 và tầng 1: hình dạng, tiêu đề, suy kiểu cột
│  ├─ kiem/            Phép kiểm chung cho danh sách, và cho biểu đã cộng
│  ├─ ho-so/           Tầng 2: hồ sơ danh sách, và danh mục biểu Thông tư 05
│  ├─ phong-van/       Sinh câu hỏi từ bằng chứng; hồ sơ đơn vị
│  ├─ sua/             Đề xuất và áp dụng phép sửa
│  ├─ ghi-tep/         Ghi .xlsx và đóng gói zip
│  ├─ vo-addin/        Đọc ghi qua Office.js
│  ├─ bieu-mau/        Dựng biểu mẫu pháp định
│  └─ index.js         Điểm vào duy nhất của lõi
├─ vo-addin/         Bản kê khai của add-in (manifest.xml)
├─ bo-thu/           Bộ thử tự động và bộ sinh tệp mẫu
└─ tai-lieu/         Hướng dẫn cài đặt
```

Vỏ chỉ có một việc: đưa vùng ô thô vào `raSoat()` rồi hiển thị kết quả trả ra.
Mọi suy luận nằm trong lõi, nên bộ thử chạy được mà không cần Excel và không cần
trình duyệt.

---

## Hỏi người dùng về ý nghĩa cột, không cần mô hình ngôn ngữ

Máy không cần *hiểu* ý nghĩa cột — nó cần *hỏi đúng câu*. Câu đúng sinh ra được từ
bằng chứng đo trong chính dữ liệu, ở `src/phong-van/`.

**Ba kỷ luật.** Vi phạm cái nào thì việc phỏng vấn thành một biểu mẫu 90 câu mà
không ai điền:

1. **Chỉ hỏi khi câu trả lời làm đổi một quyết định cụ thể.** Mỗi câu hỏi phải khai
   rõ nó phục vụ việc gì và vì sao hỏi; không khai được thì không hỏi. Bộ thử kiểm
   điều này trên từng câu.
2. **Chỉ hỏi khi dữ liệu không tự phân giải được.** Thứ tự ngày–tháng chỉ được hỏi
   khi trong cột không có một giá trị nào có thành phần đầu lớn hơn 12; chỉ cần một
   giá trị như vậy là khỏi hỏi.
3. **Hỏi bằng ví dụ thật và hệ quả, không bằng thuật ngữ.** Cán bộ trả lời được
   "gộp 12 hay gộp 27 bản ghi", chứ khó trả lời "khoá định danh là gì".

**Bốn kỹ thuật thay cho việc đọc hiểu ngữ nghĩa:**

| Kỹ thuật | Làm được gì |
|---|---|
| Gom cột theo **mẫu ô trống giống hệt** | Cột trống ở đúng những dòng giống nhau thuộc cùng một khối nghiệp vụ. Trên bản xuất thật, 20 cột gom thành 7 câu hỏi |
| **Phụ thuộc hàm** hai chiều | Cột A xác định B và B xác định A → cặp mã và nhãn của cùng một thứ. Hỏi một câu xác nhận, sau đó không đếm hai lần |
| Tính sẵn **hệ quả** của mỗi bộ khoá | Hỏi "hai dòng thế nào là cùng một người" bằng cách hiện số nhóm trùng của từng lựa chọn |
| **Hồ sơ nhận dạng trả lời sẵn** | Với tệp đã biết, câu hỏi hiện ra ở dạng đã điền sẵn, người dùng chỉ xác nhận |

**Lọc theo cột mà thao tác chạm tới.** Đây là chỗ quyết định công cụ dùng được hay
không. Đo trên bản xuất thật 90 cột:

| Thao tác | Số câu hiện ra |
|---|---|
| Bấm *Gộp trùng* | **1** |
| Bấm *Dựng Phụ lục 4* | **4** |
| Bấm *Sửa cột Giới tính* | **0** |
| Nếu hỏi hết một lượt (không làm thế) | 27 |

**Hồ sơ đơn vị** là thứ khiến việc phỏng vấn đáng bỏ công. Câu trả lời lưu thành một
tệp JSON: lần sau mở tệp cùng loại thì không hỏi lại, tệp ấy chia sẻ được cho đồng
nghiệp, và nó tự trở thành một hồ sơ nhận dạng mới cho tầng 2. Công cụ học được,
nhưng học từ người dùng chứ không từ mô hình nào.

Trong giao diện, hồ sơ được nhớ ngay trong máy theo chữ ký cấu trúc của tệp, và có
ba nút: **Lưu ra tệp** · **Nạp từ tệp** · **Xoá hết câu trả lời**. Khi nạp một hồ sơ
không khớp cấu trúc tệp đang mở, công cụ báo độ khớp rồi từ chối thay vì nạp bừa.

**Tệp hồ sơ chỉ chứa câu trả lời về ý nghĩa các cột, không chứa dữ liệu.** Đó là lý
do gửi được cho đồng nghiệp mà không vướng gì về bảo mật.

**Chỗ mô hình ngôn ngữ vẫn hơn, nói thẳng:** một cột tên lạ hoàn toàn mà dữ liệu bên
trong không gợi ý gì thì mô hình đoán được từ tên cột, còn phỏng vấn thì phải hỏi.
Nhưng với cột lạ, người dùng mới là bên có thẩm quyền. Còn với cột ghi chú tự do,
hành vi đúng của công cụ này là cảnh báo có thể chứa thông tin định danh, chứ không
phải đọc hiểu nội dung.

---

## Biểu đã cộng: kiểm bằng quan hệ số học

Danh sách và biểu đã cộng phải kiểm bằng hai bộ luật khác nhau. Biểu đã cộng không
có bản ghi trùng, không có định danh, gần như mọi ô là số đếm — nên toàn bộ 13 phép
kiểm của danh sách vô dụng ở đây. Nhưng biểu lại có thứ mà danh sách không có: **các
quan hệ số học**. Một dòng tổng không khớp, hay một dòng con lớn hơn dòng cha, là
lỗi nhìn ra được mà không cần biết biểu này là biểu gì.

`src/kiem/kiem-bieu.js` có 8 phép kiểm chạy với mọi biểu, kể cả bảng tự làm tại đơn vị:

| Mã | Nội dung | Mức |
|---|---|---|
| BB01 | dòng con lớn hơn dòng cha theo mã phân cấp | chắc chắn |
| BB02 | cột tổng **nhỏ hơn** tổng các cột phân tổ | chắc chắn |
| BB03 | cột tổng **lớn hơn** tổng các cột phân tổ | cần xác minh |
| BB04 | dòng tổng không khớp bất kỳ cách gom nào máy thử | cần xác minh |
| BB05 | ô mang số âm trong cột số liệu | cần xác minh |
| BB06 | số ghi dưới dạng chuỗi — `SUM` bỏ qua mà không báo lỗi | chắc chắn |
| BB07 | cùng một cột dùng lẫn ô trống và số 0 | ghi nhận |
| BB08 | dòng có nhãn chỉ tiêu nhưng chưa điền số nào | cần xác minh |

**Hai chiều lệch của cùng một phép so mang hai nghĩa khác nhau**, nên phải xếp hai
mức khác nhau. Tổng nhỏ hơn Nam + Nữ là mâu thuẫn logic: hai nhóm rời nhau thì tổng
không thể nhỏ hơn phần của chúng. Tổng lớn hơn thì chưa chắc lỗi — biểu có thể còn
nhóm không xác định được giới tính mà không in thành cột. Gộp cả hai vào một mức là
dạy người dùng bỏ qua cảnh báo.

**Không suy ra quan hệ cộng mà biểu không tự khai.** Chữ "Trong đó" trong phụ lục
Thông tư 05 mang ba nghĩa khác nhau, và chỉ hai nghĩa đầu cho phép cộng:

| Kiểu | Ví dụ | Cộng được? |
|---|---|---|
| phân hoạch | Bảng 6: mục 1 = 1.1 + 1.2 + 1.3, ba thời điểm bắt đầu ARV rời nhau | có |
| tập con rời | Bảng 2: mục 6 = 6.1 + 6.2, mang thai và chuyển dạ | có |
| **tập lồng** | Bảng 3: mục 1.2 *trên 12 tháng* nằm trong 1.1 *trên 6 tháng* | **không** |

Trên biểu Methadone điền đúng, ba mục con cộng lại được 795 trong khi mục cha là 420
— hoàn toàn hợp lệ, vì một bệnh nhân điều trị trên 12 tháng và có HIV dương tính
được đếm ở cả ba mục. Áp quan hệ cộng cho mọi bộ mục con thì báo nhầm ngay trên một
biểu không có lỗi nào. Vì vậy phép kiểm duy nhất áp cho **mọi** biểu là quan hệ bao
hàm — dòng con không lớn hơn dòng cha; quan hệ bằng chỉ kiểm khi hồ sơ biểu khai rõ.

`src/ho-so/tt05-bieu-bao-cao.js` khai 15 biểu mẫu của Thông tư 05, **nhận dạng theo
nhãn dòng và khối chữ phía trên hàng tiêu đề** chứ không theo tên cột — vì ở biểu đã
cộng, ý nghĩa nằm trong dòng. Mỗi biểu khai thêm hai thứ tầng chung không suy ra được:

- **quan hệ giữa các dòng ngang cấp**, thứ mà mã phân cấp không nói lên. Ví dụ ở biểu
  duy trì PrEP, mục 2 *duy trì 3 tháng liên tục* là tập con của mục 1 *bắt đầu điều
  trị trong năm*, dù hai mục cùng cấp và mã số không hề gợi ra quan hệ ấy.
- **cách cắt kỳ**, chỗ dễ sai nhất và không nhìn ra được từ số liệu. Xem mục dưới.

### Ba cách cắt kỳ, đừng lẫn

| Chế độ | Mốc | Căn cứ |
|---|---|---|
| Giám sát ca bệnh | trọn quý dương lịch | Thông tư 07 Điều 11 khoản 2 |
| Báo cáo hoạt động | 15 tháng trước kỳ → 14 tháng cuối kỳ | Thông tư 05 Điều 3 |
| **Duy trì PrEP, báo cáo năm** | **15/9 năm trước → 14/9 năm báo cáo** | Phụ lục 3/5 Bảng 1 |

Cách thứ ba chỉ áp cho một biểu duy nhất và không giống hai cách kia. Lấy số theo
năm dương lịch cho biểu ấy sẽ ra con số khác mà không có gì báo lỗi.

Một hệ quả nữa của cách cắt kỳ: **báo cáo năm không phải lúc nào cũng bằng tổng bốn
quý.** Chỉ tiêu đếm số phát sinh trong kỳ thì cộng bốn quý; chỉ tiêu đếm số hiện có
tại thời điểm cuối kỳ thì lấy đúng số của quý IV. Trong cùng một biểu Methadone, mục
1 thuộc loại thứ hai còn mục 5 thuộc loại thứ nhất. Công cụ nêu điều này ở mức ghi
nhận cho từng biểu.

---

## Thêm một loại tệp mới

Danh sách thì viết thêm một tệp mô tả trong `src/ho-so/`, rồi thêm nó vào `DS_HO_SO`
trong `src/index.js`. Biểu đã cộng thì thêm một mục vào `DS_BIEU_TT05`. Không sửa mã lõi.

Mỗi hồ sơ gồm bốn phần: dấu hiệu nhận dạng kèm trọng số, từ điển tên cột, tập giá
trị hợp lệ kèm căn cứ pháp lý, và danh sách phân tích mở khoá được.

**Ba dạng khoá tên cột**, mỗi dạng cho một mục đích:

| Dạng | Nghĩa |
|---|---|
| `"a b"` | tên cột chứa cụm này |
| `"abc"` | tên cột có đúng từ này |
| `"=abc"` | tên cột đúng bằng chuỗi này |

Cả ba dạng đều so theo **ranh giới từ**, không so chứa chuỗi. Nếu không thì khoá
`name` nuốt `facility_name`, và khoá `tam tru` nuốt `huyết áp tâm trương`.

**Không đưa vào từ điển những khoá mà bản bỏ dấu trùng một từ thông dụng.** Bỏ dấu
thì `nam` (giới tính) và `năm` (thời gian) thành một; đó là lý do hồ sơ HIV-INFO
dùng khoá `=gioi tinh` chứ không dùng khoá trần `nam`.

---

## Vì sao kho này tách riêng và công khai

**Kho này chỉ chứa mã nguồn của công cụ.** Không chứa dữ liệu, không chứa tài liệu
giảng dạy, không chứa khoá bí mật.

Thư mục `Materials` của khoá tập huấn **không được đẩy lên GitHub công khai**:
trong đó có bộ dữ liệu mô phỏng với họ tên, số căn cước và số điện thoại trông như
thật, có tài liệu hướng dẫn giảng viên và có đáp án bài thực hành. Kho công khai
thì mọi tệp vào chỉ mục tìm kiếm, và xoá đi vẫn còn trong lịch sử commit.

Kho công khai là lựa chọn có chủ đích: cán bộ cần tin rằng công cụ không gửi dữ
liệu đi đâu, và cách chứng minh tốt nhất là để họ đọc được mã.

**Quy tắc bắt buộc:** không commit bất kỳ tệp dữ liệu thật hay mô phỏng nào vào
kho này. Tệp mẫu cho bộ thử do `bo-thu/mau.js` sinh ra lúc chạy, không lưu sẵn.

---

## Năm nguyên tắc không được vi phạm

1. **Không gửi dữ liệu ra khỏi máy.** Không gọi mạng, trừ việc tải chính trang
   giao diện ở lần mở đầu tiên.
2. **Không bao giờ đè lên tệp gốc.** Kết quả luôn ghi sang trang tính mới hoặc tệp
   mới, kèm trang nhật ký ghi đã đổi gì ở dòng nào.
3. **Máy khoanh vùng, người quyết định.** Không kết luận dữ liệu đã sạch. Ba mức
   kết luận, không bao giờ chỉ có hai: *chắc chắn* · *cần xác minh* · *ghi nhận*.
   Mức thứ ba quan trọng không kém hai mức đầu — cột trống hoàn toàn trong một bản
   xuất là đặc điểm của hệ thống nguồn, không phải lỗi nhập liệu.
4. **Không nhận bừa loại tệp.** Nhận dạng bằng chấm điểm và công bố độ tin cậy;
   dưới ngưỡng thì lùi về tầng kiểm chung và **nói rõ là đang ở tầng chung**.
5. **Không viện dẫn sai điều luật.** Cảnh báo viện sai điều khoản tai hại hơn
   không viện gì: cán bộ mang điều khoản ấy đi họp, bị bác lại, rồi thôi tin cả
   công cụ.

---

## Phân tích số liệu

28 phân tích, bốn nhóm. Mỗi phân tích **khai rõ những cột nó cần**, và bộ chạy xếp
vào một trong ba tình trạng:

| Tình trạng | Nghĩa |
|---|---|
| chạy được | có đủ cột và cột có dữ liệu |
| **cột có nhưng trống** | hệ thống nguồn không xuất ra trường này |
| thiếu cột | tệp không có trường này |

Phân biệt hai tình trạng sau là **điều bắt buộc**. Bản xuất HIV-INFO thật có đủ cột
tải lượng vi rút và CD4 nhưng trống hoàn toàn — nói "thiếu cột" là đổ lỗi cho người
dùng chọn nhầm tệp, trong khi lỗi nằm ở hệ thống nguồn. Trên bản xuất thật:
**26 trên 28 phân tích chạy được**, hai cái còn lại là C5 và C6 vì đúng lý do ấy.

| Nhóm | Nội dung |
|---|---|
| **A** — 11 mục | Mô tả dịch tễ theo thời gian, con người, địa điểm. Số ca theo năm và theo quý · chéo với giới tính, nhóm tuổi, đường lây, đối tượng · phân bố địa bàn · đối chiếu thường trú với hiện tại · **dấu hiệu chùm ca theo thời gian và địa điểm** |
| **B** — 9 mục | Chất lượng và độ trễ của hệ thống giám sát. Độ trễ khẳng định → chuyển giám sát và → nhập liệu · **tính kịp thời** · độ đầy đủ từng cột · trùng và nghi trùng · mâu thuẫn ngày tháng · giá trị ngoài bảng mã · đối chiếu các cột tử vong |
| **C** — 6 mục | Điều trị và kết cục. Tỷ lệ có hồ sơ điều trị · độ trễ đến ARV · phác đồ · kết thúc điều trị · ức chế vi rút · CD4 |
| **D** — 2 mục | Xét nghiệm nhiễm mới, luôn kèm mẫu số |

**Bốn nguyên tắc áp cho mọi phân tích:**

1. **Mọi tỷ lệ kèm tử số và mẫu số.** Không bao giờ đưa ra một tỷ lệ trần trụi.
2. **Nhóm tuổi và mọi ngưỡng lấy theo văn bản, không tự nghĩ ra.** Nhóm tuổi mặc định
   theo Phụ lục 9 Thông tư 07; đổi được sang cách chia của Thông tư 05. Ngưỡng tải
   lượng 1.000 bản sao/mL theo Thông tư 05 Bảng 4, ngưỡng 200 theo Quyết định 5968.
   Mốc CD4 dưới 350 là chuẩn quốc tế và được ghi rõ là **không có trong hướng dẫn
   Việt Nam**.
3. **Công khai cách tính khi cách tính là do công cụ tự đặt ra.** Phép tìm chùm ca
   nêu đủ công thức, và nói rõ đây là **dấu hiệu cần điều tra, không phải kết luận** —
   xác định chùm ca phải qua điều tra dịch tễ học.
4. **Tứ phân vị tính theo cách của Excel** (kiểu 7, nội suy tuyến tính), để con số
   công cụ đưa ra khớp với con số người dùng tự tính bằng hàm `QUARTILE`. Lệch nhau
   vài đơn vị là đủ để người ta thôi tin công cụ.

**Che ô nhỏ.** Bài S9 cho phép dán bảng đã tổng hợp sang công cụ AI, kèm đúng một
điều kiện: gộp nhóm các ô có số quá nhỏ. Công cụ **tính chính xác rồi mới che lúc
xuất**, chứ không che từ khâu tính — vì hai chỗ không được che là biểu mẫu pháp định
và màn hình làm việc của chính người dùng với dữ liệu của chính họ. Ô bằng 0 không
che: số không cho biết là không có ai, không lộ ra ai cả. Và công cụ nói thẳng giới
hạn: dòng tổng vẫn còn nên với bảng chỉ có một ô bị che thì trừ ngược ra được.

Biểu đồ vẽ bằng SVG thuần trong `docs/bieu-do.js`, không thư viện — ba loại: đường,
cột, cột chồng.

---

## Vỏ add-in Office.js

`docs/khung-addin.html` là bảng điều khiển hiện bên phải cửa sổ Excel. Nó dùng chung
toàn bộ lõi với bản HTML; chỉ hai lớp là khác:

| | Bản HTML | Bản add-in |
|---|---|---|
| Đọc | tệp `.xlsx` kéo vào | `src/vo-addin/doc-excel.js` đọc trang tính đang mở |
| Ghi | tải tệp mới về máy | `src/vo-addin/ghi-excel.js` tạo trang tính mới trong sổ đang mở |

**Ba điều dễ sai ở lớp đọc**, đều đã xử lý và đều có ca thử:

1. **Ô ngày của Excel trả về là một con số.** Chỉ định dạng ô mới cho biết đó là
   ngày, nên phải đọc kèm `numberFormat`. Bỏ qua thì mọi ngày thành dãy số năm chữ số.
2. **Vùng đã dùng không bắt đầu từ ô A1.** Phải lấy `rowIndex` và `columnIndex` chứ
   không giả định bằng 0.
3. **Đọc một lần cả trăm nghìn ô thì treo giao diện Excel.** Phải đọc theo khối và
   nhường quyền điều khiển giữa các khối.

**Ràng buộc quan trọng nhất ở lớp ghi:** add-in có quyền sửa bảng tính, nên đây là
chỗ nguy hiểm nhất của cả công cụ. Nó **chỉ được phép tạo trang tính mới**, không bao
giờ chạm vào trang cũ. Tên trang mới luôn được đặt tránh trùng — trùng tên thì Office
ném lỗi và người dùng mất hết kết quả vừa dựng.

### Đã kiểm được gì, chưa kiểm được gì

Máy dựng bộ này không có Excel, nên lớp vỏ add-in được đo bằng một **bộ Excel giả**
(`bo-thu/excel-gia.js`) mô phỏng Office.js. Bộ giả này bắt buộc phải gọi `sync()`
trước khi đọc dữ liệu, đúng như Office.js thật — mã quên `sync()` thì bộ thử trượt.

Đã kiểm: đọc vùng không bắt đầu từ A1 · đổi số thành ngày nhờ định dạng ô · đọc theo
khối · đặt tên trang tránh trùng · **không chạm vào trang gốc** · ghi ngày kèm định
dạng · giữ mã định danh ở dạng văn bản · vòng tròn đầy đủ đọc → làm sạch → ghi trang
mới. Toàn bộ luồng bảng điều khiển cũng đã chạy thật trong trình duyệt với bộ Excel
giả tiêm vào.

**Chưa kiểm được:** hành vi trên Excel thật — tốc độ với tệp hàng chục nghìn dòng,
cách Office xử lý `numberFormat` của những định dạng lạ, và quy trình cài đặt. Cần một
người có Excel chạy thử trước khi phát cho học viên.

---

## Làm sạch dữ liệu

Bốn ràng buộc, không được nới cái nào:

1. **Đề xuất theo nhóm lỗi**, không theo từng ô rời rạc. Người dùng tích chọn nhóm,
   không phải bấm hai nghìn lần.
2. **Mỗi nhóm có bảng xem trước** giá trị hiện tại → giá trị sau khi sửa, trên từng
   ô. Khoảng trắng hiện ra thành ký hiệu `␣` — không có nó thì `Nữ␣` và `Nữ` trông y
   hệt nhau và người dùng không hiểu công cụ định sửa cái gì.
3. **Không bao giờ ghi đè bản gốc.** Kết quả ra một tệp mới.
4. **Mọi thay đổi vào nhật ký** ở trang thứ hai của tệp kết quả: dòng nào ở tệp gốc,
   cột nào, giá trị trước, giá trị sau, thuộc nhóm nào.

Năm nhóm phép sửa. Bốn nhóm đầu máy tự đề xuất vì nó chắc chắn; nhóm thứ năm **chỉ
xuất hiện sau khi người dùng trả lời**, máy không tự sinh ra:

| Nhóm | Việc |
|---|---|
| Cắt khoảng trắng thừa | ở đầu, cuối và giữa |
| Thống nhất cách viết hoa | về dạng phổ biến nhất trong tệp |
| Chuẩn hoá cột ngày | mọi dạng — văn bản, số thứ tự Excel, hai định dạng lẫn nhau — về ô ngày thật |
| Bỏ dòng trùng | những dòng giống hệt trên mọi cột mang thông tin |
| **Gộp giá trị hiếm** | theo câu trả lời của người dùng, ví dụ `M` → `Nam` |

**Biến thể về dấu tiếng Việt KHÔNG có trong danh sách này.** `Vĩnh Thanh` và
`Vĩnh Thạnh` có thể là hai xã khác nhau thật, nên việc gộp phải do người quyết định
từng nhóm một.

Bộ ghi tệp `.xlsx` tự viết, không dùng thư viện ngoài; bộ nén lấy từ chính nền tảng
như bên đọc. Đã đo trên bản xuất thật: sửa **12.635 ô**, bỏ **12 dòng**, còn **1.988
dòng**, ghi tệp 1 MB trong 0,23 giây. `openpyxl` mở lại được, mã CRC đúng ở mọi mục,
ô ngày mang định dạng `dd/mm/yyyy`.

---

## Bảy điều đã trả giá mới biết, ghi lại để không lặp

**Bỏ dấu tiếng Việt để so tên cột thì đúng, để so giá trị dữ liệu thì sai.** Trên
tệp thật, `Xã Vĩnh Thanh` và `Xã Vĩnh Thạnh` bị gộp làm một. Đó có thể là hai xã
khác nhau thật — rất nhiều địa danh Việt Nam chỉ phân biệt bằng dấu. Vì vậy biến
thể *hoa thường* xếp mức chắc chắn, còn biến thể *về dấu* chỉ xếp mức cần xác minh
và máy không tự gộp.

**So trùng trên toàn bộ cột thì bỏ lọt hết.** Cột số thứ tự dòng luôn khác nhau
nên nó che mất mọi cặp trùng. Trên tệp thật, 12 cặp trùng giống nhau ở cả 89 cột
và chỉ khác đúng cột số thứ tự; so toàn dòng bỏ lọt cả 12 cặp. Phải loại cột số
thứ tự dòng ra khỏi phép so.

**So hai giá trị theo mặt chữ thì bỏ lọt ngày dạng ISO.** Chuỗi `"2019-05-26"` hiển
thị y hệt ô ngày cùng ngày ấy, nên chốt chặn "không đổi thì bỏ qua" mà so theo chuỗi
sẽ lặng lẽ bỏ qua đúng nhóm này. Hậu quả nặng hơn là bỏ lọt: cột lẫn hai định dạng
được sửa một nửa rồi trông như đã xong. Phải so cả kiểu, không chỉ mặt chữ.

**Mức nền của phép tìm chùm ca phải tính trên toàn bộ khoảng quan sát.** Bản đầu tôi
chia số ca cho *số tháng có ca*, và trên bản xuất thật thì ra **đúng không dòng nào** —
vì cách chia ấy đẩy mức nền lên xấp xỉ một ca mỗi tháng dù thực tế thưa hơn nhiều, và
ngưỡng cao đến mức không bao giờ vượt được. Chia cho số tháng của cả khoảng quan sát
thì tìm ra 12 dấu hiệu.

**Độ hiếm không phải là dấu hiệu của lỗi.** Bản đầu, bộ dò giá trị bất thường lọc
theo tần suất và sinh ra 18 câu hỏi trên tệp thật, trong đó 17 câu về những giá trị
hoàn toàn hợp lệ chỉ tình cờ ít gặp — `Người bán dâm`, `Tỉnh An Giang`,
`Mã 2 - Lái xe`. Người dùng gặp mười bảy câu vô nghĩa thì bỏ luôn câu thứ mười tám.
Dấu hiệu thật là **hình thức khác hẳn**: một mã viết tắt nằm giữa những nhãn bằng
chữ. Và không dùng độ dài làm thước đo — `Nữ` chỉ dài hai ký tự.

**Nhận ra hình dạng biểu rồi không kiểm gì cả cũng là một cách sai.** Bản đầu, gặp
biểu đã cộng thì công cụ báo đúng một câu "đây là biểu đã cộng, không đề xuất phép
làm sạch nào" rồi dừng — không phép kiểm nào chạy. Câu ấy đúng về phần làm sạch nhưng
để người dùng tưởng công cụ đã xem hết biểu của mình. Từ chối làm việc nguy hiểm thì
phải kèm theo việc làm được: ở đây là tám phép kiểm số học.

**Mã phân cấp phải được đánh theo từng phần La Mã.** Biểu mẫu nào cũng có mục "1, 2,
3" ở phần I rồi lặp lại đúng dãy ấy ở phần II. Không ghi phần thì mục 1.1 của phần II
đi tìm dòng cha ở phần I, và một biểu điền đúng bị báo là dòng con vượt dòng cha —
đúng loại báo nhầm khiến người dùng thôi đọc cảnh báo.
