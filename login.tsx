import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { LogIn, ShieldCheck } from "lucide-react";
import { pb } from "../lib/pocketbase-client";

export default function LoginRoute() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await pb.collection("users").authWithPassword(email.trim(), password);
      navigate("/panel");
    } catch (err: any) {
      setErrorMsg(
        err?.message || "No se pudo iniciar sesión. Verifica tu correo y contraseña."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070816] px-4 py-12 text-white flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0e26] p-7 shadow-2xl">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-violet-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Raven Corp CR</span>
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold">Iniciar Sesión</h1>
          <p className="mt-1 text-xs text-slate-400">
            Accede como Jugador, Comunidad aprobada o Administrador
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jugador@correo.com"
              className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-violet-500 disabled:opacity-50 transition"
          >
            <LogIn className="h-4 w-4" />
            <span>{loading ? "Entrando..." : "Entrar"}</span>
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-slate-400">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-semibold text-violet-400 hover:underline">
            Regístrate como Jugador o solicita Comunidad
          </Link>
        </div>
      </div>
    </div>
  );
}
