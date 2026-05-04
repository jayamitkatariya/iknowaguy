import { Currency, PriceType } from "./types";

export interface GeoPriceTier {
  region: string;
  country: string | null;
  multiplier: number;
}

export interface CategoryPriceTier {
  category: string;
  base_hourly_rate: number;
  base_fixed_min: number;
  base_fixed_max: number;
}

export interface PriceQuote {
  basePrice: number;
  adjustedPrice: number;
  currency: Currency;
  breakdown: {
    base: number;
    geo_multiplier: number;
    category_multiplier: number;
    complexity_multiplier: number;
    urgency_multiplier: number;
    final: number;
  };
}

export interface PriceCalculationOptions {
  category: string;
  location: string;
  complexity?: "simple" | "moderate" | "complex";
  urgency?: "low" | "medium" | "high";
}

export class PricingEngine {
  private geoTiers: GeoPriceTier[];
  private categoryTiers: CategoryPriceTier[];

  constructor(
    geoTiers: GeoPriceTier[] = DEFAULT_GEO_TIERS,
    categoryTiers: CategoryPriceTier[] = DEFAULT_CATEGORY_TIERS
  ) {
    this.geoTiers = geoTiers;
    this.categoryTiers = categoryTiers;
  }

  getGeoMultiplier(country: string, region?: string): number {
    const tier = this.geoTiers.find(
      (t) => t.country === country && (region ? t.region === region : true)
    );
    return tier?.multiplier ?? 1.0;
  }

  getCategoryTier(category: string): CategoryPriceTier | null {
    return this.categoryTiers.find((t) => t.category.toLowerCase() === category.toLowerCase()) ?? null;
  }

  calculatePrice(
    category: string,
    location: string,
    complexity: "simple" | "moderate" | "complex" = "moderate",
    urgency: "low" | "medium" | "high" = "medium"
  ): PriceQuote {
    const geoMultiplier = this.getGeoMultiplier(location);
    const categoryTier = this.getCategoryTier(category);

    // Complexity multipliers
    const complexityMultipliers = {
      simple: 0.8,
      moderate: 1.0,
      complex: 1.5,
    };
    const complexityMultiplier = complexityMultipliers[complexity];

    // Urgency multipliers
    const urgencyMultipliers = {
      low: 0.9,
      medium: 1.0,
      high: 1.3,
    };
    const urgencyMultiplier = urgencyMultipliers[urgency];

    // Base price from category tier or default
    const basePrice = categoryTier?.base_fixed_min ?? 50;
    const categoryMultiplier = categoryTier ? (categoryTier.base_hourly_rate / 50) : 1.0;

    // Calculate adjusted price
    const adjustedPrice = Math.round(
      basePrice * geoMultiplier * categoryMultiplier * complexityMultiplier * urgencyMultiplier * 100
    ) / 100;

    return {
      basePrice,
      adjustedPrice,
      currency: "USD",
      breakdown: {
        base: basePrice,
        geo_multiplier: geoMultiplier,
        category_multiplier: categoryMultiplier,
        complexity_multiplier: complexityMultiplier,
        urgency_multiplier: urgencyMultiplier,
        final: adjustedPrice,
      },
    };
  }
}

const DEFAULT_GEO_TIERS: GeoPriceTier[] = [
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

const DEFAULT_CATEGORY_TIERS: CategoryPriceTier[] = [
  { category: "delivery", base_hourly_rate: 25, base_fixed_min: 15, base_fixed_max: 150 },
  { category: "photography", base_hourly_rate: 45, base_fixed_min: 75, base_fixed_max: 500 },
  { category: "inspection", base_hourly_rate: 40, base_fixed_min: 60, base_fixed_max: 350 },
  { category: "research", base_hourly_rate: 35, base_fixed_min: 40, base_fixed_max: 300 },
  { category: "mystery-shopping", base_hourly_rate: 30, base_fixed_min: 25, base_fixed_max: 200 },
  { category: "representation", base_hourly_rate: 50, base_fixed_min: 100, base_fixed_max: 600 },
  { category: "errands", base_hourly_rate: 25, base_fixed_min: 20, base_fixed_max: 150 },
  { category: "installation", base_hourly_rate: 55, base_fixed_min: 50, base_fixed_max: 400 },
];

export const defaultPricingEngine = new PricingEngine();

/**
 * Convenience function to calculate price using the default pricing engine
 */
export function calculatePrice(
  category: string,
  location: string,
  complexity: "simple" | "moderate" | "complex" = "moderate",
  urgency: "low" | "medium" | "high" = "medium"
): PriceQuote {
  return defaultPricingEngine.calculatePrice(category, location, complexity, urgency);
}
