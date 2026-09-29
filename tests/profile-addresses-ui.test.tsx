import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const { push, refresh, refreshAuth, refreshUser, success, error } = vi.hoisted(
  () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    refreshAuth: vi.fn(),
    refreshUser: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }),
);
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/state/Auth", () => ({ useAuth: () => ({ refresh: refreshAuth }) }));
vi.mock("@/state/User", () => ({ useUserContext: () => ({ refreshUser }) }));
vi.mock("react-hot-toast", () => ({ toast: { success, error } }));
vi.mock("@/components/modals/alert-modal", () => ({
  AlertModal: ({
    isOpen,
    onConfirm,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
  }) => (isOpen ? <button onClick={onConfirm}>Confirm delete</button> : null),
}));
import ProfileForm from "@/app/(store)/(routes)/profile/edit/components/server-profile-form";
import { AddressForm } from "@/app/(store)/(routes)/profile/addresses/[addressId]/components/address-form";
import AddressesClient from "@/app/(store)/(routes)/profile/addresses/components/addresses-client";
const address = {
  id: "existing-id",
  country: "IRI",
  address: "Street",
  city: "City",
  phone: "0123",
  postalCode: "001",
  createdAt: "2026-09-29T00:00:00.000Z",
};
const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("profile form sends only name/phone by PATCH and refreshes backend auth/profile", async () => {
  fetchMock.mockResolvedValue(
    Response.json({
      name: "New",
      phone: null,
      email: "a@test.invalid",
      birthday: null,
    }),
  );
  render(
    <ProfileForm
      initialData={{ name: "Old", phone: null, email: "a@test.invalid" }}
    />,
  );
  fireEvent.change(screen.getByPlaceholderText("Name"), {
    target: { value: "New" },
  });
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() => expect(success).toHaveBeenCalled());
  expect(fetchMock.mock.calls[0][0]).toBe("/api/profile");
  expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
    name: "New",
    phone: "",
  });
  expect(refreshAuth).toHaveBeenCalled();
  expect(refreshUser).toHaveBeenCalled();
});
it("editing uses PATCH and keeps existing address ID", async () => {
  fetchMock.mockResolvedValue(Response.json(address));
  render(<AddressForm initialData={address} />);
  fireEvent.change(screen.getByLabelText("City"), {
    target: { value: "Changed" },
  });
  fireEvent.click(screen.getByText("Save changes"));
  await waitFor(() => expect(success).toHaveBeenCalledWith("Address updated."));
  expect(fetchMock.mock.calls[0][0]).toBe("/api/addresses/existing-id");
  expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
  expect(fetchMock.mock.calls[0][1].headers).toEqual({
    "Content-Type": "application/json",
  });
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
    city: "Changed",
    address: "Street",
    phone: "0123",
    postalCode: "001",
  });
  expect(push).toHaveBeenCalledWith("/profile/addresses");
});
it("new form creates by POST", async () => {
  fetchMock.mockResolvedValue(Response.json(address));
  render(<AddressForm initialData={null} />);
  for (const [label, value] of [
    ["City", "City"],
    ["Phone", "0123"],
    ["Postal Code", "001"],
    ["Address", "Street"],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByText("Create"));
  await waitFor(() => expect(success).toHaveBeenCalledWith("Address created."));
  expect(fetchMock.mock.calls[0][0]).toBe("/api/addresses");
  expect(fetchMock.mock.calls[0][1].method).toBe("POST");
});
it.each([400, 401, 404, 503])(
  "failed edit %s does not navigate or claim success",
  async (status) => {
    fetchMock.mockResolvedValue(new Response("database secret", { status }));
    render(<AddressForm initialData={address} />);
    fireEvent.click(screen.getByText("Save changes"));
    await waitFor(() => expect(error).toHaveBeenCalled());
    expect(error.mock.calls[0][0]).not.toContain("secret");
    expect(success).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Save changes")).not.toBeDisabled();
  },
);
it("detail delete uses plural URL, accepts 204 and returns to profile addresses", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  render(<AddressForm initialData={address} />);
  fireEvent.click(screen.getByRole("button", { name: "Delete address" }));
  fireEvent.click(screen.getByText("Confirm delete"));
  await waitFor(() => expect(success).toHaveBeenCalledWith("Address deleted."));
  expect(fetchMock.mock.calls[0][0]).toBe("/api/addresses/existing-id");
  expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  expect(push).toHaveBeenCalledWith("/profile/addresses");
});
it("order-linked delete conflict keeps the address visible", async () => {
  fetchMock.mockResolvedValue(new Response("private error", { status: 409 }));
  render(<AddressesClient initialAddresses={[address]} />);
  fireEvent.click(screen.getByText("Delete"));
  await waitFor(() => expect(error).toHaveBeenCalled());
  expect(error.mock.calls[0][0]).toContain("order");
  expect(screen.getByText("Street")).toBeVisible();
  expect(success).not.toHaveBeenCalled();
});
