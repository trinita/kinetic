import { articleListPage } from "@/components/article/article-pages";

const page = articleListPage("blog");
export const generateMetadata = page.generateMetadata;
export default page.Page;
