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

export const homeCategories = [
  {
    id: 'camera',
    title: 'Máy ảnh Mirrorless',
    subtitle: 'Sức mạnh công nghệ trong thân máy nhỏ gọn',
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

export const storefrontCategories = [
  {
    id: 'camera',
    label: 'Máy ảnh',
    title: 'Máy ảnh',
    subtitle: 'Mirrorless, DSLR và compact cao cấp',
    image: assets.cameraDark,
  },
  {
    id: 'lens',
    label: 'Ống kính',
    title: 'Ống kính',
    subtitle: 'Prime, zoom và lens chuyên dụng',
    image: assets.lensDark,
  },
  {
    id: 'drone',
    label: 'Flycam',
    title: 'Flycam',
    subtitle: 'Góc nhìn mới cho hành trình sáng tạo',
    image: assets.drone,
  },
  {
    id: 'accessory',
    label: 'Phụ kiện',
    title: 'Phụ kiện',
    subtitle: 'Hoàn thiện setup quay chụp của bạn',
    image: assets.accessories,
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
      'Tôi tìm được bộ máy quay phù hợp với mức giá tốt, kèm tư vấn rất kỹ về lens và phụ kiện đi cùng.',
  },
  {
    name: 'Hải Đăng',
    role: 'Wedding Studio Owner',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    quote:
      'Sự chuyên nghiệp trong cách đóng gói, giao hàng và hỗ trợ sau bán là điều khiến studio của tôi quay lại nhiều lần.',
  },
];
