"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
export default function AdminLoginPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setLoading(true); setError(""); const fd = new FormData(e.currentTarget); try { await api.auth.login(String(fd.get("email")), String(fd.get("password"))); router.replace("/admin"); } catch { setError("Неверный email или пароль"); setLoading(false); } }
  return <main className="mx-auto min-h-[70vh] max-w-md px-8 py-20"><h1 className="text-5xl">Вход</h1><form onSubmit={submit} className="mt-10 space-y-4"><input name="email" type="email" required placeholder="Email" className="w-full border border-ink/20 bg-transparent px-4 py-3"/><input name="password" type="password" required placeholder="Пароль" className="w-full border border-ink/20 bg-transparent px-4 py-3"/>{error && <p className="text-accent">{error}</p>}<button disabled={loading} className="w-full bg-ink px-5 py-3 text-paper">{loading ? "Вход..." : "Войти"}</button></form></main>;
}
