import { describe, expect, it } from "vitest";
import { whatsappLink } from "@/lib/site";

describe("whatsappLink", () => {
  it("links to the number without a message", () => {
    expect(whatsappLink(undefined, "6281399325549")).toBe("https://wa.me/6281399325549");
  });

  it("strips formatting from the number and encodes the message", () => {
    expect(whatsappLink("Halo Kinetic, meja 2×1 m?", "+62 813-9932-5549")).toBe(
      "https://wa.me/6281399325549?text=Halo%20Kinetic%2C%20meja%202%C3%971%20m%3F",
    );
  });
});
