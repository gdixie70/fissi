const CATEGORY_ICONS: Record<string, string> = {
  Streaming: 'television-play',
  Musica: 'music-note-outline',
  Palestra: 'dumbbell',
  Casa: 'home-outline',
  Utenze: 'flash-outline',
  Assicurazioni: 'shield-check-outline',
  Software: 'application-brackets-outline',
  Telefonia: 'cellphone',
  Trasporti: 'bus',
  Altro: 'tag-outline',
};

const DEFAULT_ICON = 'cash-multiple';

/** Icona MaterialCommunityIcons associata a una categoria; ricade su un'icona generica
 * per categorie personalizzate (il campo è testo libero) o assenti. */
export function getCategoryIcon(category: string | null | undefined): string {
  if (!category) return DEFAULT_ICON;
  return CATEGORY_ICONS[category] ?? DEFAULT_ICON;
}
