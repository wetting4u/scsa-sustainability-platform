import { redirect } from "next/navigation";

// Replace this redirect with the landing page when authentication is introduced.
export default function HomePage() {
  redirect("/overview");
}
