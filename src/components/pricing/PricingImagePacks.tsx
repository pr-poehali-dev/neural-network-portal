import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const IMAGE_PACKS = [
  { slug: "img_pack_1",   name: "1 изображение",   price: 20,   images: 1,   perImg: "20 ₽/шт" },
  { slug: "img_pack_10",  name: "10 изображений",  price: 200,  images: 10,  perImg: "20 ₽/шт" },
  { slug: "img_pack_50",  name: "50 изображений",  price: 1000, images: 50,  perImg: "20 ₽/шт" },
  { slug: "img_pack_100", name: "100 изображений", price: 2000, images: 100, perImg: "20 ₽/шт" },
];

interface Props {
  paying: string | null;
  user: unknown;
  onPay: (slug: string) => void;
}

export default function PricingImagePacks({ paying, user, onPay }: Props) {
  return (
    <div>
      <p className="tag-pill text-white/30 mb-5">ПАКЕТЫ ИЗОБРАЖЕНИЙ</p>
      <p className="text-white/40 text-sm mb-5">Для генерации и редактирования фото. Без срока действия — используй когда удобно.</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {IMAGE_PACKS.map((pack) => {
          const isPaying = paying === pack.slug;
          return (
            <div key={pack.slug} className="glass rounded-xl border border-white/10 p-5 flex flex-col hover:border-primary/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon name="ImageIcon" size={20} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-white text-lg leading-tight">{pack.name}</h3>
              <p className="text-xs text-white/30 mt-1 mb-4">{pack.perImg}</p>
              <div className="mt-auto">
                <div className="text-3xl font-display font-bold text-white mb-4">
                  {pack.price.toLocaleString("ru-RU")}₽
                </div>
                <Button
                  onClick={() => onPay(pack.slug)}
                  disabled={isPaying}
                  className="w-full bg-primary text-black hover:bg-primary/90 font-semibold"
                >
                  {isPaying ? (
                    <><Icon name="Loader2" size={14} className="animate-spin mr-2" />Переходим...</>
                  ) : user ? (
                    <><Icon name="ShoppingCart" size={14} className="mr-2" />Купить</>
                  ) : (
                    "Войти и купить"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
