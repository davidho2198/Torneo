import { Link } from "react-router";
import { Trophy, Calendar, Users, Tv, Shield, UserCheck, LogIn, LayoutDashboard } from "lucide-react";

export interface TournamentItem {
  id: string;
  title: string;
  game: string;
  format: string;
  start_date: string;
  prize_pool?: string;
  max_slots?: number;
  stream_url?: string;
  status: "upcoming" | "registration_open" | "live" | "finished";
  show_on_home?: boolean;
  show_on_tournaments_page?: boolean;
  organizerName?: string;
  organizerLogo?: string;
  registeredCount?: number;
}

export interface SessionUser {
  id: string;
  name?: string;
  email: string;
  role: "admin" | "organizer" | "player";
  gamertag?: string;
  community_name?: string;
}

interface ArenaProps {
  tournaments: TournamentItem[];
  currentUser: SessionUser | null;
}

const STATUS_LABELS: Record<TournamentItem["status"], { label: string; badgeClass: string }> = {
  registration_open: {
    label: "Inscripciones Abiertas",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  upcoming: {
    label: "Próximamente",
    badgeClass: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  live: {
    label: "En Vivo",
    badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  },
  finished: {
    label: "Finalizado",
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  },
};

export function Arena({ tournaments, currentUser }: ArenaProps) {
  const homeTournaments = tournaments.filter((t) => t.show_on_home !== false);

  return (
    <div className="min-h-screen bg-[#070816] text-white selection:bg-violet-600 selection:text-white">
      <header className="border-b border-white/10 bg-[#0a0c22]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-slate-300 sm:px-6">
          <span>Raven Corp CR • Arena Competitiva & Comunidades</span>
          <div className="flex items-center gap-4">
            <Link to="/torneos" className="hover:text-violet-400 transition">
              Calendario
            </Link>
            <Link to="/panel" className="hover:text-violet-400 transition">
              Comunidades
            </Link>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 font-black tracking-tighter text-white shadow-lg shadow-violet-900/40">
              RC
            </div>
            <div>
              <p className="text-base font-extrabold tracking-wider uppercase">
                Raven Corp <span className="text-violet-400">CR</span>
              </p>
              <p className="text-[11px] text-slate-400">Esports & Torneos</p>
            </div>
          </Link>

          <div className="flex items-center gap-6 text-sm font-medium text-slate-200">
            <Link to="/" className="text-violet-400">
              Inicio
            </Link>
            <Link to="/torneos" className="hover:text-violet-400 transition">
              Torneos
            </Link>
            <Link to="/panel" className="hover:text-violet-400 transition">
              {currentUser?.role === "admin"
                ? "Admin General"
                : currentUser?.role === "organizer"
                ? "Mi Comunidad"
                : "Mi Perfil"}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link
                to="/panel"
                className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>
                  {currentUser.role === "admin"
                    ? "Panel Admin"
                    : currentUser.role === "organizer"
                    ? currentUser.community_name || "Panel Comunidad"
                    : currentUser.gamertag || "Panel Jugador"}
                </span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3.5 py-2 text-sm font-medium text-slate-200 hover:border-violet-400 hover:text-white transition"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Ingresar</span>
                </Link>
                <Link
                  to="/registro"
                  className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition"
                >
                  <span>Crear Cuenta</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#131638] via-[#0b0d24] to-[#070816] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.28),transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <p className="mb-3 text-xs font-bold tracking-[0.22em] text-violet-400 uppercase">
            Bienvenido a Raven Corp CR
          </p>
          <h1 className="text-4xl font-black tracking-tight uppercase sm:text-6xl">
            Competencia <span className="text-violet-400">Esports</span>
            <span className="block mt-1">
              En <span className="text-violet-400">Cada</span> Arena
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
            Organiza torneos con tu comunidad, administra jugadores inscritos o compite y
            construye tu historial de partidas en una sola plataforma.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#proximos-torneos"
              className="rounded-md bg-violet-600 px-6 py-3 text-sm font-bold tracking-wider uppercase text-white shadow-lg shadow-violet-900/50 hover:bg-violet-500 transition"
            >
              Ver Próximos Torneos
            </a>
            <Link
              to="/registro"
              className="rounded-md border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold tracking-wider uppercase text-white hover:border-violet-400 hover:bg-violet-600/10 transition"
            >
              Unirme como Jugador o Comunidad
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#0d102b]/80 p-4">
              <div className="mb-2 flex items-center gap-2 text-violet-400 font-bold text-sm">
                <Shield className="h-4 w-4" />
                <span>Admin Raven Corp</span>
              </div>
              <p className="text-xs text-slate-400">
                Supervisión general de la plataforma, aprobación de comunidades y todos los torneos.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0d102b]/80 p-4">
              <div className="mb-2 flex items-center gap-2 text-violet-400 font-bold text-sm">
                <Users className="h-4 w-4" />
                <span>Comunidades</span>
              </div>
              <p className="text-xs text-slate-400">
                Gestionan su perfil, crean torneos, eligen dónde mostrarlos y administran inscritos.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0d102b]/80 p-4">
              <div className="mb-2 flex items-center gap-2 text-violet-400 font-bold text-sm">
                <UserCheck className="h-4 w-4" />
                <span>Jugadores</span>
              </div>
              <p className="text-xs text-slate-400">
                Crean su perfil gamer, se inscriben a torneos y conservan su historial jugado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="proximos-torneos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Próximos <span className="text-violet-400">Torneos</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Torneos destacados habilitados por nuestras comunidades y Raven Corp CR
          </p>
        </div>

        {homeTournaments.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#0c0e26] p-10 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-violet-400" />
            <p className="text-base font-semibold">Aún no hay torneos publicados en el inicio</p>
            <p className="mt-1 text-sm text-slate-400">
              Inicia sesión como Comunidad aprobada o Admin para crear el primer torneo y marcarlo en inicio.
            </p>
            <Link
              to="/panel"
              className="mt-5 inline-block rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition"
            >
              Ir al Panel
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {homeTournaments.map((t) => {
              const statusInfo = STATUS_LABELS[t.status] ?? STATUS_LABELS.upcoming;
              const dateText = new Date(t.start_date).toLocaleString("es-CR", {
                dateStyle: "medium",
                timeStyle: "short",
              });

              return (
                <div
                  key={t.id}
                  className="grid grid-cols-1 items-center gap-4 rounded-xl border border-white/10 bg-[#0c0e26] px-5 py-4 hover:border-violet-500/50 transition md:grid-cols-12"
                >
                  <div className="flex items-center gap-3 md:col-span-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-950/50 font-black text-violet-300">
                      {t.game.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-wider text-violet-400 uppercase">
                        {t.game} • {t.format}
                      </p>
                      <h3 className="text-base font-bold text-white">{t.title}</h3>
                      <p className="text-xs text-slate-400">
                        Org: {t.organizerName || "Raven Corp CR"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 md:col-span-5 md:justify-center md:gap-4">
                    <div className="text-center">
                      <span
                        className={`inline-block rounded-full border px-3 py-0.5 text-[11px] font-semibold ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>
                      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-slate-300">
                        <Calendar className="h-3.5 w-3.5 text-violet-400" />
                        <span>{dateText}</span>
                      </div>
                    </div>

                    <div className="text-right md:text-left">
                      {t.prize_pool && (
                        <p className="text-xs font-bold text-amber-300">Premio: {t.prize_pool}</p>
                      )}
                      {typeof t.max_slots === "number" && (
                        <p className="text-xs text-slate-400">
                          Cupos: {t.registeredCount ?? 0}/{t.max_slots}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 md:col-span-3">
                    {t.stream_url && (
                      <a
                        href={t.stream_url}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver transmisión"
                        className="rounded-lg border border-white/10 p-2.5 text-slate-300 hover:border-violet-400 hover:text-violet-300 transition"
                      >
                        <Tv className="h-4 w-4" />
                      </a>
                    )}
                    <Link
                      to={`/torneos?destacado=${t.id}`}
                      className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold tracking-wider uppercase text-white hover:bg-violet-500 transition"
                    >
                      Ver / Inscribirse
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/torneos"
            className="inline-block rounded-md bg-violet-600 px-7 py-3 text-xs font-bold tracking-widest uppercase text-white hover:bg-violet-500 transition"
          >
            Ver Todos los Torneos
          </Link>
        </div>
      </section>
    </div>
  );
}
