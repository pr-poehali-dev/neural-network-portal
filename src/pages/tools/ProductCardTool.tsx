import { useState } from "react";
import Navbar from "@/components/Navbar";
import ToolWrapper from "@/components/ToolWrapper";
import ResultBox from "@/components/ResultBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { generateApi, toolsApi } from "@/lib/api";
import { toast } from "sonner";

export default function ProductCardTool() {
  const [productName, setProductName] = useState("");
  const [features, setFeatures] = useState("");
  const [price, setPrice] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (onGenerate: () => Promise<boolean>) => {
    if (!productName.trim()) { toast.error("Введите название товара"); return; }
    const allowed = await onGenerate();
    if (!allowed) return;
    setLoading(true);
    try {
      const data = await generateApi.productCard(productName, features, price);
      setResult(data.result);
      await toolsApi.saveGeneration("product-card", productName, undefined, { features, price, result });
      toast.success("Карточка товара готова!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background noise-bg">
      <Navbar />
      <ToolWrapper toolSlug="product-card" title="Карточки товаров" description="Продающие описания для маркетплейсов" icon="ShoppingBag">
        {(onGenerate) => (
          <div className="space-y-5">
            <div className="glass rounded-xl p-6 border border-white/5 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Название товара <span className="text-primary">*</span></label>
                <Input value={productName} onChange={(e) => setProductName(e.target.value)}
                  placeholder="Например: Женское платье миди из льна"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Характеристики</label>
                <Input value={features} onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Материал: 100% лён, размеры: S-XXL, цвета: белый, бежевый, синий"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Цена</label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="3 490 руб"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25" />
              </div>
              <div className="flex items-start gap-2 text-xs text-white/30 bg-white/3 rounded-lg p-3">
                <Icon name="Info" size={13} className="text-white/40 mt-0.5 flex-shrink-0" />
                <span>ИИ создаст SEO-заголовок, описание с ключевыми словами и список преимуществ товара</span>
              </div>
              <Button onClick={() => generate(onGenerate)} disabled={loading} className="w-full bg-primary text-black font-semibold hover:bg-primary/90">
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin mr-2" />Создаю...</> : <><Icon name="ShoppingBag" size={16} className="mr-2" />Создать карточку</>}
              </Button>
            </div>
            <ResultBox result={result} loading={loading} label="Карточка товара" />
          </div>
        )}
      </ToolWrapper>
    </div>
  );
}