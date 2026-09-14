import type { Metadata } from "next";
import { AdminClient } from "./admin-client";

export const metadata: Metadata = { title: "Admin | HackGrid", description: "HackGrid organiser controls." };

export default function AdminPage() {
  return <AdminClient />;
}
