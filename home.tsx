import { useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import { Arena, type TournamentItem, type SessionUser } from "../components/home/arena";
import { pb } from "../lib/pocketbase-client";

interface LoaderData {
  initialTournaments: TournamentItem[];
  initialUser: SessionUser | null;
}

function mapPocketBaseUser(record: any): SessionUser | null {
  if (!record?.id) return null;
  return {
    id: record.id,
    name: record.name,
    email: record.email || "",
    role: record.role || "player",
    gamertag: record.gamertag,
    community_name: record.community_name,
  };
}

export async function loader(): Promise<LoaderData> {
  return {
    initialTournaments: [],
    initialUser: null,
  };
}

export default function HomeRoute() {
  const { initialTournaments, initialUser } = useLoaderData<typeof loader>();
  const [tournaments, setTournaments] = useState<TournamentItem[]>(initialTournaments);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(
    pb.authStore.isValid ? mapPocketBaseUser(pb.authStore.record) : initialUser
  );

  useEffect(() => {
    setCurrentUser(pb.authStore.isValid ? mapPocketBaseUser(pb.authStore.record) : null);

    const unsubscribe = pb.authStore.onChange(() => {
      setCurrentUser(pb.authStore.isValid ? mapPocketBaseUser(pb.authStore.record) : null);
    });

    loadHomeTournaments();

    return () => {
      unsubscribe();
    };
  }, []);

  async function loadHomeTournaments() {
    try {
      const records = await pb.collection("tournaments").getFullList<any>({
        filter: "show_on_home = true",
        expand: "organizer",
        sort: "start_date",
      });

      const mapped: TournamentItem[] = records.map((t) => ({
        id: t.id,
        title: t.title,
        game: t.game,
        format: t.format,
        start_date: t.start_date,
        prize_pool: t.prize_pool,
        max_slots: t.max_slots,
        stream_url: t.stream_url,
        status: t.status || "upcoming",
        show_on_home: Boolean(t.show_on_home),
        show_on_tournaments_page: Boolean(t.show_on_tournaments_page),
        organizerName:
          t.expand?.organizer?.community_name ||
          t.expand?.organizer?.name ||
          "Raven Corp CR",
        organizerLogo: t.expand?.organizer?.community_logo,
      }));

      setTournaments(mapped);
    } catch (err) {
      console.error("Error cargando torneos del inicio desde PocketBase:", err);
    }
  }

  return <Arena tournaments={tournaments} currentUser={currentUser} />;
}
