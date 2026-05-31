const IMAGE_PACKS = [
  { slug: "img_pack_1",   label: "1 изображение",   price: 20,   images: 1 },
  { slug: "img_pack_10",  label: "10 изображений",  price: 200,  images: 10 },
  { slug: "img_pack_50",  label: "50 изображений",  price: 1000, images: 50 },
  { slug: "img_pack_100", label: "100 изображений", price: 2000, images: 100 },
];

interface Props {
  buyingPack: string | null;
  onBuy: (slug: string) => void;
}

export default function ImageGenPacksPanel({ buyingPack, onBuy }: Props) {
  return (
    <div className="space-y-3 border border-primary/20 rounded-xl p-4 bg-primary/5">
      <p className="text-sm font-medium text-white">Выберите пакет изображений</p>
      <div className="grid grid-cols-2 gap-2">
        {IMAGE_PACKS.map((pack) => (
          <button
            key={pack.slug}
            onClick={() => onBuy(pack.slug)}
            disabled={buyingPack === pack.slug}
            className="flex flex-col items-start p-3 rounded-lg bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/10 transition-all text-left"
          >
            <span className="text-sm font-semibold text-white">{pack.label}</span>
            <span className="text-primary text-base font-bold mt-0.5">{pack.price} ₽</span>
            {buyingPack === pack.slug && <span className="text-[10px] text-white/40 mt-1">Переход к оплате...</span>}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-white/30">Работает для генерации и редактирования фото</p>
    </div>
  );
}
