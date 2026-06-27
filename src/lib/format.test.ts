import { describe, expect, it } from "vitest";

import { riskProfileLabel } from "./format";

describe("format helpers", () => {
  it("maps risk profile values to reader-facing Korean labels", () => {
    expect(riskProfileLabel("conservative")).toBe("안정형");
    expect(riskProfileLabel("balanced")).toBe("균형형");
    expect(riskProfileLabel("aggressive")).toBe("적극형");
    expect(riskProfileLabel("unknown")).toBe("확인 필요");
  });
});
