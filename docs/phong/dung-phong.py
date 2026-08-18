# -*- coding: utf-8 -*-
"""Dựng bộ phông riêng của DA Assist.

    python docs/phong/dung-phong.py

Chạy MỘT LẦN rồi commit các tệp .woff kết quả. Kho add-in không phụ thuộc kịch bản
này lúc chạy — nó chỉ là công cụ dựng lại khi cần đổi dải ký tự.

VÌ SAO KHÔNG DÙNG LẠI BỘ PHÔNG CỦA TRÌNH SOẠN CÂU LỆNH: dải ký tự bên ấy thiếu vài
ký hiệu add-in cần, mà dựng lại bộ ấy thì kéo theo phải dựng lại cả tệp phát tay VÀ
bản đã khoá của nó — bản khoá là ngõ cụt một chiều, mỗi lần dựng xáo trộn khác nhau
nên phải chạy lại toàn bộ 1.106 ca thử. Cái giá quá lớn cho vài ký tự.

VÌ SAO KHÔNG NHÚNG BASE64: add-in tải qua HTTPS nên phục vụ thẳng tệp .woff gọn hơn.
Base64 làm phình thêm một phần ba, còn tệp rời thì trình duyệt lưu đệm riêng.

GIẤY PHÉP: cả ba họ phông theo SIL Open Font License 1.1, phát hành lại được nhưng
BUỘC kèm bản giấy phép — xem docs/phong/GIAY-PHEP-PHONG.txt.
"""
import os
import sys

from fontTools import subset

PHONG = {
    # tên tệp ra: (tệp nguồn, kiểu, độ đậm)
    "Inter-Regular": ("Inter-Regular.ttf", "normal", "400"),
    "JetBrainsMono-Regular": ("JetBrainsMono-Regular.ttf", "normal", "400"),
    "JetBrainsMono-Bold": ("JetBrainsMono-Bold.ttf", "normal", "700"),
    "Fraunces-Regular": ("Fraunces-Regular.ttf", "normal", "400"),
}

NGUON = [
    os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts"),
    os.path.join(os.environ.get("LOCALAPPDATA", ""), r"Microsoft\Windows\Fonts"),
]

# Dải ký tự: Latin cơ bản, Latin-1, Latin mở rộng A, phần có ơ ư, khối chứa toàn bộ
# dấu tiếng Việt, cùng các ký hiệu giao diện.
#
# Bốn ký hiệu THÊM so với bộ của trình soạn câu lệnh, và lý do từng cái:
#   U+2260 ≠  nêu hai giá trị khác nhau
#   U+2423 ␣  hiện khoảng trắng trong bảng xem trước — không có thì ô thừa dấu cách
#             trông y hệt ô bình thường
#   U+21B5 ↵  hiện ký tự xuống dòng lẫn trong ô
#   U+00B7 ·  dấu phân cách giữa các phần của nhãn
DAI = (
    "U+0020-007E,U+00A0-00FF,U+0100-017F,U+01A0-01B0,U+1EA0-1EF9,"
    "U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+00B7,"
    "U+2192,U+2190,U+2264,U+2265,U+00D7,U+2713,U+00B0,U+0300-0323,"
    "U+2260,U+2423,U+21B5,U+2191,U+2193,U+00AB,U+00BB"
)

RA = os.path.dirname(os.path.abspath(__file__))


def tim(ten):
    for d in NGUON:
        p = os.path.join(d, ten)
        if os.path.exists(p):
            return p
    raise SystemExit("khong tim thay phong: " + ten)


def main():
    tong_goc = tong_moi = 0
    for ten, (tep, _kieu, _dam) in PHONG.items():
        src = tim(tep)
        dst = os.path.join(RA, ten + ".woff")
        subset.main([
            src, "--unicodes=" + DAI, "--flavor=woff",
            "--layout-features=kern,liga,calt", "--no-hinting",
            "--desubroutinize", "--output-file=" + dst,
        ])
        goc = os.path.getsize(src)
        moi = os.path.getsize(dst)
        tong_goc += goc
        tong_moi += moi
        sys.stdout.write("%-24s %7d KB -> %5d KB\n" % (ten, goc // 1024, moi // 1024))
    sys.stdout.write("tong: %d KB -> %d KB\n" % (tong_goc // 1024, tong_moi // 1024))


if __name__ == "__main__":
    main()
