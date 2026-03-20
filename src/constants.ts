interface PricingTier {
  name: string;
  creds: number;
  price: number;
  yearlyPrice?: number;
  popular?: boolean;
  feats: string[];
}

export const PRICING: Record<string, PricingTier> = {
  starter: { name: "Starter", creds: 50, price: 0, feats: ["Calidad HD", "1 Modelo", "Marca de Agua", "Soporte Básico"] },
  creator: { name: "Influencer", creds: 1000, price: 29, yearlyPrice: 24, popular: true, feats: ["4K Ultra", "Velvet Mode", "5 Modelos", "Licencia Comercial", "Sin Marca de Agua"] },
  agency: { name: "Agency", creds: 5000, price: 99, yearlyPrice: 79, feats: ["Todo Ilimitado", "API Access", "Prioridad Total", "Account Manager", "Soporte 24/7"] }
};
