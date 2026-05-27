export const assets = {
  heroCamera:
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1800&q=90',
  cameraDark:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuA4eap3wwM7GU3qn0eVRXkLojas-k0z-cENyN5FaSgKd293_biiuuvLTfu4O5c4bfi_8BgqhzA9VcGQEgJvYliN0g5VX_TFyLkn7htArqwMiGGrfmVtnYP4O4ZsI44CVGOwof-vAWyIyrLpUJreHBIVTbYrSzIrVxTgoqMMUzSouAXeQIZ9GopZKT5hhIGkZwspzLPVhGGQEgm0XfnQ2kIrImmx4VVwAoQSpxBd0IxMVskhEbo6_BD8RTBAo0izGwuvcl3euwBLYrxk',
  lensDark:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBFZg37Rxcp8Ai9_M2rHgXqTGUDgeJl0WO8lNj1R5q45nXXm-lJlmUOwxRYJcJYMqfqglkGk8TZRUdbbMje2sn_iOP9IVcWftAkMjWj16kT6qDuFuZauSB8hbNCdlX0PEOGlBV9Rd5nq3Kii8gOGVuXFKZdK7FQXhe8ekUP3sz7AAhYIZgHAkdKxDyTllfXeaYOouGaplaw7I9zZ9Yo6XYGhxc44dwXuL-JvuEBWKLv0F8zqoQXErxlmxLo_rzGWUGrcT0czZVepIbe',
  drone:
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=900&q=85',
  accessories:
    'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=900&q=85',
  photographerLandscape:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90',
  sensor:
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85',
  colorGrade:
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85',
  architecture:
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=85',
  studioLight:
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
  portraitField:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=85',
};

export const categories = [
  {
    id: 'camera',
    title: 'Máy ảnh',
    description: 'Mirrorless, DSLR và compact cao cấp.',
  },
  {
    id: 'lens',
    title: 'Ống kính',
    description: 'Prime, zoom và lens chuyên dụng.',
  },
  {
    id: 'accessory',
    title: 'Phụ kiện',
    description: 'Tripod, flash, filter, túi máy và thẻ nhớ.',
  },
];

export const homeCategories = [
  {
    id: 'camera',
    title: 'Máy ảnh Mirrorless',
    subtitle: 'Sắc mạnh công nghệ trong thân máy nhỏ gọn',
    image: assets.cameraDark,
  },
  {
    id: 'lens',
    title: 'Ống kính',
    subtitle: 'Độ nét, màu sắc và bokeh chuyên nghiệp',
    image: assets.lensDark,
  },
  {
    id: 'drone',
    title: 'Flycam',
    subtitle: 'Góc nhìn mới cho hành trình sáng tạo',
    image: assets.drone,
  },
  {
    id: 'accessory',
    title: 'Phụ kiện',
    subtitle: 'Hoàn thiện setup quay chụp của bạn',
    image: assets.accessories,
  },
];

export const products = [
  {
    id: 'sony-alpha-a7-iv',
    name: 'Sony Alpha A7 IV Body',
    detailName: 'Sony Alpha A7 IV',
    brand: 'Sony',
    category: 'camera',
    productType: 'Máy ảnh Mirrorless',
    condition: 'Mới 100%',
    badge: 'Hot',
    eyebrow: 'Sony Professional',
    tagline: 'Full-frame hybrid 33MP cho ảnh tĩnh và video 4K chuyên nghiệp.',
    description:
      'Định nghĩa lại chuẩn mực máy ảnh Full-frame. Với cảm biến 33MP Exmor R CMOS và bộ xử lý BIONZ XR, Sony A7 IV mang đến hiệu năng lấy nét cực nhanh và quay phim 4K 60p chuyên nghiệp.',
    price: 52990000,
    detailPrice: 59990000,
    oldPrice: 57990000,
    stock: 8,
    rating: 4.9,
    reviews: 128,
    image: assets.cameraDark,
    gallery: [
      assets.cameraDark,
      assets.lensDark,
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['Cảm biến', 'Full-frame CMOS (33MP)'],
      ['ISO', '100 - 51,200 (mở rộng 204,800)'],
      ['Lấy nét', '759 điểm Fast Hybrid AF'],
      ['Quay phim', '4K 60p, 10-bit 4:2:2'],
      ['Màn hình', 'LCD xoay lật 1.03 triệu điểm'],
    ],
  },
  {
    id: 'canon-eos-r6-mark-ii',
    name: 'Canon EOS R6 Mark II',
    brand: 'Canon',
    category: 'camera',
    productType: 'Máy ảnh Mirrorless',
    condition: 'Mới 100%',
    badge: 'New',
    eyebrow: 'Full-frame 24.2MP',
    tagline: 'Tracking chủ thể tin cậy, màu Canon giàu cảm xúc.',
    description:
      'EOS R6 Mark II phù hợp nhiếp ảnh cưới, sự kiện và video nhờ tốc độ chụp liên tiếp mạnh mẽ, chống rung tốt và hệ sinh thái RF linh hoạt.',
    price: 59500000,
    oldPrice: 62990000,
    stock: 5,
    rating: 4.7,
    reviews: 72,
    image:
      'https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=1200&q=85',
      assets.cameraDark,
    ],
    specs: [
      ['Cảm biến', 'Full-frame CMOS 24.2MP'],
      ['Lấy nét', 'Dual Pixel CMOS AF II'],
      ['Video', '4K 60p oversampled'],
      ['Chụp liên tiếp', 'Tối đa 40 fps'],
    ],
  },
  {
    id: 'fujifilm-x-t5-silver',
    name: 'Fujifilm X-T5 Silver',
    brand: 'Fujifilm',
    category: 'camera',
    productType: 'Máy ảnh Mirrorless',
    condition: 'Like New',
    badge: 'Film color',
    eyebrow: 'APS-C 40MP',
    tagline: 'Chất màu film đặc trưng trong thân máy retro hiện đại.',
    description:
      'Fujifilm X-T5 kết hợp cảm biến 40MP, chống rung 7 stop và hệ màu giả lập film cho người yêu nhiếp ảnh đường phố, du lịch và đời sống.',
    price: 43900000,
    oldPrice: 46900000,
    stock: 9,
    rating: 4.8,
    reviews: 64,
    image:
      'https://images.unsplash.com/photo-1500646953400-045056a916d7?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1500646953400-045056a916d7?auto=format&fit=crop&w=1200&q=85',
      assets.cameraDark,
    ],
    specs: [
      ['Cảm biến', 'APS-C X-Trans CMOS 5 HR 40MP'],
      ['ISO', '125 - 12,800'],
      ['Chống rung', 'IBIS 7 stop'],
      ['Video', '6.2K 30p'],
    ],
  },
  {
    id: 'sony-fe-24-70-f28-gm',
    name: 'Sony FE 24-70mm f/2.8 G...',
    fullName: 'Sony FE 24-70mm f/2.8 GM II',
    brand: 'Sony',
    category: 'lens',
    productType: 'Ống kính Zoom',
    condition: 'Mới 100%',
    badge: 'G Master',
    eyebrow: 'Professional Zoom',
    tagline: 'Dải tiêu cự làm việc hằng ngày với độ sắc nét đồng đều toàn khung.',
    description:
      'Lens zoom tiêu chuẩn cho hệ Sony E, phù hợp ảnh thương mại, du lịch, phóng sự và quay video với khẩu F2.8 xuyên suốt.',
    price: 49990000,
    oldPrice: 53990000,
    stock: 7,
    rating: 4.8,
    reviews: 58,
    image: assets.lensDark,
    gallery: [assets.lensDark, assets.cameraDark],
    specs: [
      ['Tiêu cự', '24-70mm'],
      ['Khẩu độ', 'F2.8'],
      ['Ngàm', 'Sony E'],
      ['Chống bụi ẩm', 'Có'],
    ],
  },
  {
    id: 'leica-m11-black-paint',
    name: 'Leica M11 Black Paint',
    brand: 'Leica',
    category: 'camera',
    productType: 'Máy ảnh Rangefinder',
    condition: 'Mới 100%',
    badge: 'Collector',
    eyebrow: 'Rangefinder 60MP',
    tagline: 'Tối giản, cơ khí tinh xảo và chất ảnh Leica cổ điển.',
    description:
      'Leica M11 Black Paint dành cho người yêu trải nghiệm rangefinder thuần khiết, cảm biến độ phân giải cao và thiết kế mang tính biểu tượng.',
    price: 215000000,
    oldPrice: 225000000,
    stock: 2,
    rating: 4.9,
    reviews: 31,
    image:
      'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=1200&q=85',
      assets.cameraDark,
    ],
    specs: [
      ['Cảm biến', 'Full-frame BSI CMOS 60MP'],
      ['Ngàm', 'Leica M'],
      ['Bộ nhớ', '64GB trong máy'],
      ['Kính ngắm', 'Optical rangefinder'],
    ],
  },
  {
    id: 'panasonic-lumix-s5-ii',
    name: 'Panasonic Lumix S5 II',
    brand: 'Panasonic',
    category: 'camera',
    productType: 'Máy ảnh Mirrorless',
    condition: 'Mới 100%',
    badge: 'Video',
    eyebrow: 'Full-frame Hybrid',
    tagline: 'Body full-frame gọn cho quay video, chống rung và vlog chuyên nghiệp.',
    description:
      'Lumix S5 II có phase hybrid AF, chống rung mạnh và bộ công cụ video rộng cho filmmaker độc lập.',
    price: 45000000,
    oldPrice: 48990000,
    stock: 6,
    rating: 4.7,
    reviews: 47,
    image:
      'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=1200&q=85',
      assets.cameraDark,
    ],
    specs: [
      ['Cảm biến', 'Full-frame CMOS 24MP'],
      ['Lấy nét', 'Phase Hybrid AF'],
      ['Video', '6K Open Gate'],
      ['Chống rung', 'Active I.S.'],
    ],
  },
  {
    id: 'sony-alpha-a7r-v',
    name: 'Sony Alpha A7R V',
    brand: 'Sony',
    category: 'camera',
    productType: 'Máy ảnh Mirrorless',
    condition: 'Mới 100%',
    badge: 'Hot',
    eyebrow: 'High Resolution',
    tagline: '61MP, AI autofocus và chi tiết vượt trội cho ảnh thương mại.',
    description: 'Sony A7R V dành cho nhiếp ảnh gia cần độ phân giải cao và workflow chuyên nghiệp.',
    price: 82990000,
    oldPrice: 89990000,
    stock: 4,
    rating: 4.9,
    reviews: 82,
    image:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
    gallery: [assets.cameraDark],
    specs: [
      ['Cảm biến', 'Full-frame 61MP'],
      ['Lấy nét', 'AI Real-time Recognition'],
      ['Video', '8K 24p'],
      ['Chống rung', '8 stop'],
    ],
  },
  {
    id: 'sony-fe-35mm-f14-gm',
    name: 'Sony FE 35mm f/1.4 GM',
    brand: 'Sony',
    category: 'lens',
    productType: 'Ống kính Prime',
    condition: 'Mới 100%',
    badge: 'Prime',
    eyebrow: 'Street Prime',
    tagline: 'Gọn, sắc và linh hoạt cho street, cưới, documentary.',
    description: 'Ống kính prime 35mm khẩu lớn với độ nét cao và bokeh mượt.',
    price: 34490000,
    oldPrice: 37990000,
    stock: 11,
    rating: 4.8,
    reviews: 53,
    image: assets.lensDark,
    gallery: [assets.lensDark],
    specs: [
      ['Tiêu cự', '35mm'],
      ['Khẩu độ', 'F1.4'],
      ['Ngàm', 'Sony E'],
      ['Trọng lượng', '524g'],
    ],
  },
  {
    id: 'sony-alpha-a6400',
    name: 'Sony Alpha A6400',
    brand: 'Sony',
    category: 'camera',
    productType: 'Máy ảnh Mirrorless',
    condition: 'Like New',
    badge: 'Compact',
    eyebrow: 'APS-C',
    tagline: 'Body nhỏ gọn cho du lịch, vlog và người mới nâng cấp.',
    description: 'Sony A6400 có autofocus nhanh, màn hình lật và chất ảnh APS-C đáng tin cậy.',
    price: 22490000,
    oldPrice: 24990000,
    stock: 14,
    rating: 4.6,
    reviews: 76,
    image:
      'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['Cảm biến', 'APS-C 24.2MP'],
      ['Lấy nét', '425 điểm phase detection'],
      ['Video', '4K 30p'],
      ['Màn hình', 'Lật 180 độ'],
    ],
  },
  {
    id: 'sony-hvl-f60rm2-flash',
    name: 'Sony HVL-F60RM2 Flash',
    brand: 'Sony',
    category: 'accessory',
    productType: 'Phụ kiện Studio',
    condition: 'Mới 100%',
    badge: 'Flash',
    eyebrow: 'Wireless Flash',
    tagline: 'Đèn flash mạnh cho sự kiện, chân dung và studio nhỏ.',
    description: 'Flash radio wireless, hồi pin nhanh và tương thích hệ Sony Alpha.',
    price: 12990000,
    oldPrice: 14990000,
    stock: 10,
    rating: 4.5,
    reviews: 29,
    image:
      'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?auto=format&fit=crop&w=1200&q=85',
    ],
    specs: [
      ['Guide number', '60'],
      ['Kết nối', 'Radio wireless'],
      ['Hồi pin', '1.7 giây'],
      ['Chống bụi ẩm', 'Có'],
    ],
  },
];

export const featuredProduct = products[0];

export const serviceCards = [
  {
    title: 'Tư vấn bộ máy',
    description: 'Gợi ý thân máy, lens và phụ kiện theo thể loại chụp thực tế.',
  },
  {
    title: 'Bảo hành chính hãng',
    description: 'Hỗ trợ kiểm tra serial, bảo hành và vệ sinh cảm biến định kỳ.',
  },
  {
    title: 'Giao nhanh an toàn',
    description: 'Đóng gói chống sốc, miễn phí vận chuyển cho đơn hàng cao cấp.',
  },
];

export const testimonials = [
  {
    name: 'Minh Nguyễn',
    role: 'Travel Photographer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    quote:
      'CamStore không chỉ bán máy ảnh, họ cung cấp giải pháp sáng tạo. Dịch vụ bảo hành và tư vấn ở đây thực sự đáng giá.',
  },
  {
    name: 'Linh Trần',
    role: 'Freelance Filmmaker',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    quote:
      'Tìm thấy Sony A7S IV tại CamStore với mức giá tốt nhất thị trường kèm quà tặng phụ kiện cực xịn.',
  },
  {
    name: 'Hải Đăng',
    role: 'Wedding Studio Owner',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    quote:
      'Hệ thống lens FE của Canon được tôi trang bị hoàn toàn từ CamStore. Sự chuyên nghiệp trong cách đóng gói và vận chuyển là điều tôi đánh giá cao nhất.',
  },
];

export const blogPosts = [
  {
    id: 'street-moment',
    category: 'Tiêu điểm',
    readTime: '8 phút đọc',
    title: 'Nghệ thuật bắt trọn khoảnh khắc trong nhiếp ảnh đường phố',
    excerpt:
      'Khám phá cách những nhiếp ảnh gia hàng đầu thế giới quan sát thế giới và ghi lại những câu chuyện vô hình giữa lòng đô thị ồn ào.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1300&q=88',
    author: 'Lê Quang',
    date: '12 Tháng 11, 2023',
  },
  {
    id: '85mm-review',
    category: 'Đánh giá',
    readTime: '8 phút đọc',
    title: 'Đánh giá chi tiết: Siêu phẩm ống kính 85mm f/1.2 mới nhất',
    excerpt:
      'Liệu đây có phải là chiếc ống kính chân dung tốt nhất từ trước đến nay? Chúng tôi đã dành 2 tuần trải nghiệm thực tế.',
    image: assets.lensDark,
    author: 'Minh Anh',
    date: '20 Tháng 10, 2023',
  },
  {
    id: 'simple-beauty',
    category: 'Cảm hứng',
    readTime: '5 phút đọc',
    title: 'Tìm kiếm vẻ đẹp trong những điều bình dị thường nhật',
    excerpt:
      'Nhiếp ảnh không chỉ là thiết bị, đó là cách bạn nhìn nhận thế giới. Những góc nhìn mới từ các khung cảnh quen thuộc.',
    image: assets.portraitField,
    author: 'Thanh Vũ',
    date: '08 Tháng 10, 2023',
  },
  {
    id: 'sensor-ai',
    category: 'Tin tức',
    readTime: '3 phút đọc',
    title: 'Xu hướng công nghệ cảm biến ảnh trong năm 2024',
    excerpt:
      'Tìm hiểu về những đột phá mới nhất trong công nghệ CMOS và AI được tích hợp trực tiếp vào phần cứng máy ảnh.',
    image: assets.studioLight,
    author: 'Quốc Huy',
    date: '03 Tháng 10, 2023',
  },
  {
    id: 'color-grade',
    category: 'Kinh nghiệm',
    readTime: '12 phút đọc',
    title: 'Làm chủ màu sắc: Quy trình Workflow hậu kỳ chuyên nghiệp',
    excerpt:
      'Từ việc cân bằng trắng đến grading màu sắc cuối cùng, chúng tôi chia sẻ các bước để có được một bức ảnh hoàn thiện.',
    image: assets.colorGrade,
    author: 'An Nhiên',
    date: '26 Tháng 09, 2023',
  },
  {
    id: 'architecture-depth',
    category: 'Kinh nghiệm',
    readTime: '7 phút đọc',
    title: 'Tư duy hình khối trong nhiếp ảnh kiến trúc hiện đại',
    excerpt:
      'Cách sử dụng đường dẫn và ánh sáng để tạo nên những bức ảnh kiến trúc có chiều sâu và sức hút mạnh mẽ.',
    image: assets.architecture,
    author: 'Phúc Long',
    date: '18 Tháng 09, 2023',
  },
];

export const mockOrders = [
  {
    id: 'CS-2408',
    date: '18/05/2026',
    status: 'Đang giao',
    total: 87980000,
    items: ['Sony Alpha A7 IV Body', 'Sony FE 24-70mm f/2.8 GM II'],
  },
  {
    id: 'CS-2391',
    date: '02/05/2026',
    status: 'Hoàn tất',
    total: 7290000,
    items: ['Peak Design Everyday Backpack'],
  },
];
