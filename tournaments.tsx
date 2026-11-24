import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Trophy, Calendar, Users, Tv, Search, CheckCircle2, LogIn } from "lucide-react";
import { pb } from "../lib/pocketbase-client";

interface TournamentRecord {
  id: string;
  title: string;
  game: string;
  format: string;
  start_date: string;
  prize_pool?: string;
  max_slots?: number;
  stream_url?: string;
  description?: string;
  status: "upcoming" | "registration_open" | "live" | "finished";
  show_on_tournaments_page?: boolean;
  expand?: {
    organizer?: {
      id: string;
      name?: string;
      community_name?: string;
    };
  };
}

export default function TournamentsRoute() {
  const authRecord = pb.authStore.isValid ? pb.authStore.record : null;

  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [myRegisteredIds, setMyRegisteredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGame, setSelectedGame] = useState("ALL");

  const [registeringTournament, setRegisteringTournament] = useState<TournamentRecord | null>(null);
  const [gamertag, setGamertag] = useState(authRecord?.gamertag || "");
  const [teamName, setTeamName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [authRecord?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const list = await pb.collection("tournaments").getFullList<TournamentRecord>({
        filter: "show_on_tournaments_page = true",
        expand: "organizer",
        sort: "start_date",
      });
      setTournaments(list);

      if (authRecord?.id) {
        const myRegs = await pb.collection("tournament_registrations").getFullList({
          filter: `player = "${authRecord.id}"`,
        });
        setMyRegisteredIds(new Set(myRegs.map((r) => r.tournament)));
      }
    } catch (err: any) {
      console.error("Error cargando torneos:", err);
      setFeedback({
        type: "err",
        text: "No se pudieron cargar los torneos desde PocketBase.",
      });
    } finally {
      setLoading(false);
    }
  }

  function openRegistrationModal(tournament: TournamentRecord) {
    setFeedback(null);
    setGamertag(authRecord?.gamertag || "");
    setTeamName("");
    setRegisteringTournament(tournament);
  }

  async function handleConfirmRegistration(e: FormEvent) {
    e.preventDefault();
    if (!registeringTournament) return;

    if (!authRecord?.id) {
      setFeedback({
        type: "err",
        text: "Debes iniciar sesión como jugador para inscribirte.",
      });
      return;
    }

    if (myRegisteredIds.has(registeringTournament.id)) {
      setFeedback({
        type: "err",
        text: "Ya estás inscrito en este torneo.",
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await pb.collection("tournament_registrations").create({
        tournament: registeringTournament.id,
        player: authRecord.id,
        gamertag: gamertag.trim(),
        team_name: teamName.trim(),
        reg_status: "pending",
      });

      setMyRegisteredIds((prev) => new Set(prev).add(registeringTournament.id));
      setFeedback({
        type: "ok",
        text: `Inscripción enviada para "${registeringTournament.title}".`,
      });
      setRegisteringTournament(null);
    } catch (err: any) {
      setFeedback({
        type: "err",
        text: err?.message || "No se pudo completar la inscripción.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const games = Array.from(new Set(tournaments.map((t) => t.game).filter(Boolean)));

  const filteredTournaments = tournaments.filter((t) => {
    const matchesGame = selectedGame === "ALL" || t.game === selectedGame;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.game.toLowerCase().includes(q) ||
      (t.expand?.organizer?.community_name || "").toLowerCase().includes(q);
    return matchesGame && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#070816] text-white">
      <header className="border-b border-white/10 bg-[#0a0c22] px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-base font-black uppercase tracking-wider text-white">
              Raven Corp <span className="text-violet-400">CR</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium text-slate-300">
              <Link to="/" className="hover:text-violet-400 transition">
                Inicio
              </Link>
              <Link to="/torneos" className="text-violet-400">
                Torneos
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {authRecord ? (
              <Link
                to="/panel"
                className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-violet-500 transition"
              >
                Mi Panel
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-violet-500 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Ingresar para Inscribirse</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
              Calendario Competitivo
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              Todos los <span className="text-violet-400">Torneos</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar torneo o comunidad..."
                className="rounded-lg border border-white/15 bg-[#0c0e26] pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="rounded-lg border border-white/15 bg-[#0c0e26] px-3.5 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="ALL">Todos los juegos</option>
              {games.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {feedback && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "ok"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-200"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-[#0c0e26] p-10 text-center text-sm text-slate-400">
            Cargando torneos...
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#0c0e26] p-10 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-violet-400" />
            <p className="font-semibold">No hay torneos que coincidan con el filtro.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((t) => {
              const alreadyRegistered = myRegisteredIds.has(t.id);
              const canRegister = t.status === "registration_open" || t.status === "upcoming";
              const orgName =
                t.expand?.organizer?.community_name ||
                t.expand?.organizer?.name ||
                "Raven Corp CR";

              return (
                <article
                  key={t.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0c0e26] p-5 hover:border-violet-500/40 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold uppercase tracking-wider text-violet-400">
                        {t.game} • {t.format}
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] text-slate-200">
                        {t.status}
                      </span>
                    </div>

                    <h2 className="mt-2 text-lg font-extrabold text-white">{t.title}</h2>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <Users className="h-3.5 w-3.5 text-violet-400" />
                      <span>Organiza: {orgName}</span>
                    </p>

                    {t.description && (
                      <p className="mt-3 text-xs text-slate-300 line-clamp-2">{t.description}</p>
                    )}

                    <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-violet-400" />
                        <span>
                          {new Date(t.start_date).toLocaleString("es-CR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      {t.prize_pool && (
                        <p className="font-semibold text-amber-300">Premio: {t.prize_pool}</p>
                      )}
                      {typeof t.max_slots === "number" && (
                        <p className="text-slate-400">Cupos máximos: {t.max_slots}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 pt-2">
                    {t.stream_url ? (
                      <a
                        href={t.stream_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200 hover:border-violet-400 transition"
                      >
                        <Tv className="h-3.5 w-3.5 text-violet-400" />
                        <span>Stream</span>
                      </a>
                    ) : (
                      <span />
                    )}

                    {alreadyRegistered ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Inscrito</span>
                      </span>
                    ) : authRecord?.role === "player" && canRegister ? (
                      <button
                        onClick={() => openRegistrationModal(t)}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-violet-500 transition"
                      >
                        Inscribirme
                      </button>
                    ) : !authRecord ? (
                      <Link
                        to="/login"
                        className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-violet-500 transition"
                      >
                        Inicia Sesión
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">No disponible</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {registeringTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0c0e26] p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white">
              Inscribirse a {registeringTournament.title}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Confirma tu Gamertag y nombre de equipo (opcional).
            </p>

            <form onSubmit={handleConfirmRegistration} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Gamertag / ID del juego
                </label>
                <input
                  type="text"
                  required
                  value={gamertag}
                  onChange={(e) => setGamertag(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre de Equipo (opcional)
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ej. Raven Squad"
                  className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRegisteringTournament(null)}
                  className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {submitting ? "Enviando..." : "Confirmar Inscripción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
