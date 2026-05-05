import { useState } from "react";
import * as XLSX from "xlsx";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import type { ContentPlanRow } from "@/lib/api";
import { toast } from "sonner";

const SOCIAL_NETWORKS = [
  { id: "instagram", label: "Instagram",   icon: "📸" },
  { id: "vk",        label: "ВКонтакте",   icon: "🔵" },
  { id: "telegram",  label: "Telegram",    icon: "✈️" },
  { id: "dzen",      label: "Яндекс Дзен", icon: "🟡" },
  { id: "youtube",   label: "YouTube",     icon: "▶️" },
  { id: "tiktok",    label: "TikTok",      icon: "🎵" },
];

const FORMAT_COLORS: Record<string, string> = {
  "Reels":    "bg-pink-500/20 text-pink-300",
  "Карусель": "bg-blue-500/20 text-blue-300",
  "Пост":     "bg-green-500/20 text-green-300",
  "Сторис":   "bg-yellow-500/20 text-yellow-300",
  "Статья":   "bg-purple-500/20 text-purple-300",
  "Видео":    "bg-red-500/20 text-red-300",
  "Shorts":   "bg-orange-500/20 text-orange-300",
};

// Стили ячеек для xlsx
const HEADER_STYLE = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill: { fgColor: { rgb: "1a1a2e" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    top:    { style: "thin", color: { rgb: "4f46e5" } },
    bottom: { style: "thin", color: { rgb: "4f46e5" } },
    left:   { style: "thin", color: { rgb: "4f46e5" } },
    right:  { style: "thin", color: { rgb: "4f46e5" } },
  },
};

const CELL_STYLE = {
  font: { color: { rgb: "222222" }, sz: 10 },
  alignment: { vertical: "top", wrapText: true },
  border: {
    top:    { style: "thin", color: { rgb: "cccccc" } },
    bottom: { style: "thin", color: { rgb: "cccccc" } },
    left:   { style: "thin", color: { rgb: "cccccc" } },
    right:  { style: "thin", color: { rgb: "cccccc" } },
  },
};

const CELL_ALT_STYLE = {
  ...CELL_STYLE,
  fill: { fgColor: { rgb: "f0f0ff" } },
};

const INTRO_TITLE_STYLE = {
  font: { bold: true, sz: 14, color: { rgb: "1a1a2e" } },
  alignment: { horizontal: "left" },
};

const INTRO_SECTION_STYLE = {
  font: { bold: true, sz: 11, color: { rgb: "4f46e5" } },
};

const INTRO_TEXT_STYLE = {
  font: { sz: 10, color: { rgb: "333333" } },
  alignment: { wrapText: true, vertical: "top" },
};

function setCellWithStyle(ws: XLSX.WorkSheet, addr: string, value: string, style: object) {
  if (!ws[addr]) ws[addr] = {};
  ws[addr].v = value;
  ws[addr].t = "s";
  ws[addr].s = style;
}

export default function ContentPlanTool() {
  const [niche, setNiche] = useState("");
  const [period, setPeriod] = useState("месяц");
  const [goals, setGoals] = useState("рост подписчиков");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [rows, setRows] = useState<ContentPlanRow[] | null>(null);
  const [intro, setIntro] = useState("");
  const [rawResult, setRawResult] = useState("");
  const [loading, setLoading] = useState(false);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!niche.trim()) { toast.error("Введите вашу нишу"); return; }
    if (selectedPlatforms.length === 0) { toast.error("Выберите хотя бы одну соцсеть"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    setRows(null);
    setRawResult("");
    setIntro("");
    try {
      const platformLabels = selectedPlatforms.map(id => SOCIAL_NETWORKS.find(s => s.id === id)?.label || id);
      const data = await generateApi.contentPlan(niche, period, goals, platformLabels);
      setRawResult(data.result);
      if (data.intro) setIntro(data.intro);

      let parsedRows = data.rows;
      if (!parsedRows || parsedRows.length === 0) {
        try {
          let clean = data.result.trim();
          if (clean.startsWith("```")) {
            const parts = clean.split("```");
            clean = parts[1] || clean;
            if (clean.startsWith("json")) clean = clean.slice(4);
            clean = clean.trim();
          }
          parsedRows = JSON.parse(clean);
        } catch { parsedRows = null; }
      }
      if (parsedRows && parsedRows.length > 0) setRows(parsedRows);
      await toolsApi.saveGeneration("content-plan", niche, undefined, { period, goals, platforms: platformLabels });
      toast.success("Контент-план готов!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const downloadXLSX = () => {
    const wb = XLSX.utils.book_new();
    const platformLabels = selectedPlatforms.map(id => SOCIAL_NETWORKS.find(s => s.id === id)?.label || id).join(", ");

    // ───── Вкладка 1: Вступление ─────
    const ws1: XLSX.WorkSheet = { "!ref": "A1:B50" };
    setCellWithStyle(ws1, "A1", `Контент-стратегия: ${niche}`, INTRO_TITLE_STYLE);
    setCellWithStyle(ws1, "A2", `Платформы: ${platformLabels} · Период: ${period} · Цель: ${goals}`, {
      font: { sz: 10, color: { rgb: "888888" }, italic: true },
    });

    const introLines = intro
      ? intro.split("\n").filter(l => l.trim())
      : [`Контент-план для ниши "${niche}" на период: ${period}.`, `Платформы: ${platformLabels}`, `Цели: ${goals}`];

    let row1 = 4;
    for (const line of introLines) {
      const isSectionHeader = /^\d+\./.test(line.trim()) || line.trim().endsWith(":");
      setCellWithStyle(ws1, `A${row1}`, line, isSectionHeader ? INTRO_SECTION_STYLE : INTRO_TEXT_STYLE);
      ws1[`A${row1}`].r = `<t>${line}</t>`;
      row1++;
    }
    ws1["!cols"] = [{ wch: 100 }];
    ws1["!rows"] = Array(row1).fill({ hpt: 18 });
    XLSX.utils.book_append_sheet(wb, ws1, "📋 Стратегия");

    // ───── Вкладка 2: Контент-план ─────
    const planHeaders = ["Дата", "Тема поста", "Сценарий", "Формат", "Заметки", "Лайфхаки", "Выполнено"];
    const ws2: XLSX.WorkSheet = {};
    const cols2 = ["A", "B", "C", "D", "E", "F", "G"];

    // Заголовки
    planHeaders.forEach((h, i) => {
      setCellWithStyle(ws2, `${cols2[i]}1`, h, HEADER_STYLE);
    });

    // Данные
    const planRows = rows && rows.length > 0
      ? rows
      : [{ date: "", topic: "", scenario: "", format: "", notes: "", lifehacks: "" }];

    planRows.forEach((r, i) => {
      const rowNum = i + 2;
      const style = i % 2 === 0 ? CELL_STYLE : CELL_ALT_STYLE;
      const values = [r.date, r.topic, r.scenario, r.format, r.notes, r.lifehacks, ""];
      values.forEach((v, j) => {
        setCellWithStyle(ws2, `${cols2[j]}${rowNum}`, v, style);
      });
    });

    ws2["!ref"] = `A1:G${planRows.length + 1}`;
    ws2["!cols"] = [
      { wch: 8 }, { wch: 35 }, { wch: 50 }, { wch: 12 }, { wch: 28 }, { wch: 35 }, { wch: 12 },
    ];
    ws2["!rows"] = [{ hpt: 24 }, ...Array(planRows.length).fill({ hpt: 60 })];
    XLSX.utils.book_append_sheet(wb, ws2, "📅 Контент-план");

    // ───── Вкладка 3: Аналитика ─────
    const analyticsHeaders = ["Дата", "Тема поста", "Формат", "Выполнено", "Просмотры", "Лайки", "Комментарии", "Репосты", "Охват", "Заметки по итогу"];
    const ws3: XLSX.WorkSheet = {};
    const cols3 = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

    analyticsHeaders.forEach((h, i) => {
      setCellWithStyle(ws3, `${cols3[i]}1`, h, HEADER_STYLE);
    });

    planRows.forEach((r, i) => {
      const rowNum = i + 2;
      const style = i % 2 === 0 ? CELL_STYLE : CELL_ALT_STYLE;
      const values = [r.date, r.topic, r.format, "", "", "", "", "", "", ""];
      values.forEach((v, j) => {
        setCellWithStyle(ws3, `${cols3[j]}${rowNum}`, v, style);
      });
    });

    ws3["!ref"] = `A1:J${planRows.length + 1}`;
    ws3["!cols"] = [
      { wch: 8 }, { wch: 35 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
    ];
    ws3["!rows"] = [{ hpt: 24 }, ...Array(planRows.length).fill({ hpt: 30 })];
    XLSX.utils.book_append_sheet(wb, ws3, "📊 Аналитика");

    XLSX.writeFile(wb, `контент-план-${niche.slice(0, 20)}.xlsx`);
    toast.success("Excel-файл скачан — 3 вкладки!");
  };

  const hasResult = rows || rawResult;

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="content-plan" title="Контент-план" description="Таблица постов на месяц для вашей ниши" icon="CalendarDays">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-5">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Ваша ниша <span className="text-primary">*</span></label>
                <Input value={niche} onChange={(e) => setNiche(e.target.value)}
                  placeholder="Например: онлайн-школа по нутрициологии, fashion блог, строительство домов"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-2 block">Социальные сети</label>
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_NETWORKS.map((sn) => {
                    const active = selectedPlatforms.includes(sn.id);
                    return (
                      <button key={sn.id} onClick={() => togglePlatform(sn.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                          active ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
                        }`}>
                        <span>{sn.icon}</span>
                        {sn.label}
                        {active && <Icon name="Check" size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Период</label>
                  <div className="flex gap-2">
                    {["неделя", "месяц", "квартал"].map((p) => (
                      <button key={p} onClick={() => setPeriod(p)}
                        className={`px-3 py-1.5 text-xs rounded-lg flex-1 transition-all ${period === p ? "bg-primary text-black font-medium" : "bg-white/5 text-white/50 hover:text-white"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Цель</label>
                  <Input value={goals} onChange={(e) => setGoals(e.target.value)}
                    placeholder="рост подписчиков, продажи, охваты"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25 text-sm" />
                </div>
              </div>

              <Button onClick={() => generate(onGenerate)} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loading
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую план...</>
                  : <><Icon name="CalendarDays" size={16} className="mr-2" />Создать контент-план</>}
              </Button>
            </div>

            {/* Результат */}
            {hasResult && (
              <div className="glass rounded-xl border border-white/5 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon name="FileSpreadsheet" size={16} className="text-primary" />
                    <span className="text-sm font-medium text-white">
                      {rows ? `${rows.length} публикаций` : "Контент-план готов"}
                    </span>
                    <span className="text-xs text-white/30">· 3 вкладки: стратегия, план, аналитика</span>
                  </div>
                  <Button onClick={downloadXLSX} size="sm" className="bg-green-600 hover:bg-green-500 text-white gap-2 shrink-0">
                    <Icon name="Download" size={14} />
                    Скачать Excel
                  </Button>
                </div>

                {rows && rows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Дата</th>
                          <th className="text-left px-4 py-3 text-white/40 font-medium min-w-[160px]">Тема</th>
                          <th className="text-left px-4 py-3 text-white/40 font-medium min-w-[200px]">Сценарий</th>
                          <th className="text-left px-4 py-3 text-white/40 font-medium">Формат</th>
                          <th className="text-left px-4 py-3 text-white/40 font-medium min-w-[140px]">Заметки</th>
                          <th className="text-left px-4 py-3 text-white/40 font-medium min-w-[160px]">Лайфхаки</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-white/50 whitespace-nowrap font-mono text-xs">{row.date}</td>
                            <td className="px-4 py-3 text-white font-medium text-sm leading-snug">{row.topic}</td>
                            <td className="px-4 py-3 text-white/60 text-xs leading-relaxed">{row.scenario}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${FORMAT_COLORS[row.format] ?? "bg-white/10 text-white/60"}`}>
                                {row.format}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-white/50 text-xs leading-relaxed">{row.notes}</td>
                            <td className="px-4 py-3 text-primary/70 text-xs leading-relaxed">{row.lifehacks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!rows && rawResult && (
                  <div className="p-5">
                    <pre className="text-white/70 text-xs whitespace-pre-wrap leading-relaxed">{rawResult}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
