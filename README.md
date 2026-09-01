# arhanud80.online

Halaman pengalihan (redirect) untuk domain **arhanud80.online** → **https://undangan.arhanud80.online/**

## Cara kerja
1. DNS di Hostinger: 4 record A untuk `arhanud80.online` (apex) menunjuk ke IP GitHub Pages.
2. GitHub Pages repo ini (custom domain `arhanud80.online`) menampilkan halaman pengalihan otomatis.
3. Situs utama (portal Panitia/Koordinator/Petugas + halaman tamu) tetap di `undangan.arhanud80.online` (repo `domain-arhanud`).

## Record A yang dibutuhkan (Hostinger hPanel → DNS Zone Editor)
| Nama | Tipe | Nilai |
|---|---|---|
| @ / arhanud80.online | A | 185.199.108.153 |
| @ / arhanud80.online | A | 185.199.109.153 |
| @ / arhanud80.online | A | 185.199.110.153 |
| @ / arhanud80.online | A | 185.199.111.153 |

CNAME `undangan` → `assgbt963-collab.github.io` (sudah ada, jangan dihapus).
