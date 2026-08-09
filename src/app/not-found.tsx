import type { Metadata } from "next";
import { NotFoundClient } from "./_components/NotFoundClient";

export const metadata: Metadata = {
  title: "VenaaRauhassa - 404",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundClient />;
}
