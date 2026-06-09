import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { PlanLimitError } from "../constants/plan";
import type { LeagueDraft } from "../context/LeagueContext";
import { ACTIVE_TOURNAMENT_ID } from "../constants/tournaments";
import type { LeagueRecord, ScoringMode } from "../types";
import { generateInviteCode } from "../utils/inviteCode";
import { normalizeInviteCode } from "../utils/inviteLink";
import { mapFirestoreError } from "../utils/firestoreErrors";
import { assertCanAddMember, assertCanCreateLeague } from "../utils/planLimits";
import { countAdminLeagues, hasPremium } from "./entitlements";

const TOURNAMENT_ID = ACTIVE_TOURNAMENT_ID;

type LeagueDoc = {
  name: string;
  prize: string;
  winners: number;
  scoringMode: ScoringMode;
  resultPoints: number;
  exactBonus: number;
  adminId: string;
  adminName: string;
  inviteCode: string;
  tournamentId: string;
  status: "active";
  memberCount: number;
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
};

type MemberDoc = {
  userId: string;
  displayName: string;
  role: "admin" | "member";
  points: number;
  exactHits: number;
  joinedAt: ReturnType<typeof serverTimestamp>;
};

type MembershipDoc = {
  leagueId: string;
  role: "admin" | "member";
  joinedAt: ReturnType<typeof serverTimestamp>;
};

type InviteCodeDoc = {
  leagueId: string;
  name: string;
  prize: string;
  memberCount: number;
  adminName: string;
  scoringMode: ScoringMode;
};

export type LeaguePreview = {
  leagueId: string;
  code: string;
  name: string;
  prize: string;
  memberCount: number;
  adminName: string;
  scoringMode: ScoringMode;
  tournamentId: string;
  adminId: string;
  isFull: boolean;
};

function mapLeague(id: string, data: LeagueDoc): LeagueRecord {
  return {
    id,
    name: data.name,
    prize: data.prize,
    winners: data.winners,
    scoringMode: data.scoringMode,
    resultPoints: data.resultPoints,
    exactBonus: data.exactBonus,
    members: data.memberCount,
    adminId: data.adminId,
    adminName: data.adminName,
    inviteCode: data.inviteCode,
    tournamentId: data.tournamentId,
    status: data.status,
  };
}

async function createUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateInviteCode();
    const codeSnap = await getDoc(doc(db, "inviteCodes", code));
    if (!codeSnap.exists()) return code;
  }
  throw new Error("No pudimos generar un codigo de invitacion. Intenta de nuevo.");
}

export async function getLeaguePreviewByCode(rawCode: string): Promise<LeaguePreview> {
  const code = normalizeInviteCode(rawCode);
  if (!code) throw new Error("Ingresa un codigo de invitacion.");

  const snap = await getDoc(doc(db, "inviteCodes", code));
  if (!snap.exists()) throw new Error("Codigo no valido. Verifica e intenta de nuevo.");

  const data = snap.data() as Partial<InviteCodeDoc>;
  if (!data.leagueId) throw new Error("Codigo no valido. Verifica e intenta de nuevo.");

  const leagueSnap = await getDoc(doc(db, "leagues", data.leagueId));
  if (!leagueSnap.exists()) throw new Error("La liga ya no existe.");

  const league = leagueSnap.data() as LeagueDoc;
  const adminPremium = await hasPremium(league.adminId, league.tournamentId);

  let isFull = false;
  try {
    assertCanAddMember(adminPremium, league.memberCount);
  } catch (err) {
    if (err instanceof PlanLimitError && err.code === "MEMBER_LIMIT") {
      isFull = true;
    } else {
      throw err;
    }
  }

  return {
    leagueId: data.leagueId,
    code,
    name: data.name ?? league.name ?? "Liga privada",
    prize: data.prize ?? league.prize ?? "Por definir",
    memberCount: data.memberCount ?? league.memberCount ?? 1,
    adminName: data.adminName ?? league.adminName ?? "Admin",
    scoringMode: data.scoringMode ?? league.scoringMode ?? "hybrid",
    tournamentId: league.tournamentId,
    adminId: league.adminId,
    isFull,
  };
}

export async function createLeague(
  draft: LeagueDraft,
  admin: { uid: string; displayName: string },
): Promise<LeagueRecord> {
  const name = draft.name.trim();
  if (!name) throw new Error("El nombre de la liga es obligatorio.");
  if (draft.winners < 1 || draft.winners > 20) {
    throw new Error("El numero de ganadores debe estar entre 1 y 20.");
  }

  const [premium, myLeagues] = await Promise.all([
    hasPremium(admin.uid, TOURNAMENT_ID),
    listMyLeagues(admin.uid),
  ]);

  const adminLeagueCount = countAdminLeagues(myLeagues, admin.uid, TOURNAMENT_ID);
  assertCanCreateLeague(premium, adminLeagueCount);

  const leagueRef = doc(collection(db, "leagues"));
  const inviteCode = await createUniqueInviteCode();
  const now = serverTimestamp();

  const leagueData: LeagueDoc = {
    name,
    prize: draft.prize.trim() || "Por definir",
    winners: draft.winners,
    scoringMode: draft.scoringMode,
    resultPoints: draft.resultPoints,
    exactBonus: draft.exactBonus,
    adminId: admin.uid,
    adminName: admin.displayName,
    inviteCode,
    tournamentId: TOURNAMENT_ID,
    status: "active",
    memberCount: 1,
    createdAt: now,
    updatedAt: now,
  };

  const memberData: MemberDoc = {
    userId: admin.uid,
    displayName: admin.displayName,
    role: "admin",
    points: 0,
    exactHits: 0,
    joinedAt: now,
  };

  const membershipData: MembershipDoc = {
    leagueId: leagueRef.id,
    role: "admin",
    joinedAt: now,
  };

  const invitePreview: InviteCodeDoc = {
    leagueId: leagueRef.id,
    name: leagueData.name,
    prize: leagueData.prize,
    memberCount: 1,
    adminName: admin.displayName,
    scoringMode: draft.scoringMode,
  };

  const batch = writeBatch(db);
  batch.set(leagueRef, leagueData);
  batch.set(doc(db, "leagues", leagueRef.id, "members", admin.uid), memberData);
  batch.set(doc(db, "users", admin.uid, "leagueMemberships", leagueRef.id), membershipData);
  batch.set(doc(db, "inviteCodes", inviteCode), invitePreview);
  batch.set(doc(db, "users", admin.uid, "tournamentUsage", TOURNAMENT_ID), {
    tournamentId: TOURNAMENT_ID,
    leaguesCreated: adminLeagueCount + 1,
  });

  try {
    await batch.commit();
  } catch (error) {
    throw mapFirestoreError(error, "No pudimos crear la liga.");
  }

  return mapLeague(leagueRef.id, {
    ...leagueData,
    createdAt: now,
    updatedAt: now,
  });
}

export async function joinLeague(
  rawCode: string,
  user: { uid: string; displayName: string },
): Promise<LeagueRecord> {
  const preview = await getLeaguePreviewByCode(rawCode);
  if (preview.isFull) {
    throw new PlanLimitError(
      "MEMBER_LIMIT",
      "Esta liga ya alcanzo el limite de miembros del plan gratuito. Pide al administrador que actualice a Premium.",
    );
  }

  const membershipRef = doc(db, "users", user.uid, "leagueMemberships", preview.leagueId);
  const existingMembership = await getDoc(membershipRef);

  if (existingMembership.exists()) {
    throw new Error("Ya perteneces a esta liga.");
  }

  const leagueRef = doc(db, "leagues", preview.leagueId);
  const leagueSnap = await getDoc(leagueRef);
  if (!leagueSnap.exists()) {
    throw new Error("La liga ya no existe.");
  }

  const leagueData = leagueSnap.data() as LeagueDoc;
  const adminPremium = await hasPremium(leagueData.adminId, leagueData.tournamentId);
  assertCanAddMember(adminPremium, leagueData.memberCount);

  const now = serverTimestamp();

  const memberData: MemberDoc = {
    userId: user.uid,
    displayName: user.displayName,
    role: "member",
    points: 0,
    exactHits: 0,
    joinedAt: now,
  };

  const membershipData: MembershipDoc = {
    leagueId: preview.leagueId,
    role: "member",
    joinedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(doc(db, "leagues", preview.leagueId, "members", user.uid), memberData);
  batch.set(membershipRef, membershipData);
  batch.update(leagueRef, { memberCount: increment(1), updatedAt: now });
  batch.update(doc(db, "inviteCodes", preview.code), { memberCount: increment(1) });

  try {
    await batch.commit();
  } catch (error) {
    throw mapFirestoreError(error, "No pudimos unirte a la liga.");
  }

  return mapLeague(preview.leagueId, {
    ...leagueData,
    memberCount: leagueData.memberCount + 1,
  });
}

export async function listMyLeagues(userId: string): Promise<LeagueRecord[]> {
  const membershipSnap = await getDocs(collection(db, "users", userId, "leagueMemberships"));

  const leagues = await Promise.all(
    membershipSnap.docs.map(async (membershipDoc) => {
      const leagueSnap = await getDoc(doc(db, "leagues", membershipDoc.id));
      if (!leagueSnap.exists()) return null;
      return mapLeague(leagueSnap.id, leagueSnap.data() as LeagueDoc);
    }),
  );

  return leagues
    .filter((league): league is LeagueRecord => league !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
