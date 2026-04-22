const products = [
  {
    id: 1,
    name: "Koko Classic",
    price: "Rp 249.000",
    description: "Bahan adem dengan potongan clean untuk harian."
  },
  {
    id: 2,
    name: "Abaya Modern",
    price: "Rp 379.000",
    description: "Siluet flowy dengan detail minimal."
  },
  {
    id: 3,
    name: "Hijab Everyday",
    price: "Rp 89.000",
    description: "Ringan, mudah dibentuk, dan nyaman dipakai lama."
  }
];

function getAllProducts() {
  return products;
}

function getFeaturedProducts() {
  return products.slice(0, 2);
}

module.exports = {
  getAllProducts,
  getFeaturedProducts
};
