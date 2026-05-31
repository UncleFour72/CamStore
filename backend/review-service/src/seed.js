import { Review, ReviewImage, sequelize } from './models/index.js';

const reviews = [
  {
    user_id: 2,
    product_id: 1,
    order_id: 1,
    rating: 5,
    comment: 'May dong goi ky, ngoai hinh dep va autofocus dung nhu mo ta.',
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80',
    ],
  },
  {
    user_id: 3,
    product_id: 2,
    order_id: 2,
    rating: 5,
    comment: 'Canon R6 II chup su kien rat on, mau da dep va pin tot.',
    is_active: true,
    images: [],
  },
  {
    user_id: 4,
    product_id: 3,
    order_id: 3,
    rating: 4,
    comment: 'X-T5 gon nhe, mau phim dep. Shop tu van dung nhu nhu cau.',
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=500&q=80',
    ],
  },
  {
    user_id: 5,
    product_id: 4,
    order_id: 4,
    rating: 5,
    comment: 'Lens GM II net va nhe hon mong doi, hop chup cuoi.',
    is_active: true,
    images: [],
  },
  {
    user_id: 6,
    product_id: 5,
    order_id: 5,
    rating: 4,
    comment: 'Bokeh rat dep, hop may con moi. Gia cao nhung dang tien.',
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=500&q=80',
    ],
  },
  {
    user_id: 7,
    product_id: 6,
    order_id: 6,
    rating: 5,
    comment: 'DJI Air 3 bay on dinh, combo nhieu pin rat tien khi di du lich.',
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=500&q=80',
    ],
  },
  {
    user_id: 8,
    product_id: 7,
    order_id: 7,
    rating: 3,
    comment: 'Balo dep nhung khach doi size lon hon nen review de admin tham khao.',
    is_active: false,
    images: [],
  },
  {
    user_id: 9,
    product_id: 8,
    order_id: 8,
    rating: 5,
    comment: 'FX30 quay mau dep, gan rig nho gon va menu de lam quen.',
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=500&q=80',
    ],
  },
  {
    user_id: 10,
    product_id: 9,
    order_id: 9,
    rating: 4,
    comment: 'Den sang manh, app dieu khien tien. Can mua them softbox lon.',
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80',
    ],
  },
  {
    user_id: 11,
    product_id: 10,
    order_id: 10,
    rating: 4,
    comment: 'Micro thu tieng sach, hop phong van hai nguoi va vlog ngoai troi.',
    is_active: true,
    images: [
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=500&q=80',
    ],
  },
];

const seedReview = async (payload) => {
  const [review] = await Review.findOrCreate({
    where: {
      user_id: payload.user_id,
      product_id: payload.product_id,
      order_id: payload.order_id,
    },
    defaults: {
      user_id: payload.user_id,
      product_id: payload.product_id,
      order_id: payload.order_id,
      rating: payload.rating,
      comment: payload.comment,
      is_active: payload.is_active,
    },
  });

  await review.update({
    rating: payload.rating,
    comment: payload.comment,
    is_active: payload.is_active,
  });

  await ReviewImage.destroy({ where: { review_id: review.id } });

  if (payload.images.length > 0) {
    await ReviewImage.bulkCreate(
      payload.images.map((image_url) => ({
        review_id: review.id,
        image_url,
      }))
    );
  }
};

const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  for (const review of reviews) {
    await seedReview(review);
  }

  console.log(`Seeded ${reviews.length} reviews.`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
