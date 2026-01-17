/**
 * NOCO Ops - Ortak Para Formatlama Utility
 * Tüm sayfalarda tutarlı TRY para formatı sağlar
 */

/**
 * Para miktarını Türk Lirası formatında döndürür
 * @param amount - Para miktarı (sayı)
 * @param showDecimals - Kuruş gösterilsin mi (varsayılan: false)
 * @returns Formatlanmış para string'i (örn: "₺50.000" veya "₺50.000,00")
 */
export const formatCurrency = (amount: number, showDecimals = false): string => {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
};

/**
 * Kısa para formatı (k/M gösterimi)
 * @param amount - Para miktarı
 * @returns Kısa format (örn: "₺50K", "₺1.2M")
 */
export const formatCurrencyShort = (amount: number): string => {
    if (amount >= 1000000) {
        return `₺${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `₺${Math.round(amount / 1000)}K`;
    }
    return formatCurrency(amount);
};

/**
 * Para miktarını düz sayı formatında döndürür (para işareti olmadan)
 * @param amount - Para miktarı
 * @returns Formatlanmış sayı (örn: "50.000")
 */
export const formatNumber = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR').format(amount);
};
