import { query } from './db';
import { PRODUCTS_SERVICES_CATEGORIES } from './productsServicesData';

export async function seedProductsServices(siteId: number, eventId: number): Promise<number> {
  const values: unknown[] = [];
  const chunks: string[] = [];
  let i = 1;

  for (const cat of PRODUCTS_SERVICES_CATEGORIES) {
    for (const sub of cat.subcategories) {
      for (const item of sub.items) {
        chunks.push(`($${i},$${i+1},$${i+2},$${i+3},$${i+4},'inactive')`);
        values.push(siteId, eventId, cat.label, sub.name, item.name);
        i += 5;
      }
    }
  }

  if (chunks.length === 0) return 0;

  const { rowCount } = await query(
    `INSERT INTO products_services (site_id, event_id, category, subcategory, name, status)
     VALUES ${chunks.join(',')}
     ON CONFLICT (site_id, event_id, category, subcategory, name) DO NOTHING`,
    values,
  );

  return rowCount ?? 0;
}
