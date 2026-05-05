import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const PLATFORMS = ["Instagram", "VKontakte", "Telegram", "TikTok", "Facebook"];
const TONES = ["вовлекающий", "продающий", "информационный", "вдохновляющий", "юмористический"];
const LENGTHS = ["Короткий", "Средний", "Длинный"] as const;
const LANGUAGES = ["Русский", "English"] as const;
const EMOJI_STYLES = ["Много эмодзи 🔥", "Умеренно", "Без эмодзи"] as const;

type Length = typeof LENGTHS[number];
type Language = typeof LANGUAGES[number];
type EmojiStyle = typeof EMOJI_STYLES[number];

export default function PostTool() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("вовлекающий");
  const [length, setLength] = useState<Length>("Средний");
  const [language, setLanguage] = useState<Language>("Русский");
  const [emojiStyle, setEmojiStyle] = useState<EmojiStyle>("Умеренно");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!topic.trim()) { toast.error("Введите тему поста"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.post(topic, platform, tone, length, language, emojiStyle);
      setResult(data.result);
      await toolsApi.saveGeneration("post", topic, undefined, { platform, tone, length, language, emoji_style: emojiStyle, result: data.result });
      toast.success("Пост готов!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="post" title="Генерация постов" description="Продающие посты для социальных сетей" icon="Wand2">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Тема поста <span className="text-primary">*</span></label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: 5 лайфхаков для роста продаж в Instagram"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25"
                />
                <p className="text-xs text-white/25 mt-1">Подсказка: чем конкретнее тема — тем лучше результат</p>
              </div>

              {/* Платформа и Тон */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Платформа</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlatform(p)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${platform === p ? "bg-primary text-black font-medium" : "bg-white/5 text-white/50 hover:text-white"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Тон</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-all ${tone === t ? "bg-white/20 text-white font-medium" : "bg-white/5 text-white/40 hover:text-white"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Длина, Язык, Эмодзи */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Длина поста</label>
                  <div className="flex gap-2">
                    {LENGTHS.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLength(l)}
                        className={`px-3 py-1.5 text-xs rounded-lg flex-1 transition-all ${length === l ? "bg-primary text-black font-medium" : "bg-white/5 text-white/50 hover:text-white"}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/25 mt-1">
                    {length === "Короткий" && "до 500 символов"}
                    {length === "Средний" && "500–1000 символов"}
                    {length === "Длинный" && "1000–2000 символов"}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Язык</label>
                  <div className="flex gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`px-3 py-1.5 text-xs rounded-lg flex-1 transition-all ${language === lang ? "bg-primary text-black font-medium" : "bg-white/5 text-white/50 hover:text-white"}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Эмодзи</label>
                  <div className="flex gap-2">
                    {EMOJI_STYLES.map((es) => (
                      <button
                        key={es}
                        onClick={() => setEmojiStyle(es)}
                        className={`px-3 py-1.5 text-xs rounded-lg flex-1 transition-all ${emojiStyle === es ? "bg-primary text-black font-medium" : "bg-white/5 text-white/50 hover:text-white"}`}
                      >
                        {es}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => generate(onGenerate)}
                disabled={loading}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
              >
                {loading
                  ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую...</>
                  : <><Icon name="Sparkles" size={16} className="mr-2" />Создать пост</>
                }
              </Button>
            </div>

            <ResultBox result={result} loading={loading} label="Готовый пост" />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
