import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { mfaDictionaries } from "@/messages/mfa";
import { MfaPanel } from "./mfa-panel";

afterEach(cleanup);

it("shows authenticator setup only after the provider returns setup data", async () => {
  const begin = vi.fn().mockResolvedValue({ setup: { factorId: "factor", qr: "data:image/svg+xml;utf-8,<svg></svg>", secret: "TESTSECRET" } });
  const verify = vi.fn();
  const remove = vi.fn();
  const { container } = render(<MfaPanel copy={mfaDictionaries.en} currentLevel="aal1" verifiedFactors={[]} unverifiedFactors={[]} next="/en/account" begin={begin} verify={verify} remove={remove} />);
  expect(screen.queryByText("TESTSECRET")).not.toBeInTheDocument();
  await act(async () => { fireEvent.submit(container.querySelector("form")!); });
  await waitFor(() => expect(screen.getByText("TESTSECRET")).toBeVisible());
  expect(screen.getByLabelText(mfaDictionaries.en.code)).toBeVisible();
});
