/** Numero massimo di pagamenti fissi attivi consentiti sul livello gratuito. */
export const FREE_TIER_MAX_ACTIVE = 3;

/**
 * true se salvare questo pagamento farebbe superare il limite del livello gratuito.
 * Conta solo i pagamenti attivi (non quelli sospesi o già completati): sono quelli
 * che l'utente sta effettivamente monitorando in questo momento.
 *
 * `isActivating` distingue il caso "sto riattivando un pagamento sospeso" (che va
 * ricontrollato) da un salvataggio che non cambia lo stato attivo/sospeso.
 */
export function wouldExceedFreeLimit(activeCount: number, isPremium: boolean, isActivating: boolean): boolean {
  if (isPremium || !isActivating) return false;
  return activeCount >= FREE_TIER_MAX_ACTIVE;
}
