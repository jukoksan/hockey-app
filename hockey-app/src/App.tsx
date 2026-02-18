import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "./components/ui/select";

import {
  Plus,
  Trash2,
  Save,
  Users,
  ArrowLeftRight,
  PlusCircle,
  MinusCircle,
  RefreshCcw,
} from "lucide-react";

type Player = { id: string; name: string; role: "G" | "S" };
type Goal = { id: string; scorerId: string; scorerName?: string; team: "HOME" | "AWAY" };

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [goalieId, setGoalieId] = useState<string | null>(null);
  const [lineSize, setLineSize] = useState<3 | 4>(3);
  const [lines, setLines] = useState<string[][]>([]);
  const [bench, setBench] = useState<string[]>([]);
  const [gf, setGf] = useState(0);
  const [ga, setGa] = useState(0);

  // UUTTA: maalit & scorer-valitsimen näkyvyydet
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showHomeScorer, setShowHomeScorer] = useState(false);
  const [showAwayScorer, setShowAwayScorer] = useState(false);

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
        setGoals(Array.isArray(s.goals) ? s.goals : []); // <-- UUTTA
      }
    } catch {}
  }, []);

  useEffect(() => {
    const payload = { players, goalieId, lineSize, lines, bench, gf, ga, goals };
    localStorage.setItem("hockey_app_state_v1", JSON.stringify(payload));
  }, [players, goalieId, lineSize, lines, bench, gf, ga, goals]);

  const [bulkNames, setBulkNames] = useState("");
  const addBulk = () => {
    const names = bulkNames
      .split(/\n|,|;/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (!names.length) return;
    const newPlayers: Player[] = names.map((n) => ({
      id: crypto.randomUUID(),
      name: n,
      role: "S",
    }));
    setPlayers((p) => [...p, ...newPlayers]);
    setBulkNames("");
  };

  const removePlayer = (id: string) => {
    if (id === goalieId) setGoalieId(null);
    setPlayers((p) => p.filter((x) => x.id !== id));
    setLines((LL) => LL.map((L) => L.filter((pid) => pid !== id)));
    setBench((B) => B.filter((pid) => pid !== id));
    // ei poisteta historiamaaleja, mutta voisi halutessa suodattaa goalsista jos tekijä poistuu
  };

  const candidateGoalies = useMemo(() => players, [players]);

  const setGoalie = (id: string) => {
    setGoalieId(id);
    setLines((LL) => LL.map((L) => L.filter((pid) => pid !== id)));
    setBench((B) => B.filter((pid) => pid !== id));
    setPlayers((p) =>
      p.map((pl) =>
        pl.id === id ? { ...pl, role: "G" } : { ...pl, role: pl.role === "G" ? "S" : pl.role }
      )
    );
  };

  const skaters = useMemo(
    () => players.filter((p) => p.id !== goalieId),
    [players, goalieId]
  );

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

  const changeLineSize = (size: 3 | 4) => {
    setLineSize(size);
    // Käytetään uutta kokoa suoraan autoLines-logiikassa, ei closure-bugia
    const ids = skaters.map((s) => s.id);
    const numLines = Math.ceil(ids.length / size) || 1;
    const newLines: string[][] = Array.from({ length: numLines }, () => []);
    ids.forEach((id, i) => {
      newLines[i % numLines].push(id);
    });
    const trimmed = newLines.map((L) => L.slice(0, size));
    const used = new Set(trimmed.flat());
    const newBench = ids.filter((id) => !used.has(id));
    setLines(trimmed);
    setBench(newBench);
  };

  const dragDataRef = useRef<{ playerId: string; from: string } | null>(null);
  const onDragStart =
    (playerId: string, from: string) => (e: React.DragEvent) => {
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
      setLines((LL) =>
        LL.map((L, i) => (i === idx ? L.filter((id) => id !== playerId) : L))
      );
    } else {
      setBench((B) => B.filter((id) => id !== playerId));
    }
    setBench((B) => (B.includes(playerId) ? B : [...B, playerId]));
    dragDataRef.current = null;
  };
  const dropToLine =
    (lineIdx: number) => () => {
      const data = dragDataRef.current;
      if (!data) return;
      const { playerId, from } = data;
      if (playerId === goalieId) return;
      if (from.startsWith("line:")) {
        const src = parseInt(from.split(":")[1]!, 10);
        setLines((LL) =>
          LL.map((L, i) => (i === src ? L.filter((id) => id !== playerId) : L))
        );
      } else {
        setBench((B) => B.filter((id) => id !== playerId));
      }
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
        if (overflow.length)
          setBench((B) => [...B, ...overflow.filter((id) => !B.includes(id))]);
        return L;
      });
      dragDataRef.current = null;
    };

  const removeFromLine = (lineIdx: number, playerId: string) => {
    setLines((LL) =>
      LL.map((L, i) => (i === lineIdx ? L.filter((id) => id !== playerId) : L))
    );
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
        const overflow = target.shift()!;
        setBench((B) => [...B, overflow]);
      }
      L[lineIdx] = target;
      return L;
    });
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const exportState = () => {
    const data = { players, goalieId, lineSize, lines, bench, gf, ga, goals }; // goals mukana
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
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
      setGoals(Array.isArray(s.goals) ? s.goals : []); // <-- UUTTA
    } catch (e) {
      alert("JSON-tuonti epäonnistui: " + (e as Error).message);
    }
  };

  const importCsvNames = async (file: File) => {
    try {
      const text = await file.text();
      const rows = text
        .split(/\r?\n/)
        .map((r) => r.trim())
        .filter(Boolean);
    const newPlayers: Player[] = rows.map((n) => ({
        id: crypto.randomUUID(),
        name: n,
        role: "S",
      }));
      setPlayers((p) => [...p, ...newPlayers]);
    } catch (e) {
      alert("CSV-tuonti epäonnistui: " + (e as Error).message);
    }
  };

  const nameById = (id: string) => players.find((p) => p.id === id)?.name || "?";
  const goalieName = useMemo(
    () => players.find((p) => p.id === goalieId)?.name || "—",
    [players, goalieId]
  );
  const skaterCount = skaters.length;

  const resetAll = () => {
    if (!confirm("Nollataanko tulostaulu ja kokoonpanot?")) return;
    setGf(0);
    setGa(0);
    setLines([]);
    setBench([]);
    setGoals([]); // <-- tyhjennä maalit
    setShowHomeScorer(false);
    setShowAwayScorer(false);
  };

  // UUSI: lisää maali (kasvattaa myös GF/GA)
  const addGoal = (team: "HOME" | "AWAY", scorerId?: string) => {
    const scorer = players.find((p) => p.id === scorerId);
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      team,
      scorerId: scorerId || "",
      scorerName: scorer?.name || "",  // <- nimi talteen
    };
    setGoals((prev) => [...prev, newGoal]);

    if (team === "HOME") setGf((v) => v + 1);
    else setGa((v) => v + 1);
  };

  // Muokattavana olevan maalin id (null = ei muokkausta)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Vaihda maalintekijä (ei muuta tulostaulua, vain tekijän tiedot)
  function updateGoalScorer(goalId: string, newScorerId: string) {
    const newName = nameById(newScorerId);
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, scorerId: newScorerId, scorerName: newName } : g
      )
    );
  }

  // Poista tietty maali ja säädä GF/GA oikein
  function removeGoal(goalId: string) {
    setGoals((prev) => {
      const g = prev.find((x) => x.id === goalId);
      if (!g) return prev;
      if (g.team === "HOME") setGf((v) => Math.max(0, v - 1));
      else setGa((v) => Math.max(0, v - 1));
      return prev.filter((x) => x.id !== goalId);
    });
  }

  return (
    <div
      className="min-h-screen bg-yellow-400 bg-center bg-no-repeat bg-contain text-slate-900"
      style={{ backgroundImage: "url('/ilves-logo.jpg')" }}
      data-testid="app-root"
    >
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-screen-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h1 className="font-semibold text-lg" data-testid="app-title">
              Kentälliset &amp; Tulostaulu
            </h1>
          </div>
          <div className="flex gap-2 items-center text-xs text-slate-600">
            <Badge className="app-badge" data-testid="players-count">Pelaajia: {players.length}</Badge>
            <Badge className="app-badge" data-testid="skaters-count">Kenttäpelaajia: {skaterCount}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto p-4 space-y-4">
        {/* Syöttö & asetukset */}
        <Card className="rounded-2xl shadow-lg" data-testid="section-inputs">
          <CardHeader>
            <CardTitle>1) Syötä pelaajat &amp; valitse maalivahti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm block mb-1 pl-5">
                  Lisää pelaajat:
                </label>
                <Textarea
                  data-testid="names-textarea"
                  placeholder={`Pelaaja1
Pelaaja2
…`}
                  value={bulkNames}
                  onChange={(e) => setBulkNames(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 pt-6">
                <Button className="mx-1 my-1" onClick={addBulk} data-testid="add-names">
                  <Plus className="w-4 h-4 mr-1" />
                  Lisää nimet
                </Button>

                <Button
                  className="mx-1 my-1"
                  onClick={() => {
                    setPlayers([]);
                    setGoalieId(null);
                    setLines([]);
                    setBench([]);
                  }}
                  data-testid="clear-roster"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Tyhjennä kokoonpano
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-sm block mb-1 pl-5 font-bold">Maalivahti</label>
                <Select
                  value={goalieId || undefined}
                  onValueChange={setGoalie}
                  placeholder="Valitse maalivahti"
                >
                  <SelectTrigger id="goalie" className="mx-1 my-1" data-testid="select-goalie-trigger" />
                  <SelectContent>
                    <SelectGroup>
                      {candidateGoalies.map((p) => (
                        <SelectItem key={p.id} value={p.id} data-testid={`select-goalie-option-${p.id}`}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <p className="text-xs text-slate-500 leading-relaxed mt-1 mx-5" data-testid="goalie-help">
                  Maalivahti pysyy samana eikä ole mukana kentällisissä.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm block mb-2 pl-2 font-bold">Kentän koko</label>
                <Tabs
                  value={String(lineSize)}
                  onValueChange={(v) => changeLineSize(Number(v) as 3 | 4)}
                  data-testid="tabs-line-size"
                >
                  {/* Siirretty oikealle marginaalilla */}
                  <TabsList className="ml-2">
                    <TabsTrigger value="3" data-testid="line-size-3">3 pelaajaa</TabsTrigger>
                    <TabsTrigger value="4" data-testid="line-size-4">4 pelaajaa</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button className="mt-2 mx-1 my-1" onClick={autoLines} data-testid="auto-lines">
                  <Save className="w-4 h-4 mr-1" />
                  Muodosta kentät automaattisesti
                </Button>
              </div>
            </div>

            {/* Pelaajaluettelo */}
            {players.length > 0 && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="players-list">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border p-2 bg-white"
                    data-testid={`player-row-${p.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className="app-badge">
                        {p.id === goalieId ? "MV" : "P"}
                      </Badge>
                      <span className="text-sm">{p.name}</span>
                    </div>
                    <div className="flex gap-2">
                      {p.id !== goalieId && (
                        <Button
                          size="sm"
                          onClick={() =>
                            setBench((B) => (B.includes(p.id) ? B : [...B, p.id]))
                          }
                          data-testid={`to-bench-${p.id}`}
                        >
                          Penkille
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removePlayer(p.id)}
                        data-testid={`remove-player-${p.id}`}
                      >
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
        <Card className="rounded-2xl shadow-lg" data-testid="section-lines">
          <CardHeader>
            <CardTitle>2) Kentälliset &amp; vaihdot</CardTitle>
          </CardHeader>
        <CardContent className="space-y-4">
            <div className="text-xs text-slate-500 leading-relaxed mt-1 mx-5">
              Vedä ja pudota pelaajia kenttien ja penkin välillä. Maalivahti:{" "}
              <strong data-testid="goalie-name">{goalieName}</strong>.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="lines-grid">
              {lines.map((L, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border bg-white"
                  onDragOver={onDragOver}
                  onDrop={dropToLine(idx)}
                  data-testid={`line-${idx}`}
                >
                  <div className="px-3 py-2 border-b flex items-center justify-between">
                    <div className="font-medium">
                      Kenttä #{idx + 1}{" "}
                      <span className="text-xs text-slate-500">
                        ({L.length}/{lineSize})
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs items-center">
                      <Badge className="app-badge">Koko {lineSize}</Badge>
                    </div>
                  </div>
                  <div className="p-3 flex flex-wrap gap-2 min-h-[64px]">
                    {L.map((pid) => (
                      <PlayerChip
                        key={pid}
                        name={nameById(pid)}
                        draggable
                        onDragStart={onDragStart(pid, `line:${idx}`)}
                        dataTestId={`line-slot-${idx}-${pid}`}
                      >
                        <Button
                          size="sm"
                          onClick={() => removeFromLine(idx, pid)}
                          className="ml-2"
                          data-testid={`to-bench-from-line-${idx}-${pid}`}
                        >
                          <ArrowLeftRight className="w-3 h-3 mr-1" />
                          Penkille
                        </Button>
                      </PlayerChip>
                    ))}
                    {Array.from({ length: Math.max(0, lineSize - L.length) }).map(
                      (_, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center justify-center text-xs text-slate-400 border rounded-full px-3 py-1"
                          data-testid={`line-empty-${idx}-${i}`}
                        >
                          Tyhjä
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))}

              {/* Lisää uusi kenttä */}
              <div className="rounded-2xl border bg-white p-3 flex flex-col justify-between" data-testid="add-line-card">
                <div className="font-medium mb-2 ml-1">Uusi kenttä</div>
                <Button className="mx-1" onClick={() => setLines((LL) => [...LL, []])} data-testid="add-line">
                  <Plus className="w-4 h-4 mr-1" />
                  Lisää kenttä
                </Button>
              </div>
            </div>

            {/* Penkki */}
            <div
              className="rounded-2xl border bg-white"
              onDragOver={onDragOver}
              onDrop={dropToBench}
              data-testid="bench"
            >
              <div className="px-3 py-2 border-b font-medium">Penkki</div>
              <div className="p-3 flex flex-wrap gap-2 min-h-[64px]">
                {bench.map((pid) => (
                  <PlayerChip
                    key={pid}
                    name={nameById(pid)}
                    draggable
                    onDragStart={onDragStart(pid, "bench")}
                    dataTestId={`bench-item-${pid}`}
                  >
                    <div className="flex gap-2 ml-2">
                      {lines.map((_, i) => (
                        <Button key={i} size="sm" onClick={() => addToLine(i, pid)} data-testid={`to-line-${i}-from-bench-${pid}`}>
                          Kenttä {i + 1}
                        </Button>
                      ))}
                    </div>
                  </PlayerChip>
                ))}
                {bench.length === 0 && (
                  <span className="text-xs text-slate-400" data-testid="bench-empty">
                    Ei varapelaajia penkillä.
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tulostaulu + maalintekijät */}
        <Card className="rounded-2xl shadow-lg" data-testid="scoreboard">
          <CardHeader>
            <CardTitle>3) Tulostaulu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">

              {/* KOTI */}
              <div className="rounded-xl border bg-white p-4 text-center" data-testid="score-home">
                <div className="text-xs uppercase tracking-wide text-slate-700 font-bold">KOTI</div>
                <div className="text-5xl font-bold my-2" data-testid="home-value">{gf}</div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex justify-center gap-2">
                    <Button data-testid="inc-home" onClick={() => setGf(v => v + 1)}>
                      <PlusCircle className="w-4 h-4 mr-1" />
                    </Button>
                    <Button data-testid="dec-home" onClick={() => setGf(v => Math.max(0, v - 1))}>
                      <MinusCircle className="w-4 h-4 mr-1" />
                    </Button>
                  </div>
                  <Button data-testid="add-goal-home" onClick={() => setShowHomeScorer(v => !v)}>
                    Maalintekijä
                  </Button>
                  {showHomeScorer && (
                    <Select onValueChange={(pid) => { addGoal("HOME", pid); setShowHomeScorer(false); }}
                            placeholder="Valitse maalintekijä"
                            >
                              <SelectTrigger className="mx-1 my-1" data-testid="home-scorer-trigger" />
                              <SelectContent>
                                <SelectGroup>
                                  {skaters.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>

              {/* VIERAS */}
              <div className="rounded-xl border bg-white p-4 text-center" data-testid="away-card">
                <div className="text-xs uppercase tracking-wide text-slate-700 font-bold">
                  VIERAS
                </div>
                <div className="text-5xl font-bold my-2" data-testid="away-value">{ga}</div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex justify-center gap-2">
                    <Button onClick={() => setGa((v) => v + 1)} data-testid="away-plus">
                      <PlusCircle className="w-4 h-4 mr-1" />
                    </Button>
                    <Button onClick={() => setGa((v) => Math.max(0, v - 1))} data-testid="away-minus">
                      <MinusCircle className="w-4 h-4 mr-1" />
                    </Button>
                  </div>
                  <Button
                    data-testid="add-goal-away"
                    onClick={() => setShowAwayScorer(true)}
                  >
                    Maalintekijä
                  </Button>

                  {showAwayScorer && (
                    <Select
                      onValueChange={(pid) => {
                        addGoal("AWAY", pid);
                        setShowAwayScorer(false);
                      }}
                      placeholder="Valitse maalintekijä"
                    >
                      <SelectTrigger
                        className="mx-1 my-1"
                        data-testid="away-scorer-trigger"
                      />
                      <SelectContent>
                        <SelectGroup>
                          {skaters.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}

                </div>
              </div>

              {/* TILANNE */}
              <div className="rounded-xl border bg-white p-4 text-center" data-testid="score-card">
                <div className="text-xs uppercase tracking-wide text-slate-700 font-bold">
                  TILANNE
                </div>
                <div className="text-4xl font-bold my-2" data-testid="score-value">
                  {gf} - {ga}
                </div>
              </div>
            </div>

            {/* Maalintekijät-lista */}
            <div className="mt-4" data-testid="goals-list">
              <h3 className="text-sm font-bold mb-2 pl-1">Maalintekijät</h3>
              {goals.length === 0 ? (
                <p className="text-xs text-slate-500 pl-1" data-testid="goals-empty">Ei maaleja vielä.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {goals.map((g, i) => (
                    <li key={g.id} className="flex flex-wrap items-center gap-2" data-testid={`goal-item-${g.id}`}>
                      <span className="text-xs text-slate-500 w-6">{i + 1}.</span>

                      {editingGoalId === g.id ? (
                        <>
                          {/* editointi-mode (Select pudotusvalikko) */}
                          <Select
                            onValueChange={(pid) => {
                              updateGoalScorer(g.id, pid);
                              setEditingGoalId(null);
                            }}
                            placeholder="Valitse maalintekijä"
                          >
                            <SelectTrigger className="h-8 w-40" data-testid={`goal-edit-trigger-${g.id}`} />
                            <SelectContent>
                              <SelectGroup>
                                {skaters.map((p) => (
                                  <SelectItem key={p.id} value={p.id} data-testid={`goal-edit-option-${g.id}-${p.id}`}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>

                          <Button size="sm" variant="secondary" onClick={() => setEditingGoalId(null)} data-testid={`goal-edit-cancel-${g.id}`}>
                            Peru
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* Tässä näkyy nyt tekijän nimi */}
                          <span className="font-medium" data-testid={`goal-scorer-${g.id}`}>{g.scorerName || "?"}</span>
                          <Badge className="app-badge" data-testid={`goal-team-${g.id}`}>{g.team === "HOME" ? "Koti" : "Vieras"}</Badge>

                          <Button size="sm" onClick={() => setEditingGoalId(g.id)} data-testid={`goal-edit-${g.id}`}>
                            Muokkaa
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => removeGoal(g.id)} data-testid={`goal-delete-${g.id}`}>
                            Poista
                          </Button>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tuonti / Vienti */}
        <Card className="rounded-2xl shadow-lg" data-testid="section-import-export">
          <CardHeader>
            <CardTitle>4) Tuonti &amp; vienti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button className="mx-2 my-1" onClick={exportState} data-testid="export-json">
                Tallenna tulokset (JSON)
              </Button>

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
                data-testid="json-file-input"
              />
              <Button className="mx-1 my-1" onClick={() => fileInputRef.current?.click()} data-testid="import-json">
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
                data-testid="csv-file-input"
              />
              <Button className="mx-1 my-1" onClick={() => csvInputRef.current?.click()} data-testid="import-csv">
                Tuo nimilista (CSV / txt)
              </Button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-3 mx-6">
              Tallennus sisältää kentät, penkin, maalivahdin, kenttäkoon, tulostaulun ja maalintekijät.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={resetAll} data-testid="reset-all">
            <RefreshCcw className="w-4 h-4 mr-1" />
            Nollaa kaikki
          </Button>
        </div>

        <footer className="py-6 text-center text-xs text-slate-500 space-y-2">
          <p>
            Vinkki: voit “Lisätä aloitusnäyttöön” (A2HS) ja käyttää tätä
            sovellusta kuin natiivisovellusta. Tallennus on laitekohtainen.
          </p>
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
  dataTestId,
}: {
  name: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  children?: React.ReactNode;
  dataTestId?: string;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full border px-3 py-1 bg-white shadow-sm select-none"
      draggable={draggable}
      onDragStart={onDragStart}
      title="Vedä siirtääksesi"
      data-testid={dataTestId}
    >
      <span className="text-sm">{name}</span>
      {children}
    </div>
  );
}
