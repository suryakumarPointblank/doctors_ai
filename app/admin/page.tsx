"use client";

import { useEffect, useState } from "react";

type Submission = {
  _id: string;
  abeName: string;
  hq: string;
  empId: string;
  zone: string;
  doctorName: string;
  doctorDegree: string;
  activity: string;
  inputNeeded: string;
  photoUrl: string;
  voiceUrl: string;
  voiceSeconds: number;
  consent: boolean;
  submittedAt: string;
};

export default function AdminPage() {
  const [checking, setChecking]       = useState(true);
  const [authed, setAuthed]           = useState(false);
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [loginError, setLoginError]   = useState("");
  const [loggingIn, setLoggingIn]     = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadError, setLoadError]     = useState("");
  const [loading, setLoading]         = useState(false);

  const loadSubmissions = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/submissions");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setAuthed(true);
        setSubmissions(json.submissions);
      } else {
        setLoadError(json.error || "Failed to load submissions.");
      }
    } catch {
      setLoadError("Network error while loading submissions.");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleLogin = async () => {
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (json.success) {
        setAuthed(true);
        setPassword("");
        await loadSubmissions();
      } else {
        setLoginError(json.error || "Invalid credentials.");
      }
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setSubmissions([]);
    setUsername("");
  };

  if (checking) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Admin Login</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to view doctor submissions.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Username</label>
              <input
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {loginError && <p className="text-sm text-red-600">{loginError}</p>}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loggingIn}
              className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {loggingIn ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Doctor Submissions</h1>
            <p className="mt-1 text-sm text-zinc-500">{submissions.length} submission(s)</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Log out
          </button>
        </div>

        {loading && <p className="mt-6 text-sm text-zinc-500">Loading submissions…</p>}
        {loadError && <p className="mt-6 text-sm text-red-600">{loadError}</p>}

        {!loading && !loadError && submissions.length === 0 && (
          <p className="mt-6 text-sm text-zinc-500">No submissions yet.</p>
        )}

        <div className="mt-6 space-y-4">
          {submissions.map((s) => (
            <div key={s._id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.photoUrl}
                  alt={s.doctorName}
                  className="h-20 w-20 flex-shrink-0 rounded-full object-cover"
                />

                <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  <Info label="Doctor" value={`${s.doctorName}, ${s.doctorDegree}`} />
                  <Info label="ABE Name" value={s.abeName} />
                  <Info label="HQ" value={s.hq} />
                  <Info label="EMP ID" value={s.empId} />
                  <Info label="Zone" value={s.zone} />
                  <Info label="Activity" value={s.activity} />
                  <Info label="Input Needed" value={s.inputNeeded} />
                  <Info label="Consent" value={s.consent ? "Yes" : "No"} />
                  <Info label="Submitted" value={new Date(s.submittedAt).toLocaleString()} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-medium text-zinc-500">
                  Voice ({s.voiceSeconds}s)
                </span>
                <audio controls src={s.voiceUrl} className="h-9" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-zinc-800">{value}</div>
    </div>
  );
}
