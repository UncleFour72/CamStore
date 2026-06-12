import { pathToFileURL } from 'url';
import { BlogPost, sequelize } from './models/index.js';

const posts = [
  {
    title: 'Huong dan chon may anh mirrorless dau tien',
    slug: 'huong-dan-chon-may-anh-mirrorless-dau-tien',
    excerpt:
      'Cac tieu chi quan trong khi bat dau mua may anh mirrorless: cam bien, lens, chong rung va ngan sach.',
    content:
      '<p>Mirrorless la lua chon linh hoat cho nguoi moi bat dau lan nguoi sang tao noi dung. Hay uu tien he lens, kha nang lay net, pin va nhu cau chup thuc te truoc khi chon than may.</p><p>Neu chup du lich, than may gon nhe va lens kit tot se quan trong hon thong so qua cao. Neu quay video, hay xem them chong rung va ho tro 4K.</p>',
    category: 'Huong dan',
    cover_image:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=85',
    author_id: 1,
    author_name: 'CamStore Admin',
    read_time: '5 phut doc',
    is_featured: true,
    is_published: true,
    published_at: new Date('2026-01-10T09:00:00+07:00'),
  },
  {
    title: 'So sanh lens prime va lens zoom cho chup chan dung',
    slug: 'so-sanh-lens-prime-va-lens-zoom-cho-chup-chan-dung',
    excerpt:
      'Prime cho khau do lon va bokeh dep, zoom linh hoat hon trong su kien. Dau la lua chon dung cho ban?',
    content:
      '<p>Lens prime thuong co khau do lon, do net cao va kich thuoc gon. Lens zoom lai thang ve toc do thao tac khi chup su kien, cuoi va phong su.</p><p>Neu ban chup chan dung co kiem soat anh sang, 50mm hoac 85mm prime la lua chon dang gia. Neu can di chuyen nhanh, 24-70mm F2.8 se an toan hon.</p>',
    category: 'Kien thuc lens',
    cover_image:
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=1400&q=85',
    author_id: 1,
    author_name: 'CamStore Admin',
    read_time: '6 phut doc',
    is_featured: false,
    is_published: true,
    published_at: new Date('2026-02-05T09:00:00+07:00'),
  },
  {
    title: 'Cach bao quan may anh trong mua am',
    slug: 'cach-bao-quan-may-anh-trong-mua-am',
    excerpt:
      'Do am cao co the gay nam moc lens va cam bien. Day la cac thoi quen bao quan nen co.',
    content:
      '<p>Do am ly tuong cho thiet bi anh thuong nam trong khoang 40% den 50%. Tu chong am, hat hut am va viec lau kho sau khi chup ngoai troi la nhung viec rat nen lam.</p><p>Khong nen cat may anh vao tui kin khi than may con am. Hay thao pin neu khong dung trong thoi gian dai.</p>',
    category: 'Bao quan',
    cover_image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85',
    author_id: 1,
    author_name: 'CamStore Admin',
    read_time: '4 phut doc',
    is_featured: false,
    is_published: true,
    published_at: new Date('2026-03-12T09:00:00+07:00'),
  },
  {
    title: 'Checklist set up studio chup san pham tai nha',
    slug: 'checklist-set-up-studio-chup-san-pham-tai-nha',
    excerpt:
      'Tu den, phong nen den tripod: nhung mon can co de chup san pham gon gang va dong nhat.',
    content:
      '<p>Một góc studio nhỏ có thể bắt đầu bằng bàn chắc, nền sạch, hai nguồn sáng mềm và tripod ổn định. Điều quan trọng là giữ ánh sáng, góc máy và màu nền nhất quán.</p><p>Khi chụp sản phẩm cho shop, hãy lưu preset màu và thông số đèn để những buổi chụp sau đồng bộ hơn.</p>',
    category: 'Studio',
    cover_image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85',
    author_id: 1,
    author_name: 'CamStore Admin',
    read_time: '7 phut doc',
    is_featured: true,
    is_published: true,
    published_at: new Date('2026-03-28T09:00:00+07:00'),
  },
  {
    title: 'Nhung loi thuong gap khi mua lens cu',
    slug: 'nhung-loi-thuong-gap-khi-mua-lens-cu',
    excerpt:
      'Kiem tra nam moc, vong zoom, autofocus va tinh trang coating truoc khi xuong tien mua lens da qua su dung.',
    content:
      '<p>Lens cũ có thể rất đáng tiền nếu được kiểm tra kỹ. Hãy soi dưới đèn để tìm nấm mốc, kiểm tra vòng focus, khẩu, ngàm và test autofocus ở nhiều khoảng cách.</p>',
    category: 'Kinh nghiem mua hang',
    cover_image:
      'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=1400&q=85',
    author_id: 1,
    author_name: 'CamStore Admin',
    read_time: '5 phut doc',
    is_featured: false,
    is_published: true,
    published_at: new Date('2026-04-02T09:00:00+07:00'),
  },
  {
    title: 'Khi nao nen nang cap tu APS-C len full-frame',
    slug: 'khi-nao-nen-nang-cap-tu-aps-c-len-full-frame',
    excerpt:
      'Full-frame khong phai luc nao cung can thiet. Hay xem nhu cau anh sang yeu, do sau truong anh va he lens.',
    content:
      '<p>Nâng cấp lên full-frame hợp lý khi bạn thường xuyên chụp thiếu sáng, cần dynamic range tốt hơn hoặc đã có nhu cầu lens chuyên nghiệp rõ ràng.</p><p>Nếu chủ yếu du lịch và mạng xã hội, APS-C tốt vẫn rất mạnh và tiết kiệm chi phí.</p>',
    category: 'Tu van',
    cover_image:
      'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1400&q=85',
    author_id: 1,
    author_name: 'CamStore Admin',
    read_time: '6 phut doc',
    is_featured: false,
    is_published: true,
    published_at: new Date('2026-04-10T09:00:00+07:00'),
  },
  {
    title: 'Goi y combo quay vlog gon nhe cho nguoi moi',
    slug: 'goi-y-combo-quay-vlog-gon-nhe-cho-nguoi-moi',
    excerpt:
      'Than may, lens, micro va den nho nao giup ban bat dau quay vlog ma khong qua cong kenh.',
    content:
      '<p>Một combo vlog dễ dùng gồm thân máy có màn lật, lens góc rộng, micro không dây và tripod mini. Đừng quên pin dự phòng và thẻ nhớ tốc độ cao.</p>',
    category: 'Video',
    cover_image:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=85',
    author_id: 1,
    author_name: 'CamStore Admin',
    read_time: '4 phut doc',
    is_featured: true,
    is_published: true,
    published_at: new Date('2026-04-18T09:00:00+07:00'),
  },
  {
    title: 'Cach chon the nho cho quay 4K',
    slug: 'cach-chon-the-nho-cho-quay-4k',
    excerpt:
      'Toc do ghi, dung luong va chuan V30/V60/V90 anh huong truc tiep den viec quay video on dinh.',
    content:
      '<p>Khi quay 4K, tốc độ ghi ổn định quan trọng hơn tốc độ đọc tối đa trên bao bì. Hãy xem chuẩn V30, V60 hoặc V90 theo bitrate máy yêu cầu.</p>',
    category: 'Phu kien',
    cover_image:
      'https://images.unsplash.com/photo-1601737487795-dab272f52420?auto=format&fit=crop&w=1400&q=85',
    author_id: 1,
    author_name: 'CamStore Admin',
    read_time: '4 phut doc',
    is_featured: false,
    is_published: true,
    published_at: new Date('2026-04-25T09:00:00+07:00'),
  },
  {
    title: 'Bao duong flycam truoc moi chuyen di',
    slug: 'bao-duong-flycam-truoc-moi-chuyen-di',
    excerpt:
      'Kiem tra canh quat, pin, firmware va khu vuc bay de han che rui ro khi tac nghiep.',
    content:
      '<p>Trước mỗi chuyến đi, hãy kiểm tra cánh quạt, pin phồng, gimbal, cảm biến tránh vật cản và cập nhật bản đồ vùng cấm bay. Mang thêm cánh dự phòng luôn là lựa chọn khôn ngoan.</p>',
    category: 'Flycam',
    cover_image:
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1400&q=85',
    author_id: 1,
    author_name: 'CamStore Admin',
    read_time: '5 phut doc',
    is_featured: false,
    is_published: false,
    published_at: null,
  },
  {
    title: 'Nhung phu kien nho nhung dang tien cho nhiep anh gia',
    slug: 'nhung-phu-kien-nho-nhung-dang-tien-cho-nhiep-anh-gia',
    excerpt:
      'Day deo tot, filter, kit ve sinh va hop the nho giup tac nghiep gon hon moi ngay.',
    content:
      '<p>Không phải phụ kiện nào cũng đắt mới hữu ích. Dây đeo tốt, filter bảo vệ, blower, khăn microfiber và hộp thẻ nhớ có thể cứu cả buổi chụp.</p>',
    category: 'Phu kien',
    cover_image:
      'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=1400&q=85',
    author_id: 1,
    author_name: 'CamStore Admin',
    read_time: '3 phut doc',
    is_featured: false,
    is_published: true,
    published_at: new Date('2026-05-05T09:00:00+07:00'),
  },
];

const seedPost = async (payload) => {
  const [post] = await BlogPost.findOrCreate({
    where: { slug: payload.slug },
    defaults: payload,
  });

  await post.update(payload);
};

export const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  for (const post of posts) {
    await seedPost(post);
  }

  console.log(`Seeded ${posts.length} blog posts.`);
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
