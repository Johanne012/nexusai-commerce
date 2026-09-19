import { PaymentProvider } from "./base";
import { xrpProvider } from "./xrp";
import { demoProvider } from "./demo";

const providers: Record<string, PaymentProvider> = {
  xrp: xrpProvider,
  demo: demoProvider,
};

export function getPaymentProvider(name: string = "xrp"): PaymentProvider {
  const provider = providers[name.toLowerCase()];
  if (!provider) throw new Error(`Payment provider "${name}" is not supported`);
  return provider;
}

export function listPaymentProviders(): string[] {
  return Object.keys(providers);
}

export * from "./base";
export * from "./xrp";
export * from "./demo";
