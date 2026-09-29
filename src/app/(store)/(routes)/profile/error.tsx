"use client";
export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <div role="alert">
      <p>
        Profile and addresses are temporarily unavailable. Please try again.
      </p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
