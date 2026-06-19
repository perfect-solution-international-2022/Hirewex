import { db } from "@/lib/db";
import { categories } from "@/drizzle/schema";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { CategoryManager } from "./CategoryManager";

export const metadata = {
  title: "Manage Categories — Admin",
};

export default async function AdminCategoriesPage() {
  // Fetch all categories from MySQL
  const allCategories = await db.select().from(categories);

  return (
    <DashboardShell title="Categories" role="admin">
      <div className="mx-auto w-full max-w-5xl">
        <CategoryManager initialCategories={allCategories} />
      </div>
    </DashboardShell>
  );
}