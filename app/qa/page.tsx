"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { ZONES } from "@/lib/constants";

type Submission = {
  _id: string;
  abeName: string;
  hq: string;
  empId: string;
  zone: string;
  zoneManager: string;
  doctorName: string;
  doctorUniqueId: string;
  doctorMobile: string;
  doctorEmail: string;
  city: string;
  cityType: string;
  practiceType: string;
  yearsExperience: number;
  monthlyPcvPotential: number;
  pneubevax14Usage: number;
  inputNeeded: string;
  regionalLanguage: string;
  script: string;
  photoUrl: string;
  voiceUrl: string;
  voiceSeconds: number;
  consent: boolean;
  submittedAt: string;
};

const EXPORT_COLUMNS: { key: keyof Submission; label: string }[] = [
  { key: "submittedAt", label: "Submitted At" },
  { key: "abeName", label: "ABE Name" },
  { key: "hq", label: "HQ" },
  { key: "empId", label: "EMP ID" },
  { key: "zone", label: "Zone" },
  { key: "zoneManager", label: "Zone Manager" },
  { key: "doctorName", label: "Doctor Name" },
  { key: "doctorUniqueId", label: "Doctor Unique ID" },
  { key: "doctorMobile", label: "Doctor Mobile" },
  { key: "doctorEmail", label: "Doctor Email" },
  { key: "city", label: "City" },
  { key: "cityType", label: "City Type" },
  { key: "practiceType", label: "Practice Type" },
  { key: "yearsExperience", label: "Years of Experience" },
  { key: "monthlyPcvPotential", label: "Monthly PCV Potential" },
  { key: "pneubevax14Usage", label: "Pneubevax 14 Usage" },
  { key: "inputNeeded", label: "Input Needed" },
  { key: "regionalLanguage", label: "Regional Language" },
  { key: "script", label: "Script" },
  { key: "voiceSeconds", label: "Voice Seconds" },
  { key: "consent", label: "Consent" },
  { key: "photoUrl", label: "Photo URL" },
  { key: "voiceUrl", label: "Voice URL" },
];

export default function QaPage() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState("");

  const filteredSubmissions = useMemo(
    () => (zoneFilter ? submissions.filter((s) => s.zone === zoneFilter) : []),
    [submissions, zoneFilter]
  );

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

  const handleExport = () => {
    const rows = filteredSubmissions.map((s) =>
      Object.fromEntries(
        EXPORT_COLUMNS.map(({ key, label }) => [
          label,
          key === "consent" ? (s.consent ? "Yes" : "No") : s[key],
        ])
      )
    );
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
    const date = new Date().toISOString().slice(0, 10);
    const zoneSlug = zoneFilter.toLowerCase().replace(/\s+/g, "-");
    XLSX.writeFile(workbook, `doctors_ai-${zoneSlug}-submissions-${date}.xlsx`);
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
          <h1 className="text-lg font-semibold text-zinc-900">QA Login</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to review doctor submissions.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Username</label>
              <input
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
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
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">QA — Doctor Submissions</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {zoneFilter ? `${filteredSubmissions.length} submission(s)` : "Select a zone to view submissions"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="sr-only" htmlFor="zone-filter">Filter by zone</label>
            <select
              id="zone-filter"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              <option value="" disabled>
                Select a zone…
              </option>
              {ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleExport}
              disabled={filteredSubmissions.length === 0}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              Export to Excel
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Log out
            </button>
          </div>
        </div>

        {loading && <p className="mt-6 text-sm text-zinc-500">Loading submissions…</p>}
        {loadError && <p className="mt-6 text-sm text-red-600">{loadError}</p>}

        {!loading && !loadError && zoneFilter && filteredSubmissions.length === 0 && (
          <p className="mt-6 text-sm text-zinc-500">No submissions for this zone.</p>
        )}

        {filteredSubmissions.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <Th>Submitted</Th>
                  <Th>Doctor</Th>
                  <Th>Doctor Unique ID</Th>
                  <Th>ABE Name</Th>
                  <Th>Zone</Th>
                  <Th>City</Th>
                  <Th>Content</Th>
                  <Th>Consent</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSubmissions.map((s) => (
                  <Fragment key={s._id}>
                    <tr className="hover:bg-zinc-50">
                      <Td>{new Date(s.submittedAt).toLocaleString()}</Td>
                      <Td>{s.doctorName}</Td>
                      <Td>{s.doctorUniqueId}</Td>
                      <Td>{s.abeName}</Td>
                      <Td>{s.zone}</Td>
                      <Td>{s.city}</Td>
                      <Td>
                        <div className="flex gap-3">
                          <a
                            href={s.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
                          >
                            Photo
                          </a>
                          <a
                            href={s.voiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
                          >
                            Voice
                          </a>
                        </div>
                      </Td>
                      <Td>{s.consent ? "Yes" : "No"}</Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === s._id ? null : s._id)}
                          className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
                        >
                          {expandedId === s._id ? "Hide" : "Details"}
                        </button>
                      </Td>
                    </tr>
                    {expandedId === s._id && (
                      <tr>
                        <td colSpan={9} className="bg-zinc-50 px-4 py-4">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                            <Info label="Mobile" value={s.doctorMobile} />
                            <Info label="Email" value={s.doctorEmail} />
                            <Info label="HQ" value={s.hq} />
                            <Info label="EMP ID" value={s.empId} />
                            <Info label="Zone Manager" value={s.zoneManager} />
                            <Info label="City Type" value={s.cityType} />
                            <Info label="Type of Practice" value={s.practiceType} />
                            <Info label="Years of Experience" value={String(s.yearsExperience)} />
                            <Info label="Monthly PCV Potential" value={String(s.monthlyPcvPotential)} />
                            <Info label="Pneubevax 14 Current Usage" value={String(s.pneubevax14Usage)} />
                            <Info label="Input Needed" value={s.inputNeeded} />
                            <Info label="Regional Language" value={s.regionalLanguage} />
                            <Info label="Voice Duration" value={`${s.voiceSeconds}s`} />
                          </div>
                          {s.script && (
                            <div className="mt-3 rounded-lg bg-white px-3 py-2 ring-1 ring-zinc-100">
                              <div className="text-xs text-zinc-400">Script</div>
                              <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{s.script}</p>
                            </div>
                          )}
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={s.photoUrl}
                              alt={s.doctorName}
                              className="h-24 w-24 rounded-full object-cover"
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
      {children}
    </th>
  );
}

function Td({ children }: { children?: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3 text-zinc-800">{children}</td>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="text-zinc-800">{value}</div>
    </div>
  );
}
