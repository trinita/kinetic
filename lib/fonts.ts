import { Fraunces, Inter, Plus_Jakarta_Sans } from "next/font/google";

export const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });
export const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
/** Bold grotesque used only for the homepage hero headline. */
export const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: "700" });
