import { Currency } from "./types";

export interface PriceQuote {
  basePrice: number; adjustedPrice: number;
  currency: Currency;
  breakdown: {
    base: number; geo_multiplier: number;
    category_multiplier: number; complexity_multiplier: number;
    urgency_multiplier: number; final: number;
  };
}

export class PricingEngine {
  private geoTiers = [
    { region: "North America", country: "US", multiplier: 1.0 },
    { region: "North America", country: "CA", multiplier: 1.05 },
    { region: "Europe", country: "GB", multiplier: 1.1 },
    { region: "Europe", country: "DE", multiplier: 0.95 },
    { region: "Europe", country: "FR", multiplier: 0.95 },
    { region: "Europe", country: "IT", multiplier: 0.9 },
    { region: "Europe", country: "ES", multiplier: 0.9 },
    { region: "Asia Pacific", country: "AU", multiplier: 1.05 },
    { region: "Asia Pacific", country: "JP", multiplier: 1.1 },
    { region: "Asia Pacific", country: "SG", multiplier: 1.0 },
    { region: "Asia", country: "IN", multiplier: 0.6 },
    { region: "Asia", country: "PH", multiplier: 0.55 },
    { region: "Asia", country: "CN", multiplier: 0.7 },
    { region: "Latin America", country: "MX", multiplier: 0.65 },
    { region: "Latin America", country: "BR", multiplier: 0.7 },
    { region: "Middle East", country: "AE", multiplier: 0.95 },
    { region: "Africa", country: "ZA", multiplier: 0.7 },
    { region: "Africa", country: "NG", multiplier: 0.6 },
  ];

  private categoryTiers = [
    { category: "delivery", base_hourly_rate: 25, base_fixed_min: 15, base_fixed_max: 150 },
    { category: "photography", base_hourly_rate: 45, base_fixed_min: 75, base_fixed_max: 500 },
    { category: "inspection", base_hourly_rate: 40, base_fixed_min: 60, base_fixed_max: 350 },
    { category: "research", base_hourly_rate: 35, base_fixed_min: 40, base_fixed_max: 300 },
    { category: "mystery-shopping", base_hourly_rate: 30, base_fixed_min: 25, base_fixed_max: 200 },
    { category: "representation", base_hourly_rate: 50, base_fixed_min: 100, base_fixed_max: 600 },
    { category: "errands", base_hourly_rate: 25, base_fixed_min: 20, base_fixed_max: 150 },
    { category: "installation", base_hourly_rate: 55, base_fixed_min: 50, base_fixed_max: 400 },
  ];

  getGeoMultiplier(country: string): number {
    const tier = this.geoTiers.find((t) => t.country === country);
    return tier?.multiplier ?? 1.0;
  }

  calculatePrice(category: string, country: string, complexity: "simple" | "moderate" | "complex" = "moderate", urgency: "low" | "medium" | "high" = "medium"): PriceQuote {
    const geoMultiplier = this.getGeoMultiplier(country);
    const categoryTier = this.categoryTiers.find((t) => t.category.toLowerCase() === category.toLowerCase()) ?? null;
    const complexityMultipliers = { simple: 0.8, moderate: 1.0, complex: 1.5 };
    const urgencyMultipliers = { low: 0.9, medium: 1.0, high: 1.3 };
    const complexityMultiplier = complexityMultipliers[complexity];
    const urgencyMultiplier = urgencyMultipliers[urgency];
    const basePrice = categoryTier?.base_fixed_min ?? 50;
    const categoryMultiplier = categoryTier ? (categoryTier.base_hourly_rate / 50) : 1.0;
    const adjustedPrice = Math.round(basePrice * geoMultiplier * categoryMultiplier * complexityMultiplier * urgencyMultiplier * 100) / 100;
    return { basePrice, adjustedPrice, currency: "USD", breakdown: { base: basePrice, geo_multiplier: geoMultiplier, category_multiplier: categoryMultiplier, complexity_multiplier: complexityMultiplier, urgency_multiplier: urgencyMultiplier, final: adjustedPrice } };
  }
}

export default new PricingEngine();
