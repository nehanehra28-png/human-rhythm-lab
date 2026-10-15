"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function PhoneSignIn() {
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !supabase) return;
    const form = new FormData(e.currentTarget);
    const number = pending ? phone : String(form.get("phone")).trim();
    if (!/^\+[1-9]\d{7,14}$/.test(number)) {
      setMessage("Include your country code, for example +31612345678.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = pending
        ? await supabase.auth.verifyOtp({
            phone: number,
            token: String(form.get("code")).trim(),
            type: "phone_change",
          })
        : await supabase.auth.updateUser({ phone: number });
      if (error) throw error;
      if (pending) {
        setPending(false);
        setMessage(
          "Phone verified. You can now sign in to this account by email or phone.",
        );
      } else {
        setPhone(number);
        setPending(true);
        setMessage("Enter the verification code sent by SMS.");
      }
    } catch {
      setMessage(
        pending
          ? "Code invalid or expired. Try again or start over."
          : "Could not send an SMS. Check the number or contact your program team.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card account-card">
      <h2>Phone sign-in</h2>
      <p>
        Add and verify a phone number to sign in to your existing account by
        SMS.
      </p>
      <form onSubmit={submit}>
        {pending ? (
          <label>
            Code sent to {phone}
            <input
              key="code"
              name="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6,10}"
              minLength={6}
              maxLength={10}
              autoComplete="one-time-code"
              required
              disabled={busy}
            />
          </label>
        ) : (
          <label>
            Phone number
            <input
              key="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+31612345678"
              required
              disabled={busy}
            />
          </label>
        )}
        <button className="primary" disabled={busy}>
          {busy
            ? "Please wait…"
            : pending
              ? "Verify phone"
              : "Send verification code"}
        </button>
      </form>
      {pending && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setPending(false);
            setMessage("");
          }}
        >
          Start over
        </button>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
