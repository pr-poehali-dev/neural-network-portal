import Icon from "@/components/ui/icon";

export default function PromptsEmpty() {
  return (
    <div className="text-center py-20">
      <Icon name="SearchX" size={40} className="text-white/20 mx-auto mb-4" />
      <p className="text-white/40 text-lg">Ничего не найдено</p>
      <p className="text-white/25 text-sm mt-1">Попробуй другой запрос или категорию</p>
    </div>
  );
}
