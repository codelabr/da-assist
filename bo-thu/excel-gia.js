/**
 * Bộ Excel giả, đủ giống Office.js để đo lớp vỏ add-in mà không cần mở Excel.
 *
 * Điểm quan trọng: `load()` KHÔNG trả dữ liệu ngay. Giá trị chỉ xuất hiện sau
 * khi gọi `sync()`, đúng như Office.js thật. Nhờ vậy nếu mã quên `sync()` thì bộ
 * thử trượt ngay, chứ không đợi đến lúc chạy trên máy người dùng mới lộ.
 */

function saoBang(hang) {
  return hang.map((h) => h.slice());
}

class TrangGia {
  constructor(ten, gt = [], dd = null) {
    this.ten = ten;
    this.gt = saoBang(gt);
    this.dd = dd ? saoBang(dd) : gt.map((h) => h.map(() => "General"));
    this.daKichHoat = false;
  }

  soHang() {
    return this.gt.length;
  }

  soCot() {
    let n = 0;
    for (const h of this.gt) if (h.length > n) n = h.length;
    return n;
  }

  /** Vùng đã dùng: bỏ các hàng và cột rỗng ở rìa. */
  vungDaDung() {
    const rong = (v) => v === null || v === undefined || v === "";
    let r1 = 0;
    let r2 = this.gt.length - 1;
    while (r1 <= r2 && (this.gt[r1] || []).every(rong)) r1++;
    while (r2 >= r1 && (this.gt[r2] || []).every(rong)) r2--;
    if (r1 > r2) return { r: 0, c: 0, nr: 0, nc: 0 };
    const nc0 = this.soCot();
    let c1 = 0;
    let c2 = nc0 - 1;
    const cotRong = (c) => {
      for (let r = r1; r <= r2; r++) if (!rong((this.gt[r] || [])[c])) return false;
      return true;
    };
    while (c1 <= c2 && cotRong(c1)) c1++;
    while (c2 >= c1 && cotRong(c2)) c2--;
    return { r: r1, c: c1, nr: r2 - r1 + 1, nc: c2 - c1 + 1 };
  }
}

class VungGia {
  constructor(ctx, trang, r, c, nr, nc) {
    this._ctx = ctx;
    this._t = trang;
    this._r = r;
    this._c = c;
    this._nr = nr;
    this._nc = nc;
    this._can = new Set();
    this._daGan = new Set();
    for (const ten of ["values", "numberFormat"]) {
      let kho;
      Object.defineProperty(this, ten, {
        get: () => kho,
        set: (v) => {
          kho = v;
          this._daGan.add(ten);
          this._ctx._chuaXong.add(this);
        },
        configurable: true,
      });
    }
  }

  load(p) {
    const ds = Array.isArray(p) ? p : String(p).split(",");
    for (const x of ds) this._can.add(String(x).trim());
    this._ctx._chuaXong.add(this);
    return this;
  }

  _docO(r, c, loai) {
    const t = this._t;
    if (loai === "values") {
      const v = (t.gt[r] || [])[c];
      return v === undefined ? "" : v;
    }
    const v = (t.dd[r] || [])[c];
    return v === undefined ? "General" : v;
  }

  _dongBo() {
    // Ghi trước, đọc sau — giống thứ tự Office xử lý một lượt sync.
    for (const ten of this._daGan) {
      const bang = this[ten];
      for (let i = 0; i < this._nr; i++) {
        for (let j = 0; j < this._nc; j++) {
          const r = this._r + i;
          const c = this._c + j;
          const kho = ten === "values" ? this._t.gt : this._t.dd;
          while (kho.length <= r) kho.push([]);
          while (kho[r].length <= c) kho[r].push(ten === "values" ? "" : "General");
          kho[r][c] = (bang[i] || [])[j];
        }
      }
    }
    this._daGan.clear();

    for (const p of this._can) {
      if (p === "rowIndex") this.rowIndex = this._r;
      else if (p === "columnIndex") this.columnIndex = this._c;
      else if (p === "rowCount") this.rowCount = this._nr;
      else if (p === "columnCount") this.columnCount = this._nc;
      else if (p === "values" || p === "numberFormat") {
        const ra = [];
        for (let i = 0; i < this._nr; i++) {
          const d = [];
          for (let j = 0; j < this._nc; j++) d.push(this._docO(this._r + i, this._c + j, p));
          ra.push(d);
        }
        this[p] = ra;
        this._daGan.delete(p);
      }
    }
    this._can.clear();
  }
}

class TrangTinhGia {
  constructor(ctx, trang) {
    this._ctx = ctx;
    this._t = trang;
    this._can = new Set();
  }

  load(p) {
    const ds = Array.isArray(p) ? p : String(p).split(",");
    for (const x of ds) this._can.add(String(x).trim());
    this._ctx._chuaXong.add(this);
    return this;
  }

  getUsedRange() {
    const v = this._t.vungDaDung();
    return new VungGia(this._ctx, this._t, v.r, v.c, v.nr, v.nc);
  }

  getRangeByIndexes(r, c, nr, nc) {
    return new VungGia(this._ctx, this._t, r, c, nr, nc);
  }

  activate() {
    for (const t of this._ctx._so.trang) t.daKichHoat = false;
    this._t.daKichHoat = true;
    this._ctx._so.trangHoatDong = this._t.ten;
  }

  _dongBo() {
    if (this._can.has("name")) this.name = this._t.ten;
    this._can.clear();
  }
}

class DsTrangGia {
  constructor(ctx) {
    this._ctx = ctx;
    this._can = new Set();
  }

  load(p) {
    const ds = Array.isArray(p) ? p : String(p).split(",");
    for (const x of ds) this._can.add(String(x).trim());
    this._ctx._chuaXong.add(this);
    return this;
  }

  getActiveWorksheet() {
    const so = this._ctx._so;
    const t = so.trang.find((x) => x.ten === so.trangHoatDong) || so.trang[0];
    return new TrangTinhGia(this._ctx, t);
  }

  add(ten) {
    const so = this._ctx._so;
    if (so.trang.some((x) => x.ten === ten)) {
      throw new Error(`Trang tính “${ten}” đã tồn tại.`);
    }
    const t = new TrangGia(ten, []);
    so.trang.push(t);
    return new TrangTinhGia(this._ctx, t);
  }

  _dongBo() {
    if (this._can.has("items/name") || this._can.has("items")) {
      this.items = this._ctx._so.trang.map((t) => ({ name: t.ten }));
    }
    this._can.clear();
  }
}

/**
 * Dựng bộ Excel giả.
 * @param {Array<{ten:string, gt:Array, dd?:Array}>} trang
 */
export function taoExcelGia(trang) {
  const so = {
    trang: trang.map((t) => new TrangGia(t.ten, t.gt, t.dd)),
    trangHoatDong: trang[0] ? trang[0].ten : null,
  };
  let soLanSync = 0;

  const Excel = {
    async run(cb) {
      const ctx = {
        _so: so,
        _chuaXong: new Set(),
        async sync() {
          soLanSync++;
          for (const o of [...this._chuaXong]) o._dongBo();
          this._chuaXong.clear();
        },
      };
      ctx.workbook = { worksheets: new DsTrangGia(ctx) };
      return cb(ctx);
    },
  };

  return {
    Excel,
    so,
    tenTrang: () => so.trang.map((t) => t.ten),
    layTrang: (ten) => so.trang.find((t) => t.ten === ten),
    soLanSync: () => soLanSync,
  };
}
