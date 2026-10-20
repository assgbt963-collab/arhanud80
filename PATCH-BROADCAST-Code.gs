/* =========================================================================
 * PATCH LENGKAP SISTEM BROADCAST UNDANGAN & KONFIRMASI HUT KE-80 ARHANUD
 * Versi Patch: 20261020-v2 (Override Penuh kirimUndangan & kirimTesUndangan)
 *
 * Fitur Utama:
 * 1. Override penuh kirimUndangan() & kirimTesUndangan() agar TIDAK lagi
 *    mengirim pesan lama "08.00 WIB — Selesai", melainkan mengirim naskah
 *    dan link preview yang berbeda antara:
 *    - UNDANGAN 1 (TRADISI & SYUKURAN): Tradisi Korps Pati (07.30 WIB) &
 *      Syukuran HUT ke-80 Arhanud (09.00 WIB) -> link /tradisi
 *    - UNDANGAN 2 (KHUSUS SYUKURAN): Syukuran HUT ke-80 Arhanud (09.00 WIB)
 *      -> link /syukuran
 * 2. Pemberitahuan Broadcast Pengingat H-3 (14 Nov), H-1 (16 Nov) & Hari H (17 Nov)
 *    dengan keterangan tenggat waktu dan waktu pelaksanaan acara (07.30 & 09.00 vs 09.00)
 * 3. Upload Massal Detail Tamu (Tradisi & HUT) ke Spreadsheet (importTamuDetail)
 * 4. Perhitungan Jumlah Orang Hadir Otomatis dari Konfirmasi (konfirmasiDariLampiran)
 *
 * CARA PASANG DI GOOGLE APPS SCRIPT (Code.gs):
 * Ganti bagian patch sebelumnya di PALING BAWAH Code.gs dengan seluruh kode ini.
 * Lalu klik: Save (💾) -> Deploy -> Manage deployments -> Edit (✏️) ->
 *            Version: New version -> Deploy
 * ========================================================================= */

var PATCH_VERSION_ARHANUD = "20261020-v2";

// KONSEP 1: Undangan Tradisi Laporan Korps Pati Arhanud (07.30 WIB) & Syukuran HUT ke-80 Arhanud (09.00 WIB)
var DEFAULT_WA_FMT_TRADISI =
  "*UNDANGAN TRADISI DAN SYUKURAN HUT KE-80 ARHANUD TNI AD*\n\n" +
  "Kepada Yth.\n" +
  "*{nama}*\n" +
  "di Tempat\n\n" +
  "Dengan hormat,\n" +
  "Dalam rangka memperingati Hari Ulang Tahun ke-80 Korps Artileri Pertahanan Udara TNI Angkatan Darat Tahun 2026, kami mengundang Bapak/Ibu untuk hadir pada rangkaian kegiatan *Tradisi dan Syukuran*:\n\n" +
  "📅 *Hari/Tanggal:* Selasa, 17 November 2026\n\n" +
  "1️⃣ *Tradisi Laporan Korps Pati Arhanud*\n" +
  "   🕣 *Waktu:* Pukul 07.30 WIB\n" +
  "   📍 *Tempat:* Aula R. Harsoyo Pussenarhanud, Cimahi\n\n" +
  "2️⃣ *Acara Syukuran HUT ke-80 Arhanud TNI AD*\n" +
  "   🕘 *Waktu:* Pukul 09.00 WIB — Selesai\n" +
  "   📍 *Tempat:* Aula R. Harsoyo Pussenarhanud, Cimahi\n\n" +
  "👔 *Pakaian:*\n" +
  "• Militer: PDU IV & Persit: PSU\n" +
  "• Purnawirawan / Sipil: Batik Lengan Panjang / Bebas Rapi\n" +
  "_(Dimohon hadir 15 menit sebelum acara dimulai)_\n\n" +
  "Mohon kesediaan Bapak/Ibu untuk membuka Undangan Digital *Tradisi dan Syukuran* serta melakukan *Konfirmasi Kehadiran (RSVP)* melalui tautan berikut:\n" +
  "{link}\n\n" +
  "Terima kasih, salam Arhanud Jaya!\n" +
  "_Vyati Rakca Bhala Cakti_\n" +
  "*{panitia}*";

// KONSEP 2: Khusus Syukuran HUT ke-80 Arhanud TNI AD (09.00 WIB — Tanpa Tradisi Korps Pati)
var DEFAULT_WA_FMT_HUT =
  "*UNDANGAN SYUKURAN HUT KE-80 ARHANUD TNI AD*\n\n" +
  "Kepada Yth.\n" +
  "*{nama}*\n" +
  "di Tempat\n\n" +
  "Dengan hormat,\n" +
  "Dalam rangka memperingati Hari Ulang Tahun ke-80 Korps Artileri Pertahanan Udara TNI Angkatan Darat Tahun 2026, kami mengundang Bapak/Ibu untuk hadir pada *Acara Syukuran HUT ke-80 Arhanud TNI AD*:\n\n" +
  "📅 *Hari/Tanggal:* Selasa, 17 November 2026\n" +
  "🕘 *Waktu:* Pukul 09.00 WIB — Selesai\n" +
  "📍 *Tempat:* Aula R. Harsoyo Pussenarhanud, Jl. Sriwijaya Raya No. 1, Cimahi\n" +
  "👔 *Pakaian:* Militer PDU IV · Persit PSU · Sipil Bebas Rapi\n" +
  "_(Dimohon hadir 15 menit sebelum acara dimulai)_\n\n" +
  "Mohon kesediaan Bapak/Ibu untuk membuka Undangan Digital *Syukuran HUT ke-80 Arhanud* serta melakukan *Konfirmasi Kehadiran (RSVP)* melalui tautan berikut:\n" +
  "{link}\n\n" +
  "Terima kasih, salam Arhanud Jaya!\n" +
  "_Vyati Rakca Bhala Cakti_\n" +
  "*{panitia}*";

// NASKAH BAWAAN PENGINGAT H-3, H-1, DAN HARI H (TENGGAT WAKTU & WAKTU PELAKSANAAN ACARA)
var DEFAULT_REM_H3 =
  "*PENGINGAT WAKTU PELAKSANAAN ACARA (H-3)*\n" +
  "*{acara}*\n\n" +
  "Kepada Yth.\n*{nama}*\ndi Tempat\n\n" +
  "Dengan hormat,\n" +
  "Kami mengingatkan kembali mengenai tenggat waktu pelaksanaan *{acara}* yang akan dilaksanakan dalam *3 hari lagi (H-3)*, yaitu pada:\n\n" +
  "⏳ *Tenggat Waktu:* H-3 (3 Hari Menjelang Pelaksanaan Acara)\n" +
  "📅 *Hari/Tanggal:* Selasa, 17 November 2026\n" +
  "🕗 *Waktu Pelaksanaan:* {waktu}\n" +
  "_(Dimohon hadir 15 menit sebelum acara dimulai)_\n" +
  "📍 *Tempat:* {tempat}\n" +
  "👔 *Pakaian:* Militer PDU IV · Persit PSU · Sipil Bebas Rapi\n\n" +
  "Bagi Bapak/Ibu yang belum melakukan konfirmasi kehadiran, mohon berkenan melakukan konfirmasi melalui tautan undangan digital berikut:\n" +
  "{link}\n\n" +
  "Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.\n" +
  "_Vyati Rakca Bhala Cakti_\n*{panitia}*";

var DEFAULT_REM_H1 =
  "*PENGINGAT WAKTU PELAKSANAAN ACARA (H-1 / BESOK)*\n" +
  "*{acara}*\n\n" +
  "Kepada Yth.\n*{nama}*\ndi Tempat\n\n" +
  "Dengan hormat,\n" +
  "Kami mengingatkan kembali mengenai tenggat waktu pelaksanaan *{acara}* yang akan dilaksanakan *besok (H-1 / 1 hari lagi)*, yaitu pada:\n\n" +
  "⏳ *Tenggat Waktu:* H-1 (1 Hari Menjelang Pelaksanaan Acara / Besok)\n" +
  "📅 *Hari/Tanggal:* Selasa, 17 November 2026\n" +
  "🕗 *Waktu Pelaksanaan:* {waktu}\n" +
  "_(Dimohon hadir 15 menit sebelum acara dimulai)_\n" +
  "📍 *Tempat:* {tempat}\n" +
  "👔 *Pakaian:* Militer PDU IV · Persit PSU · Sipil Bebas Rapi\n\n" +
  "Informasi lengkap undangan digital dan konfirmasi kehadiran dapat diakses melalui tautan berikut:\n" +
  "{link}\n\n" +
  "Kami sangat menantikan kehadiran Bapak/Ibu. Terima kasih.\n" +
  "_Vyati Rakca Bhala Cakti_\n*{panitia}*";

var DEFAULT_REM_H0 =
  "*PENGINGAT WAKTU PELAKSANAAN ACARA (HARI H / HARI INI)*\n" +
  "*{acara}*\n\n" +
  "Kepada Yth.\n*{nama}*\ndi Tempat\n\n" +
  "Selamat Pagi,\n" +
  "Dengan hormat kami mengingatkan bahwa *hari ini (Hari H)* telah tiba waktu pelaksanaan *{acara}*, yang diselenggarakan pada:\n\n" +
  "⏳ *Tenggat Waktu:* Hari H (Hari Pelaksanaan Acara — Hari Ini)\n" +
  "📅 *Hari/Tanggal:* Selasa, 17 November 2026\n" +
  "🕗 *Waktu Pelaksanaan:* {waktu}\n" +
  "_(Dimohon hadir 15 menit sebelum acara dimulai)_\n" +
  "📍 *Tempat:* {tempat}\n" +
  "👔 *Pakaian:* Militer PDU IV · Persit PSU · Sipil Bebas Rapi\n\n" +
  "Panduan lokasi (Google Maps) dan undangan digital dapat dibuka melalui tautan berikut:\n" +
  "{link}\n\n" +
  "Selamat datang di Mapussenarhanud Cimahi. Atas kehadiran Bapak/Ibu, kami ucapkan terima kasih.\n" +
  "_Vyati Rakca Bhala Cakti_\n*{panitia}*";

var _ACTIVE_JENIS_BROADCAST = "TRADISI";
var _FORCE_JENIS_BROADCAST = "";
var _ACTIVE_CUSTOM_TEMPLATE = "";

function _normJenisUndangan(k) {
  var s = String(k || "").trim().toUpperCase();
  if (s === "HUT" || s === "SYUKURAN" || s === "2") return "HUT";
  return "TRADISI";
}

function _buatLinkTamu(tok, nama, jenis) {
  var jns = _normJenisUndangan(jenis);
  var pagePath = (jns === "HUT") ? "syukuran" : "tradisi";
  var paramJenis = (jns === "HUT") ? "hut" : "tradisi";
  var tClean = String(tok || "").trim();
  var nClean = String(nama || "").trim();
  return "https://undangan.arhanud80.online/" + pagePath + "?jenis=" + paramJenis +
         (tClean ? "&t=" + encodeURIComponent(tClean) : "") +
         (nClean ? "&to=" + encodeURIComponent(nClean) : "");
}

// Mengarahkan {link} ke halaman dengan OpenGraph khusus (/tradisi vs /syukuran) agar tampilan preview WA berbeda
function linkTamu(token, optJenis) {
  var g = null;
  try { g = findTamu(token); } catch (e) {}
  var nama = (g && g.nama) ? String(g.nama).trim() : "";
  var tok  = (g && g.token) ? String(g.token).trim() : String(token || "").trim();
  var jns = _FORCE_JENIS_BROADCAST
    ? _normJenisUndangan(_FORCE_JENIS_BROADCAST)
    : _normJenisUndangan(optJenis || (g && g.kategori) || _ACTIVE_JENIS_BROADCAST);
  return _buatLinkTamu(tok, nama, jns);
}

function _ambilDuaFormat() {
  var st = {};
  try { st = setting() || {}; } catch (e) {}
  var rawTrad = (typeof st === "string") ? "" : (st.wa_broadcast_tradisi || st.WA_BROADCAST_TRADISI || "");
  var rawHut  = (typeof st === "string") ? "" : (st.wa_broadcast_hut || st.WA_BROADCAST_HUT || "");
  var fTrad = (typeof rawTrad === "string" && rawTrad.trim() && rawTrad.indexOf("[object") < 0 && rawTrad.indexOf("08.00") < 0)
    ? rawTrad.trim()
    : DEFAULT_WA_FMT_TRADISI;
  var fHut  = (typeof rawHut === "string" && rawHut.trim() && rawHut.indexOf("[object") < 0 && rawHut.indexOf("08.00") < 0)
    ? rawHut.trim()
    : DEFAULT_WA_FMT_HUT;
  return { tradisi: fTrad, hut: fHut };
}

function _renderPesanWa(tpl, g, jenis) {
  var jns = _normJenisUndangan(jenis || (g && g.kategori) || _ACTIVE_JENIS_BROADCAST);
  var nama = (g && g.nama) ? String(g.nama).trim() : "Bapak/Ibu Tamu Undangan";
  var tok  = (g && g.token) ? String(g.token).trim() : "CONTOH123";
  var lnk  = _buatLinkTamu(tok, nama, jns);
  var acara = (jns === "HUT")
    ? "Acara Syukuran HUT ke-80 Arhanud TNI AD"
    : "Tradisi Laporan Korps Pati Arhanud & Syukuran HUT ke-80 Arhanud TNI AD";
  var waktu = (jns === "HUT")
    ? "Pukul 09.00 WIB — Selesai"
    : "Pukul 07.30 WIB (Tradisi Korps Pati) & Pukul 09.00 WIB (Syukuran HUT ke-80)";
  var tanggal = "Selasa, 17 November 2026";
  var tempat  = "Aula R. Harsoyo Pussenarhanud, Cimahi";
  var panitia = "Panitia HUT ke-80 Arhanud TNI AD";

  var base = String(tpl || ((jns === "HUT") ? DEFAULT_WA_FMT_HUT : DEFAULT_WA_FMT_TRADISI));
  return base
    .replace(/\{nama\}/g, nama)
    .replace(/\{acara\}/g, acara)
    .replace(/\{tanggal\}/g, tanggal)
    .replace(/\{waktu\}/g, waktu)
    .replace(/\{tempat\}/g, tempat)
    .replace(/\{link\}/g, lnk)
    .replace(/\{panitia\}/g, panitia);
}

function _setWaBroadcastAktif(teks) {
  var keys = ["wa_broadcast", "WA_BROADCAST", "fmt_broadcast", "FMT_BROADCAST", "broadcast", "pesan_broadcast", "format_broadcast"];
  for (var i = 0; i < keys.length; i++) {
    try { setSettingVal(keys[i], teks); } catch (e) {}
  }
  try { setSettingVal("waktu", "Pukul 07.30 WIB (Tradisi) & Pukul 09.00 WIB (Syukuran)"); } catch (eW) {}
  try { memoClear(); } catch (e3) {}
  try { flushCache(); } catch (e4) {}
}

function _aktifkanFormatJenis(jenis) {
  var jns = _normJenisUndangan(jenis);
  _ACTIVE_JENIS_BROADCAST = jns;
  var fmts = _ambilDuaFormat();
  var aktif = (jns === "HUT") ? fmts.hut : fmts.tradisi;
  return aktif;
}

function getWaFormat() {
  var fmts = _ambilDuaFormat();
  var aktif = (_ACTIVE_JENIS_BROADCAST === "HUT") ? fmts.hut : fmts.tradisi;
  return {
    ok: true,
    patchVersion: PATCH_VERSION_ARHANUD,
    overrideKirim: true,
    broadcast: aktif,
    broadcast_tradisi: fmts.tradisi,
    broadcast_hut: fmts.hut,
    broadcastTradisi: fmts.tradisi,
    broadcastHut: fmts.hut,
    qr: "",
    def_broadcast: DEFAULT_WA_FMT_TRADISI,
    def_hut: DEFAULT_WA_FMT_HUT,
    def_qr: ""
  };
}

function saveWaFormat(broadcastTradisi, broadcastHut) {
  var bTrad = String(broadcastTradisi || "").trim() || DEFAULT_WA_FMT_TRADISI;
  var bHut  = String(broadcastHut || "").trim() || DEFAULT_WA_FMT_HUT;
  try { setSettingVal("wa_broadcast_tradisi", bTrad); } catch (e1) {}
  try { setSettingVal("wa_broadcast_hut", bHut); } catch (e2) {}
  _setWaBroadcastAktif(bTrad);
  try { log("panitia", "Format pesan 2 konsep undangan (Tradisi & Syukuran 07.30/09.00 vs Syukuran 09.00) diperbarui"); } catch (e5) {}
  return { ok: true, patchVersion: PATCH_VERSION_ARHANUD, broadcastTradisi: bTrad, broadcastHut: bHut };
}

function resetWaFormat() {
  try { setSettingVal("wa_broadcast_tradisi", DEFAULT_WA_FMT_TRADISI); } catch (e1) {}
  try { setSettingVal("wa_broadcast_hut", DEFAULT_WA_FMT_HUT); } catch (e2) {}
  _setWaBroadcastAktif(DEFAULT_WA_FMT_TRADISI);
  try { log("panitia", "Kedua format pesan WA dikembalikan ke bawaan (07.30 & 09.00 WIB)"); } catch (e5) {}
  return { ok: true, patchVersion: PATCH_VERSION_ARHANUD, broadcastTradisi: DEFAULT_WA_FMT_TRADISI, broadcastHut: DEFAULT_WA_FMT_HUT };
}

/* =========================================================================
 * OVERRIDE PENUH kirimUndangan & kirimTesUndangan AGAR TIDAK MENGGUNAKAN
 * TEMPLATE LAMA Code.gs v7.11 ("08.00 WIB — Selesai")
 * ========================================================================= */
function _cekHasilKirimWa(r) {
  if (r === true) return { ok: true, err: "" };
  if (r && typeof r === "object") {
    if (r.ok === true || r.status === true || r.sent === true || r.status === "sent") {
      return { ok: true, err: "" };
    }
    return { ok: false, err: String(r.error || r.reason || r.detail || r.message || "Gagal kirim Fonnte") };
  }
  if (typeof r === "string" && r.toLowerCase().indexOf("true") >= 0) {
    return { ok: true, err: "" };
  }
  return { ok: false, err: String(r || "Gagal kirim WA") };
}

function kirimUndangan(tokens, optJenisOverride) {
  if (!Array.isArray(tokens)) tokens = tokens ? [tokens] : [];
  if (!tokens.length) return { ok: true, sent: 0, gagal: [], lanjut: false };

  var fmts = _ambilDuaFormat();
  var batch = tokens.slice(0, 20);
  var hasMore = tokens.length > 20;
  var sent = 0;
  var gagal = [];

  for (var i = 0; i < batch.length; i++) {
    var tok = String(batch[i] || "").trim();
    if (!tok) continue;
    var g = null;
    try { g = findTamu(tok); } catch (e) {}
    if (!g) continue;

    var hpRaw = String(g.hp || "").trim();
    if (!hpRaw || hpRaw.toLowerCase().indexOf("belum") >= 0 || hpRaw === "-") {
      continue;
    }

    var jns = _FORCE_JENIS_BROADCAST
      ? _normJenisUndangan(_FORCE_JENIS_BROADCAST)
      : _normJenisUndangan(optJenisOverride || g.kategori || _ACTIVE_JENIS_BROADCAST);

    var tpl = _ACTIVE_CUSTOM_TEMPLATE
      ? _ACTIVE_CUSTOM_TEMPLATE
      : ((jns === "HUT") ? fmts.hut : fmts.tradisi);

    var pesan = _renderPesanWa(tpl, g, jns);
    var r = null;
    var chk = { ok: false, err: "" };
    try {
      r = kirimWa(hpRaw, pesan);
      chk = _cekHasilKirimWa(r);
    } catch (errWa) {
      chk = { ok: false, err: String((errWa && errWa.message) || errWa) };
    }

    var labelLog = (jns === "HUT") ? "Syukuran 09.00" : "Tradisi & Syukuran 07.30/09.00";
    if (chk.ok) {
      sent++;
      try { updateTamu(g.token, { invite_status: "terkirim", invite_waktu: nowStr(), kategori: jns }); } catch (eU) {}
      try { log("broadcast", "Terkirim [" + labelLog + "] → " + g.nama + " (" + g.hp + ")"); } catch (eL) {}
    } else {
      gagal.push(g.nama);
      try { updateTamu(g.token, { invite_status: "gagal", kategori: jns }); } catch (eU2) {}
      try { log("broadcast", "Gagal [" + labelLog + "] → " + g.nama + " (" + g.hp + ")" + (chk.err ? " — " + chk.err : "")); } catch (eL2) {}
    }
  }

  try { clearTamuCache(); } catch (eC1) {}
  try { flushCache(); } catch (eC2) {}
  return { ok: sent > 0 || gagal.length === 0, sent: sent, gagal: gagal, lanjut: hasMore };
}

function kirimTesUndangan(hp, optJenis) {
  var hpClean = String(hp || "").trim();
  if (!hpClean) return { ok: false, status: "Nomor tujuan kosong", nama: "-" };

  var jns = _FORCE_JENIS_BROADCAST
    ? _normJenisUndangan(_FORCE_JENIS_BROADCAST)
    : _normJenisUndangan(optJenis || _ACTIVE_JENIS_BROADCAST);

  var all = [];
  try { all = tamuRows() || []; } catch (e) {}
  var g0 = all[0] || { token: "CONTOH123", nama: "Bapak/Ibu Tamu Undangan", hp: hpClean };
  var gTes = {
    token: g0.token || "CONTOH123",
    nama: g0.nama || "Bapak/Ibu Tamu Undangan",
    hp: hpClean,
    kategori: jns
  };

  var fmts = _ambilDuaFormat();
  var tpl = _ACTIVE_CUSTOM_TEMPLATE
    ? _ACTIVE_CUSTOM_TEMPLATE
    : ((jns === "HUT") ? fmts.hut : fmts.tradisi);

  var pesan = _renderPesanWa(tpl, gTes, jns);
  var r = null;
  var chk = { ok: false, err: "" };
  try {
    r = kirimWa(hpClean, pesan);
    chk = _cekHasilKirimWa(r);
  } catch (errWa) {
    chk = { ok: false, err: String((errWa && errWa.message) || errWa) };
  }

  var labelLog = (jns === "HUT") ? "Syukuran 09.00" : "Tradisi & Syukuran 07.30/09.00";
  try {
    log("tes", "Tes undangan [" + labelLog + "] → " + hpClean + " (" + (chk.ok ? "sent" : ("gagal: " + chk.err)) + ")");
  } catch (eL) {}

  return {
    ok: chk.ok,
    status: chk.ok ? "sent" : (chk.err || "gagal"),
    nama: gTes.nama + " [" + labelLog + "]",
    jenis: jns,
    patchVersion: PATCH_VERSION_ARHANUD
  };
}

function kirimSemuaUndangan() {
  return kirimSemuaByJenis("SEMUA");
}

function lanjutkanKirim() {
  return kirimSemuaByJenis("SEMUA");
}

function lanjutOtomatis() {
  return kirimSemuaByJenis("SEMUA");
}

/* ===== PENGINGAT H-3, H-1, DAN HARI H ===== */
function _ambilFormatReminder() {
  var st = {};
  try { st = setting() || {}; } catch (e) {}
  var h3 = (st && (st.wa_rem_h3 || st.WA_REM_H3)) ? String(st.wa_rem_h3 || st.WA_REM_H3).trim() : DEFAULT_REM_H3;
  var h1 = (st && (st.wa_rem_h1 || st.WA_REM_H1)) ? String(st.wa_rem_h1 || st.WA_REM_H1).trim() : DEFAULT_REM_H1;
  var h0 = (st && (st.wa_rem_h0 || st.WA_REM_H0)) ? String(st.wa_rem_h0 || st.WA_REM_H0).trim() : DEFAULT_REM_H0;
  return { H3: h3, H1: h1, H0: h0 };
}

function getReminderFormat() {
  var r = _ambilFormatReminder();
  var adaTrigger = false;
  try {
    var trigs = ScriptApp.getProjectTriggers();
    for (var i = 0; i < trigs.length; i++) {
      if (trigs[i].getHandlerFunction() === "jalankanJadwalReminderOtomatis") {
        adaTrigger = true;
        break;
      }
    }
  } catch (e) {}
  return { ok: true, patchVersion: PATCH_VERSION_ARHANUD, rem_h3: r.H3, rem_h1: r.H1, rem_h0: r.H0, jadwal_aktif: adaTrigger };
}

function saveReminderFormat(h3, h1, h0) {
  try { setSettingVal("wa_rem_h3", String(h3 || DEFAULT_REM_H3).trim()); } catch (e1) {}
  try { setSettingVal("wa_rem_h1", String(h1 || DEFAULT_REM_H1).trim()); } catch (e2) {}
  try { setSettingVal("wa_rem_h0", String(h0 || DEFAULT_REM_H0).trim()); } catch (e3) {}
  try { log("panitia", "Format pengingat H-3, H-1 & Hari H diperbarui"); } catch (e4) {}
  return { ok: true, patchVersion: PATCH_VERSION_ARHANUD };
}

function _susunTeksReminderUntukJenis(rawTpl, jenis) {
  var jns = _normJenisUndangan(jenis);
  var acara = (jns === "HUT")
    ? "Acara Syukuran HUT ke-80 Arhanud TNI AD"
    : "Tradisi Laporan Korps Pati Arhanud & Syukuran HUT ke-80 Arhanud TNI AD";
  var waktu = (jns === "HUT")
    ? "Pukul 09.00 WIB — Selesai"
    : "Pukul 07.30 WIB (Tradisi Korps Pati) & Pukul 09.00 WIB (Syukuran HUT ke-80)";
  return String(rawTpl || "")
    .replace(/\{acara\}/g, acara)
    .replace(/\{waktu\}/g, waktu);
}

function kirimTesReminder(hp, tahap, jenis) {
  var t = String(tahap || "H3").toUpperCase();
  var jns = _normJenisUndangan(jenis);
  var r = _ambilFormatReminder();
  var raw = r[t] || r.H3;
  var tplSiap = _susunTeksReminderUntukJenis(raw, jns);
  _ACTIVE_JENIS_BROADCAST = jns;
  _FORCE_JENIS_BROADCAST = jns;
  _ACTIVE_CUSTOM_TEMPLATE = tplSiap;
  var res = kirimTesUndangan(hp, jns);
  _FORCE_JENIS_BROADCAST = "";
  _ACTIVE_CUSTOM_TEMPLATE = "";
  _ACTIVE_JENIS_BROADCAST = "TRADISI";
  return res;
}

function kirimReminderMassal(tahap, sasaran) {
  var t = String(tahap || "H3").toUpperCase();
  var s = String(sasaran || "SEMUA_AKTIF").toUpperCase();
  var r = _ambilFormatReminder();
  var raw = r[t] || r.H3;
  var all = tamuRows();
  var tokTrad = [], tokHut = [];

  for (var i = 0; i < all.length; i++) {
    var g = all[i];
    var h = String(g.hadir || "").trim().toUpperCase();
    var jns = _normJenisUndangan(g.kategori);
    if (s === "SEMUA_AKTIF" && h && h !== "HADIR") continue;
    if (s === "TRADISI" && jns !== "TRADISI") continue;
    if (s === "HUT" && jns !== "HUT") continue;
    if (s === "HADIR" && h !== "HADIR") continue;
    if (s === "BELUM_KONF" && h) continue;
    if (jns === "HUT") tokHut.push(g.token);
    else tokTrad.push(g.token);
  }

  var totalSent = 0, totalGagal = [];
  if (tokTrad.length > 0) {
    _FORCE_JENIS_BROADCAST = "TRADISI";
    _ACTIVE_CUSTOM_TEMPLATE = _susunTeksReminderUntukJenis(raw, "TRADISI");
    var r1 = kirimUndangan(tokTrad, "TRADISI");
    totalSent += (r1 && r1.sent) || 0;
    if (r1 && r1.gagal && r1.gagal.length) totalGagal = totalGagal.concat(r1.gagal);
  }
  if (tokHut.length > 0) {
    _FORCE_JENIS_BROADCAST = "HUT";
    _ACTIVE_CUSTOM_TEMPLATE = _susunTeksReminderUntukJenis(raw, "HUT");
    var r2 = kirimUndangan(tokHut, "HUT");
    totalSent += (r2 && r2.sent) || 0;
    if (r2 && r2.gagal && r2.gagal.length) totalGagal = totalGagal.concat(r2.gagal);
  }
  _FORCE_JENIS_BROADCAST = "";
  _ACTIVE_CUSTOM_TEMPLATE = "";
  _ACTIVE_JENIS_BROADCAST = "TRADISI";
  try { log("pengingat-" + t, "Terkirim: " + totalSent + " tamu (Sasaran: " + s + ")"); } catch (e5) {}
  return { ok: true, sent: totalSent, gagal: totalGagal };
}

function pasangTriggerReminderOtomatis() {
  try {
    var trigs = ScriptApp.getProjectTriggers();
    for (var i = 0; i < trigs.length; i++) {
      if (trigs[i].getHandlerFunction() === "jalankanJadwalReminderOtomatis") {
        ScriptApp.deleteTrigger(trigs[i]);
      }
    }
    ScriptApp.newTrigger("jalankanJadwalReminderOtomatis")
      .timeBased()
      .everyDays(1)
      .atHour(6)
      .create();
    try { log("panitia", "Jadwal otomatis pengingat H-3 (14 Nov), H-1 (16 Nov) & Hari H (17 Nov) diaktifkan"); } catch (e2) {}
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  }
}

function jalankanJadwalReminderOtomatis() {
  var tglWib = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
  if (tglWib === "2026-11-14") {
    kirimReminderMassal("H3", "SEMUA_AKTIF");
  } else if (tglWib === "2026-11-16") {
    kirimReminderMassal("H1", "SEMUA_AKTIF");
  } else if (tglWib === "2026-11-17") {
    kirimReminderMassal("H0", "SEMUA_AKTIF");
  }
}

/* ===== SIMPAN DETAIL TAMU & UPLOAD SPREADSHEET (TRADISI & HUT) ===== */
function _simpanDetailDiSheet(token, jenis, ket) {
  var tok = String(token || "").trim();
  var jns = _normJenisUndangan(jenis);
  if (!tok) return false;
  var patch = { kategori: jns };
  if (ket !== undefined && String(ket).trim() !== "") patch.ket = String(ket).trim();
  try { updateTamu(tok, patch); } catch (e) {}
  try {
    var sh = sheetTamu();
    var vals = sh.getDataRange().getValues();
    if (vals.length > 1) {
      var colTok = 0, colKat = 4, colKet = -1;
      for (var c = 0; c < vals[0].length; c++) {
        var h = String(vals[0][c] || "").trim().toLowerCase();
        if (h === "token") colTok = c;
        if (h === "kategori" || h === "jenis") colKat = c;
        if (h === "ket" || h === "keterangan") colKet = c;
      }
      for (var r = 1; r < vals.length; r++) {
        if (String(vals[r][colTok] || "").trim() === tok) {
          sh.getRange(r + 1, colKat + 1).setValue(jns);
          if (colKet >= 0 && ket !== undefined && String(ket).trim() !== "") {
            sh.getRange(r + 1, colKet + 1).setValue(String(ket).trim());
          }
          break;
        }
      }
    }
  } catch (e2) {}
  try { clearTamuCache(); } catch (e3) {}
  try { flushCache(); } catch (e4) {}
  return true;
}

function setJenisUndangan(token, jenis) {
  var tok = String(token || "").trim();
  var jns = _normJenisUndangan(jenis);
  if (!tok) return { ok: false, error: "Token kosong." };
  _simpanDetailDiSheet(tok, jns);
  return { ok: true, token: tok, jenis: jns };
}

function tambahTamuDenganJenis(d) {
  var jns = _normJenisUndangan(d && (d.jenis || d.kategori));
  var ket = (d && d.ket) ? String(d.ket).trim() : "";
  var res = tambahTamu(d);
  if (res && res.ok && res.token) {
    _simpanDetailDiSheet(res.token, jns, ket);
  }
  return res;
}

function importTamuDetail(list) {
  if (!Array.isArray(list) || !list.length) {
    return { ok: false, error: "Daftar tamu kosong." };
  }
  var added = 0;
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    if (!item || !item.nama || !item.hp) continue;
    var jns = _normJenisUndangan(item.jenis || item.kategori);
    var ket = item.ket ? String(item.ket).trim() : "";
    var r = tambahTamu({
      nama: String(item.nama).trim(),
      hp: String(item.hp).trim(),
      org: String(item.org || "").trim(),
      kategori: jns
    });
    if (r && r.ok && r.token) {
      _simpanDetailDiSheet(r.token, jns, ket);
      added++;
    }
  }
  try { clearTamuCache(); } catch (e1) {}
  try { flushCache(); } catch (e2) {}
  try { log("panitia", "Upload detail Spreadsheet: " + added + " tamu ditambahkan"); } catch (e3) {}
  return { ok: true, added: added };
}

/* ===== DATA PANITIA & PERHITUNGAN JUMLAH ORANG HADIR ===== */
function dataPanitia() {
  try { clearTamuCache(); } catch (e0) {}
  var all = tamuRows();
  var terkirim = 0, gagal = 0, belum = 0, hadir = 0, tidak = 0, orang = 0;
  var rows = all.map(function(g) {
    var st = String(g.invite_status || "");
    if (st === "terkirim") terkirim++;
    else if (st === "gagal") gagal++;
    else belum++;

    var h = String(g.hadir || "").trim().toUpperCase();
    var jml = Math.max(1, Number(g.jumlah || 1) || 1);
    if (h === "HADIR") { hadir++; orang += jml; }
    else if (h) { tidak++; jml = 0; }

    var jns = _normJenisUndangan(g.kategori);
    return {
      token: g.token,
      nama: g.nama,
      hp: g.hp,
      org: g.org || "",
      jenis: jns,
      kategori: jns,
      invite_status: st,
      hadir: h,
      jumlah: jml,
      confirm_waktu: g.confirm_waktu || "",
      ket: g.ket || g.keterangan || ""
    };
  });
  return {
    ok: true,
    patchVersion: PATCH_VERSION_ARHANUD,
    empty: rows.length === 0,
    stats: {
      total: rows.length,
      terkirim: terkirim,
      gagal: gagal,
      belum: belum,
      hadir: hadir,
      tidak: tidak,
      orang: orang
    },
    rows: rows
  };
}

function kirimUlang(token, optJenis) {
  var g = findTamu(token);
  if (!g) return { ok: false, sent: 0, gagal: [], lanjut: false, error: "Tamu tidak ditemukan." };
  var jns = optJenis ? _normJenisUndangan(optJenis) : _normJenisUndangan(g.kategori);
  if (optJenis && _normJenisUndangan(g.kategori) !== jns) {
    _simpanDetailDiSheet(token, jns);
    g.kategori = jns;
  }
  _FORCE_JENIS_BROADCAST = jns;
  _aktifkanFormatJenis(jns);
  var res = kirimUndangan([token], jns);
  _FORCE_JENIS_BROADCAST = "";
  _ACTIVE_JENIS_BROADCAST = "TRADISI";
  var terkirim = !!(res && res.sent > 0);
  try { clearTamuCache(); } catch (e) {}
  return {
    ok: terkirim,
    sent: (res && res.sent) || 0,
    gagal: (res && res.gagal) || (terkirim ? [] : [g.nama]),
    lanjut: !!(res && res.lanjut),
    jenis: jns,
    patchVersion: PATCH_VERSION_ARHANUD,
    error: terkirim ? "" : ("Gagal kirim ke " + g.nama + " (" + g.hp + ") — cek Log Pengiriman atau koneksi Device di Fonnte.")
  };
}

function _kirimBatchSesuaiJenis(listTamu) {
  var tokTrad = [], tokHut = [];
  for (var i = 0; i < listTamu.length; i++) {
    if (_normJenisUndangan(listTamu[i].kategori) === "HUT") tokHut.push(listTamu[i].token);
    else tokTrad.push(listTamu[i].token);
  }
  var totalSent = 0, totalGagal = [], adaLanjut = false;
  if (tokTrad.length > 0) {
    _FORCE_JENIS_BROADCAST = "TRADISI";
    _aktifkanFormatJenis("TRADISI");
    var r1 = kirimUndangan(tokTrad, "TRADISI");
    totalSent += (r1 && r1.sent) || 0;
    if (r1 && r1.gagal && r1.gagal.length) totalGagal = totalGagal.concat(r1.gagal);
    if (r1 && r1.lanjut) adaLanjut = true;
  }
  if (tokHut.length > 0) {
    _FORCE_JENIS_BROADCAST = "HUT";
    _aktifkanFormatJenis("HUT");
    var r2 = kirimUndangan(tokHut, "HUT");
    totalSent += (r2 && r2.sent) || 0;
    if (r2 && r2.gagal && r2.gagal.length) totalGagal = totalGagal.concat(r2.gagal);
    if (r2 && r2.lanjut) adaLanjut = true;
  }
  _FORCE_JENIS_BROADCAST = "";
  _ACTIVE_JENIS_BROADCAST = "TRADISI";
  try { clearTamuCache(); } catch (e) {}
  return { ok: true, sent: totalSent, gagal: totalGagal, lanjut: adaLanjut, patchVersion: PATCH_VERSION_ARHANUD };
}

function kirimSemuaByJenis(mode) {
  var m = String(mode || "SEMUA").trim().toUpperCase();
  var all = tamuRows();
  var target = [];
  for (var i = 0; i < all.length; i++) {
    var g = all[i];
    if (String(g.invite_status || "") === "terkirim") continue;
    var jns = _normJenisUndangan(g.kategori);
    if (m === "TRADISI" && jns !== "TRADISI") continue;
    if (m === "HUT" && jns !== "HUT") continue;
    target.push(g);
  }
  if (!target.length) return { ok: true, sent: 0, gagal: [], lanjut: false };
  return _kirimBatchSesuaiJenis(target);
}

function kirimUlangGagal() {
  var all = tamuRows();
  var gagalList = [];
  for (var i = 0; i < all.length; i++) {
    if (String(all[i].invite_status || "") === "gagal") gagalList.push(all[i]);
  }
  if (!gagalList.length) return { ok: true, sent: 0, gagal: [], lanjut: false };
  return _kirimBatchSesuaiJenis(gagalList);
}

function kirimTesDenganJenis(hp, jenis) {
  var jns = _normJenisUndangan(jenis);
  _FORCE_JENIS_BROADCAST = jns;
  _aktifkanFormatJenis(jns);
  var res = kirimTesUndangan(hp, jns);
  _FORCE_JENIS_BROADCAST = "";
  _ACTIVE_JENIS_BROADCAST = "TRADISI";
  return res;
}

function setKonfirmasiPanitia(token, hadir, jumlah, ket) {
  var tok = String(token || "").trim();
  var g = findTamu(tok);
  if (!g) return { ok: false, error: "Tamu tidak ditemukan." };
  var stHadir = String(hadir || "").trim().toUpperCase();
  var jml = (stHadir === "HADIR") ? Math.max(1, parseInt(jumlah, 10) || 1) : 0;
  var wkt = stHadir ? nowStr() : "";
  updateTamu(tok, {
    hadir: stHadir,
    jumlah: jml,
    confirm_waktu: wkt,
    ket: String(ket || "").trim()
  });
  try { clearTamuCache(); } catch (e1) {}
  try { flushCache(); } catch (e2) {}
  try { log("konfirmasi", g.nama + " -> " + (stHadir || "BELUM") + (stHadir === "HADIR" ? " (" + jml + " org)" : "")); } catch (e3) {}
  return { ok: true, token: tok, nama: g.nama, hadir: stHadir, jumlah: jml };
}

function konfirmasiDariLampiran(d) {
  if (!d || typeof d !== "object") return { ok: false, error: "Data kosong." };
  var namaIn = String(d.nama || "").trim();
  var satuanIn = String(d.satuan || "").trim();
  var jnsIn = _normJenisUndangan(d.jenis || "TRADISI");
  var stHadir = String(d.hadir || "HADIR").trim().toUpperCase();
  if (stHadir !== "HADIR") stHadir = "TIDAK HADIR";
  var jml = (stHadir === "HADIR") ? Math.max(1, parseInt(d.jumlah, 10) || 1) : 0;
  var ucapan = String(d.ucapan || "").trim();

  var all = tamuRows();
  var target = null;
  if (d.tok) target = findTamu(String(d.tok).trim());
  if (!target && namaIn) {
    var low = namaIn.toLowerCase();
    for (var i = 0; i < all.length; i++) {
      var nmRow = String(all[i].nama || "").trim().toLowerCase();
      if (nmRow === low || (nmRow && (nmRow.indexOf(low) >= 0 || low.indexOf(nmRow) >= 0))) {
        target = all[i];
        break;
      }
    }
  }
  if (!target && namaIn) {
    var baru = tambahTamu({
      nama: namaIn,
      hp: String(d.hp || "-"),
      org: satuanIn,
      kategori: jnsIn
    });
    if (baru && baru.ok && baru.token) {
      _simpanDetailDiSheet(baru.token, jnsIn, ucapan);
      target = findTamu(baru.token);
    }
  }
  if (target) {
    var patch = { hadir: stHadir, jumlah: jml, confirm_waktu: nowStr(), ket: ucapan };
    if (satuanIn && !target.org) patch.org = satuanIn;
    updateTamu(target.token, patch);
    try { clearTamuCache(); } catch (e1) {}
    try { flushCache(); } catch (e2) {}
    try { log("konfirmasi", target.nama + " konfirmasi: " + stHadir + " (" + jml + " org)"); } catch (e3) {}
    return { ok: true, token: target.token, nama: target.nama, jumlah: jml };
  }
  return { ok: true, info: "Dicatat ke log" };
}

function hapusTamu(token) {
  var tok = String(token || "").trim();
  if (!tok) return { ok: false, error: "Token tamu kosong." };
  var g = null;
  try { g = findTamu(tok); } catch (e) {}
  var sh = sheetTamu();
  var vals = sh.getDataRange().getValues();
  var colTok = 0;
  if (vals.length > 0) {
    for (var c = 0; c < vals[0].length; c++) {
      if (String(vals[0][c] || "").trim().toLowerCase() === "token") { colTok = c; break; }
    }
  }
  var foundRow = -1;
  var nama = (g && g.nama) ? String(g.nama) : "";
  for (var r = vals.length - 1; r >= 1; r--) {
    if (String(vals[r][colTok] || "").trim() === tok) {
      foundRow = r + 1;
      if (!nama && vals[r][1]) nama = String(vals[r][1]);
      break;
    }
  }
  if (foundRow < 2) return { ok: false, error: "Tamu tidak ditemukan di sheet." };
  sh.deleteRow(foundRow);
  try { clearTamuCache(); } catch (e1) {}
  try { flushCache(); } catch (e2) {}
  try { log("panitia", "Tamu dihapus: " + (nama || tok)); } catch (e3) {}
  return { ok: true, token: tok, nama: nama || tok };
}

function hapusSemuaTamu() {
  var sh = sheetTamu();
  var last = sh.getLastRow();
  if (last <= 1) return { ok: true, jumlah: 0 };
  var jumlah = last - 1;
  sh.deleteRows(2, jumlah);
  try { clearTamuCache(); } catch (e1) {}
  try { flushCache(); } catch (e2) {}
  try { log("panitia", "Semua tamu dihapus (" + jumlah + " tamu)"); } catch (e3) {}
  return { ok: true, jumlah: jumlah };
}

function _parseRpcVal(v) {
  if (typeof v !== "string") return v;
  var s = v.trim();
  if ((s.charAt(0) === "{" && s.charAt(s.length - 1) === "}") ||
      (s.charAt(0) === "[" && s.charAt(s.length - 1) === "]") ||
      (s.charAt(0) === '"' && s.charAt(s.length - 1) === '"') ||
      s === "true" || s === "false" || s === "null") {
    try { return JSON.parse(s); } catch (e) {}
  }
  return v;
}

function rpcDispatch(fn, a, b, c, d) {
  var args = [];
  if (Array.isArray(a)) {
    for (var i = 0; i < a.length; i++) args.push(_parseRpcVal(a[i]));
  } else if (a && typeof a === "object" && ("a1" in a || "fn" in a || "mode" in a)) {
    for (var k = 1; k <= 10; k++) {
      if (("a" + k) in a) args.push(_parseRpcVal(a["a" + k]));
    }
  } else {
    args = [_parseRpcVal(a), _parseRpcVal(b), _parseRpcVal(c), _parseRpcVal(d)];
  }

  switch (String(fn || "")) {
    case "cekPin":                        return cekPin(args[0], args[1]);
    case "dataPanitia":                   return dataPanitia();
    case "statusBroadcast":               return statusBroadcast();
    case "logBroadcast":                  return logBroadcast();
    case "tambahTamu":                    return tambahTamuDenganJenis(args[0]);
    case "importTamuDetail":              return importTamuDetail(args[0]);
    case "setJenisUndangan":              return setJenisUndangan(args[0], args[1]);
    case "isiDataContoh":                 return isiDataContoh();
    case "kirimUlang":                    return kirimUlang(args[0], args[1]);
    case "kirimUlangGagal":               return kirimUlangGagal();
    case "setKonfirmasiPanitia":          return setKonfirmasiPanitia(args[0], args[1], args[2], args[3]);
    case "konfirmasiDariLampiran":        return konfirmasiDariLampiran(args[0]);
    case "hapusTamu":                     return hapusTamu(args[0]);
    case "hapusSemuaTamu":                return hapusSemuaTamu();
    case "kirimTesUndangan":              return kirimTesDenganJenis(args[0], args[1]);
    case "kirimTesQR":                    return kirimTesQR(args[0]);
    case "kirimSemuaUndangan":            return kirimSemuaByJenis(args[0]);
    case "getReminderFormat":             return getReminderFormat();
    case "saveReminderFormat":            return saveReminderFormat(args[0], args[1], args[2]);
    case "kirimTesReminder":              return kirimTesReminder(args[0], args[1], args[2]);
    case "kirimReminderMassal":           return kirimReminderMassal(args[0], args[1]);
    case "pasangTriggerReminderOtomatis": return pasangTriggerReminderOtomatis();
    case "pastikanTriggerOtomatis":       return pastikanTriggerOtomatis();
    case "lanjutkanKirim":                return lanjutkanKirim();
    case "getWaFormat":                   return getWaFormat();
    case "saveWaFormat":                  return saveWaFormat(args[0], args[1]);
    case "resetWaFormat":                 return resetWaFormat();
    case "dataKoordinator":               return dataKoordinator();
    case "setMeja":                       return setMeja(args[0], args[1]);
    case "setMejaBatch":                  return setMejaBatch(args[0]);
    case "susunMejaOtomatis":             return susunMejaOtomatis();
    case "dataPetugas":                   return dataPetugas();
    case "setStatusTamu":                 return setStatusTamu(args[0], args[1], args[2]);
    case "scanHadir":                     return scanHadir(args[0]);
    case "tambahWalkIn":                  return tambahWalkIn(args[0]);
    case "kirimQrUlang":                  return kirimQrUlang(args[0]);
    case "statusKonfirmasi":              return statusKonfirmasi(args[0]);
    case "tvData":                        return tvData();
    default:
      return { ok: false, error: "Fungsi tidak dikenal: " + fn };
  }
}
