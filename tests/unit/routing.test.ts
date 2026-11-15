import { describe, expect, it } from "vitest";
import { href, parsePublicPath, resolveRequest, switchLocalePath } from "@/lib/i18n/routing";

describe("href", () => {
  it("builds Indonesian URLs at the root", () => {
    expect(href("id", "home")).toBe("/");
    expect(href("id", "products")).toBe("/produk");
    expect(href("id", "team")).toBe("/tentang/tim");
    expect(href("id", "products", "meja-jati")).toBe("/produk/meja-jati");
  });

  it("builds English URLs under /en", () => {
    expect(href("en", "home")).toBe("/en");
    expect(href("en", "caseStudies")).toBe("/en/case-studies");
    expect(href("en", "products", "teak-table")).toBe("/en/products/teak-table");
  });
});

describe("parsePublicPath", () => {
  it("prefers the longest matching route", () => {
    expect(parsePublicPath("/tentang/tim")).toEqual({ locale: "id", key: "team", rest: [] });
    expect(parsePublicPath("/en/about/team")).toEqual({ locale: "en", key: "team", rest: [] });
    expect(parsePublicPath("/tentang")).toEqual({ locale: "id", key: "about", rest: [] });
  });
});

describe("switchLocalePath", () => {
  it("keeps the visitor on the same page", () => {
    expect(switchLocalePath("/produk", "en")).toBe("/en/products");
    expect(switchLocalePath("/en/about/team", "id")).toBe("/tentang/tim");
    expect(switchLocalePath("/", "en")).toBe("/en");
    expect(switchLocalePath("/en", "id")).toBe("/");
    expect(switchLocalePath("/produk", "id")).toBe("/produk");
  });
});

describe("resolveRequest", () => {
  it("rewrites Indonesian URLs to internal English folders", () => {
    expect(resolveRequest("/")).toEqual({ type: "rewrite", pathname: "/id" });
    expect(resolveRequest("/produk")).toEqual({ type: "rewrite", pathname: "/id/products" });
    expect(resolveRequest("/produk/meja-jati")).toEqual({
      type: "rewrite",
      pathname: "/id/products/meja-jati",
    });
    expect(resolveRequest("/tentang/tim")).toEqual({ type: "rewrite", pathname: "/id/about/team" });
    expect(resolveRequest("/blog/cara-merawat-kayu")).toEqual({
      type: "rewrite",
      pathname: "/id/blog/cara-merawat-kayu",
    });
  });

  it("passes English URLs straight through", () => {
    expect(resolveRequest("/en")).toEqual({ type: "next" });
    expect(resolveRequest("/en/products")).toEqual({ type: "next" });
  });

  it("redirects internal /id URLs and unprefixed English URLs to clean Indonesian URLs", () => {
    expect(resolveRequest("/id")).toEqual({ type: "redirect", pathname: "/" });
    expect(resolveRequest("/id/products/x")).toEqual({ type: "redirect", pathname: "/produk/x" });
    expect(resolveRequest("/products")).toEqual({ type: "redirect", pathname: "/produk" });
    expect(resolveRequest("/about/team")).toEqual({ type: "redirect", pathname: "/tentang/tim" });
  });

  it("lets unknown paths 404 in Indonesian", () => {
    expect(resolveRequest("/tidak-ada")).toEqual({ type: "rewrite", pathname: "/id/tidak-ada" });
  });
});
