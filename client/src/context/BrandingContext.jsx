import { createContext, useContext, useEffect, useState } from "react";

export const BrandingContext = createContext(null);

const defaultBranding = {
  companyDisplayName: "",
  shortTagline: "",
  logoUrl: "",
  coverUrl: "",
  primaryColor: "#2563EB",
  accentColor: "#10B981",
  secondaryColor: "#1F2937",
};

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(defaultBranding);

  const updateBranding = (data) => {
    setBranding((prev) => ({
      ...prev,
      ...data,
    }));
  };

  // Sync to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", branding.primaryColor);
    root.style.setProperty("--brand-accent", branding.accentColor);
    root.style.setProperty("--brand-secondary", branding.secondaryColor);
  }, [branding]);

  return (
    <BrandingContext.Provider value={{ branding, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
