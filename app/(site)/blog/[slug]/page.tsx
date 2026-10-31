import { BlogPostPage, blogPostMetadata } from '@/components/site/views';
export const revalidate = 3600;
export function generateMetadata({ params }: { params: { slug: string } }) { return blogPostMetadata('en', params.slug); }
export default function Page({ params }: { params: { slug: string } }) { return <BlogPostPage lang="en" slug={params.slug} />; }
