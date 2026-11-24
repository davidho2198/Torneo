import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  Shield,
  Users,
  Gamepad2,
  PlusCircle,
  CheckCircle2,
  XCircle,
  LogOut,
  History,
  UserCheck,
} from "lucide-react";
import { pb } from "../lib/pocketbase-client";

export default function DashboardRoute() {
  const navigate = useNavigate();
  const [authRecord, setAuthRecord] = useState<any>(pb.authStore.record);

  const [pendingCommunities, setPendingCommunities] = useState<any[]>([]);
  const [allCommunities, setAllCommunities] = useState<any[]>([]);

  const [myTournaments, setMyTournaments] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [registrations, setRegistrations] = useState<any[]>([]);

  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [gamertagInput, setGamertagInput] = useState(authRecord?.gamertag || "");
  const [mainGameInput, setMainGameInput] = useState(authRecord?.main_game || "");

  const [commNameInput, setCommNameInput] = useState(authRecord?.community_name || "");
  const [commBioInput, setCommBioInput] = useState(authRecord?.community_bio || "");

  const [title, setTitle] = useState("");
  const [game, setGame] = useState("");
  const [format, setFormat] = useState("3v3 Squads");
  const [startDate, setStartDate] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [maxSlots, setMaxSlots] = useState<number>(20);
  const [status, setStatus] = useState<"registration_open" | "upcoming" | "live" | "finished">(
    "registration_open"
  );
  const [showOnHome, setShowOnHome] = useState(true);
  const [showOnTournamentsPage, setShowOnTournamentsPage] = useState(true);

  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!pb.authStore.isValid || !authRecord) {
      navigate("/login");
      return;
    }
    loadRoleData();
  }, [authRecord?.id]);

  async function loadRoleData() {
    if (!authRecord) return;
    try {
      if (authRecord.role === "admin") {
        const commList = await pb.collection("users").getFullList({
          filter: 'role = "organizer"',
          sort: "-created",
        });
        setAllCommunities(commList);
        setPendingCommunities(commList.filter((u) => u.community_status === "pending"));
      }

      if (authRecord.role === "organizer" || authRecord.role === "admin") {
        const filterExpr =
          authRecord.role === "admin" ? "" : `organizer = "${authRecord.id}"`;
        const tList = await pb.collection("tournaments").getFullList({
          filter: filterExpr,
          sort: "-created",
        });
        setMyTournaments(tList);
        const activeId = selectedTournamentId || tList[0]?.id || "";
        if (activeId) {
          setSelectedTournamentId(activeId);
          await loadRegistrationsForTournament(activeId);
        }
      }

      if (authRecord.role === "player") {
        const regs = await pb.collection("tournament_registrations").getFullList({
          filter: `player = "${authRecord.id}"`,
          expand: "tournament",
          sort: "-created",
        });
        setMyRegistrations(regs);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadRegistrationsForTournament(tournamentId: string) {
    if (!tournamentId) return;
    try {
      const list = await pb.collection("tournament_registrations").getFullList({
        filter: `tournament = "${tournamentId}"`,
        expand: "player",
        sort: "-created",
      });
      setRegistrations(list);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCommunityDecision(userId: string, decision: "approved" | "rejected") {
    setFeedback(null);
    await pb.collection("users").update(userId, {
      community_status: decision,
      community_verified: decision === "approved",
    });
    setFeedback(
      decision === "approved"
        ? "Comunidad aprobada. Ya puede crear y gestionar torneos."
        : "Solicitud de comunidad rechazada."
    );
    await loadRoleData();
  }

  async function handleCreateTournament(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (authRecord.role === "organizer" && authRecord.community_status !== "approved") {
      setFeedback("Tu comunidad aún no está aprobada por el Administrador.");
      return;
    }

    await pb.collection("tournaments").create({
      title: title.trim(),
      game: game.trim(),
      format: format.trim(),
      start_date: new Date(startDate).toISOString(),
      prize_pool: prizePool.trim(),
      max_slots: Number(maxSlots) || 16,
      status,
      show_on_home: showOnHome,
      show_on_tournaments_page: showOnTournamentsPage,
      organizer: authRecord.id,
    });

    setTitle("");
    setGame("");
    setPrizePool("");
    setStartDate("");
    setFeedback("Torneo creado correctamente.");
    await loadRoleData();
  }

  async function handleRegistrationStatus(
    regId: string,
    regStatus: "pending" | "approved" | "rejected" | "played",
    placement?: string
  ) {
    await pb.collection("tournament_registrations").update(regId, {
      reg_status: regStatus,
      ...(placement !== undefined ? { result_placement: placement } : {}),
    });
    setFeedback("Inscripción de jugador actualizada.");
    await loadRegistrationsForTournament(selectedTournamentId);
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const updatePayload =
      authRecord.role === "organizer"
        ? { community_name: commNameInput.trim(), community_bio: commBioInput.trim() }
        : { gamertag: gamertagInput.trim(), main_game: mainGameInput.trim() };

    const updated = await pb.collection("users").update(authRecord.id, updatePayload);
    setAuthRecord(updated);
    setFeedback("Perfil guardado.");
  }

  function handleLogout() {
    pb.authStore.clear();
    navigate("/login");
  }

  if (!authRecord) return null;

  const playedHistory = myRegistrations.filter(
    (r) => r.reg_status === "played" || r.expand?.tournament?.status === "finished"
  );
  const activeRegistrations = myRegistrations.filter(
    (r) => r.reg_status !== "played" && r.expand?.tournament?.status !== "finished"
  );

  return (
    <div className="min-h-screen bg-[#070816] text-white">
      <header className="border-b border-white/10 bg-[#0a0c22] px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-black uppercase tracking-wider text-violet-400">
              Raven Corp CR
            </Link>
            <span className="rounded-full border border-violet-500/30 bg-violet-600/15 px-3 py-0.5 text-xs font-semibold uppercase text-violet-300">
              Rol: {authRecord.role}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/torneos"
              className="rounded-lg border border-white/15 px-3.5 py-2 text-xs font-semibold hover:border-violet-400 transition"
            >
              Ver Torneos
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-rose-600/30 hover:text-rose-200 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-8">
        {feedback && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {feedback}
          </div>
        )}

        {authRecord.role === "admin" && (
          <section className="rounded-2xl border border-white/10 bg-[#0c0e26] p-6">
            <div className="mb-4 flex items-center gap-2 text-lg font-extrabold">
              <Shield className="h-5 w-5 text-violet-400" />
              <span>Administración de Comunidades</span>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-300">
                Solicitudes Pendientes ({pendingCommunities.length})
              </h3>
              {pendingCommunities.length === 0 ? (
                <p className="text-xs text-slate-400">No hay comunidades pendientes de aprobación.</p>
              ) : (
                <div className="space-y-3">
                  {pendingCommunities.map((comm) => (
                    <div
                      key={comm.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-500/25 bg-[#070816] p-4"
                    >
                      <div>
                        <p className="font-bold text-white">
                          {comm.community_name || comm.name}{" "}
                          <span className="text-xs font-normal text-slate-400">
                            ({comm.email})
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-slate-300">
                          {comm.community_bio || "Sin descripción"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCommunityDecision(comm.id, "approved")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Aprobar</span>
                        </button>
                        <button
                          onClick={() => handleCommunityDecision(comm.id, "rejected")}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-600/80 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-600 transition"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Todas las Comunidades ({allCommunities.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {allCommunities.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-white/10 bg-[#070816] p-3.5 text-xs"
                  >
                    <p className="font-bold text-white">{c.community_name || c.name}</p>
                    <p className="mt-1 text-slate-400">Estado: {c.community_status}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {(authRecord.role === "organizer" || authRecord.role === "admin") && (
          <>
            {authRecord.role === "organizer" && authRecord.community_status !== "approved" ? (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
                <h2 className="text-lg font-extrabold text-amber-200">
                  Comunidad en Estado: {authRecord.community_status || "pending"}
                </h2>
                <p className="mt-1 text-sm text-amber-100/80">
                  Tu cuenta de comunidad debe ser aprobada por un Administrador de Raven Corp CR
                  antes de crear torneos o gestionar jugadores.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <section className="rounded-2xl border border-white/10 bg-[#0c0e26] p-6 lg:col-span-6">
                  <div className="mb-4 flex items-center gap-2 text-lg font-extrabold">
                    <PlusCircle className="h-5 w-5 text-violet-400" />
                    <span>Crear Nuevo Torneo</span>
                  </div>

                  <form onSubmit={handleCreateTournament} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nombre del Torneo
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej. Raven Masters Apex 3v3"
                        className="w-full rounded-lg border border-white/15 bg-[#070816] px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Juego
                        </label>
                        <input
                          type="text"
                          required
                          value={game}
                          onChange={(e) => setGame(e.target.value)}
                          placeholder="Apex Legends"
                          className="w-full rounded-lg border border-white/15 bg-[#070816] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Modalidad / Formato
                        </label>
                        <input
                          type="text"
                          required
                          value={format}
                          onChange={(e) => setFormat(e.target.value)}
                          placeholder="3v3 Squads"
                          className="w-full rounded-lg border border-white/15 bg-[#070816] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Fecha y Hora
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full rounded-lg border border-white/15 bg-[#070816] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Premio
                        </label>
                        <input
                          type="text"
                          value={prizePool}
                          onChange={(e) => setPrizePool(e.target.value)}
                          placeholder="$200 o ₡100,000"
                          className="w-full rounded-lg border border-white/15 bg-[#070816] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Cupos máximos
                        </label>
                        <input
                          type="number"
                          min={2}
                          value={maxSlots}
                          onChange={(e) => setMaxSlots(Number(e.target.value))}
                          className="w-full rounded-lg border border-white/15 bg-[#070816] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Estado
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          className="w-full rounded-lg border border-white/15 bg-[#070816] px-3 py-2 text-sm"
                        >
                          <option value="registration_open">Inscripciones Abiertas</option>
                          <option value="upcoming">Próximamente</option>
                          <option value="live">En Vivo</option>
                          <option value="finished">Finalizado</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-5 pt-1 text-xs text-slate-300">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOnHome}
                          onChange={(e) => setShowOnHome(e.target.checked)}
                        />
                        <span>Mostrar en Página de Inicio (/)</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOnTournamentsPage}
                          onChange={(e) => setShowOnTournamentsPage(e.target.checked)}
                        />
                        <span>Mostrar en Página de Torneos (/torneos)</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-violet-500 transition"
                    >
                      Publicar Torneo
                    </button>
                  </form>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#0c0e26] p-6 lg:col-span-6">
                  <div className="mb-4 flex items-center gap-2 text-lg font-extrabold">
                    <UserCheck className="h-5 w-5 text-violet-400" />
                    <span>Jugadores Inscritos</span>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Selecciona un torneo
                    </label>
                    <select
                      value={selectedTournamentId}
                      onChange={(e) => {
                        setSelectedTournamentId(e.target.value);
                        loadRegistrationsForTournament(e.target.value);
                      }}
                      className="w-full rounded-lg border border-white/15 bg-[#070816] px-3 py-2 text-sm"
                    >
                      {myTournaments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.game})
                        </option>
                      ))}
                    </select>
                  </div>

                  {registrations.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Aún no hay jugadores inscritos en este torneo.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {registrations.map((reg) => (
                        <div
                          key={reg.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#070816] p-3.5 text-xs"
                        >
                          <div>
                            <p className="font-bold text-white">
                              {reg.gamertag}{" "}
                              {reg.team_name ? `• Equipo: ${reg.team_name}` : ""}
                            </p>
                            <p className="text-slate-400">
                              Estado: <span className="text-violet-300">{reg.reg_status}</span>
                              {reg.result_placement ? ` • Resultado: ${reg.result_placement}` : ""}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleRegistrationStatus(reg.id, "approved")}
                              className="rounded-md bg-emerald-600/80 px-2.5 py-1.5 font-semibold hover:bg-emerald-600"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() =>
                                handleRegistrationStatus(reg.id, "played", "Participó")
                              }
                              className="rounded-md bg-violet-600/80 px-2.5 py-1.5 font-semibold hover:bg-violet-600"
                            >
                              Marcar Jugado
                            </button>
                            <button
                              onClick={() => handleRegistrationStatus(reg.id, "rejected")}
                              className="rounded-md bg-rose-600/80 px-2.5 py-1.5 font-semibold hover:bg-rose-600"
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}

        {authRecord.role === "player" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <section className="rounded-2xl border border-white/10 bg-[#0c0e26] p-6 lg:col-span-6">
              <div className="mb-4 flex items-center gap-2 text-lg font-extrabold">
                <Gamepad2 className="h-5 w-5 text-violet-400" />
                <span>Mis Inscripciones Activas ({activeRegistrations.length})</span>
              </div>

              {activeRegistrations.length === 0 ? (
                <div className="text-xs text-slate-400">
                  No tienes inscripciones activas.{" "}
                  <Link to="/torneos" className="text-violet-400 underline">
                    Explora los próximos torneos
                  </Link>
                  .
                </div>
              ) : (
                <div className="space-y-3">
                  {activeRegistrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="rounded-xl border border-white/10 bg-[#070816] p-4 text-xs"
                    >
                      <p className="font-bold text-white text-sm">
                        {reg.expand?.tournament?.title || "Torneo"}
                      </p>
                      <p className="mt-1 text-slate-400">
                        Gamertag: <span className="text-white">{reg.gamertag}</span> • Estado:{" "}
                        <span className="text-violet-300">{reg.reg_status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#0c0e26] p-6 lg:col-span-6">
              <div className="mb-4 flex items-center gap-2 text-lg font-extrabold">
                <History className="h-5 w-5 text-violet-400" />
                <span>Historial de Torneos Jugados ({playedHistory.length})</span>
              </div>

              {playedHistory.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Aún no tienes torneos marcados como jugados o finalizados en tu historial.
                </p>
              ) : (
                <div className="space-y-3">
                  {playedHistory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-[#070816] p-4 text-xs"
                    >
                      <p className="font-bold text-white text-sm">
                        {item.expand?.tournament?.title || "Torneo"}
                      </p>
                      <p className="mt-1 text-slate-400">
                        Juego: {item.expand?.tournament?.game || "-"} • Resultado:{" "}
                        <span className="text-amber-300 font-semibold">
                          {item.result_placement || "Completado"}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {(authRecord.role === "player" || authRecord.role === "organizer") && (
          <section className="rounded-2xl border border-white/10 bg-[#0c0e26] p-6">
            <div className="mb-4 flex items-center gap-2 text-lg font-extrabold">
              <Users className="h-5 w-5 text-violet-400" />
              <span>
                {authRecord.role === "organizer"
                  ? "Perfil de mi Comunidad"
                  : "Mi Perfil de Jugador"}
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {authRecord.role === "organizer" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nombre de la Comunidad
                    </label>
                    <input
                      type="text"
                      value={commNameInput}
                      onChange={(e) => setCommNameInput(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={commBioInput}
                      onChange={(e) => setCommBioInput(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2 text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Gamertag
                    </label>
                    <input
                      type="text"
                      value={gamertagInput}
                      onChange={(e) => setGamertagInput(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Juego principal
                    </label>
                    <input
                      type="text"
                      value={mainGameInput}
                      onChange={(e) => setMainGameInput(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#070816] px-3.5 py-2 text-sm"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-violet-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-violet-500 transition"
                >
                  Guardar Cambios de Perfil
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
