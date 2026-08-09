"use client";

import { useRef, useState, ChangeEvent } from "react";

const ZONES = ["South 1", "South 2", "West", "North", "East"];
const ACTIVITIES = ["Customized LAMA/Poster", "S-20 campaign"];
const INPUTS_NEEDED = ["LAMA", "A2 Poster"];
const MIN_VOICE_SECONDS = 30;

const VOICE_TEMPLATE = `Hello, I am Dr. [Your Name], [Your Degree]. Over the years, I have treated
many patients dealing with this condition, and I have seen first-hand how the right
guidance and timely care can make a real difference to their recovery and quality of life.
Based on my clinical experience, I recommend this treatment to my patients because it is
safe, effective, and backed by strong clinical evidence. It is important to take the
medication exactly as prescribed and to complete the full course, even if you start
feeling better before it is finished. If you notice any unusual symptoms or side effects,
please reach out to your doctor immediately rather than stopping the treatment on your own.
As always, please consult your doctor before starting any new medication, and do not
hesitate to ask questions about your treatment plan. Thank you, and take care of your health.`;

export default function Home() {
  const [abeName, setAbeName]         = useState("");
  const [hq, setHq]                   = useState("");
  const [empId, setEmpId]             = useState("");
  const [zone, setZone]               = useState("");
  const [doctorName, setDoctorName]   = useState("");
  const [doctorDegree, setDoctorDegree] = useState("");
  const [activity, setActivity]       = useState("");
  const [inputNeeded, setInputNeeded] = useState("");
  const [consent, setConsent]         = useState(false);

  const [photoFile, setPhotoFile]     = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const [recording, setRecording]     = useState(false);
  const [voiceBlob, setVoiceBlob]     = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl]       = useState<string>("");
  const [voiceSeconds, setVoiceSeconds] = useState(0);

  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [apiError, setApiError]       = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const startRecording = async () => {
    setApiError("");
    setVoiceBlob(null);
    setVoiceUrl("");
    setVoiceSeconds(0);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setVoiceBlob(blob);
      setVoiceUrl(URL.createObjectURL(blob));
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };

    recorder.start();
    setRecording(true);

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setVoiceSeconds(elapsed);
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!abeName.trim())       e.abeName = "ABE name is required";
    if (!hq.trim())            e.hq = "HQ is required";
    if (!empId.trim())         e.empId = "EMP ID is required";
    if (!zone)                 e.zone = "Zone is required";
    if (!doctorName.trim())    e.doctorName = "Doctor's name is required";
    if (!doctorDegree.trim())  e.doctorDegree = "Doctor's degree is required";
    if (!activity)             e.activity = "Activity is required";
    if (!inputNeeded)          e.inputNeeded = "Input needed is required";
    if (!photoFile)            e.photo = "Doctor's photo is required";
    if (!voiceBlob)            e.voice = "Doctor's voice recording is required";
    else if (voiceSeconds < MIN_VOICE_SECONDS)
      e.voice = `Recording must be at least ${MIN_VOICE_SECONDS} seconds`;
    if (!consent)              e.consent = "Doctor's consent is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setApiError("");

    try {
      const form = new FormData();
      form.append("abeName", abeName);
      form.append("hq", hq);
      form.append("empId", empId);
      form.append("zone", zone);
      form.append("doctorName", doctorName);
      form.append("doctorDegree", doctorDegree);
      form.append("activity", activity);
      form.append("inputNeeded", inputNeeded);
      form.append("consent", consent ? "true" : "false");
      form.append("voiceSeconds", String(voiceSeconds));
      form.append("photo", photoFile as File);
      form.append("voice", voiceBlob as Blob, "voice.webm");

      const res  = await fetch("/api/submit", { method: "POST", body: form });
      const json = await res.json();

      if (json.success) {
        setSubmitted(true);
      } else {
        setApiError(json.error || "Something went wrong. Please try again.");
      }
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
            ✓
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Submission received</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Doctor details, photo, and voice recording have been uploaded successfully.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-zinc-900">Doctor AI Video Onboarding</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Fill in the details below to onboard a doctor for AI video generation.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ABE Name" error={errors.abeName}>
            <input className={inputCls(errors.abeName)} value={abeName} onChange={(e) => setAbeName(e.target.value)} />
          </Field>

          <Field label="HQ" error={errors.hq}>
            <input className={inputCls(errors.hq)} value={hq} onChange={(e) => setHq(e.target.value)} />
          </Field>

          <Field label="EMP ID" error={errors.empId}>
            <input className={inputCls(errors.empId)} value={empId} onChange={(e) => setEmpId(e.target.value)} />
          </Field>

          <Field label="Zone" error={errors.zone}>
            <select className={inputCls(errors.zone)} value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="">Select zone</option>
              {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </Field>

          <Field label="Doctor's name to print" error={errors.doctorName}>
            <input className={inputCls(errors.doctorName)} value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
          </Field>

          <Field label="Doctor's degree to print" error={errors.doctorDegree}>
            <input className={inputCls(errors.doctorDegree)} value={doctorDegree} onChange={(e) => setDoctorDegree(e.target.value)} />
          </Field>

          <Field label="Activity" error={errors.activity}>
            <select className={inputCls(errors.activity)} value={activity} onChange={(e) => setActivity(e.target.value)}>
              <option value="">Select activity</option>
              {ACTIVITIES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>

          <Field label="Input Needed" error={errors.inputNeeded}>
            <select className={inputCls(errors.inputNeeded)} value={inputNeeded} onChange={(e) => setInputNeeded(e.target.value)}>
              <option value="">Select input</option>
              {INPUTS_NEEDED.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>
        </div>

        {/* Photo */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-zinc-700">Doctor's photo</label>
          <div className="mt-2 flex items-center gap-4">
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Doctor preview" className="h-16 w-16 rounded-full object-cover" />
            )}
            <input type="file" accept="image/*" onChange={handlePhoto}
              className="block text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-zinc-700" />
          </div>
          {errors.photo && <p className="mt-1 text-xs text-red-600">{errors.photo}</p>}
        </div>

        {/* Voice */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-zinc-700">
            Doctor's voice (minimum {MIN_VOICE_SECONDS} seconds)
          </label>
          <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 whitespace-pre-line">
            {VOICE_TEMPLATE}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {!recording ? (
              <button type="button" onClick={startRecording}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">
                {voiceBlob ? "Re-record" : "Start recording"}
              </button>
            ) : (
              <button type="button" onClick={stopRecording}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Stop ({voiceSeconds}s)
              </button>
            )}

            {!recording && voiceUrl && (
              <audio controls src={voiceUrl} className="h-9" />
            )}

            {!recording && voiceBlob && (
              <span className={`text-xs ${voiceSeconds >= MIN_VOICE_SECONDS ? "text-green-600" : "text-red-600"}`}>
                {voiceSeconds}s recorded
              </span>
            )}
          </div>
          {errors.voice && <p className="mt-1 text-xs text-red-600">{errors.voice}</p>}
        </div>

        {/* Consent */}
        <div className="mt-6">
          <label className="flex items-start gap-2 text-sm text-zinc-700">
            <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
I consent to my photo &amp; audio being used to generate an AI video
          </label>
          {errors.consent && <p className="mt-1 text-xs text-red-600">{errors.consent}</p>}
        </div>

        {apiError && <p className="mt-4 text-sm text-red-600">{apiError}</p>}

        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function inputCls(error?: string) {
  return `w-full rounded-md border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 ${
    error ? "border-red-400" : "border-zinc-300"
  }`;
}
