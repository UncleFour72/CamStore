import { mockOrders, products } from '../data/catalog.js';

export async function getProducts() {
  return products;
}

export async function getProductById(productId) {
  return products.find((product) => product.id === productId);
}

export async function getOrders() {
  return mockOrders;
}
