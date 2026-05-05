import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

const COMMENT_STYLES = ["Вопрос", "Экспертный", "Личный опыт", "Поддержка", "Провокация"];

export default function CommentTool() {
  const [postTopic, setPostTopic] = useState("");
  const [accountNiche, setAccountNiche] = useState("");
  const [commentStyle, setCommentStyle] = useState("Вопрос");
  const [count, setCount] = useState(10);
  const [result, setResult] = useState("");
  const [comments, setComments] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!postTopic.trim()) { toast.error("Введите тему поста"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    setComments(null);
    setResult("");
    try {
      const data = await generateApi.comments(postTopic, accountNiche, commentStyle, count);
      setResult(data.result);
      try {
        const raw = data.result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
          setComments(parsed as string[]);
        }
      } catch {
        // fallback to ResultBox
      }
      await toolsApi.saveGeneration("comments", postTopic, undefined, { account_niche: accountNiche, comment_style: commentStyle, count });
      toast.success("Комментарии готовы!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const copyComment = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Комментарий скопирован!");
  };

  const copyAll = () => {
    navigator.clipboard.writeText(result);
    toast.success("Все комментарии скопированы!");
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="comments" title="Генератор комментариев" description="Комментарии для прогрева аудитории в социальных сетях" icon="MessageCircle">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Тема поста / о чём пост <span className="text-primary">*</span>
                </label>
                <textarea
                  value={postTopic}
                  onChange={(e) => setPostTopic(e.target.value)}
                  placeholder="Например: пост о том, как я вышел на 100к в месяц за полгода без вложений"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                  style={{ minHeight: "80px" }}
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Ниша вашего аккаунта</label>
                <input
                  value={accountNiche}
                  onChange={(e) => setAccountNiche(e.target.value)}
                  placeholder="Например: маркетинг, фитнес, недвижимость"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Стиль комментария</label>
                <div className="flex flex-wrap gap-2">
                  {COMMENT_STYLES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setCommentStyle(s)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                        commentStyle === s
                          ? "bg-primary text-black font-medium"
                          : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block">
                  Количество комментариев: <span className="text-white">{count}</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={1}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/25 mt-1">
                  <span>5</span>
                  <span>20</span>
                </div>
              </div>

              <div className="flex items-start gap-3 px-3 py-3 rounded-lg bg-yellow-500/8 border border-yellow-500/20">
                <Icon name="AlertTriangle" size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400/80 leading-relaxed">
                  Используй комментарии естественно — не все сразу и не с одного аккаунта
                </p>
              </div>

              <Button
                onClick={() => generate(onGenerate)}
                disabled={loading}
                className="w-full bg-primary text-black font-semibold hover:bg-primary/90"
              >
                {loading ? (
                  <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Генерирую...</>
                ) : (
                  <><Icon name="MessageCircle" size={16} className="mr-2" />Сгенерировать комментарии</>
                )}
              </Button>
            </div>

            {loading && (
              <div className="glass rounded-xl border border-white/5 p-8 flex items-center justify-center gap-3 text-white/30">
                <Icon name="Loader2" size={20} className="animate-spin" />
                <span className="text-sm">Генерирую комментарии...</span>
              </div>
            )}

            {!loading && comments && comments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">{comments.length} комментариев</span>
                  <button
                    onClick={copyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Icon name="Copy" size={13} />
                    Копировать всё
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {comments.map((comment, i) => (
                    <div
                      key={i}
                      className="glass rounded-xl px-4 py-3 border border-white/5 flex items-start justify-between gap-3"
                    >
                      <p className="text-sm text-white/75 leading-relaxed">{comment}</p>
                      <button
                        onClick={() => copyComment(comment)}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Icon name="Copy" size={12} />
                        Копировать
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && result && !comments && (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={copyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Icon name="Copy" size={13} />
                    Копировать всё
                  </button>
                </div>
                <ResultBox result={result} loading={false} label="Комментарии" />
              </>
            )}
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}
