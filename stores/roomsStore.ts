// stores/roomsStore.ts
import { create } from "zustand";

/* ─────────── Tipos ─────────── */
export type RoomType = "Sencilla" | "Doble" | "Triple" | "Familiar";
export type RoomStatus = "clean" | "dirty" | "blocked";

export type StatusKey =
  | "dirtyEmpty"       // Vacío sucio
  | "dirtyOccupied"    // Ocupado sucio
  | "cleanOccupied"    // Ocupado limpio
  | "adjustment"       // Ajuste
  | "clean"            // Limpio
  | "blocked"          // Bloqueado
  | "sold"             // Reservada
  | "lateCheckout";    // Salida tarde

export type Room = {
  id: string;
  number: string;
  type: RoomType;
  status: RoomStatus;            // estado base (limpio/sucio/bloqueado)
  note?: string;
  assignedTo?: string;           // si hay huésped asignado
  flags?: {
    adjustment?: boolean;
    sold?: boolean;
    lateCheckout?: boolean;
  };
};

/* ─────────── Fuentes (números) ─────────── */
const ROOMS_SOURCE: Record<RoomType, string[]> = {
  Sencilla: [
    "106","108","110","112","116","118","120","122",
    "206","208","210","212","216","218","220","222",
    "306","308","310","312","316","318","320","322",
  ],
  Doble: [
    "115","117","119","121","123","124",
    "215","217","219","221","223","224",
    "315","317","319","321","323","324",
  ],
  Triple: [
    "105","107","109","111","113","114",
    "205","207","209","211","213","214",
    "305","307","309","311","313","314",
  ],
  Familiar: [
    "101","102","103","104",
    "201","202","203","204",
    "301","302","303","304",
  ],
};

/* Inicializa TODAS como limpias */
const seedRoomsClean = (): Room[] => {
  const out: Room[] = [];
  (Object.keys(ROOMS_SOURCE) as RoomType[]).forEach((t) => {
    ROOMS_SOURCE[t].forEach((n) => {
      out.push({
        id: `${t}-${n}`,
        number: n,
        type: t,
        status: "clean",
        flags: {},
      });
    });
  });
  return out;
};

/* ─────────── Store ─────────── */
type RoomsState = {
  rooms: Room[];

  // init
  initRooms: () => void;

  // CRUD
  addRoom: (data: { number: string; type: RoomType; note?: string }) => void;
  updateRoom: (id: string, patch: Partial<Room>) => void;
  removeRoom: (id: string) => void;

  // Campos directos
  setNote: (id: string, note?: string) => void;
  setAssignedTo: (id: string, name?: string) => void;

  // Estados
  setPrimaryStatus: (id: string, status: RoomStatus) => void;
  applyStatusKey: (id: string, key: StatusKey) => void;
};

export const useRoomsStore = create<RoomsState>((set, get) => ({
  rooms: [],

  initRooms: () => set({ rooms: seedRoomsClean() }),

  addRoom: ({ number, type, note }) =>
    set((s) => ({
      rooms: [
        {
          id: `${type}-${number}-${Date.now()}`,
          number,
          type,
          status: "clean", // por defecto limpias
          note,
          flags: {},
        },
        ...s.rooms,
      ],
    })),

  updateRoom: (id, patch) =>
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),

  removeRoom: (id) =>
    set((s) => ({ rooms: s.rooms.filter((r) => r.id !== id) })),

  setNote: (id, note) =>
    set((s) => ({
      rooms: s.rooms.map((r) => (r.id === id ? { ...r, note } : r)),
    })),

  setAssignedTo: (id, name) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === id ? { ...r, assignedTo: name || undefined } : r
      ),
    })),

  // Limpio vs Sucio se reemplazan; Bloqueado alterna (desbloquear => limpio)
  setPrimaryStatus: (id, status) =>
    set((s) => ({
      rooms: s.rooms.map((r) => {
        if (r.id !== id) return r;
        if (status === "blocked") {
          return r.status === "blocked" ? { ...r, status: "clean" } : { ...r, status: "blocked" };
        }
        // auto-exclusión limpio/sucio
        return { ...r, status };
      }),
    })),

  // Aplica los 8 estatus extendidos (misma lógica que tenías)
  applyStatusKey: (id, key) =>
    set((s) => ({
      rooms: s.rooms.map((r) => {
        if (r.id !== id) return r;
        switch (key) {
          case "dirtyEmpty":
            return { ...r, status: "dirty", assignedTo: undefined };
          case "dirtyOccupied":
            return { ...r, status: "dirty", assignedTo: r.assignedTo ?? "(ocupado)" };
          case "cleanOccupied":
            return { ...r, status: "clean", assignedTo: r.assignedTo ?? "(ocupado)" };
          case "adjustment":
            return { ...r, flags: { ...r.flags, adjustment: !r.flags?.adjustment } };
          case "clean":
            return { ...r, status: "clean" };
          case "blocked":
            return r.status === "blocked" ? { ...r, status: "clean" } : { ...r, status: "blocked" };
          case "sold":
            return { ...r, flags: { ...r.flags, sold: !r.flags?.sold } };
          case "lateCheckout":
            return { ...r, flags: { ...r.flags, lateCheckout: !r.flags?.lateCheckout } };
          default:
            return r;
        }
      }),
    })),
}));
