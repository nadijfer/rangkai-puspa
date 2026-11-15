import { Language } from '../types/bouquet';

export const TRANSLATIONS: Record<
  Language,
  {
    appTitle: string;
    subtitle: string;
    tabs: {
      flowers: string;
      wrapper: string;
      card: string;
    };
    actions: {
      autoArrange: string;
      undo: string;
      redo: string;
      gallery: string;
      shareExport: string;
      saveGallery: string;
      savedToast: string;
      addFlower: string;
      applySelected: string;
      duplicate: string;
      remove: string;
      clearAll: string;
      resetCamera: string;
      remixBouquet: string;
      copyLink: string;
      copied: string;
      downloadPng: string;
      downloadPostcard: string;
      loadBouquet: string;
      deleteSaved: string;
      close: string;
    };
    labels: {
      species: string;
      categoryAll: string;
      categoryFocal: string;
      categoryAccent: string;
      categoryFoliage: string;
      primaryColor: string;
      secondaryColor: string;
      petalMotif: string;
      wrapperShape: string;
      outerColor: string;
      innerColor: string;
      wrapperMotif: string;
      motifColor: string;
      ribbonStyle: string;
      ribbonColor: string;
      tagText: string;
      bouquetName: string;
      cardTo: string;
      cardFrom: string;
      cardMessage: string;
      pixelDensity: string;
      chunky: string;
      balanced: string;
      fine: string;
      inspectorTitle: string;
      height: string;
      depth: string;
      spin: string;
      scale: string;
      stemCount: string;
      dragHint: string;
      dragPaletteHint: string;
      dropOnBouquet: string;
      giftBadge: string;
      starterPresets: string;
      savedBouquets: string;
      noSavedYet: string;
      shareDescription: string;
      transparentBg: string;
      studioBg: string;
    };
  }
> = {
  id: {
    appTitle: 'Rangkai Puspa',
    subtitle: 'Studio Buket Pixel 3D',
    tabs: {
      flowers: 'Bunga & Daun',
      wrapper: 'Bungkus & Pita',
      card: 'Kartu Ucapan',
    },
    actions: {
      autoArrange: 'Auto-Rapi',
      undo: 'Undo',
      redo: 'Redo',
      gallery: 'Galeri',
      shareExport: 'Bagikan / PNG',
      saveGallery: 'Simpan ke Galeri',
      savedToast: 'Buket tersimpan di galeri lokal!',
      addFlower: 'Tambah ke Buket',
      applySelected: 'Terapkan ke Bunga Terpilih',
      duplicate: 'Duplikat',
      remove: 'Hapus',
      clearAll: 'Kosongkan',
      resetCamera: 'Reset Kamera',
      remixBouquet: 'Rangkai / Edit Buket Ini',
      copyLink: 'Salin Link Hadiah',
      copied: 'Link Tersalin!',
      downloadPng: 'Unduh PNG Buket',
      downloadPostcard: 'Unduh Kartu Pos PNG',
      loadBouquet: 'Buka',
      deleteSaved: 'Hapus',
      close: 'Tutup',
    },
    labels: {
      species: 'Pilih Bunga / Daun',
      categoryAll: 'Semua',
      categoryFocal: 'Utama',
      categoryAccent: 'Aksen',
      categoryFoliage: 'Daun',
      primaryColor: 'Warna Utama',
      secondaryColor: 'Warna Kedua / Motif',
      petalMotif: 'Motif Kelopak',
      wrapperShape: 'Bentuk Bungkus',
      outerColor: 'Kertas Luar',
      innerColor: 'Lapisan Dalam',
      wrapperMotif: 'Motif Kertas',
      motifColor: 'Warna Motif',
      ribbonStyle: 'Model Pita',
      ribbonColor: 'Warna Pita',
      tagText: 'Teks Tag Gantung',
      bouquetName: 'Nama Rangkaian',
      cardTo: 'Untuk',
      cardFrom: 'Dari',
      cardMessage: 'Pesan Kartu Ucapan',
      pixelDensity: 'Tingkat Pixel',
      chunky: 'Kasar',
      balanced: 'Pas',
      fine: 'Halus',
      inspectorTitle: 'Atur Bunga',
      height: 'Tinggi',
      depth: 'Depan/Belakang',
      spin: 'Putar',
      scale: 'Ukuran',
      stemCount: 'tangkai',
      dragHint: 'Klik & seret bunga untuk geser 3D • Seret latar untuk putar kamera',
      dragPaletteHint: 'Tahan & seret bunga ke buket, atau klik Tambah',
      dropOnBouquet: 'Lepas di buket!',
      giftBadge: 'Kiriman Buket Spesial',
      starterPresets: 'Contoh Rangkaian',
      savedBouquets: 'Tersimpan di Browser',
      noSavedYet: 'Belum ada buket tersimpan. Klik "Simpan ke Galeri" untuk menyimpannya!',
      shareDescription: 'Kirimkan buket 3D ini lewat link tanpa backend, atau unduh sebagai gambar pixel PNG.',
      transparentBg: 'Latar Transparan',
      studioBg: 'Latar Studio Hangat',
    },
  },
  en: {
    appTitle: 'Rangkai Puspa',
    subtitle: '3D Pixel Florist Studio',
    tabs: {
      flowers: 'Flowers & Leaves',
      wrapper: 'Wrap & Ribbon',
      card: 'Gift Card',
    },
    actions: {
      autoArrange: 'Auto-Arrange',
      undo: 'Undo',
      redo: 'Redo',
      gallery: 'Gallery',
      shareExport: 'Share / PNG',
      saveGallery: 'Save to Gallery',
      savedToast: 'Bouquet saved to local gallery!',
      addFlower: 'Add to Bouquet',
      applySelected: 'Apply to Selected',
      duplicate: 'Duplicate',
      remove: 'Remove',
      clearAll: 'Clear',
      resetCamera: 'Reset View',
      remixBouquet: 'Remix / Edit Bouquet',
      copyLink: 'Copy Gift Link',
      copied: 'Link Copied!',
      downloadPng: 'Download Bouquet PNG',
      downloadPostcard: 'Download Postcard PNG',
      loadBouquet: 'Open',
      deleteSaved: 'Delete',
      close: 'Close',
    },
    labels: {
      species: 'Pick Flower / Foliage',
      categoryAll: 'All',
      categoryFocal: 'Focal',
      categoryAccent: 'Accent',
      categoryFoliage: 'Foliage',
      primaryColor: 'Primary Color',
      secondaryColor: 'Secondary / Pattern',
      petalMotif: 'Petal Motif',
      wrapperShape: 'Wrapper Shape',
      outerColor: 'Outer Paper',
      innerColor: 'Inner Lining',
      wrapperMotif: 'Paper Motif',
      motifColor: 'Motif Color',
      ribbonStyle: 'Ribbon Style',
      ribbonColor: 'Ribbon Color',
      tagText: 'Hanging Tag Text',
      bouquetName: 'Bouquet Name',
      cardTo: 'To',
      cardFrom: 'From',
      cardMessage: 'Gift Note Message',
      pixelDensity: 'Pixel Scale',
      chunky: 'Chunky',
      balanced: 'Cozy',
      fine: 'Crisp',
      inspectorTitle: 'Tune Stem',
      height: 'Height',
      depth: 'Depth',
      spin: 'Spin',
      scale: 'Scale',
      stemCount: 'stems',
      dragHint: 'Drag any flower in 3D • Drag background to orbit camera',
      dragPaletteHint: 'Hold & drag a flower onto the bouquet, or tap Add',
      dropOnBouquet: 'Drop on bouquet!',
      giftBadge: 'A Pixel Bouquet For You',
      starterPresets: 'Starter Bouquets',
      savedBouquets: 'Saved in Browser',
      noSavedYet: 'No saved bouquets yet. Click "Save to Gallery" to keep one here!',
      shareDescription: 'Share this interactive 3D bouquet via a static URL link, or download crisp pixel PNGs.',
      transparentBg: 'Transparent BG',
      studioBg: 'Warm Studio BG',
    },
  },
};
