import { describe, expect, it } from "vitest";
import { PlanLimitError } from "../constants/plan";
import { assertCanAddMember, assertCanCreateLeague } from "./planLimits";

describe("planLimits", () => {
  it("permite crear la primera liga en free", () => {
    expect(() => assertCanCreateLeague(false, 0)).not.toThrow();
  });

  it("bloquea la segunda liga sin premium", () => {
    expect(() => assertCanCreateLeague(false, 1)).toThrow(PlanLimitError);
  });

  it("permite ligas ilimitadas con premium", () => {
    expect(() => assertCanCreateLeague(true, 12)).not.toThrow();
  });

  it("bloquea el miembro 11 sin premium", () => {
    expect(() => assertCanAddMember(false, 10)).toThrow(PlanLimitError);
  });

  it("permite miembros ilimitados con premium", () => {
    expect(() => assertCanAddMember(true, 500)).not.toThrow();
  });
});
