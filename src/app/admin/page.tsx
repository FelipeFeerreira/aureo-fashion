import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  ADMIN_COOKIE,
  getAdminSession,
  adminConfigured,
} from "@/lib/admin/auth";
import { AdminLogin } from "@/components/admin/access";
import { FashionAdmin, type EditableProduct } from "@/components/fashion/admin";
import { categories, settings, fashionInclude } from "@/lib/fashion/catalog";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Espaço da marca",
  robots: { index: false, follow: false },
};
export default async function Admin() {
  if (!(await getAdminSession((await cookies()).get(ADMIN_COOKIE)?.value)))
    return (
      <div className="section">
        <AdminLogin configured={adminConfigured()} />
      </div>
    );
  const [products, cats, brand, orders, count, revenue, customers] =
    await Promise.all([
      db.product.findMany({
        where: { categoryId: { not: null } },
        include: fashionInclude,
        orderBy: { createdAt: "desc" },
      }),
      categories(),
      settings(),
      db.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.order.count(),
      db.order.aggregate({
        where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
        _sum: { totalCents: true },
      }),
      db.order.findMany({
        where: { email: { not: null } },
        distinct: ["email"],
        select: { email: true },
      }),
    ]);
  return (
    <FashionAdmin
      products={products.map((p) => ({
        ...p,
        categoryId: p.categoryId!,
        saleStartsAt: p.saleStartsAt?.toISOString() ?? null,
        saleEndsAt: p.saleEndsAt?.toISOString() ?? null,
        sizeChart: p.sizeChart as EditableProduct["sizeChart"],
      }))}
      categories={cats}
      settings={brand}
      orders={orders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
      }))}
      metrics={{
        orders: count,
        revenue: revenue._sum.totalCents ?? 0,
        customers: customers.length,
      }}
    />
  );
}
