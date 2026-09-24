export const identity = {
  user: {
    id: "user-a",
    email: "a@example.test",
    name: "A",
    phone: null,
    isEmailVerified: false,
    isPhoneVerified: false,
  },
  session: { expiresAt: "2026-10-24T12:00:00.000Z" },
};
export const authFailure = (code: string) => ({
  error: { code, message: "Safe backend error" },
});
