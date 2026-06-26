import { describe, expect, it } from "vitest";

import {
  ensureV1ApiBase,
  parseArgs,
  regionFromIssuer,
  renderFrontendEnv,
  unwrapTerraformOutputs,
} from "./sync-dev-env-from-terraform.mjs";

const terraformOutputs = {
  api_base_url: { value: "https://api.example.com" },
  cognito_app_client_id: { value: "client-id" },
  cognito_hosted_ui_domain: {
    value: "https://stockbrief-dev.example.auth.ap-northeast-2.amazoncognito.com",
  },
  cognito_issuer: {
    value: "https://cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_example",
  },
  cognito_user_pool_id: { value: "ap-northeast-2_example" },
};

describe("sync-dev-env-from-terraform", () => {
  it("renders FE public env values from Terraform outputs", () => {
    const content = renderFrontendEnv(terraformOutputs, {
      redirectUri: "http://localhost:3000/auth/callback",
    });

    expect(content).toContain("NEXT_PUBLIC_API_BASE_URL=https://api.example.com/v1");
    expect(content).toContain("NEXT_PUBLIC_COGNITO_REGION=ap-northeast-2");
    expect(content).toContain("NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-northeast-2_example");
    expect(content).toContain("NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=client-id");
    expect(content).toContain(
      "NEXT_PUBLIC_COGNITO_HOSTED_UI_DOMAIN=https://stockbrief-dev.example.auth.ap-northeast-2.amazoncognito.com",
    );
    expect(content).toContain("NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback");
  });

  it("fails when a required Terraform output is missing", () => {
    const outputs = Object.fromEntries(
      Object.entries(terraformOutputs).filter(([key]) => key !== "cognito_user_pool_id"),
    );

    expect(() => renderFrontendEnv(outputs)).toThrow(
      "Missing required Terraform output(s): cognito_user_pool_id",
    );
  });

  it("keeps an API base that already includes /v1", () => {
    expect(ensureV1ApiBase("https://api.example.com/v1/")).toBe("https://api.example.com/v1");
  });

  it("parses the Cognito issuer region", () => {
    expect(regionFromIssuer("https://cognito-idp.ap-northeast-2.amazonaws.com/pool")).toBe(
      "ap-northeast-2",
    );
  });

  it("supports overriding paths and dry run from CLI args", () => {
    expect(
      parseArgs([
        "--terraform-dir",
        "../be/infra/terraform",
        "--output",
        ".env.test",
        "--redirect-uri",
        "http://localhost:3001/auth/callback",
        "--dry-run",
      ]),
    ).toEqual({
      terraformDir: "../be/infra/terraform",
      outputPath: ".env.test",
      redirectUri: "http://localhost:3001/auth/callback",
      region: "ap-northeast-2",
      dryRun: true,
    });
  });

  it("unwraps Terraform output objects while leaving plain values supported", () => {
    expect(unwrapTerraformOutputs({ one: { value: "1" }, two: "2" })).toEqual({
      one: "1",
      two: "2",
    });
  });
});
