import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

function generateCardNumber() {
  const year = new Date().getFullYear();
  if (typeof window === "undefined") return `KMCR/${year}/0001`;

  const key = `kmcr_counter_${year}`;
  const current = Number(window.localStorage.getItem(key) || "0") + 1;
  window.localStorage.setItem(key, String(current));

  return `KMCR/${year}/${String(current).padStart(4, "0")}`;
}

function getTodayFormatted() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  return `${d}-${m}-${y}`;
}

function getCurrentTimeFormatted() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function displayDateToInputValue(displayDate) {
  if (!displayDate) return "";
  const parts = displayDate.split("-");
  if (parts.length !== 3) return "";
  const [d, m, y] = parts;
  return `${y}-${m}-${d}`;
}

function inputDateToDisplayValue(inputDate) {
  if (!inputDate) return "";
  const parts = inputDate.split("-");
  if (parts.length !== 3) return "";
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
}

function createInitialForm() {
  return {
    numerKarty: generateCardNumber(),
    data: getTodayFormatted(),
    godzina: getCurrentTimeFormatted(),
    miejsce: "",
    zespol: "",
    typZdarzenia: "ogolne",
    priorytet: "",
    powodWezwania: "",
    danePacjenta: {
      imieNazwisko: "",
      wiek: "",
      pesel: "",
      plec: "",
      adres: "",
    },
    sample: {
      s: "",
      a: "",
      m: "",
      p: "",
      l: "",
      e: "",
    },
    badanie: {
      swiadomosc: "",
      airway: "",
      breathing: "",
      circulation: "",
      disability: "",
      exposure: "",
      glasgow: "",
      gcsEye: "",
      gcsVerbal: "",
      gcsMotor: "",
      bol: "",
    },
    parametry: {
      cisnienie: "",
      tetno: "",
      spo2: "",
      oddechy: "",
      glikemia: "",
      temperatura: "",
      etco2: "",
      ekg: "",
    },
    uraz: {
      mechanizm: "",
      lokalizacja: "",
      skala: "",
    },
    postepowanie: {
      tlenoterapia: "",
      dostep: "",
      leki: "",
      plyny: "",
      procedury: "",
      zalecenia: "",
    },
    transport: {
      decyzja: "",
      miejsceDocelowe: "",
      pozycja: "",
      przekazanie: "",
    },
    notatki: "",
  };
}

const initial = createInitialForm();
const STORAGE_CURRENT = "kmcr-current-form";
const STORAGE_HISTORY = "kmcr-saved-cards";

function safeValue(value, fallback = "...") {
  if (value === undefined || value === null) return fallback;
  const normalized = String(value).trim();
  return normalized ? normalized : fallback;
}

function calculateGCS(badanie) {
  const eye = Number(badanie.gcsEye || 0);
  const verbal = Number(badanie.gcsVerbal || 0);
  const motor = Number(badanie.gcsMotor || 0);
  const total = eye + verbal + motor;
  return total > 0 ? String(total) : "";
}

function buildGeneratedText(form) {
  const p = form.danePacjenta;
  const s = form.sample;
  const b = form.badanie;
  const v = form.parametry;
  const u = form.uraz;
  const x = form.postepowanie;
  const t = form.transport;

  return [
    `KARTA KMCR nr ${safeValue(form.numerKarty)}`,
    `Data/godzina: ${safeValue(form.data)} ${safeValue(form.godzina)}`,
    `Miejsce: ${safeValue(form.miejsce)}`,
    `Zespół: ${safeValue(form.zespol)}`,
    `Typ zdarzenia: ${safeValue(form.typZdarzenia)}`,
    `Priorytet: ${safeValue(form.priorytet)}`,
    `Powód wezwania: ${safeValue(form.powodWezwania)}`,
    `Pacjent: ${safeValue(p.imieNazwisko)}, wiek: ${safeValue(p.wiek)}, PESEL: ${safeValue(p.pesel)}, płeć: ${safeValue(p.plec)}, adres: ${safeValue(p.adres)}`,
    `SAMPLE: S - ${safeValue(s.s, "brak danych")}; A - ${safeValue(s.a, "brak danych")}; M - ${safeValue(s.m, "brak danych")}; P - ${safeValue(s.p, "brak danych")}; L - ${safeValue(s.l, "brak danych")}; E - ${safeValue(s.e, "brak danych")}`,
    `ABCDE: A - ${safeValue(b.airway)}; B - ${safeValue(b.breathing)}; C - ${safeValue(b.circulation)}; D - ${safeValue(b.disability)}; E - ${safeValue(b.exposure)}`,
    `Stan ogólny: świadomość ${safeValue(b.swiadomosc)}, GCS ${safeValue(b.glasgow)}, ból ${safeValue(b.bol)}`,
    `Parametry: RR ${safeValue(v.cisnienie)} mmHg, HR ${safeValue(v.tetno)}/min, SpO2 ${safeValue(v.spo2)}%, oddechy ${safeValue(v.oddechy)}/min, glikemia ${safeValue(v.glikemia)}, temp. ${safeValue(v.temperatura)}°C, EtCO2 ${safeValue(v.etco2)}, EKG ${safeValue(v.ekg)}`,
    `Uraz: mechanizm ${safeValue(u.mechanizm, "nie dotyczy")}, lokalizacja ${safeValue(u.lokalizacja, "nie dotyczy")}, skala ${safeValue(u.skala, "nie dotyczy")}`,
    `Postępowanie: tlenoterapia ${safeValue(x.tlenoterapia, "nie wdrożono")}; dostęp ${safeValue(x.dostep, "brak")}; leki ${safeValue(x.leki, "nie podano")}; płyny ${safeValue(x.plyny, "nie podano")}; procedury ${safeValue(x.procedury, "brak")}; zalecenia ${safeValue(x.zalecenia, "brak")}`,
    `Transport: ${safeValue(t.decyzja)}; miejsce docelowe: ${safeValue(t.miejsceDocelowe)}; pozycja: ${safeValue(t.pozycja)}; przekazanie: ${safeValue(t.przekazanie)}`,
    `Notatki: ${safeValue(form.notatki, "brak")}`,
  ].join("\n");
}

function getSavedCards() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_HISTORY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCards(cards) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_HISTORY, JSON.stringify(cards));
}

function saveCurrentForm(form) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_CURRENT, JSON.stringify(form));
}

function loadCurrentForm() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_CURRENT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function copyTextWithFallback(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: "clipboard" };
    } catch {
      // fallback below
    }
  }

  if (typeof document === "undefined") {
    return { ok: false, method: "none", error: new Error("Brak document") };
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.left = "-1000px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = typeof document.execCommand === "function" && document.execCommand("copy");
    document.body.removeChild(textarea);

    return copied ? { ok: true, method: "execCommand" } : { ok: false, method: "manual" };
  } catch (error) {
    return { ok: false, method: "manual", error };
  }
}

function downloadPdf(title, text) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  const lines = doc.splitTextToSize(text, maxWidth);
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  lines.forEach((line) => {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5;
  });

  doc.save(`${title.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`);
}

function runTests() {
  const example = {
    ...createInitialForm(),
    numerKarty: "KMCR/03/2026/001",
    data: "2026-03-10",
    godzina: "21:30",
    miejsce: "Siemianowice Śląskie",
    zespol: "ZRM P0123",
    powodWezwania: "Ból w klatce piersiowej",
    danePacjenta: {
      ...initial.danePacjenta,
      imieNazwisko: "Jan Kowalski",
      wiek: "54",
    },
    badanie: {
      ...initial.badanie,
      gcsEye: "4",
      gcsVerbal: "5",
      gcsMotor: "6",
      glasgow: "15",
    },
    sample: {
      ...initial.sample,
      s: "Ból zamostkowy",
    },
  };

  const generated = buildGeneratedText(example);

  return [
    { name: "Generowanie numeru karty", pass: generated.includes("KARTA KMCR nr KMCR/03/2026/001") },
    { name: "Fallback dla pustych pól", pass: buildGeneratedText({ ...initial, numerKarty: "" }).includes("KARTA KMCR nr ...") },
    { name: "Dane pacjenta trafiają do opisu", pass: generated.includes("Pacjent: Jan Kowalski, wiek: 54") },
    { name: "SAMPLE trafia do opisu", pass: generated.includes("SAMPLE: S - Ból zamostkowy") },
    { name: "Wynik jest tekstem wieloliniowym", pass: generated.split("\n").length > 10 },
    { name: "GCS sumuje się poprawnie", pass: calculateGCS(example.badanie) === "15" },
    { name: "Konwersja daty do input działa", pass: displayDateToInputValue("10-03-2026") === "2026-03-10" },
    { name: "Konwersja daty z input działa", pass: inputDateToDisplayValue("2026-03-10") === "10-03-2026" },
    { name: "Historia kart jest tablicą", pass: Array.isArray(getSavedCards()) },
  ];
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "Inter, Arial, sans-serif", padding: 16 },
  container: { maxWidth: 1500, margin: "0 auto" },
  topBar: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, marginBottom: 20 },
  title: { margin: 0, fontSize: 34, fontWeight: 800 },
  subtitle: { margin: "6px 0 0", color: "#475569" },
  buttonRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  button: { border: "1px solid #cbd5e1", background: "white", padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontWeight: 600 },
  dangerButton: { border: "1px solid #fecaca", background: "#ef4444", color: "white", padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontWeight: 700 },
  mutedButton: { border: "1px solid #bfdbfe", background: "#eff6ff", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 600 },
  infoBox: { borderRadius: 16, padding: 14, marginBottom: 18, border: "1px solid #fcd34d", background: "#fef3c7" },
  successBox: { borderRadius: 16, padding: 14, marginBottom: 18, border: "1px solid #86efac", background: "#dcfce7" },
  layout: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" },
  card: { background: "white", border: "1px solid #e2e8f0", borderRadius: 20, boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)", overflow: "hidden" },
  cardHeader: { padding: "18px 20px 8px", borderBottom: "1px solid #f1f5f9" },
  cardTitle: { margin: 0, fontSize: 20, fontWeight: 800 },
  cardBody: { padding: 20 },
  fieldGrid2: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 },
  fieldGrid3: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 },
  fieldGrid4: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 14, fontWeight: 700 },
  subLabel: { fontSize: 12, fontWeight: 600, color: "#64748b" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 12px", fontSize: 14, background: "white" },
  textarea: { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 12, padding: "10px 12px", fontSize: 14, resize: "vertical", minHeight: 110, background: "white" },
  tabs: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  tab: { border: "1px solid #cbd5e1", background: "white", borderRadius: 999, padding: "10px 14px", cursor: "pointer", fontWeight: 700 },
  tabActive: { border: "1px solid #0f172a", background: "#0f172a", color: "white", borderRadius: 999, padding: "10px 14px", cursor: "pointer", fontWeight: 700 },
  rightSticky: { position: "sticky", top: 16 },
  badge: { fontSize: 12, padding: "5px 10px", borderRadius: 999, background: "#e2e8f0", fontWeight: 700 },
  row: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  hint: { fontSize: 12, color: "#64748b", marginTop: 4 },
  testsList: { display: "flex", flexDirection: "column", gap: 8 },
  testOk: { color: "#166534", fontWeight: 600 },
  testBad: { color: "#b91c1c", fontWeight: 600 },
  historyItem: { border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8 },
  historyMeta: { fontSize: 12, color: "#64748b" },
};

function Field({ label, value, onChange, placeholder, type = "text", readOnly = false }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input style={styles.input} type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} />
    </div>
  );
}

function Area({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <textarea style={styles.textarea} value={value} onChange={onChange} placeholder={placeholder} rows={rows} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <select style={styles.input} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder || "Wybierz"}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function KMCRKarta() {
  const [form, setForm] = useState(() => loadCurrentForm() || createInitialForm());
  const [copyStatus, setCopyStatus] = useState({ type: "idle", message: "" });
  const [activeTab, setActiveTab] = useState("dane");
  const [savedCards, setSavedCards] = useState(() => getSavedCards());
  const tests = useMemo(() => runTests(), []);

  const setTop = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const setNested = (section, key, value) => setForm((p) => ({ ...p, [section]: { ...p[section], [key]: value } }));

  const gcsScore = useMemo(() => calculateGCS(form.badanie), [form.badanie]);

  const normalizedForm = useMemo(() => ({
    ...form,
    badanie: {
      ...form.badanie,
      glasgow: gcsScore,
    },
  }), [form, gcsScore]);

  const generatedText = useMemo(() => buildGeneratedText(normalizedForm), [normalizedForm]);

  useEffect(() => {
    saveCurrentForm(normalizedForm);
  }, [normalizedForm]);

  const copyToClipboard = async () => {
    const result = await copyTextWithFallback(generatedText);
    if (result.ok) {
      setCopyStatus({ type: "success", message: result.method === "clipboard" ? "Skopiowano do schowka." : "Skopiowano metodą zapasową." });
      return;
    }
    setCopyStatus({ type: "warning", message: "Automatyczne kopiowanie jest zablokowane. Zaznacz tekst ręcznie i użyj Ctrl+C." });
  };

  const saveJson = () => {
    const blob = new Blob([JSON.stringify(normalizedForm, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kmcr-${normalizedForm.numerKarty || "karta"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveCardToHistory = () => {
    const summary = `${safeValue(normalizedForm.powodWezwania, "Brak powodu wezwania")} • ${safeValue(normalizedForm.miejsce, "Brak miejsca")}`;
    const card = {
      id: `${normalizedForm.numerKarty}-${Date.now()}`,
      savedAt: new Date().toISOString(),
      numerKarty: normalizedForm.numerKarty,
      data: normalizedForm.data,
      godzina: normalizedForm.godzina,
      patient: normalizedForm.danePacjenta.imieNazwisko || "Pacjent NN",
      summary,
      form: normalizedForm,
      text: generatedText,
    };

    const filtered = savedCards.filter((item) => item.numerKarty !== normalizedForm.numerKarty);
    const next = [card, ...filtered].slice(0, 50);
    setSavedCards(next);
    saveCards(next);
    setCopyStatus({ type: "success", message: `Zapisano kartę ${normalizedForm.numerKarty} w historii.` });
  };

  const loadSavedCard = (card) => {
    setForm(card.form);
    setActiveTab("dane");
    setCopyStatus({ type: "success", message: `Wczytano kartę ${card.numerKarty}.` });
  };

  const deleteSavedCard = (id) => {
    const next = savedCards.filter((card) => card.id !== id);
    setSavedCards(next);
    saveCards(next);
  };

  const exportCurrentPdf = () => {
    downloadPdf(normalizedForm.numerKarty || "KMCR", generatedText);
    setCopyStatus({ type: "success", message: "Wygenerowano PDF bieżącej karty." });
  };

  const exportSavedPdf = (card) => {
    downloadPdf(card.numerKarty || "KMCR", card.text);
  };

  const reset = () => {
    const fresh = createInitialForm();
    setForm(fresh);
    setCopyStatus({ type: "idle", message: "" });
    setActiveTab("dane");
  };

  const renderDane = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}><h2 style={styles.cardTitle}>Dane wyjazdu</h2></div>
      <div style={styles.cardBody}>
        <div style={styles.fieldGrid2}>
          <Field label="Numer karty" value={form.numerKarty} onChange={(e) => setTop("numerKarty", e.target.value)} placeholder="np. KMCR/2026/0001" />
          <Field label="Zespół" value={form.zespol} onChange={(e) => setTop("zespol", e.target.value)} placeholder="np. ZRM P0123" />

          <div style={styles.field}>
            <label style={styles.label}>Data</label>
            <div style={styles.row}>
              <input style={styles.input} type="date" value={displayDateToInputValue(form.data)} onChange={(e) => setTop("data", inputDateToDisplayValue(e.target.value))} />
              <button style={styles.button} type="button" onClick={() => setTop("data", getTodayFormatted())}>Dziś</button>
            </div>
            <div style={styles.hint}>Format zapisu: dd-mm-rrrr</div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Godzina</label>
            <div style={styles.row}>
              <input style={styles.input} type="time" value={form.godzina} onChange={(e) => setTop("godzina", e.target.value)} />
              <button style={styles.button} type="button" onClick={() => setTop("godzina", getCurrentTimeFormatted())}>Teraz</button>
            </div>
          </div>

          <Field label="Miejsce zdarzenia" value={form.miejsce} onChange={(e) => setTop("miejsce", e.target.value)} placeholder="Adres lub lokalizacja" />
          <SelectField label="Priorytet" value={form.priorytet} onChange={(v) => setTop("priorytet", v)} placeholder="Wybierz priorytet" options={[{ value: "K1", label: "K1" }, { value: "K2", label: "K2" }]} />
          <SelectField label="Typ zdarzenia" value={form.typZdarzenia} onChange={(v) => setTop("typZdarzenia", v)} options={[
            { value: "ogolne", label: "Ogólne" },
            { value: "uraz", label: "Uraz" },
            { value: "klp", label: "Ból w klatce" },
            { value: "dusznosc", label: "Duszność" },
            { value: "udar", label: "Podejrzenie udaru" },
            { value: "nagłe-zatrzymanie", label: "NZK / RKO" },
            { value: "drgawki", label: "Drgawki" },
            { value: "omdlenie", label: "Omdlenie / zasłabnięcie" },
          ]} />
        </div>
        <div style={{ marginTop: 14 }}>
          <Area label="Powód wezwania" value={form.powodWezwania} onChange={(e) => setTop("powodWezwania", e.target.value)} placeholder="Co zastano na miejscu, zgłoszenie, główny problem" rows={4} />
        </div>
      </div>
    </div>
  );

  const renderPacjent = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}><h2 style={styles.cardTitle}>Dane pacjenta</h2></div>
      <div style={styles.cardBody}>
        <div style={styles.fieldGrid2}>
          <Field label="Imię i nazwisko" value={form.danePacjenta.imieNazwisko} onChange={(e) => setNested("danePacjenta", "imieNazwisko", e.target.value)} placeholder="Pacjent NN / dane" />
          <Field label="Wiek" value={form.danePacjenta.wiek} onChange={(e) => setNested("danePacjenta", "wiek", e.target.value)} placeholder="np. 54" />
          <Field label="PESEL" value={form.danePacjenta.pesel} onChange={(e) => setNested("danePacjenta", "pesel", e.target.value)} placeholder="opcjonalnie" />
          <Field label="Płeć" value={form.danePacjenta.plec} onChange={(e) => setNested("danePacjenta", "plec", e.target.value)} placeholder="K / M" />
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label="Adres" value={form.danePacjenta.adres} onChange={(e) => setNested("danePacjenta", "adres", e.target.value)} placeholder="Adres pacjenta" />
        </div>
      </div>
    </div>
  );

  const renderSample = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}><h2 style={styles.cardTitle}>SAMPLE</h2></div>
      <div style={styles.cardBody}>
        <div style={{ display: "grid", gap: 14 }}>
          <Area label="S – objawy" value={form.sample.s} onChange={(e) => setNested("sample", "s", e.target.value)} placeholder="Objawy" />
          <Area label="A – alergie" value={form.sample.a} onChange={(e) => setNested("sample", "a", e.target.value)} placeholder="Alergie" />
          <Area label="M – leki" value={form.sample.m} onChange={(e) => setNested("sample", "m", e.target.value)} placeholder="Leki" />
          <Area label="P – przebyte choroby" value={form.sample.p} onChange={(e) => setNested("sample", "p", e.target.value)} placeholder="Choroby" />
          <Area label="L – ostatni posiłek" value={form.sample.l} onChange={(e) => setNested("sample", "l", e.target.value)} placeholder="Ostatni posiłek" />
          <Area label="E – wydarzenia poprzedzające" value={form.sample.e} onChange={(e) => setNested("sample", "e", e.target.value)} placeholder="Wydarzenia poprzedzające" />
        </div>
      </div>
    </div>
  );

  const renderABCDE = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}><h2 style={styles.cardTitle}>Badanie i parametry</h2></div>
      <div style={styles.cardBody}>
        <div style={styles.fieldGrid2}>
          <Field label="Świadomość" value={form.badanie.swiadomosc} onChange={(e) => setNested("badanie", "swiadomosc", e.target.value)} placeholder="np. przytomny, logiczny" />
          <Field label="Ból (NRS)" value={form.badanie.bol} onChange={(e) => setNested("badanie", "bol", e.target.value)} placeholder="0-10" />
          <Field label="A – drożność" value={form.badanie.airway} onChange={(e) => setNested("badanie", "airway", e.target.value)} placeholder="drożne / zagrożone" />
          <Field label="B – oddech" value={form.badanie.breathing} onChange={(e) => setNested("badanie", "breathing", e.target.value)} placeholder="wydolny / duszność / świsty" />
          <Field label="C – krążenie" value={form.badanie.circulation} onChange={(e) => setNested("badanie", "circulation", e.target.value)} placeholder="skóra, tętno, perfuzja" />
          <Field label="D – neurologia" value={form.badanie.disability} onChange={(e) => setNested("badanie", "disability", e.target.value)} placeholder="AVPU, objawy ogniskowe" />
          <Field label="E – ekspozycja" value={form.badanie.exposure} onChange={(e) => setNested("badanie", "exposure", e.target.value)} placeholder="urazy, temperatura, wysypka" />
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={styles.label}>GCS</div>
          <div style={{ ...styles.fieldGrid4, marginTop: 8 }}>
            <div style={styles.field}>
              <label style={styles.subLabel}>Oczy (E)</label>
              <select style={styles.input} value={form.badanie.gcsEye} onChange={(e) => setNested("badanie", "gcsEye", e.target.value)}>
                <option value="">E</option>
                <option value="4">4 - spontanicznie</option>
                <option value="3">3 - na głos</option>
                <option value="2">2 - na ból</option>
                <option value="1">1 - brak</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.subLabel}>Słowna (V)</label>
              <select style={styles.input} value={form.badanie.gcsVerbal} onChange={(e) => setNested("badanie", "gcsVerbal", e.target.value)}>
                <option value="">V</option>
                <option value="5">5 - zorientowany</option>
                <option value="4">4 - splątany</option>
                <option value="3">3 - nieadekwatne słowa</option>
                <option value="2">2 - niezrozumiałe dźwięki</option>
                <option value="1">1 - brak</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.subLabel}>Ruchowa (M)</label>
              <select style={styles.input} value={form.badanie.gcsMotor} onChange={(e) => setNested("badanie", "gcsMotor", e.target.value)}>
                <option value="">M</option>
                <option value="6">6 - wykonuje polecenia</option>
                <option value="5">5 - lokalizuje ból</option>
                <option value="4">4 - reakcja obronna</option>
                <option value="3">3 - zgięciowa patologiczna</option>
                <option value="2">2 - wyprostna patologiczna</option>
                <option value="1">1 - brak</option>
              </select>
            </div>
            <Field label="Wynik" value={gcsScore} readOnly placeholder="Auto" />
          </div>
        </div>

        <div style={{ ...styles.fieldGrid4, marginTop: 18 }}>
          <Field label="Ciśnienie" value={form.parametry.cisnienie} onChange={(e) => setNested("parametry", "cisnienie", e.target.value)} placeholder="np. 128/76" />
          <Field label="Tętno" value={form.parametry.tetno} onChange={(e) => setNested("parametry", "tetno", e.target.value)} placeholder="/min" />
          <Field label="SpO₂" value={form.parametry.spo2} onChange={(e) => setNested("parametry", "spo2", e.target.value)} placeholder="%" />
          <Field label="Oddechy" value={form.parametry.oddechy} onChange={(e) => setNested("parametry", "oddechy", e.target.value)} placeholder="/min" />
          <Field label="Glikemia" value={form.parametry.glikemia} onChange={(e) => setNested("parametry", "glikemia", e.target.value)} placeholder="mg/dl lub mmol/l" />
          <Field label="Temperatura" value={form.parametry.temperatura} onChange={(e) => setNested("parametry", "temperatura", e.target.value)} placeholder="°C" />
          <Field label="EtCO₂" value={form.parametry.etco2} onChange={(e) => setNested("parametry", "etco2", e.target.value)} placeholder="mmHg" />
          <Field label="EKG" value={form.parametry.ekg} onChange={(e) => setNested("parametry", "ekg", e.target.value)} placeholder="np. SR 78/min" />
        </div>

        <div style={{ ...styles.fieldGrid3, marginTop: 18 }}>
          <Field label="Mechanizm urazu" value={form.uraz.mechanizm} onChange={(e) => setNested("uraz", "mechanizm", e.target.value)} placeholder="jeśli dotyczy" />
          <Field label="Lokalizacja urazu" value={form.uraz.lokalizacja} onChange={(e) => setNested("uraz", "lokalizacja", e.target.value)} placeholder="jeśli dotyczy" />
          <Field label="Skala urazu" value={form.uraz.skala} onChange={(e) => setNested("uraz", "skala", e.target.value)} placeholder="np. brak / lekki / ciężki" />
        </div>
      </div>
    </div>
  );

  const renderTerapia = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}><h2 style={styles.cardTitle}>Postępowanie</h2></div>
      <div style={styles.cardBody}>
        <div style={styles.fieldGrid2}>
          <Field label="Tlenoterapia" value={form.postepowanie.tlenoterapia} onChange={(e) => setNested("postepowanie", "tlenoterapia", e.target.value)} placeholder="np. maska 10 l/min" />
          <Field label="Dostęp" value={form.postepowanie.dostep} onChange={(e) => setNested("postepowanie", "dostep", e.target.value)} placeholder="IV / IO / brak" />
          <Area label="Leki" value={form.postepowanie.leki} onChange={(e) => setNested("postepowanie", "leki", e.target.value)} placeholder="Nazwa, dawka, droga, godzina" />
          <Area label="Płyny" value={form.postepowanie.plyny} onChange={(e) => setNested("postepowanie", "plyny", e.target.value)} placeholder="Rodzaj, objętość, tempo" />
          <Area label="Procedury" value={form.postepowanie.procedury} onChange={(e) => setNested("postepowanie", "procedury", e.target.value)} placeholder="np. 12-odprowadzeniowe EKG, unieruchomienie, RKO" />
          <Area label="Zalecenia / decyzje" value={form.postepowanie.zalecenia} onChange={(e) => setNested("postepowanie", "zalecenia", e.target.value)} placeholder="Dalsze postępowanie" />
        </div>
      </div>
    </div>
  );

  const renderTransport = () => (
    <div style={styles.card}>
      <div style={styles.cardHeader}><h2 style={styles.cardTitle}>Transport i przekazanie</h2></div>
      <div style={styles.cardBody}>
        <div style={styles.fieldGrid2}>
          <Field label="Decyzja" value={form.transport.decyzja} onChange={(e) => setNested("transport", "decyzja", e.target.value)} placeholder="transport / odmowa / pozostawienie" />
          <Field label="Miejsce docelowe" value={form.transport.miejsceDocelowe} onChange={(e) => setNested("transport", "miejsceDocelowe", e.target.value)} placeholder="SOR / IP / pozostawiono" />
          <Field label="Pozycja transportowa" value={form.transport.pozycja} onChange={(e) => setNested("transport", "pozycja", e.target.value)} placeholder="siedząca / leżąca / na noszach" />
          <Field label="Przekazanie" value={form.transport.przekazanie} onChange={(e) => setNested("transport", "przekazanie", e.target.value)} placeholder="komu i gdzie przekazano" />
        </div>
        <div style={{ marginTop: 14 }}>
          <Area label="Dodatkowe notatki" value={form.notatki} onChange={(e) => setTop("notatki", e.target.value)} placeholder="Wolne uwagi, odstępstwa, obserwacje" rows={5} />
        </div>
      </div>
    </div>
  );

  const tabs = [
    { key: "dane", label: "Dane" },
    { key: "pacjent", label: "Pacjent" },
    { key: "sample", label: "SAMPLE" },
    { key: "abcde", label: "ABCDE" },
    { key: "terapia", label: "Terapia" },
    { key: "transport", label: "Transport" },
  ];

  const tabRenderers = { dane: renderDane, pacjent: renderPacjent, sample: renderSample, abcde: renderABCDE, terapia: renderTerapia, transport: renderTransport };
  const CurrentTab = tabRenderers[activeTab];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.title}>Karta KMCR</h1>
            <p style={styles.subtitle}>Wersja z historią kart i eksportem PDF.</p>
          </div>
          <div style={styles.buttonRow}>
            <button style={styles.button} onClick={copyToClipboard}>Kopiuj</button>
            <button style={styles.button} onClick={saveJson}>Zapisz JSON</button>
            <button style={styles.button} onClick={saveCardToHistory}>Zapisz kartę</button>
            <button style={styles.button} onClick={exportCurrentPdf}>Eksport PDF</button>
            <button style={styles.button} onClick={() => window.print()}>Drukuj</button>
            <button style={styles.dangerButton} onClick={reset}>Nowa karta</button>
          </div>
        </div>

        {copyStatus.message ? <div style={copyStatus.type === "success" ? styles.successBox : styles.infoBox}>{copyStatus.message}</div> : null}

        <div style={styles.layout}>
          <div>
            <div style={styles.tabs}>
              {tabs.map((tab) => (
                <button key={tab.key} style={activeTab === tab.key ? styles.tabActive : styles.tab} onClick={() => setActiveTab(tab.key)}>
                  {tab.label}
                </button>
              ))}
            </div>
            <CurrentTab />
          </div>

          <div style={styles.rightSticky}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <h2 style={styles.cardTitle}>Podgląd opisu</h2>
                  <span style={styles.badge}>live</span>
                </div>
              </div>
              <div style={styles.cardBody}>
                <textarea style={{ ...styles.textarea, minHeight: 320, fontFamily: "ui-monospace, monospace", fontSize: 12 }} value={generatedText} readOnly />
                <div style={styles.hint}>Jeżeli schowek jest zablokowany, zaznacz tekst ręcznie i użyj Ctrl+C.</div>
              </div>
            </div>

            <div style={{ ...styles.card, marginTop: 20 }}>
              <div style={styles.cardHeader}><h2 style={styles.cardTitle}>Historia kart</h2></div>
              <div style={styles.cardBody}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {savedCards.length === 0 ? <div style={styles.hint}>Brak zapisanych kart.</div> : null}
                  {savedCards.map((card) => (
                    <div key={card.id} style={styles.historyItem}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{card.numerKarty}</div>
                        <div style={styles.historyMeta}>{card.patient} • {card.data} {card.godzina}</div>
                        <div style={styles.historyMeta}>{card.summary}</div>
                      </div>
                      <div style={styles.row}>
                        <button style={styles.mutedButton} onClick={() => loadSavedCard(card)}>Wczytaj</button>
                        <button style={styles.mutedButton} onClick={() => exportSavedPdf(card)}>PDF</button>
                        <button style={styles.mutedButton} onClick={() => deleteSavedCard(card.id)}>Usuń</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ ...styles.card, marginTop: 20 }}>
              <div style={styles.cardHeader}><h2 style={styles.cardTitle}>Testy wbudowane</h2></div>
              <div style={styles.cardBody}>
                <div style={styles.testsList}>
                  {tests.map((test) => (
                    <div key={test.name} style={test.pass ? styles.testOk : styles.testBad}>
                      {test.pass ? "✓" : "✗"} {test.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
