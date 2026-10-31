import { requireStaff } from '@/lib/auth';
import { route } from '@/lib/http';
import { searchProducts, toStaffProduct } from '@/lib/products';

// Search for the "change item" box. Selling prices only.
export const GET = route(async (req: Request) => {
  await requireStaff();
  const q = new URL(req.url).searchParams.get('q') || '';
  const rows = await searchProducts(q.slice(0, 100), 40);
  return { products: rows.map(toStaffProduct) };
});
