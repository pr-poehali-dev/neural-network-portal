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

const FORMAT_COLORS: Record<string, string> = {
  "Reels":    "bg-pink-500/20 text-pink-300",
  "Карусель": "bg-blue-500/20 text-blue-300",
  "Пост":     "bg-green-500/20 text-green-300",
  "Сторис":   "bg-yellow-500/20 text-yellow-300",
};

export default function ContentPlanTool() {
  const [niche, setNiche] = useState("");
  const [period, setPeriod] = useState("месяц");
  const [goals, setGoals] = useState("рост подписчиков");
  const [rows, setRows] = useState<ContentPlanRow[] | null>(null);
  const [rawResult, setRawResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!niche.trim()) { toast.error("Введите вашу нишу"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    setRows(null);
    setRawResult("");
    try {
      const data = await generateApi.contentPlan(niche, period, goals);
      setRawResult(data.result);
      if (data.rows && data.rows.length > 0) {
        setRows(data.rows);
      }
      await toolsApi.saveGeneration("content-plan", niche, undefined, { period, goals });
      toast.success("Контент-план готов!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const downloadXLSX = () => {
    if (!rows) return;

    const headers = ["Дата", "Тема поста", "Формат", "Платформа", "Хэштеги", "Заметки"];
    const data = rows.map(r => [r.date, r.topic, r.format, r.platform, r.hashtags, r.notes]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Ширина колонок
    ws["!cols"] = [
      { wch: 8 },
      { wch: 40 },
      { wch: 12 },
      { wch: 14 },
      { wch: 30 },
      { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Контент-план");
    XLSX.writeFile(wb, `контент-план-${niche.slice(0, 20)}.xlsx`);
    toast.success("Файл скачан!");
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="content-plan" title="Контент-план" description="Таблица постов на месяц для вашей ниши" icon="CalendarDays">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Ваша ниша <span className="text-primary">*</span></label>
                <Input value={niche} onChange={(e) => setNiche(e.target.value)}
                  placeholder="Например: онлайн-школа по нутрициологии, fashion блог, строительство домов"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
                <p className="text-xs text-white/25 mt-1">Подсказка: укажи конкретную тематику для точного плана</p>
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
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую...</>
                  : <><Icon name="CalendarDays" size={16} className="mr-2" />Создать контент-план</>}
              </Button>
            </div>

            {/* Таблица */}
            {rows && rows.length > 0 && (
              <div className="glass rounded-xl border border-white/5 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Icon name="Table" size={16} className="text-primary" />
                    <span className="text-sm font-medium text-white">{rows.length} публикаций</span>
                  </div>
                  <Button onClick={downloadXLSX} size="sm" className="bg-green-600 hover:bg-green-500 text-white gap-2">
                    <Icon name="Download" size={14} />
                    Скачать Excel
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Дата</th>
                        <th className="text-left px-4 py-3 text-white/40 font-medium">Тема</th>
                        <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Формат</th>
                        <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Платформа</th>
                        <th className="text-left px-4 py-3 text-white/40 font-medium">Хэштеги</th>
                        <th className="text-left px-4 py-3 text-white/40 font-medium">Заметки</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-white/60 whitespace-nowrap font-mono text-xs">{row.date}</td>
                          <td className="px-4 py-3 text-white font-medium max-w-[220px]">{row.topic}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${FORMAT_COLORS[row.format] ?? "bg-white/10 text-white/60"}`}>
                              {row.format}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/60 whitespace-nowrap text-xs">{row.platform}</td>
                          <td className="px-4 py-3 text-white/40 text-xs max-w-[180px] leading-relaxed">{row.hashtags}</td>
                          <td className="px-4 py-3 text-white/50 text-xs max-w-[180px]">{row.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fallback — если JSON не распарсился */}
            {!rows && rawResult && (
              <div className="glass rounded-xl p-5 border border-white/5">
                <p className="text-xs text-white/40 mb-2">Текстовый результат:</p>
                <pre className="text-white/70 text-xs whitespace-pre-wrap leading-relaxed">{rawResult}</pre>
              </div>
            )}
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
