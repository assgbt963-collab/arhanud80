/* =========================================================================
 * PATCH LENGKAP SISTEM BROADCAST UNDANGAN & KONFIRMASI HUT KE-80 ARHANUD
 * Versi Patch: 20261020-v3 (Penyelarasan Penuh Undangan Tradisi & Syukuran
 *              + Mode Aman Hanya Kirim ke Nomor Contoh + Fix Status Sent)
 *
 * Fitur Utama:
 * 1. Penyelarasan penuh format WhatsApp & Link Preview:
 *    - UNDANGAN 1 (TRADISI DAN SYUKURAN):
 *      🕣 Waktu Tradisi Korps Pati: Pukul 07.30 WIB — Selesai
 *      🕘 Waktu Acara Syukuran: Pukul 09.00 WIB — Selesai
 *      Link & Kartu Preview WA: https://undangan.arhanud80.online/tradisi
 *    - UNDANGAN 2 (ACARA SYUKURAN):
 *      🕘 Waktu: Pukul 09.00 WIB — Selesai
 *      Link & Kartu Preview WA: https://undangan.arhanud80.online/syukuran
 * 2. Proteksi Kontak Tamu: Menonaktifkan pengiriman otomatis latar belakang
 *    (lanjutOtomatis) agar TIDAK mengirim ke seluruh kontak tamu asli.
 *    Pengecekan broadcast dibatasi khusus ke Nomor Contoh.
 * 3. Perbaikan deteksi status "sent" dari Fonnte (_cekHasilKirimWa).
 * 4. Pemberitahuan Broadcast Pengingat H-3 (14 Nov), H-1 (16 Nov) & Hari H (17 Nov)
 *    beserta tenggat waktu dan waktu pelaksanaan acara.
 * ========================================================================= */

var PATCH_VERSION_ARHANUD = "20261020-v3";

// KONSEP 1: Undangan Tradisi Laporan Korps Pati Arhanud (07.30 WIB) & Acara Syukuran HUT ke-80 Arhanud (09.00 WIB)
// Disesuaikan 100% dengan struktur & susunan kalimat Undangan Acara Syukuran
var DEFAULT_WA_FMT_TRADISI =
  "*UNDANGAN TRADISI DAN SYUKURAN*\n" +
  "*TRADISI LAPORAN KORPS PATI ARHANUD & SYUKURAN HUT KE-80 ARHANUD TNI ANGKATAN DARAT*\n\n" +
  "Kepada Yth.\n" +
  "*{nama}*\n" +
  "di Tempat\n\n" +
  "Dengan hormat,\n" +
  "Komandan Pusat Kesenjataan Arhanud TNI AD mengharap dengan hormat kehadiran Bapak/Ibu dalam acara:\n\n" +
  "🎖️ *Tradisi Laporan Korps Pati Arhanud & Acara Syukuran HUT ke-80 Arhanud TNI AD*\n" +
  "📅 *Hari/Tanggal:* Selasa, 17 November 2026\n" +
  "🕣 *Waktu Tradisi Korps Pati:* Pukul 07.30 WIB — Selesai\n" +
  "🕘 *Waktu Acara Syukuran:* Pukul 09.00 WIB — Selesai\n" +
  "📍 *Tempat:* Aula R. Harsoyo Pussenarhanud, Jl. Sriwijaya Raya No. 1, Cimahi\n" +
  "👔 *Pakaian:* Militer PDU IV · Persit PSU · Sipil Bebas Rapi\n" +
  "_(Dimohon hadir 15 menit sebelum acara dimulai)_\n\n" +
  "Silakan membuka tautan *Undangan Tradisi dan Syukuran* berikut untuk informasi lengkap serta konfirmasi kehadiran:\n" +
  "{link}\n\n" +
  "Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.\n" +
  "_Vyati Rakca Bhala Cakti_\n" +
  "*Panitia HUT ke-80 Arhanud TNI AD*";

// KONSEP 2: Khusus Acara Syukuran HUT ke-80 Arhanud TNI AD (09.00 WIB — Tanpa Tradisi Korps Pati)
var DEFAULT_WA_FMT_HUT =
  "*UNDANGAN ACARA SYUKURAN*\n" +
  "*SYUKURAN HUT KE-80 ARHANUD TNI ANGKATAN DARAT*\n\n" +
  "Kepada Yth.\n" +
  "*{nama}*\n" +
  "di Tempat\n\n" +
  "Dengan hormat,\n" +
  "Komandan Pusat Kesenjataan Arhanud TNI AD mengharap dengan hormat kehadiran Bapak/Ibu dalam acara:\n\n" +
  "🎉 *Acara Syukuran HUT ke-80 Arhanud TNI AD*\n" +
  "📅 *Hari/Tanggal:* Selasa, 17 November 2026\n" +
  "🕘 *Waktu:* Pukul 09.00 WIB — Selesai\n" +
  "📍 *Tempat:* Aula R. Harsoyo Pussenarhanud, Jl. Sriwijaya Raya No. 1, Cimahi\n" +
  "👔 *Pakaian:* Militer PDU IV · Persit PSU · Sipil Bebas Rapi\n" +
  "_(Dimohon hadir 15 menit sebelum acara dimulai)_\n\n" +
  "Silakan membuka tautan *Undangan Acara Syukuran* berikut untuk informasi lengkap serta konfirmasi kehadiran:\n" +
  "{link}\n\n" +
  "Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.\n" +
  "_Vyati Rakca Bhala Cakti_\n" +
  "*Panitia HUT ke-80 Arhanud TNI AD*";

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

var _DAFTAR_NOMOR_CONTOH = {
  "mochammad abian r. a.": true,
  "letkol arh erfan": true,
  "uji kirim (nomor sendiri)": true,
  "mayor arh rizki prima": true,
  "mayor arh agus": true,
  "mayor arh ina": true,
  "sertu guston": true,
  "multazam": true
};

function _isTamuContoh(g) {
  if (!g) return false;
  var nm = String(g.nama || "").trim().toLowerCase();
  if (_DAFTAR_NOMOR_CONTOH[nm]) return true;
  var org = String(g.org || "").trim().toUpperCase();
  if (!org || org === "YONARHANUD 3/YBY" || org === "PUSSENARHANUD") return true;
  return false;
}

function _hapusTriggerLanjutOtomatis() {
  try {
    var trigs = ScriptApp.getProjectTriggers();
    for (var i = 0; i < trigs.length; i++) {
      var fn = trigs[i].getHandlerFunction();
      if (fn === "lanjutOtomatis" || fn === "kirimSemuaUndangan") {
        ScriptApp.deleteTrigger(trigs[i]);
      }
    }
  } catch (e) {}
}

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

function _isValidFmtTradisi(s) {
  if (typeof s !== "string" || !s.trim()) return false;
  if (s.indexOf("[object") >= 0 || s.indexOf("08.00") >= 0 || s.indexOf("08:00") >= 0) return false;
  if (s.indexOf("salam Arhanud Jaya") >= 0 || s.indexOf("Dalam rangka HUT ke-80") >= 0) return false;
  if (s.indexOf("07.30") < 0 || s.indexOf("09.00") < 0) return false;
  if (s.toUpperCase().indexOf("TRADISI") < 0) return false;
  return true;
}

function _isValidFmtHut(s) {
  if (typeof s !== "string" || !s.trim()) return false;
  if (s.indexOf("[object") >= 0 || s.indexOf("08.00") >= 0 || s.indexOf("08:00") >= 0) return false;
  if (s.indexOf("salam Arhanud Jaya") >= 0 || s.indexOf("Dalam rangka HUT ke-80") >= 0) return false;
  if (s.indexOf("09.00") < 0) return false;
  return true;
}

function _ambilDuaFormat() {
  var st = {};
  try { st = setting() || {}; } catch (e) {}
  var rawTrad = (typeof st === "string") ? "" : (st.wa_broadcast_tradisi || st.WA_BROADCAST_TRADISI || "");
  var rawHut  = (typeof st === "string") ? "" : (st.wa_broadcast_hut || st.WA_BROADCAST_HUT || "");
  var fTrad = _isValidFmtTradisi(rawTrad) ? rawTrad.trim() : DEFAULT_WA_FMT_TRADISI;
  var fHut  = _isValidFmtHut(rawHut) ? rawHut.trim() : DEFAULT_WA_FMT_HUT;
  return { tradisi: fTrad, hut: fHut };
}

function _renderPesanWa(tpl, g, jenis) {
  var jns = _normJenisUndangan(jenis || (g && g.kategori) || _ACTIVE_JENIS_BROADCAST);
  var nama = (g && g.nama) ? String(g.nama).trim() : "Mochammad Abian R. A.";
  var tok  = (g && g.token) ? String(g.token).trim() : "ggEa9dSV";
  var lnk  = _buatLinkTamu(tok, nama, jns);
  var acara = (jns === "HUT")
    ? "Acara Syukuran HUT ke-80 Arhanud TNI AD"
    : "Tradisi Laporan Korps Pati Arhanud & Acara Syukuran HUT ke-80 Arhanud TNI AD";
  var waktu = (jns === "HUT")
    ? "Pukul 09.00 WIB — Selesai"
    : "Pukul 07.30 WIB — Selesai (Tradisi Korps Pati) & Pukul 09.00 WIB — Selesai (Acara Syukuran)";
  var tanggal = "Selasa, 17 November 2026";
  var tempat  = "Aula R. Harsoyo Pussenarhanud, Jl. Sriwijaya Raya No. 1, Cimahi";
  var panitia = "Panitia HUT ke-80 Arhanud TNI AD";

  var base = String(tpl || "");
  var isReminder = base.indexOf("PENGINGAT WAKTU PELAKSANAAN ACARA") >= 0;
  if (!isReminder) {
    if (jns === "HUT") {
      if (!_isValidFmtHut(base) || base.toUpperCase().indexOf("TRADISI LAPORAN KORPS") >= 0) {
        base = DEFAULT_WA_FMT_HUT;
      }
    } else {
      if (!_isValidFmtTradisi(base)) {
        base = DEFAULT_WA_FMT_TRADISI;
      }
    }
  }

  var out = base
    .replace(/08[\.:]00\s*WIB(\s*[—\-–]\s*Selesai)?/gi, (jns === "HUT") ? "09.00 WIB — Selesai" : "07.30 WIB — Selesai")
    .replace(/08[\.:]00/g, (jns === "HUT") ? "09.00" : "07.30")
    .replace(/\{nama\}/g, nama)
    .replace(/\{acara\}/g, acara)
    .replace(/\{tanggal\}/g, tanggal)
    .replace(/\{waktu\}/g, waktu)
    .replace(/\{tempat\}/g, tempat)
    .replace(/\{link\}/g, lnk)
    .replace(/\{panitia\}/g, panitia);

  // Pastikan link di dalam hasil akhir selalu sesuai jenis (/tradisi vs /syukuran, tidak pernah /lampiran)
  out = out.replace(/https:\/\/undangan\.arhanud80\.online\/(lampiran|tradisi|syukuran)\?[^\s\n]+/g, lnk);
  return out;
}

function _setWaBroadcastAktif(teks) {
  var keys = ["wa_broadcast", "WA_BROADCAST", "fmt_broadcast", "FMT_BROADCAST", "broadcast", "pesan_broadcast", "format_broadcast"];
  for (var i = 0; i < keys.length; i++) {
    try { setSettingVal(keys[i], teks); } catch (e) {}
  }
  try { setSettingVal("waktu", "Pukul 07.30 WIB — Selesai (Tradisi Korps Pati) & Pukul 09.00 WIB — Selesai (Acara Syukuran)"); } catch (eW) {}
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
  _hapusTriggerLanjutOtomatis();
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
  var raw1 = String(broadcastTradisi || "").trim();
  var raw2 = String(broadcastHut || "").trim();
  var fmts = _ambilDuaFormat();
  var bTrad = fmts.tradisi;
  var bHut  = fmts.hut;

  // Kompatibilitas penuh bila dipanggil dari tab lama yang mengirim (teksAktif, tHut)
  if (_isValidFmtTradisi(raw1)) {
    bTrad = raw1;
    _ACTIVE_JENIS_BROADCAST = "TRADISI";
  } else if (_isValidFmtHut(raw1) && raw1.toUpperCase().indexOf("TRADISI") < 0) {
    bHut = raw1;
    _ACTIVE_JENIS_BROADCAST = "HUT";
  }
  if (_isValidFmtHut(raw2) && raw2.toUpperCase().indexOf("TRADISI LAPORAN KORPS") < 0) {
    bHut = raw2;
  }

  try { setSettingVal("wa_broadcast_tradisi", bTrad); } catch (e1) {}
  try { setSettingVal("wa_broadcast_hut", bHut); } catch (e2) {}
  _setWaBroadcastAktif(_ACTIVE_JENIS_BROADCAST === "HUT" ? bHut : bTrad);
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
    var stObj = String(r.status || "").toLowerCase();
    if (r.ok === true || r.status === true || r.sent === true || stObj === "sent" || stObj === "true" || stObj === "ok") {
      return { ok: true, err: "" };
    }
    return { ok: false, err: String(r.error || r.reason || r.detail || r.message || r.status || "Gagal kirim Fonnte") };
  }
  if (typeof r === "string") {
    var s = r.trim().toLowerCase();
    if (s === "sent" || s === "ok" || s === "true" || s === "berhasil" || s.indexOf('"status":true') >= 0 || s.indexOf('"sent"') >= 0 || s.indexOf("true") >= 0) {
      return { ok: true, err: "" };
    }
    return { ok: false, err: r.trim() || "Gagal kirim WA" };
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

function _cariTamuContohUntukTes(hpClean) {
  var all = [];
  try { all = tamuRows() || []; } catch (e) {}
  var digitsIn = String(hpClean || "").replace(/\D+/g, "").replace(/^0+/, "").replace(/^62/, "");
  var fallbackAbian = null;
  var fallbackContoh = null;
  for (var i = 0; i < all.length; i++) {
    var g = all[i];
    var nm = String(g.nama || "").trim().toLowerCase();
    if (nm === "mochammad abian r. a.") fallbackAbian = g;
    if (!fallbackContoh && _isTamuContoh(g)) fallbackContoh = g;
    var dRow = String(g.hp || "").replace(/\D+/g, "").replace(/^0+/, "").replace(/^62/, "");
    if (digitsIn && dRow && digitsIn === dRow) {
      return g;
    }
  }
  return fallbackAbian || fallbackContoh || { token: "ggEa9dSV", nama: "Mochammad Abian R. A.", hp: hpClean };
}

function kirimTesUndangan(hp, optJenis) {
  var hpClean = String(hp || "").trim();
  if (!hpClean) return { ok: false, status: "Nomor tujuan kosong", nama: "-" };

  var jns = _FORCE_JENIS_BROADCAST
    ? _normJenisUndangan(_FORCE_JENIS_BROADCAST)
    : _normJenisUndangan(optJenis || _ACTIVE_JENIS_BROADCAST);

  var gRef = _cariTamuContohUntukTes(hpClean);
  var gTes = {
    token: gRef.token || "ggEa9dSV",
    nama: gRef.nama || "Mochammad Abian R. A.",
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
    log("tes", "Tes undangan [" + labelLog + "] → " + gTes.nama + " (" + hpClean + ") — " + (chk.ok ? "sent" : ("gagal: " + chk.err)));
  } catch (eL) {}

  return {
    ok: chk.ok,
    status: chk.ok ? "sent" : (chk.err || "gagal"),
    nama: gTes.nama,
    jenis: jns,
    patchVersion: PATCH_VERSION_ARHANUD
  };
}

/* ===== PENGINGAT BROADCAST H-3, H-1 & HARI H ===== */
function _ambilTigaReminder() {
  var st = {};
  try { st = setting() || {}; } catch (e) {}
  var h3 = (typeof st === "string") ? "" : (st.wa_reminder_h3 || st.WA_REMINDER_H3 || "");
  var h1 = (typeof st === "string") ? "" : (st.wa_reminder_h1 || st.WA_REMINDER_H1 || "");
  var h0 = (typeof st === "string") ? "" : (st.wa_reminder_h0 || st.WA_REMINDER_H0 || "");
  return {
    h3: (typeof h3 === "string" && h3.trim() && h3.indexOf("08.00") < 0) ? h3.trim() : DEFAULT_REM_H3,
    h1: (typeof h1 === "string" && h1.trim() && h1.indexOf("08.00") < 0) ? h1.trim() : DEFAULT_REM_H1,
    h0: (typeof h0 === "string" && h0.trim() && h0.indexOf("08.00") < 0) ? h0.trim() : DEFAULT_REM_H0
  };
}

function getReminderFormat() {
  var r = _ambilTigaReminder();
  return {
    ok: true,
    patchVersion: PATCH_VERSION_ARHANUD,
    h3: r.h3,
    h1: r.h1,
    h0: r.h0,
    def_h3: DEFAULT_REM_H3,
    def_h1: DEFAULT_REM_H1,
    def_h0: DEFAULT_REM_H0
  };
}

function saveReminderFormat(h3, h1, h0) {
  var r3 = String(h3 || "").trim() || DEFAULT_REM_H3;
  var r1 = String(h1 || "").trim() || DEFAULT_REM_H1;
  var r0 = String(h0 || "").trim() || DEFAULT_REM_H0;
  try { setSettingVal("wa_reminder_h3", r3); } catch (e1) {}
  try { setSettingVal("wa_reminder_h1", r1); } catch (e2) {}
  try { setSettingVal("wa_reminder_h0", r0); } catch (e3) {}
  try { memoClear(); } catch (e4) {}
  try { flushCache(); } catch (e5) {}
  try { log("panitia", "Format pengingat H-3, H-1 & Hari H diperbarui"); } catch (e6) {}
  return { ok: true, h3: r3, h1: r1, h0: r0 };
}

function _rakitPesanReminder(rawTpl, jenis) {
  var jns = _normJenisUndangan(jenis);
  var namaAcara = (jns === "HUT")
    ? "Acara Syukuran HUT ke-80 Arhanud TNI AD"
    : "Tradisi Laporan Korps Pati Arhanud & Acara Syukuran HUT ke-80 Arhanud TNI AD";
  var waktuAcara = (jns === "HUT")
    ? "Pukul 09.00 WIB — Selesai"
    : "Pukul 07.30 WIB — Selesai (Tradisi Korps Pati) & Pukul 09.00 WIB — Selesai (Acara Syukuran)";
  return String(rawTpl || "")
    .replace(/\{acara\}/g, namaAcara)
    .replace(/\{waktu\}/g, waktuAcara);
}

function kirimTesReminder(hp, tahap, jenis) {
  var rems = _ambilTigaReminder();
  var t = String(tahap || "H3").toUpperCase();
  var raw = (t === "H0" || t === "HARI_H") ? rems.h0 : ((t === "H1") ? rems.h1 : rems.h3);
  var jns = _normJenisUndangan(jenis);
  var tplSiap = _rakitPesanReminder(raw, jns);

  _FORCE_JENIS_BROADCAST = jns;
  _ACTIVE_JENIS_BROADCAST = jns;
  _ACTIVE_CUSTOM_TEMPLATE = tplSiap;
  var res = kirimTesUndangan(hp, jns);
  _ACTIVE_CUSTOM_TEMPLATE = "";
  _FORCE_JENIS_BROADCAST = "";
  _ACTIVE_JENIS_BROADCAST = "TRADISI";
  return res;
}

function kirimReminderMassal(tahap, sasaran) {
  var rems = _ambilTigaReminder();
  var t = String(tahap || "H3").toUpperCase();
  var s = String(sasaran || "CONTOH_SAJA").toUpperCase();
  var raw = (t === "H0" || t === "HARI_H") ? rems.h0 : ((t === "H1") ? rems.h1 : rems.h3);

  var all = tamuRows();
  var tokTrad = [], tokHut = [];
  for (var i = 0; i < all.length; i++) {
    var g = all[i];
    if (!_isTamuContoh(g)) continue; // Proteksi: hanya kirim ke nomor contoh
    var h = String(g.hadir || "").trim().toUpperCase();
    var jns = _normJenisUndangan(g.kategori);
    if (s === "SEMUA_AKTIF" && h && h !== "HADIR") continue;
    if (s === "SUDAH_HADIR" && h !== "HADIR") continue;
    if (s === "BELUM_KONF" && h !== "") continue;
    if (s === "TRADISI" && jns !== "TRADISI") continue;
    if (s === "HUT" && jns !== "HUT") continue;
    if (jns === "HUT") tokHut.push(g.token);
    else tokTrad.push(g.token);
  }

  var totalSent = 0, totalGagal = [], adaLanjut = false;
  if (tokTrad.length > 0) {
    _FORCE_JENIS_BROADCAST = "TRADISI";
    _ACTIVE_JENIS_BROADCAST = "TRADISI";
    _ACTIVE_CUSTOM_TEMPLATE = _rakitPesanReminder(raw, "TRADISI");
    var r1 = kirimUndangan(tokTrad, "TRADISI");
    totalSent += (r1 && r1.sent) || 0;
    if (r1 && r1.gagal && r1.gagal.length) totalGagal = totalGagal.concat(r1.gagal);
    if (r1 && r1.lanjut) adaLanjut = true;
  }
  if (tokHut.length > 0) {
    _FORCE_JENIS_BROADCAST = "HUT";
    _ACTIVE_JENIS_BROADCAST = "HUT";
    _ACTIVE_CUSTOM_TEMPLATE = _rakitPesanReminder(raw, "HUT");
    var r2 = kirimUndangan(tokHut, "HUT");
    totalSent += (r2 && r2.sent) || 0;
    if (r2 && r2.gagal && r2.gagal.length) totalGagal = totalGagal.concat(r2.gagal);
    if (r2 && r2.lanjut) adaLanjut = true;
  }

  _ACTIVE_CUSTOM_TEMPLATE = "";
  _FORCE_JENIS_BROADCAST = "";
  _ACTIVE_JENIS_BROADCAST = "TRADISI";
  try { clearTamuCache(); } catch (e) {}
  try { log("broadcast", "Pengingat " + t + " (" + s + " - Nomor Contoh) terkirim: " + totalSent + " tamu"); } catch (e2) {}
  return { ok: true, sent: totalSent, gagal: totalGagal, lanjut: adaLanjut, tahap: t };
}

function pasangTriggerReminderOtomatis() {
  _hapusTriggerLanjutOtomatis();
  return { ok: true, info: "Trigger otomatis dinonaktifkan agar aman (pengiriman hanya manual / ke nomor contoh)." };
}

function jalankanJadwalReminderOtomatis() {
  return { ok: true, sent: 0 };
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
  _ACTIVE_JENIS_BROADCAST = jns;
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
      if (jns !== "TRADISI" || ket) {
        _simpanDetailDiSheet(r.token, jns, ket);
      }
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
  _hapusTriggerLanjutOtomatis();
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
  var jns = optJenis
    ? _normJenisUndangan(optJenis)
    : _normJenisUndangan(g.kategori || _ACTIVE_JENIS_BROADCAST);
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

// Proteksi: fungsi kirimSemuaByJenis hanya mengirim ke Nomor Contoh bila dipanggil langsung
function kirimSemuaByJenis(mode) {
  _hapusTriggerLanjutOtomatis();
  var m = String(mode || "SEMUA").trim().toUpperCase();
  var all = tamuRows();
  var target = [];
  for (var i = 0; i < all.length; i++) {
    var g = all[i];
    if (!_isTamuContoh(g)) continue; // Hanya Nomor Contoh
    if (String(g.invite_status || "") === "terkirim") continue;
    var jns = _normJenisUndangan(g.kategori);
    if (m === "TRADISI" && jns !== "TRADISI") continue;
    if (m === "HUT" && jns !== "HUT") continue;
    target.push(g);
  }
  if (!target.length) return { ok: true, sent: 0, gagal: [], lanjut: false };
  return _kirimBatchSesuaiJenis(target);
}

function kirimSemuaUndangan() {
  _hapusTriggerLanjutOtomatis();
  return { ok: true, sent: 0, gagal: [], lanjut: false, info: "Gunakan pengiriman per nomor contoh di Portal Broadcast." };
}

function lanjutkanKirim() {
  _hapusTriggerLanjutOtomatis();
  return { ok: true, sent: 0, gagal: [], lanjut: false };
}

function pastikanTriggerOtomatis() {
  _hapusTriggerLanjutOtomatis();
  return { ok: true, auto: false, info: "Auto-lanjut dinonaktifkan agar tidak mengirim ke seluruh kontak tamu." };
}

function lanjutOtomatis() {
  _hapusTriggerLanjutOtomatis();
  return { ok: true, sent: 0, gagal: [], lanjut: false };
}

function kirimUlangGagal() {
  var all = tamuRows();
  var gagalList = [];
  for (var i = 0; i < all.length; i++) {
    if (_isTamuContoh(all[i]) && String(all[i].invite_status || "") === "gagal") {
      gagalList.push(all[i]);
    }
  }
  if (!gagalList.length) return { ok: true, sent: 0, gagal: [], lanjut: false };
  return _kirimBatchSesuaiJenis(gagalList);
}

function kirimTesDenganJenis(hp, jenis) {
  var jns = _normJenisUndangan(jenis || _ACTIVE_JENIS_BROADCAST);
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
