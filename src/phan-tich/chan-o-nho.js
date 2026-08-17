/**
 * Che ô có số nhỏ trước khi bảng rời khỏi màn hình.
 *
 * Vì sao cần: một bảng chéo mà có ô bằng 1 hoặc 2 thì ở một xã nhỏ, người trong
 * ngành đọc ra được đó là ai. Bài S9 cho phép dán BẢNG ĐÃ TỔNG HỢP sang công cụ
 * AI, nhưng kèm đúng một điều kiện: gộp nhóm các ô có số quá nhỏ.
 *
 * HAI CHỖ KHÔNG ĐƯỢC CHE:
 *   - Biểu mẫu pháp định. Phụ lục 4 Thông tư 07 phải có số chính xác; che ô ở đó
 *     là nộp báo cáo sai.
 *   - Màn hình làm việc của chính người dùng với dữ liệu của chính họ. Họ đã có
 *     toàn bộ dữ liệu gốc rồi, che đi chẳng bảo vệ ai mà chỉ cản trở công việc.
 *
 * Vì vậy công cụ TÍNH CHÍNH XÁC rồi mới che lúc xuất, chứ không che ngay từ khâu
 * tính. Người dùng bật tắt được, và luôn thấy đã che bao nhiêu ô.
 *
 * Giới hạn phải nói thẳng: đây là che sơ cấp. Dòng tổng và cột tổng vẫn còn, nên
 * với bảng chỉ có một ô bị che thì trừ ngược ra được. Công cụ ghi rõ điều này
 * chứ không để người dùng tưởng đã an toàn tuyệt đối.
 */

export const NGUONG_MAC_DINH = 5;
export const KY_HIEU_CHE = "<5";

function laSoDem(v) {
  return typeof v === "number" && Number.isFinite(v) && Number.isInteger(v);
}

/**
 * Che các ô đếm nhỏ hơn ngưỡng nhưng lớn hơn 0.
 * Ô bằng 0 KHÔNG che: số không cho biết là không có ai, không lộ ra ai cả.
 *
 * @param {object} bang  { tieuDe, hang, tongCot }
 * @param {object} tuyChon { nguong, cotBoQua }
 * @returns {{bang:object, soODaChe:number, ghiChu:Array<string>}}
 */
export function cheONho(bang, { nguong = NGUONG_MAC_DINH, cotBoQua = [0] } = {}) {
  const boQua = new Set(cotBoQua);
  let soODaChe = 0;

  const cheHang = (h) =>
    h.map((v, i) => {
      if (boQua.has(i)) return v;
      if (laSoDem(v) && v > 0 && v < nguong) {
        soODaChe++;
        return KY_HIEU_CHE;
      }
      return v;
    });

  const ra = {
    ...bang,
    hang: bang.hang.map(cheHang),
    tongCot: bang.tongCot ? cheHang(bang.tongCot) : bang.tongCot,
  };

  const ghiChu = [];
  if (soODaChe > 0) {
    ghiChu.push(
      `Đã che ${soODaChe} ô có số nhỏ hơn ${nguong}, thay bằng “${KY_HIEU_CHE}”, ` +
        "để bảng này không truy ngược về một người cụ thể."
    );
    ghiChu.push(
      "Lưu ý: dòng tổng và cột tổng vẫn giữ số thật, nên nếu một dòng chỉ có đúng " +
        "một ô bị che thì vẫn trừ ngược ra được. Với bảng cần chia sẻ ra ngoài, " +
        "hãy gộp bớt nhóm cho tới khi không còn ô nhỏ."
    );
  }
  return { bang: ra, soODaChe, ghiChu };
}

/**
 * Gộp các nhóm nhỏ thành một dòng “Nhóm khác”.
 * Cách này an toàn hơn che ô vì không để lại chỗ trống để trừ ngược, nhưng làm
 * mất chi tiết — nên để người dùng chọn.
 */
export function gopNhomNho(bang, { nguong = NGUONG_MAC_DINH, tenGop = "Các nhóm nhỏ gộp lại" } = {}) {
  const giu = [];
  const gop = [];
  for (const h of bang.hang) {
    const tong = h[h.length - 1];
    if (laSoDem(tong) && tong > 0 && tong < nguong) gop.push(h);
    else giu.push(h);
  }
  if (gop.length < 2) return { bang, soNhomDaGop: 0, ghiChu: [] };

  const soCot = bang.tieuDe.length;
  const cong = new Array(soCot).fill(0);
  for (const h of gop) {
    for (let i = 1; i < soCot; i++) if (laSoDem(h[i])) cong[i] += h[i];
  }
  cong[0] = `${tenGop} (${gop.length} nhóm)`;

  return {
    bang: { ...bang, hang: [...giu, cong] },
    soNhomDaGop: gop.length,
    ghiChu: [
      `Đã gộp ${gop.length} nhóm có tổng nhỏ hơn ${nguong} thành một dòng chung. ` +
        "Cách này an toàn hơn che từng ô vì không để lại chỗ trống để trừ ngược.",
    ],
  };
}
