# 🌸 Rangkai Puspa

**Rangkai Puspa** adalah aplikasi web *virtual florist* 3D bergaya **pixel / voxel estetik** yang berjalan sepenuhnya di frontend (tanpa backend). Kamu bisa merangkai berbagai bunga dan daun 3D sesuka hati, memilih warna dan motif kelopak, mengkustomisasi bungkus serta pita buket, lalu membagikannya ke orang tersayang lewat link atau gambar PNG!

## ✨ Fitur Utama

- **Grafik 3D Voxel Pixelated**: Model bunga dan bungkus kotak-kotak 3D (Three.js) yang dirender pada resolusi rendah (*NearestFilter*) untuk menghasilkan siluet dan tekstur pixel yang estetik, dengan opsi tingkat pixel (**Kasar / Pas / Halus**).
- **Interaksi 3D Alami**:
  - **Drag 3D di Area Buket**: Klik dan seret bunga di kanvas; tangkainya otomatis mengarah masuk ke ikatan bungkus (*auto-tuck*).
  - **Putar Kamera 360°**: Seret latar belakang untuk melihat buket dari berbagai sudut.
  - **Auto-Rapi**: Tata ulang komposisi bunga secara otomatis dengan susunan kubah (*phyllotaxis*).
  - **Undo / Redo** & kontrol detail (*tinggi, kedalaman, putar, ukuran*).
- **11 Jenis Bunga & Daun**: Mawar, Peony, Tulip, Matahari, Lily, Hortensia, Aster/Daisy, Lavender, Baby’s Breath, Eukaliptus, dan Daun Pakis.
- **Kustomisasi Warna & Motif**:
  - Warna utama & warna kedua bebas pilih (kurasi palet estetik atau *color picker*).
  - **4 Motif Kelopak**: Polos, Gradasi Ombre, Bintik Manis, dan Tepi Kontras.
  - **4 Bentuk Bungkus**: Berlapis Korea, Kerucut Klasik, Bergelombang, dan Selongsong Kraft.
  - **7 Motif Kertas Bungkus**: Polos, Serat Kraft, Kotak Gingham, Polka Dot, Garis Halus, Bintang Kecil, dan Bunga Mini — lengkap dengan warna kertas luar & lapisan dalam terpisah.
  - **3 Model Pita & Tag Gantung**: Pita Klasik, Pita Ganda, dan Tali Rami dengan teks tag kustom.
- **Berbagi Tanpa Backend & Ekspor PNG**:
  - **Link Hadiah (`#b=...`)**: Seluruh rangkaian dan kartu ucapan dikompresi ke dalam URL hash. Penerima yang membuka link akan masuk ke mode tampilan hadiah dengan buket berputar pelan dan kartu ucapan.
  - **Unduh PNG & Kartu Pos**: Simpan gambar buket (latar studio atau transparan) maupun kartu pos berbingkai pixel.
  - **Galeri Lokal**: Simpan rangkaian di browser (`localStorage`) atau buka 3 *starter preset* yang sudah tersedia.
- **Bilingual (ID / EN)** & efek suara Web Audio ringan (dapat dimatikan).

## 🛠️ Teknologi

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [Three.js](https://threejs.org/) (WebGL Voxel Builder & Low-Res Pixel Render Target)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [lz-string](https://pieroxy.net/blog/pages/lz-string/index.html) untuk kompresi link berbagi statis
- [Vitest](https://vitest.dev/) untuk unit testing

## 🚀 Menjalankan Secara Lokal

Pastikan **Node.js** (v20+) dan **npm** sudah terpasang:

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server pengembangan
npm run dev

# 3. Jalankan unit test
npm test

# 4. Build produksi (output di folder dist/)
npm run build
```

## 🌐 Deploy ke GitHub Pages

Proyek ini sudah dilengkapi workflow GitHub Actions di `.github/workflows/deploy.yml` dan konfigurasi `base: './'` di `vite.config.ts`.

1. Push kode ke branch `main` di repositori GitHub.
2. Buka **Settings → Pages** pada repositori GitHub kamu.
3. Pada bagian **Build and deployment → Source**, pilih **GitHub Actions**.
4. Setiap kali ada *push* ke `main`, GitHub Pages akan otomatis mem-build dan mempublikasikan situs.
