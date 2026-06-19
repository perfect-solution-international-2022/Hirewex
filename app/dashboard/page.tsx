// app/dashboard/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserDashboardClient from "./UserDashboardClient";

export const metadata = {
  title: "Buyer Dashboard — Hirewex",
};

export default async function UserDashboardPage() {
  const session = await auth();
  
  // Keep the same security logic as your freelancer page
  if (!session?.user?.id) redirect("/auth");

  // If you need to fetch DB stats for the buyer later (e.g., db.select().from(jobs)...)
  // you can do it here, just like you did for freelancerServices.
  
  return <UserDashboardClient />;
}