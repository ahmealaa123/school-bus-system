import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login"); // أو "/admin/dashboard" لو عايز يروح مباشرة للداشبورد
}