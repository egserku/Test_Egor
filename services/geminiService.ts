
import { GoogleGenAI } from "@google/genai";

const apiKey =
  process.env.GEMINI_API_KEY ||
  (import.meta as any)?.env?.VITE_GEMINI_API_KEY ||
  (import.meta as any)?.env?.VITE_API_KEY ||
  '';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const STATIC_FALLBACKS: Record<string, string[]> = {
  'DEFAULT': [
    "• Используйте контрастные цвета для лучшей читаемости текста.",
    "• Оставляйте свободное пространство вокруг логотипа, чтобы он 'дышал'.",
    "• Выбирайте шрифты без засечек для современного и чистого образа."
  ],
  'SCHOOL': [
    "• Разместите крупный номер школы по центру для классического вида.",
    "• Используйте традиционные шрифты (Serif) для придания солидности.",
    "• Добавьте год выпуска мелким шрифтом под основным логотипом."
  ],
  'TEAM': [
    "• Сделайте номера игроков максимально крупными на спине.",
    "• Используйте динамичные, наклонные шрифты для эффекта скорости.",
    "• Поместите логотип команды на уровне сердца для сплоченности."
  ]
};

export async function getDesignFeedback(itemType: string, subtype: string) {
  const cacheKey = `design_tips_${itemType}_${subtype}`;
  
  // Check session cache first to save quota
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  if (!ai) {
    const category = subtype === 'Школа' ? 'SCHOOL' : (subtype === 'Команда' ? 'TEAM' : 'DEFAULT');
    return STATIC_FALLBACKS[category].join("\n");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User is designing a ${itemType} with ${subtype} style. Provide 3 creative typography design tips for this specific product in Russian. Use bullet points. Keep it short and catchy.`
    });
    
    const text = response.text || "";
    if (text) {
      sessionStorage.setItem(cacheKey, text);
      return text;
    }
    throw new Error("Empty response");
  } catch (error: any) {
    console.warn("Gemini design tips API unavailable (likely quota):", error?.message);
    
    // Determine which fallback to use
    const category = subtype === 'Школа' ? 'SCHOOL' : (subtype === 'Команда' ? 'TEAM' : 'DEFAULT');
    const fallbackText = STATIC_FALLBACKS[category].join("\n");
    
    return fallbackText;
  }
}

export async function generateOrderSummaryDescription(orderData: any) {
    if (!ai) {
        return "Ваш заказ успешно сформирован! Наш менеджер свяжется с вами в ближайшее время для уточнения деталей производства.";
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a professional, warm order confirmation summary for a customer in Russian. The order has ${orderData.items.length} items. Keep it formal yet friendly.`
        });
        return response.text || "Ваш заказ успешно сформирован и готов к отправке!";
    } catch (e) {
        return "Ваш заказ успешно сформирован! Наш менеджер свяжется с вами в ближайшее время для уточнения деталей производства.";
    }
}
