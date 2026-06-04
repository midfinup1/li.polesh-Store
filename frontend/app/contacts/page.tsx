import type { Metadata } from "next";
import { api } from "@/lib/api";
export const metadata: Metadata = { title: "Контакты" };
export const revalidate = 60;
export default async function ContactsPage() {
  const artist = await api.artist.get().catch(() => null);
  return <main className="mx-auto min-h-[70vh] max-w-3xl px-8 py-20"><h1 className="text-5xl">Контакты</h1><p className="mt-8 text-ink-light">По вопросам приобретения работ, выставок и сотрудничества.</p><div className="mt-12 space-y-4 text-lg">{artist?.email && <p><a className="hover:text-accent" href={`mailto:${artist.email}`}>{artist.email}</a></p>}{artist?.instagram && <p><a className="hover:text-accent" rel="noreferrer" target="_blank" href={artist.instagram.startsWith("http") ? artist.instagram : `https://instagram.com/${artist.instagram.replace("@", "")}`}>Instagram</a></p>}</div></main>;
}
