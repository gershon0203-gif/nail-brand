import type { Category, ProductWithDetails } from '@/types';

/**
 * Deterministic, in-memory catalogue used ONLY when VITE_DEMO_MODE=true.
 * This is a visual preview aid. It performs no persistence and is never used
 * for auth, cart, addresses, orders or uploads. See SETUP_GUIDE.md.
 */

const now = new Date('2026-01-01T09:00:00Z').getTime();

const categorySeed: Array<{ name: string; slug: string; description: string; nouns: string[] }> = [
  {
    name: 'Kitchen & Dining', slug: 'kitchen-dining',
    description: 'Considered essentials for the everyday table.',
    nouns: ['Stoneware Mug', 'Oak Serving Board', 'Linen Tea Towel', 'Ceramic Bowl', 'Copper Saucepan', 'Glass Carafe'],
  },
  {
    name: 'Home Decor', slug: 'home-decor',
    description: 'Quiet pieces that make a room feel like yours.',
    nouns: ['Linen Cushion', 'Ceramic Vase', 'Woven Throw', 'Wall Mirror', 'Soy Candle', 'Marble Tray'],
  },
  {
    name: 'Personal Care', slug: 'personal-care',
    description: 'Simple rituals, thoughtfully made.',
    nouns: ['Botanical Soap', 'Shea Hand Balm', 'Argan Hair Oil', 'Bamboo Brush', 'Bath Salts', 'Face Cloth'],
  },
  {
    name: 'Apparel', slug: 'apparel',
    description: 'Easy layers in natural fibres.',
    nouns: ['Cotton Tee', 'Linen Shirt', 'Wool Cardigan', 'Everyday Tote', 'Cotton Scarf', 'Relaxed Trouser'],
  },
  {
    name: 'Accessories', slug: 'accessories',
    description: 'The small details that finish the look.',
    nouns: ['Leather Wallet', 'Canvas Belt', 'Silver Pendant', 'Wool Beanie', 'Sunglasses Case', 'Key Ring'],
  },
  {
    name: 'Stationery', slug: 'stationery',
    description: 'Paper goods worth writing on.',
    nouns: ['Hardcover Notebook', 'Brass Pen', 'Letter Set', 'Desk Planner', 'Bookmark Set', 'Gift Tags'],
  },
  {
    name: 'Wellness', slug: 'wellness',
    description: 'Small habits for a calmer day.',
    nouns: ['Herbal Tea Blend', 'Weighted Eye Pillow', 'Diffuser Stones', 'Yoga Mat Strap', 'Journal Kit', 'Rescue Balm'],
  },
  {
    name: 'Outdoor', slug: 'outdoor',
    description: 'Made for slow mornings and long evenings.',
    nouns: ['Canvas Picnic Rug', 'Enamel Mug', 'Trail Flask', 'Foldable Stool', 'Garden Gloves', 'Patio Lantern'],
  },
];

const descriptors = ['Classic', 'Everyday', 'Heritage', 'Studio', 'Natural', 'Signature'];
const finish = ['Sand', 'Olive', 'Ash', 'Clay', 'Charcoal', 'Cream', 'Walnut', 'Slate'];

function seeded(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export const demoCategories: Category[] = categorySeed.map((c, i) => ({
  id: `demo-cat-${i + 1}`,
  name: c.name,
  slug: c.slug,
  description: c.description,
  image_path: `/images/demo/${c.slug}.svg`,
  is_active: true,
  sort_order: i + 1,
  created_at: new Date(now - i * 86400000).toISOString(),
  updated_at: new Date(now - i * 86400000).toISOString(),
}));

export const demoProducts: ProductWithDetails[] = categorySeed.flatMap((cat, ci) =>
  Array.from({ length: 25 }, (_, j) => {
    const n = ci * 25 + j;
    const r1 = seeded(n + 1);
    const r2 = seeded(n + 2);
    const r3 = seeded(n + 3);
    const price = Math.round((12 + r1 * 180) * 100) / 100;
    const discountPercent = r2 > 0.68 ? [10, 15, 20, 25][n % 4] : 0;
    const stock = r3 < 0.07 ? 0 : Math.floor(2 + r3 * 60);
    const name = `${descriptors[n % descriptors.length]} ${cat.nouns[j % cat.nouns.length]} — ${finish[n % finish.length]}`;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${n + 1}`;
    const image = `/images/demo/${cat.slug}.svg`;
    return {
      id: `demo-prod-${n + 1}`,
      name,
      slug,
      short_description: `${cat.description} Available in ${finish[n % finish.length].toLowerCase()} finish.`,
      description: `The ${name} is part of our ${cat.name.toLowerCase()} collection. Made with honest materials and finished by hand, it is designed to be used every day and to grow more beautiful with time. Care instructions and full details are available by contacting our team.`,
      sku: `NW-${String(1000 + n)}`,
      category_id: demoCategories[ci].id,
      price,
      discount_percent: discountPercent,
      stock_quantity: stock,
      is_featured: n % 9 === 0 || n % 13 === 0,
      is_archived: false,
      is_active: true,
      created_at: new Date(now - n * 3600000).toISOString(),
      updated_at: new Date(now - n * 3600000).toISOString(),
      sold_count: Math.floor(seeded(n + 9) * 40),
      category: demoCategories[ci],
      images: [
        { id: `demo-img-${n}-1`, product_id: `demo-prod-${n + 1}`, path: image, alt_text: name, sort_order: 0 },
        { id: `demo-img-${n}-2`, product_id: `demo-prod-${n + 1}`, path: '/images/demo/detail-one.svg', alt_text: `${name} — detail`, sort_order: 1 },
        { id: `demo-img-${n}-3`, product_id: `demo-prod-${n + 1}`, path: '/images/demo/detail-two.svg', alt_text: `${name} — lifestyle`, sort_order: 2 },
      ],
    };
  }),
);

export function demoProductById(idOrSlug: string): ProductWithDetails | undefined {
  return demoProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}
