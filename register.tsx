import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { UserPlus, Users, Gamepad2, Clock } from "lucide-react";
import { pb } from "../lib/pocketbase-client";

export default function RegisterRoute() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<"player" | "organizer">("player");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [gamertag, setGamertag] = useState("");
  const [mainGame, setMainGame] = useState("");

  const [communityName, setCommunityName] = useState("");
  const [communityBio, setCommunityBio] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingApprovalNotice, setPendingApprovalNotice] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== passwordConfirm) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        email: email.trim(),
        password,
        passwordConfirm,
        name: name.trim() || (accountType === "organizer" ? communityName.trim() : gamertag.trim()),
        role: accountType,
      };

      if (accountType === "player") {
        payload.gamertag = gamertag.trim();
        payload.main_game = mainGame.trim();
        payload.community_status = "none";
      } else {
        payload.community_name = communityName.trim();
        payload.community_bio = communityBio.trim();
        payload.community_status = "pending";
        payload.community_verified = false;
      }

      await pb.collection("users").create(payload);
      await pb.collection("users").authWithPassword(email.trim(), password);

      if (accountType === "organizer") {
        setPendingApprovalNotice(true);
      } else {
        navigate("/panel");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "No se pudo completar el registro.");
    } finally {
      setLoading(false);
    }
  }

  if (pendingApprovalNotice) {
    return (
      <div className="min-h-screen bg-[#070816] px-4 py-12 text-white flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#0c0e26] p-7 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <h1 className="text-xl font-extrabold">Solicitud de Comunidad Enviada</h1>
          <p className="mt-2 text-sm text-slate-300">
            Tu cuenta de comunidad <span className="font-bold text-white">{communityName}</span>{" "}
            está en revisión. Un <span className="text-violet-400 font-semibold">Administrador</span>{" "}
            debe aprobarla antes de que puedas publicar torneos.
          </p>
          <button
            onClick={() => navigate("/panel")}
            className="mt-6 w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-violet-500 transition"
          >
            Ir a mi Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070816] px-4 py-10 text-white flex items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c0e26] p-7 shadow-2xl">
        <div className="mb-6 text-center">
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-violet-400">
            Raven Corp CR
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold">Crear Cuenta</h1>
          <p className="mt-1 text-xs text-slate-400">
            Los jugadores entran al instante; las comunidades pasan por aprobación del Admin.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType("player")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-wider transition ${
              accountType === "player"
                ? "border-violet-500 bg-violet-600/20 text-white"
                : "border-white/10 bg-[#070816] text-slate-400 hover:border-white/25"
            }`}
          >
            <Gamepad2 className="h-4 w-4 text-violet-400" />
            <span>Jugador</span>
          </button>

          <button
            type="button"
            onClick={() => setAccountType("organizer")}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold uppercase tracking-wider transition ${
              accountType === "organizer"
                ? "border-violet-500 bg-violet-600/20 text-white"
                : "border-white/10 bg-[#070816] text-slate-400 hover:border-white/25"
            }`}
          >
            <Users className="h-4 w-4 text-violet-400" />
            <span>Comunidad</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre / Encargado
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {accountType === "player" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gamertag / Nick en juego
                </label>
                <input
                  type="text"
                  required
                  value={gamertag}
                  onChange={(e) => setGamertag(e.target.value)}
                  placeholder="Ej. RavenPlayerCR"
                  className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Juego principal
                </label>
                <input
                  type="text"
                  required
                  value={mainGame}
                  onChange={(e) => setMainGame(e.target.value)}
                  placeholder="Ej. Apex Legends"
                  className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre de la Comunidad
                </label>
                <input
                  type="text"
                  required
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="Ej. Battle Royale CR"
                  className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descripción de la Comunidad
                </label>
                <textarea
                  rows={2}
                  required
                  value={communityBio}
                  onChange={(e) => setCommunityBio(e.target.value)}
                  placeholder="Juegos que organizan, región, modalidad y experiencia..."
                  className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white hover:bg-violet-500 disabled:opacity-50 transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>
              {loading
                ? "Registrando..."
                : accountType === "organizer"
                ? "Enviar Solicitud de Comunidad"
                : "Registrarme como Jugador"}
            </span>
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-4 text-center text-xs text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-violet-400 hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
