import { sdiDriver } from "./sdi";

export const BillingGateway = {
  forProvider(providerId: string) {
    if (providerId === "sdi") return sdiDriver;
    throw new Error("Provider non supportato");
  }
};