import { articleListPage } from "@/components/article/article-pages";

const page = articleListPage("case-studies");
export const generateMetadata = page.generateMetadata;
export default page.Page;
