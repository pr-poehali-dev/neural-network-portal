import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import Icon from "@/components/ui/icon";
import { toolsApi, generateApi, paymentsApi } from "@/lib/api";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import ImageGenTabGenerate from "@/components/image-gen/ImageGenTabGenerate";
import ImageGenTabEdit from "@/components/image-gen/ImageGenTabEdit";

export default function ImageGenTool() {
  const [tab, setTab] = useState<"generate" | "edit">("generate");

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [size, setSize] = useState("square");
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [editPrompt, setEditPrompt] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<string | null>(null);
  const [editSize, setEditSize] = useState("square");
  const [editLoading, setEditLoading] = useState(false);
  const [editResultUrl, setEditResultUrl] = useState<string | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [showPacks, setShowPacks] = useState(false);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [polling, setPolling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user, refreshUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    toolsApi.checkLimit("image-gen").then((res) => {
      if (res.allowed && typeof res.remaining === "number") setCredits(res.remaining);
      else if (!res.allowed) setCredits(0);
    }).catch(() => {});
  }, [user]);

  // Polling после возврата с оплаты
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("payment") !== "success") return;

    const paymentId = localStorage.getItem("pending_payment_id");
    if (!paymentId) { refreshUser(); return; }

    localStorage.removeItem("pending_payment_id");
    setPolling(true);
    setShowPacks(false);
    toast.info("Проверяем оплату...", { id: "payment-poll", duration: 60000 });

    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await paymentsApi.status(paymentId);
        if (res.status === "paid") {
          clearInterval(pollRef.current!);
          setPolling(false);
          await refreshUser();
          const limit = await toolsApi.checkLimit("image-gen");
          if (typeof limit.remaining === "number") setCredits(limit.remaining);
          toast.dismiss("payment-poll");
          toast.success("Оплата подтверждена! Баланс пополнен.", { duration: 6000 });
        } else if (attempts >= 20) {
          clearInterval(pollRef.current!);
          setPolling(false);
          toast.dismiss("payment-poll");
          toast.warning("Платёж обрабатывается. Обнови страницу через минуту.", { duration: 8000 });
        }
      } catch {
        if (attempts >= 20) { clearInterval(pollRef.current!); setPolling(false); toast.dismiss("payment-poll"); }
      }
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [location.search]);

  const checkLimit = async (toolSlug: string) => {
    if (!user) { setAuthOpen(true); return false; }
    try {
      const limit = await toolsApi.checkLimit(toolSlug);
      if (typeof limit.remaining === "number") setCredits(limit.remaining);
      if (!limit.allowed) {
        setCredits(0);
        setShowPacks(true);
        return false;
      }
    } catch { /* ignore */ }
    return false;
  };

  const buyPack = async (slug: string) => {
    if (!user) { setAuthOpen(true); return; }
    setBuyingPack(slug);
    try {
      const returnUrl = `${window.location.origin}/tools/image-gen?payment=success`;
      const res = await paymentsApi.create(slug, undefined, returnUrl);
      if (res.confirmation_url) {
        if (res.payment_id) localStorage.setItem("pending_payment_id", res.payment_id);
        window.location.href = res.confirmation_url;
      } else if (res.demo) {
        toast.error("Оплата не настроена. Обратитесь к администратору.");
      }
    } catch {
      toast.error("Ошибка при создании платежа");
    } finally {
      setBuyingPack(null);
    }
  };

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Введите описание изображения"); return; }
    if (!await checkLimit("image-gen")) return;

    setLoading(true);
    setResultUrl(null);
    try {
      const started = await generateApi.brathuaStart(prompt, style, size);
      const { operation_id, prompt: fullPrompt } = started;

      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const poll = await generateApi.bratuhaPoll(operation_id, fullPrompt);
        if (poll.status === "completed" && poll.image_url) {
          setResultUrl(poll.image_url);
          await toolsApi.saveGeneration("image-gen", fullPrompt, poll.image_url);
          setCredits((c) => (c !== null && c > 0 ? c - 1 : c));
          toast.success("Изображение создано!");
          return;
        }
        if (poll.status === "failed") {
          throw new Error(poll.error || "Ошибка генерации");
        }
      }
      throw new Error("Превышено время ожидания. Попробуйте ещё раз.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Файл больше 10 МБ"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setEditImage(result);
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", 0.85);
        setEditImageFile(compressed.split(",")[1]);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const editPhoto = async () => {
    if (!editImageFile) { toast.error("Загрузите фото"); return; }
    if (!editPrompt.trim()) { toast.error("Опишите что изменить"); return; }
    if (!await checkLimit("image-edit")) return;

    setEditLoading(true);
    setEditResultUrl(null);
    try {
      const started = await generateApi.brathuaEditStart(editImageFile, editPrompt, editSize);
      const { operation_id, prompt: fullPrompt } = started;

      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const poll = await generateApi.bratuhaPoll(operation_id, fullPrompt);
        if (poll.status === "completed" && poll.image_url) {
          setEditResultUrl(poll.image_url);
          await toolsApi.saveGeneration("image-edit", fullPrompt, poll.image_url);
          setCredits((c) => (c !== null && c > 0 ? c - 1 : c));
          toast.success("Фото отредактировано!");
          return;
        }
        if (poll.status === "failed") {
          throw new Error(poll.error || "Ошибка редактирования");
        }
      }
      throw new Error("Превышено время ожидания. Попробуйте ещё раз.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка редактирования");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="image-gen" title="Генерация изображений" description="По промту или смена стиля фото" icon="ImagePlus">
        {() => (
          <div className="space-y-5">
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
              <button
                onClick={() => setTab("generate")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "generate" ? "bg-primary text-black" : "text-white/50 hover:text-white"}`}
              >
                Генерация по промту
              </button>
              <button
                onClick={() => setTab("edit")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "edit" ? "bg-primary text-black" : "text-white/50 hover:text-white"}`}
              >
                Редактирование фото
              </button>
            </div>

            {polling && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5 text-sm">
                <Icon name="Loader2" size={16} className="text-primary animate-spin flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Ожидаем подтверждение от банка...</p>
                  <p className="text-white/40 text-xs mt-0.5">Не закрывай страницу — баланс обновится автоматически</p>
                </div>
              </div>
            )}

            {user && credits !== null && (
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${credits === 0 ? "bg-red-500/10 border-red-500/20" : "bg-white/5 border-white/10"}`}>
                <div className="flex items-center gap-2 text-white/60">
                  <Icon name="ImageIcon" size={15} />
                  <span>Баланс изображений</span>
                </div>
                <span className={`font-bold tabular-nums ${credits === 0 ? "text-red-400" : "text-primary"}`}>
                  {credits} шт.
                </span>
              </div>
            )}

            {tab === "generate" && (
              <ImageGenTabGenerate
                prompt={prompt}
                style={style}
                size={size}
                loading={loading}
                resultUrl={resultUrl}
                showPacks={showPacks}
                buyingPack={buyingPack}
                onPromptChange={setPrompt}
                onStyleChange={setStyle}
                onSizeChange={setSize}
                onGenerate={generate}
                onBuyPack={buyPack}
              />
            )}

            {tab === "edit" && (
              <ImageGenTabEdit
                editPrompt={editPrompt}
                editImage={editImage}
                editSize={editSize}
                editLoading={editLoading}
                editResultUrl={editResultUrl}
                showPacks={showPacks}
                buyingPack={buyingPack}
                fileInputRef={fileInputRef}
                onPromptChange={setEditPrompt}
                onSizeChange={setEditSize}
                onFileSelect={handleFileSelect}
                onClearImage={() => {
                  setEditImage(null);
                  setEditImageFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                onEdit={editPhoto}
                onBuyPack={buyPack}
              />
            )}

            <div className="glass rounded-xl p-5 border border-white/5">
              <p className="text-white/30 mb-3 text-xs uppercase tracking-wider">Советы</p>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <Icon name="Zap" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/50">Генерация занимает до 60 секунд — модель работает на мощных серверах</p>
                </div>
                <div className="flex gap-3 items-start">
                  <Icon name="Palette" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/50">Добавь "фотореалистично", "8K", "профессиональный" для лучшего качества</p>
                </div>
                <div className="flex gap-3 items-start">
                  <Icon name="ImageOff" size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/50">Для редактирования лучше всего подходят чёткие фото с хорошим освещением</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ToolWrapper>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}