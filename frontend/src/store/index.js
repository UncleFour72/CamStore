import { configureStore } from '@reduxjs/toolkit';
import addressReducer from './slices/addressSlice.js';
import authReducer from './slices/authSlice.js';
import cartReducer from './slices/cartSlice.js';
import orderReducer from './slices/orderSlice.js';
import productReducer from './slices/productSlice.js';
import reviewReducer from './slices/reviewSlice.js';
import wishlistReducer from './slices/wishlistSlice.js';

export const store = configureStore({
  reducer: {
    address: addressReducer,
    auth: authReducer,
    cart: cartReducer,
    order: orderReducer,
    product: productReducer,
    review: reviewReducer,
    wishlist: wishlistReducer,
  },
});

export default store;
