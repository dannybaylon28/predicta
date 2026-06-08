import { Timestamp, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export type LeagueMemberRecord = {
  userId: string;
  displayName: string;
  role: "admin" | "member";
  points: number;
  exactHits: number;
  joinedAt: string;
};

type MemberDoc = {
  userId: string;
  displayName: string;
  role: "admin" | "member";
  points: number;
  exactHits: number;
  joinedAt: Timestamp | { toDate?: () => Date };
};

function mapMember(id: string, data: MemberDoc): LeagueMemberRecord {
  const joinedAt =
    data.joinedAt instanceof Timestamp
      ? data.joinedAt.toDate().toISOString()
      : typeof data.joinedAt === "object" && data.joinedAt?.toDate
        ? data.joinedAt.toDate().toISOString()
        : new Date(0).toISOString();

  return {
    userId: data.userId ?? id,
    displayName: data.displayName ?? "Jugador",
    role: data.role ?? "member",
    points: Number(data.points ?? 0),
    exactHits: Number(data.exactHits ?? 0),
    joinedAt,
  };
}

export async function listLeagueMembers(leagueId: string): Promise<LeagueMemberRecord[]> {
  const snapshot = await getDocs(collection(db, "leagues", leagueId, "members"));
  return snapshot.docs
    .map((entry) => mapMember(entry.id, entry.data() as MemberDoc))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));
}
