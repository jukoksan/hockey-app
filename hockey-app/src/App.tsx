import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Plus, Trash2, Save, Users, ArrowLeftRight, PlusCircle, MinusCircle, RefreshCcw } from "lucide-react";

// Jääkiekkojoukkue – kentälliset & tulostaulu
// – Syötä 7–15 pelaajaa, joista 1 on maalivahti
// – Muodosta kentällinen (3 tai 4 pelaajaa / kenttä, ilman maalivahtia)
// – Maalivahti ei vaihdu kentällisissä
// – Pelaajia voidaan siirtää kentästä toiseen kesken pelin (drag & drop tai napista)
// – Pidä kirjaa tehtyjen ja päästettyjen maalien määrästä (± ja nollaus)
// – Tallennus localStorageen
// – Vienti/tuonti (JSON) + nimilista CSV:stä

// Pieni apu-tyyppi
type Player = { id: string; name: string; role: "G" | "S" };

export default function App() {
  // --- Perustila ---
  const [players, setPlayers] = useState<Player[]>([]); // sisältää maalivahdin ja kenttäpelaajat
  const [goalieId, setGoalieId] = useState<string | null>(null);
  const [lineSize, setLineSize] = useState<3 | 4>(3);
  const [lines, setLines] = useState<string[][]>([]); // pelaaja-id:t per kenttä (vain kenttäpelaajat)
  const [bench, setBench] = useState<string[]>([]); // pelaaja-id:t (varalla/penkillä)
  const [gf, setGf] = useState(0); // tehdyt
  const [ga, setGa] = useState(0); // päästetyt

  // --- Lataa ja tallenna localStorageen ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hockey_app_state_v1");
      if (raw) {
        const s = JSON.parse(raw);
        setPlayers(s.players || []);
        setGoalieId(s.goalieId || null);
        setLineSize(s.lineSize === 4 ? 4 : 3);
        setLines(s.lines || []);
        setBench(s.bench || []);
        setGf(typeof s.gf === "number" ? s.gf : 0);
        setGa(typeof s.ga === "number" ? s.ga : 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const payload = { players, goalieId, lineSize, lines, bench, gf, ga };
    localStorage.setItem("hockey_app_state_v1", JSON.stringify(payload));
  }, [players, goalieId, lineSize, lines, bench, gf, ga]);

  // --- Syöttö: bulk-nimet ---
  const [bulkNames, setBulkNames] = useState("");
  const addBulk = () => {
    const names = bulkNames
      .split(/\n|,|;/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (!names.length) return;
    const newPlayers: Player[] = names.map((n) => ({ id: crypto.randomUUID(), name: n, role: "S" }));
    setPlayers((p) => [...p, ...newPlayers]);
    setBulkNames("");
  };

  const removePlayer = (id: string) => {
    // Estä maalivahdin poisto jos valittuna
    if (id === goalieId) setGoalieId(null);
    setPlayers((p) => p.filter((x) => x.id !== id));
    setLines((LL) => LL.map((L) => L.filter((pid) => pid !== id)));
    setBench((B) => B.filter((pid) => pid !== id));
  };

  const candidateGoalies = useMemo(() => players, [players]);

  const setGoalie = (id: string) => {
    setGoalieId(id);
    // varmista että MV ei ole riveissä/penkillä
    setLines((LL) => LL.map((L) => L.filter((pid) => pid !== id)));
    setBench((B) => B.filter((pid) => pid !== id));
    setPlayers((p) =>
      p.map((pl) => (pl.id === id ? { ...pl, role: "G" } : { ...pl, role: pl.role === "G" ? "S" : pl.role })),
    );
  };

  // Käytettävissä olevat kenttäpelaajat (ei MV)
  const skaters = useMemo(() => players.filter((p) => p.id !== goalieId), [players, goalieId]);

  // Jaa skaterit kenttiin tasaisesti
  const autoLines = () => {
    const ids = skaters.map((s) => s.id);
    const numLines = Math.ceil(ids.length / lineSize) || 1;
    const newLines: string[][] = Array.from({ length: numLines }, () => []);
    ids.forEach((id, i) => {
      newLines[i % numLines].push(id);
    });
    const trimmed = newLines.map((L) => L.slice(0, lineSize));
    const used = new Set(trimmed.flat());
    const newBench = ids.filter((id) => !used.has(id));
    setLines(trimmed);
    setBench(newBench);
  };

  // Vaihda kentän kokoluokkaa
  const changeLineSize = (size: 3 | 4) => {
    setLineSize(size);
    // pakota uudelleenjako, jotta kentät eivät ylitä kokoa
    setTimeout(autoLines, 0);
  };

  // --- Drag & Drop ---
  const dragDataRef = useRef<{ playerId: string; from: string } | null>(null);
  const onDragStart = (playerId: string, from: string) => (e: React.DragEvent) => {
    dragDataRef.current = { playerId, from };
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const dropToBench = () => {
    const data = dragDataRef.current;
    if (!data) return;
    const { playerId, from } = data;
    if (playerId === goalieId) return;
    if (from.startsWith("line:")) {
      const idx = parseInt(from.split(":")[1]!, 10);
      setLines((LL) => LL.map((L, i) => (i === idx ? L.filter((id) => id !== playerId) : L)));
    } else {
      setBench((B) => B.filter((id) => id !== playerId));
    }
    setBench((B) => (B.includes(playerId) ? B : [...B, playerId]));
    dragDataRef.current = null;
  };
  const dropToLine = (lineIdx: number) => () => {
    const data = dragDataRef.current;
    if (!data) return;
    const { playerId, from } = data;
    if (playerId === goalieId) return;
    // Poista lähteestä
    if (from.startsWith("line:")) {
      const src = parseInt(from.split(":")[1]!, 10);
      setLines((LL) => LL.map((L, i) => (i === src ? L.filter((id) => id !== playerId) : L)));
    } else {
      setBench((B) => B.filter((id) => id !== playerId));
    }
    // Lisää kohteeseen, jos tilaa; jos täynnä, siirrä vanhin penkille
    setLines((LL) => {
      const L = [...LL];
      const target = [...(L[lineIdx] || [])];
      if (target.includes(playerId)) return L;
      target.push(playerId);
      let overflow: string[] = [];
      while (target.length > lineSize) {
        overflow.push(target.shift()!);
      }
      L[lineIdx] = target;
      if (overflow.length) setBench((B) => [...B, ...overflow.filter((id) => !B.includes(id))]);
      return L;
    });
    dragDataRef.current = null;
  };

  const removeFromLine = (lineIdx: number, playerId: string) => {
    setLines((LL) => LL.map((L, i) => (i === lineIdx ? L.filter((id) => id !== playerId) : L)));
    setBench((B) => (B.includes(playerId) ? B : [...B, playerId]));
  };

  const addToLine = (lineIdx: number, playerId: string) => {
    if (playerId === goalieId) return;
    setBench((B) => B.filter((id) => id !== playerId));
    setLines((LL) => {
      const L = [...LL];
      const target = [...(L[lineIdx] || [])];
      if (target.includes(playerId)) return L;
      target.push(playerId);
      if (target.length > lineSize) {
        const overflow = target.shift()!; // siirrä vanhin penkille
        setBench((B) => [...B, overflow]);
      }
      L[lineIdx] = target;
      return L;
    });
  };

  // --- Import/Export ---
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const exportState = () => {
    const data = { players, goalieId, lineSize, lines, bench, gf, ga };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kokoonpano_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const s = JSON.parse(text);
      if (!Array.isArray(s.players)) throw new Error("Virheellinen tiedosto");
      setPlayers(s.players);
      setGoalieId(s.goalieId || null);
      setLineSize(s.lineSize === 4 ? 4 : 3);
      setLines(Array.isArray(s.lines) ? s.lines : []);
      setBench(Array.isArray(s.bench) ? s.bench : []);
      setGf(typeof s.gf === "number" ? s.gf : 0);
      setGa(typeof s.ga === "number" ? s.ga : 0);
    } catch (e) {
      alert("JSON-tuonti epäonnistui: " + (e as Error).message);
    }
  };

  const importCsvNames = async (file: File) => {
    try {
      const text = await file.text();
      const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
      const newPlayers: Player[] = rows.map((n) => ({ id: crypto.randomUUID(), name: n, role: "S" }));
      setPlayers((p) => [...p, ...newPlayers]);
    } catch (e) {
      alert("CSV-tuonti epäonnistui: " + (e as Error).message);
    }
  };

  // Apurit
  const nameById = (id: string) => players.find((p) => p.id === id)?.name || "?";
  const goalieName = useMemo(() => players.find((p) => p.id === goalieId)?.name || "—", [players, goalieId]);
  const skaterCount = skaters.length;

  const resetAll = () => {
    if (!confirm("Nollataanko tulostaulu ja kokoonpanot?")) return;
    setGf(0);
    setGa(0);
    setLines([]);
    setBench([]);
  };

  return (
    <div
    className="min-h-screen bg-yellow-400 bg-center bg-no-repeat bg-contain text-slate-900"
    style={{ backgroundImage: "url('/ilves-logo.jpg')" }}  >
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-screen-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h1 className="font-semibold text-lg">Kentälliset &amp; Tulostaulu</h1>
          </div>
          <div className="flex gap-2 items-center text-xs text-slate-600">
            <Badge variant="secondary">Pelaajia: {players.length}</Badge>
            <Badge variant="secondary">Kenttäpelaajia: {skaterCount}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto p-4 space-y-4">
        {/* Syöttö & asetukset */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>1) Syötä pelaajat &amp; valitse maalivahti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm">Pelaajien nimet (yksi per rivi, 7–15):</label>
                <Textarea
                  placeholder={`Matti Meikäläinen
Teemu Testaaja
…`}
                  value={bulkNames}
                  onChange={(e) => setBulkNames(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 pt-6">
                <Button onClick={addBulk}>
                  <Plus className="w-4 h-4 mr-1" />
                  Lisää nimet
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPlayers([]);
                    setGoalieId(null);
                    setLines([]);
                    setBench([]);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Tyhjennä kokoonpano
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-sm">Maalivahti</label>
                <Select value={goalieId || undefined} onValueChange={setGoalie}>
                  <SelectTrigger id="goalie">
                    <SelectValue placeholder="Valitse maalivahti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {candidateGoalies.map((p) => (
                        <SelectItem key={p.id} onSelect={() => setGoalie(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Maalivahti pysyy samana eikä ole mukana kentällisissä.</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm">Kentän koko</label>
                <Tabs value={String(lineSize)} onValueChange={(v) => changeLineSize(Number(v) as 3 | 4)}>
                  <TabsList>
                    <TabsTrigger value="3" onClick={() => changeLineSize(3 as 3)}>3 pelaajaa</TabsTrigger>
                    <TabsTrigger value="4" onClick={() => changeLineSize(4 as 4)}>4 pelaajaa</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button className="mt-2" variant="secondary" onClick={autoLines}>
                  <Save className="w-4 h-4 mr-1" />
                  Muodosta kentät automaattisesti
                </Button>
              </div>
            </div>

            {/* Pelaajaluettelo */}
            {players.length > 0 && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {players.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border p-2 bg-white">
                    <div className="flex items-center gap-2">
                      <Badge variant={p.id === goalieId ? "default" : "secondary"}>{p.id === goalieId ? "MV" : "P"}</Badge>
                      <span className="text-sm">{p.name}</span>
                    </div>
                    <div className="flex gap-2">
                      {p.id !== goalieId && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setBench((B) => (B.includes(p.id) ? B : [...B, p.id]))}
                        >
                          Penkille
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => removePlayer(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kentälliset & penkki */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>2) Kentälliset &amp; vaihdot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-600">
              Vedä ja pudota pelaajia kenttien ja penkin välillä. Maalivahti: <strong>{goalieName}</strong>.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lines.map((L, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border bg-white"
                  onDragOver={onDragOver}
                  onDrop={dropToLine(idx)}
                >
                  <div className="px-3 py-2 border-b flex items-center justify-between">
                    <div className="font-medium">
                      Kenttä #{idx + 1} <span className="text-xs text-slate-500">({L.length}/{lineSize})</span>
                    </div>
                    <div className="flex gap-2 text-xs items-center">
                      <Badge variant="secondary">Koko {lineSize}</Badge>
                    </div>
                  </div>
                  <div className="p-3 flex flex-wrap gap-2 min-h-[64px]">
                    {L.map((pid) => (
                      <PlayerChip key={pid} name={nameById(pid)} draggable onDragStart={onDragStart(pid, `line:${idx}`)}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => removeFromLine(idx, pid)}
                          className="ml-2"
                        >
                          <ArrowLeftRight className="w-3 h-3 mr-1" />
                          Penkille
                        </Button>
                      </PlayerChip>
                    ))}
                    {/* Tyhjäpaikat visuaalisesti */}
                    {Array.from({ length: Math.max(0, lineSize - L.length) }).map((_, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center justify-center text-xs text-slate-400 border rounded-full px-3 py-1"
                      >
                        Tyhjä
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Lisää uusi kenttä tarvittaessa */}
              <div className="rounded-2xl border bg-white p-3 flex flex-col justify-between">
                <div className="font-medium mb-2">Uusi kenttä</div>
                <Button onClick={() => setLines((LL) => [...LL, []])}>
                  <Plus className="w-4 h-4 mr-1" />
                  Lisää kenttä
                </Button>
              </div>
            </div>

            {/* Penkki */}
            <div className="rounded-2xl border bg-white" onDragOver={onDragOver} onDrop={dropToBench}>
              <div className="px-3 py-2 border-b font-medium">Penkki</div>
              <div className="p-3 flex flex-wrap gap-2 min-h-[64px]">
                {bench.map((pid) => (
                  <PlayerChip key={pid} name={nameById(pid)} draggable onDragStart={onDragStart(pid, "bench")}>
                    <div className="flex gap-2 ml-2">
                      {lines.map((_, i) => (
                        <Button key={i} size="sm" variant="secondary" onClick={() => addToLine(i, pid)}>
                          Kenttä {i + 1}
                        </Button>
                      ))}
                    </div>
                  </PlayerChip>
                ))}
                {bench.length === 0 && <span className="text-xs text-slate-400">Ei varapelaajia penkillä.</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tulostaulu */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>3) Tulostaulu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="rounded-xl border bg-white p-4 text-center">
                <div className="text-xs uppercase tracking-wide text-slate-500">Koti</div>
                <div className="text-5xl font-bold my-2">{gf}</div>
                <div className="flex justify-center gap-2">
                  <Button onClick={() => setGf((v) => v + 1)}>
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Lisää
                  </Button>
                  <Button variant="secondary" onClick={() => setGf((v) => Math.max(0, v - 1))}>
                    <MinusCircle className="w-4 h-4 mr-1" />
                    Vähennä
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border bg-white p-4 text-center">
                <div className="text-xs uppercase tracking-wide text-slate-500">Vieras</div>
                <div className="text-5xl font-bold my-2">{ga}</div>
                <div className="flex justify-center gap-2">
                  <Button onClick={() => setGa((v) => v + 1)}>
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Lisää
                  </Button>
                  <Button variant="secondary" onClick={() => setGa((v) => Math.max(0, v - 1))}>
                    <MinusCircle className="w-4 h-4 mr-1" />
                    Vähennä
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border bg-white p-4 text-center">
                <div className="text-xs uppercase tracking-wide text-slate-500">Tilanne</div>
                <div className="text-4xl font-bold my-2">
                  {gf} - {ga}
                </div>
                <div className="flex justify-center gap-2">
                  <Button variant="secondary" onClick={() => { setGf(0); setGa(0); }}>
                    <RefreshCcw className="w-4 h-4 mr-1" />
                    Nollaa
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tuonti / Vienti */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>4) Tuonti &amp; vienti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button onClick={exportState}>Vie kokoonpano (JSON)</Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importJson(f);
                  e.currentTarget.value = "";
                }}
              />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                Tuo kokoonpano (JSON)
              </Button>

              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importCsvNames(f);
                  e.currentTarget.value = "";
                }}
              />
              <Button variant="secondary" onClick={() => csvInputRef.current?.click()}>
                Tuo nimilista (CSV / txt)
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              JSON-vienti sisältää kentät, penkin, maalivahdin, kenttäkoon ja tulostaulun. CSV-tuonti lisää riveittäin nimet
              pelaajaluetteloon.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={resetAll}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            Nollaa kaikki
          </Button>
        </div>

        <footer className="py-6 text-center text-xs text-slate-500 space-y-2">
          <p>
            Vinkki: voit “Lisätä aloitusnäyttöön” (A2HS) ja käyttää tätä sovellusta kuin natiivisovellusta. Tallennus on
            laitekohtainen.
          </p>
          <details className="text-left mx-auto max-w-prose">
            <summary className="cursor-pointer">PWA (manifest + service worker) – ohje ja mallit</summary>
            <pre className="whitespace-pre-wrap text-[11px] bg-white p-3 rounded-xl border mt-2">{`// public/manifest.json
{
  "name": "Kentälliset & Tulostaulu",
  "short_name": "Kentälliset",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

// public/sw.js (yksinkertainen välimuisti)
const CACHE = 'hockey-app-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// index.tsx: rekisteröi SW
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
`}</pre>
          </details>
        </footer>
      </main>
    </div>
  );
}

function PlayerChip({
  name,
  draggable,
  onDragStart,
  children,
}: {
  name: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full border px-3 py-1 bg-white shadow-sm select-none"
      draggable={draggable}
      onDragStart={onDragStart}
      title="Vedä siirtääksesi"
    >
      <span className="text-sm">{name}</span>
      {children}
    </div>
  );
}
