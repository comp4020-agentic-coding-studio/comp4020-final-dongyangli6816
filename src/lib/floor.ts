// Where everyone stands on the gym map (GYM-9, GYM-10; docs/design/room/spec.md
// 3.2), worked out from the room view alone, so every screen puts everyone
// in the same place with nothing extra stored. Pure, so the server's first
// render and the room's script agree.
import { EQUIPMENT, type Equipment } from "./exercises.ts";
import type { MemberView, RoomView, State } from "./presence.ts";
import { STATIONS } from "../sprites/gym.ts";
import type { Pose } from "../sprites/avatar.ts";

export type Tile = [number, number];
export type Spot = { id: number; tile: Tile; onStation: boolean; pose: Pose; state: State };

export const DOOR: Tile = [4, 9];
// fill orders: the first three of each never overlap
const REST_SPOTS: Tile[] = [[1, 7], [3, 7], [2, 8], [1, 8], [3, 8], [2, 7], [1, 6], [3, 6], [2, 6], [4, 8], [4, 7], [4, 6]];
const IDLE_SPOTS: Tile[] = [[8, 7], [6, 7], [7, 8], [8, 8], [6, 8], [7, 7], [8, 6], [6, 6], [7, 6], [5, 8], [5, 7], [5, 6]];

// The state shown at `now`: Resting turns Slacking at the server's slackAt.
const stateAt = (m: MemberView, now: number): State =>
  m.state === "resting" && m.slackAt !== null && now >= m.slackAt ? "slacking" : m.state;

// Lifting and Slacking are on their station; Resting at the cooler; Idle and
// Finished by the lockers. Spots go by join order within a state.
export function spots(view: RoomView, now: number): Spot[] {
  let rest = 0;
  let idle = 0;
  return view.members.map((m) => {
    const state = stateAt(m, now);
    if ((state === "lifting" || state === "slacking") && m.station) {
      const equipment = view.stations.find((s) => s.slot === m.station!.slot)?.equipment;
      const pose: Pose = state === "slacking" ? "sit" : equipment === "treadmill" ? "stand" : "lift";
      return { id: m.id, tile: STATIONS[m.station.slot - 1], onStation: true, pose, state };
    }
    if (state === "resting" || state === "slacking") {
      return { id: m.id, tile: REST_SPOTS[rest++ % REST_SPOTS.length], onStation: false, pose: "rest", state };
    }
    return { id: m.id, tile: IDLE_SPOTS[idle++ % IDLE_SPOTS.length], onStation: false, pose: "stand", state };
  });
}

// The walk between two tiles along the aisles (GYM-10): out to the nearest
// aisle row, along it to the central walkway (x = 4), along that to the
// target's aisle row, along it, then in. Two tiles off the same aisle row
// skip the walkway. Each step is one tile; staying put is no steps.
export function route(from: Tile, to: Tile): Tile[] {
  if (from[0] === to[0] && from[1] === to[1]) return [];
  const path: Tile[] = [];
  let [x, y] = from;
  const step = (tx: number, ty: number) => {
    while (x !== tx) {
      x += Math.sign(tx - x);
      path.push([x, y]);
    }
    while (y !== ty) {
      y += Math.sign(ty - y);
      path.push([x, y]);
    }
  };
  // the aisle row a tile is reached from: below a station, row 6 for the lobby
  const aisle = ([tx, ty]: Tile) => (ty >= 7 ? 6 : ty % 2 === 1 ? ty + 1 : ty);
  const isStation = (t: Tile) => STATIONS.some(([sx, sy]) => sx === t[0] && sy === t[1]);
  const ay = from[1] === 9 ? 6 : aisle(from);
  if (isStation(from) || from[1] >= 7) step(x, ay);
  if (ay !== aisle(to)) {
    step(4, y);
    step(4, aisle(to));
  }
  step(to[0], y);
  step(x, to[1]);
  return path;
}

const lower = (e: Equipment) => EQUIPMENT[e].toLowerCase();

// The avatar's accessible name: "Mia, lifting, back squat on squat rack 3".
export function avatarLabel(m: MemberView, state: State, you: boolean): string {
  const where =
    state === "finished"
      ? "finished"
      : !m.station
        ? "no station yet"
        : state === "lifting"
          ? `${(m.exercise ?? "lifting").toLowerCase()} on ${m.station.equipment.toLowerCase()} ${m.station.slot}`
          : `${m.station.equipment.toLowerCase()} ${m.station.slot}`;
  return `${m.name}${you ? " (you)" : ""}, ${state}${m.away ? ", away" : ""}, ${where}`;
}

// What's on the floor, for screen readers: the stations are art.
export function floorLine(stations: RoomView["stations"]): string {
  const on = stations.filter((s) => s.equipment).map((s) => `${lower(s.equipment!)} ${s.slot}`);
  const empty = stations.length - on.length;
  return `On the floor: ${on.join(", ")}. ${empty} station${empty === 1 ? "" : "s"} empty.`;
}
