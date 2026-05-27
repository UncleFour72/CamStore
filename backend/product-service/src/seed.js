import { pathToFileURL } from 'url';
import { Category, Product, ProductImage, ProductSpec, sequelize } from './models/index.js';

const categories = [
  {
    name: 'May anh',
    slug: 'camera',
    description: 'Mirrorless, DSLR va compact cao cap.',
    image_url:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'Ong kinh',
    slug: 'lens',
    description: 'Prime, zoom va lens chuyen dung cho nhiep anh va video.',
    image_url:
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'Flycam',
    slug: 'drone',
    description: 'Thiet bi bay quay chup cho goc nhin sang tao.',
    image_url:
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'Phu kien',
    slug: 'accessory',
    description: 'Tripod, flash, filter, tui may va the nho.',
    image_url:
      'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'May quay',
    slug: 'video-camera',
    description: 'May quay cinema, camcorder va thiet bi quay vlog.',
    image_url:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'Anh sang',
    slug: 'lighting',
    description: 'Den LED, softbox va phu kien setup anh sang studio.',
    image_url:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'Am thanh',
    slug: 'audio',
    description: 'Micro, recorder va thiet bi thu am cho video.',
    image_url:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'Tripod va Gimbal',
    slug: 'tripod-gimbal',
    description: 'Chan may, gimbal chong rung va rig tac nghiep.',
    image_url:
      'https://images.unsplash.com/photo-1519183071298-a2962be96f83?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'Luu tru',
    slug: 'storage',
    description: 'The nho, SSD va dau doc toc do cao.',
    image_url:
      'https://images.unsplash.com/photo-1601737487795-dab272f52420?auto=format&fit=crop&w=1200&q=85',
  },
  {
    name: 'May in anh',
    slug: 'photo-printer',
    description: 'May in anh mini, may in studio va giay in chuyen dung.',
    image_url:
      'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1200&q=85',
  },
];

const products = [
  {
    category_slug: 'camera',
    name: 'Sony Alpha A7 IV Body',
    slug: 'sony-alpha-a7-iv-body',
    brand: 'Sony',
    sku: 'SONY-A7IV-BODY',
    price: 52990000,
    original_price: 57990000,
    stock_quantity: 8,
    condition: 'New 100%',
    badge: 'Hot',
    short_description: 'Full-frame hybrid 33MP cho anh tinh va video 4K chuyen nghiep.',
    description:
      'Sony A7 IV ket hop cam bien full-frame 33MP, autofocus nhanh va kha nang quay phim 4K.',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['Loai may', 'Mirrorless full-frame'],
      ['Cam bien', 'Full-frame Exmor R CMOS 33MP'],
      ['Bo xu ly', 'BIONZ XR'],
      ['Lay net', '759 diem phase-detection, Real-time Eye AF'],
      ['Quay phim', '4K 60p 10-bit 4:2:2'],
      ['Chong rung', 'IBIS 5 truc'],
    ],
  },
  {
    category_slug: 'camera',
    name: 'Canon EOS R6 Mark II',
    slug: 'canon-eos-r6-mark-ii',
    brand: 'Canon',
    sku: 'CANON-R6M2-BODY',
    price: 59500000,
    original_price: 62990000,
    stock_quantity: 5,
    condition: 'New 100%',
    badge: 'New',
    short_description: 'Full-frame 24.2MP, tracking chu the tot va mau Canon dac trung.',
    description:
      'Canon EOS R6 Mark II phu hop chup cuoi, su kien va video nho toc do cao.',
    images: [
      'https://images.unsplash.com/photo-1500634245200-e5245c7574ef?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['Loai may', 'Mirrorless full-frame'],
      ['Cam bien', 'Full-frame CMOS 24.2MP'],
      ['Bo xu ly', 'DIGIC X'],
      ['Lay net', 'Dual Pixel CMOS AF II'],
      ['Toc do chup', '40 fps electronic'],
      ['Quay phim', '4K 60p oversampled tu 6K'],
    ],
  },
  {
    category_slug: 'camera',
    name: 'Fujifilm X-T5 Kit 18-55mm',
    slug: 'fujifilm-x-t5-kit-18-55mm',
    brand: 'Fujifilm',
    sku: 'FUJI-XT5-1855',
    price: 42990000,
    original_price: 45990000,
    stock_quantity: 7,
    condition: 'New 100%',
    badge: 'Popular',
    short_description: 'APS-C 40MP voi mau phim Fuji va than may gon nhe.',
    description:
      'Fujifilm X-T5 la lua chon gon nhe cho street, travel va portrait.',
    images: [
      'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['Loai may', 'Mirrorless APS-C'],
      ['Cam bien', 'X-Trans CMOS 5 HR 40.2MP'],
      ['Bo xu ly', 'X-Processor 5'],
      ['Chong rung', 'IBIS toi 7 stop'],
      ['Quay phim', '6.2K 30p 10-bit'],
      ['Trong luong', 'Khoang 557g kem pin va the'],
    ],
  },
  {
    category_slug: 'lens',
    name: 'Sony FE 24-70mm F2.8 GM II',
    slug: 'sony-fe-24-70mm-f28-gm-ii',
    brand: 'Sony',
    sku: 'SONY-2470GM2',
    price: 48990000,
    original_price: 51990000,
    stock_quantity: 4,
    condition: 'New 100%',
    badge: 'Pro',
    short_description: 'Zoom tieu cu chuan cho studio, cuoi va su kien.',
    description:
      'Sony FE 24-70mm F2.8 GM II co do net cao, lay net nhanh va trong luong nhe.',
    images: [
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['Loai lens', 'Zoom tieu cu chuan'],
      ['Tieu cu', '24-70mm'],
      ['Khau do toi da', 'F2.8'],
      ['Ngam', 'Sony E full-frame'],
      ['La khau', '11 la tron'],
      ['Trong luong', 'Khoang 695g'],
    ],
  },
  {
    category_slug: 'lens',
    name: 'Canon RF 50mm F1.2L USM',
    slug: 'canon-rf-50mm-f12l-usm',
    brand: 'Canon',
    sku: 'CANON-RF50F12',
    price: 54990000,
    original_price: 57990000,
    stock_quantity: 3,
    condition: 'New 100%',
    badge: 'Portrait',
    short_description: 'Lens portrait cao cap voi bokeh mem va do net lon.',
    description:
      'Canon RF 50mm F1.2L USM danh cho portrait, wedding va anh san pham.',
    images: [
      'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['Loai lens', 'Prime portrait cao cap'],
      ['Tieu cu', '50mm'],
      ['Khau do toi da', 'F1.2'],
      ['Ngam', 'Canon RF full-frame'],
      ['Motor lay net', 'Ring-type USM'],
      ['Trong luong', 'Khoang 950g'],
    ],
  },
  {
    category_slug: 'drone',
    name: 'DJI Air 3 Fly More Combo',
    slug: 'dji-air-3-fly-more-combo',
    brand: 'DJI',
    sku: 'DJI-AIR3-FMC',
    price: 32990000,
    original_price: 34990000,
    stock_quantity: 6,
    condition: 'New 100%',
    badge: 'Travel',
    short_description: 'Flycam camera kep, thoi luong bay dai va tranh vat can da huong.',
    description:
      'DJI Air 3 la bo flycam linh hoat cho travel creator voi camera kep wide/tele.',
    images: [
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['He camera', 'Camera kep wide va medium tele'],
      ['Cam bien', '2 cam bien CMOS 1/1.3 inch'],
      ['Video', '4K 100fps, D-Log M 10-bit'],
      ['Gimbal', '3 truc co hoc'],
      ['Thoi luong bay', 'Toi 46 phut'],
      ['Trong luong', 'Khoang 720g'],
    ],
  },
  {
    category_slug: 'accessory',
    name: 'Peak Design Everyday Backpack 20L',
    slug: 'peak-design-everyday-backpack-20l',
    brand: 'Peak Design',
    sku: 'PD-EDB-20L',
    price: 6890000,
    original_price: 7290000,
    stock_quantity: 12,
    condition: 'New 100%',
    badge: 'Accessory',
    short_description: 'Balo may anh 20L chong nuoc, chia ngan linh hoat.',
    description:
      'Peak Design Everyday Backpack 20L phu hop di lam, di chup va du lich.',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['Dung tich', '20L'],
      ['Chat lieu ngoai', '400D nylon tai che'],
      ['Ngan laptop', 'Toi 15 inch'],
      ['Vach ngan', 'FlexFold tuy bien'],
      ['Chong thoi tiet', 'Vai phu chong mua nhe'],
      ['Bao hanh', 'Theo chinh sach hang'],
    ],
  },
  {
    category_slug: 'video-camera',
    name: 'Sony FX30 Cinema Line',
    slug: 'sony-fx30-cinema-line',
    brand: 'Sony',
    sku: 'SONY-FX30-BODY',
    price: 43990000,
    original_price: 46990000,
    stock_quantity: 5,
    condition: 'New 100%',
    badge: 'Cinema',
    short_description: 'May quay cinema APS-C gon nhe cho nha lam phim doc lap.',
    description:
      'Sony FX30 mang lai mau S-Cinetone, quay 4K 120p va than may toi uu cho rig video.',
    images: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['Loai may', 'Cinema camera APS-C/Super 35'],
      ['Cam bien', 'Exmor R CMOS 26MP'],
      ['Ngam', 'Sony E'],
      ['Video', '4K 120p 10-bit 4:2:2'],
      ['Profile mau', 'S-Cinetone, S-Log3'],
      ['Tan nhiet', 'Quat lam mat chu dong'],
    ],
  },
  {
    category_slug: 'lighting',
    name: 'Aputure Amaran 200x S',
    slug: 'aputure-amaran-200x-s',
    brand: 'Aputure',
    sku: 'APUTURE-200XS',
    price: 8990000,
    original_price: 9490000,
    stock_quantity: 10,
    condition: 'New 100%',
    badge: 'Studio',
    short_description: 'Den LED bi-color cong suat cao cho studio va quay phim.',
    description:
      'Amaran 200x S co CRI cao, nhiet mau linh hoat va dieu khien qua app.',
    images: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['Loai den', 'LED COB bi-color'],
      ['Cong suat', '200W'],
      ['Nhiet mau', '2700K - 6500K'],
      ['CRI/TLCI', '95+'],
      ['Ngam phu kien', 'Bowens mount'],
      ['Trong luong', 'Khoang 3.1kg'],
    ],
  },
  {
    category_slug: 'audio',
    name: 'Rode Wireless PRO',
    slug: 'rode-wireless-pro',
    brand: 'Rode',
    sku: 'RODE-WLPRO',
    price: 9990000,
    original_price: 10990000,
    stock_quantity: 9,
    condition: 'New 100%',
    badge: 'Creator',
    short_description: 'Bo micro khong day hai nguoi voi ghi am 32-bit float.',
    description:
      'Rode Wireless PRO phu hop phong van, vlog va san xuat noi dung.',
    images: [
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['He thong', 'Micro khong day 2.4GHz digital'],
      ['Bo phat', '2 transmitters kem micro tich hop'],
      ['Tam hoat dong', 'Toi 260m trong dieu kien ly tuong'],
      ['Ghi am noi bo', '32-bit float'],
      ['Thoi luong pin', 'Toi 7 gio moi thiet bi'],
      ['Hop sac', 'Sac va bao quan ca bo kit'],
    ],
  },
];

const upsertCategory = async (category) => {
  const [record] = await Category.findOrCreate({
    where: { slug: category.slug },
    defaults: category,
  });

  await record.update(category);
  return record;
};

const seedProduct = async (item, categoryMap) => {
  const category = categoryMap.get(item.category_slug);

  if (!category) {
    throw new Error(`Missing category for ${item.slug}`);
  }

  const payload = {
    name: item.name,
    slug: item.slug,
    description: item.description,
    short_description: item.short_description,
    brand: item.brand,
    sku: item.sku,
    price: item.price,
    original_price: item.original_price,
    stock_quantity: item.stock_quantity,
    category_id: category.id,
    condition: item.condition,
    badge: item.badge,
    is_active: true,
  };

  const [product] = await Product.findOrCreate({
    where: { slug: item.slug },
    defaults: payload,
  });

  await product.update(payload);
  await ProductImage.destroy({ where: { product_id: product.id } });
  await ProductSpec.destroy({ where: { product_id: product.id } });

  await ProductImage.bulkCreate(
    item.images.map((image_url, index) => ({
      product_id: product.id,
      image_url,
      sort_order: index,
      is_primary: index === 0,
    }))
  );

  await ProductSpec.bulkCreate(
    item.specs.map(([spec_name, spec_value], index) => ({
      product_id: product.id,
      spec_name,
      spec_value,
      sort_order: index,
    }))
  );
};

export const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  const categoryMap = new Map();

  for (const category of categories) {
    const record = await upsertCategory(category);
    categoryMap.set(category.slug, record);
  }

  for (const product of products) {
    await seedProduct(product, categoryMap);
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
};

const isMainModule = () =>
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule()) {
  run()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await sequelize.close();
    });
}
