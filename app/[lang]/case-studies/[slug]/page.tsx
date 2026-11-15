import { articleDetailPage } from "@/components/article/article-pages";

const page = articleDetailPage("case-studies");
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
// Every page is prebuilt, so there's nothing to show a loading state for.
export const instant = false;
export default page.Page;
