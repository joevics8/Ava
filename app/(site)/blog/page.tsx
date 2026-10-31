import { BlogHub, blogHubMetadata } from '@/components/site/views';
import { listPosts } from '@/lib/blog';
export const revalidate = 3600;
export async function generateMetadata() { return blogHubMetadata('en', (await listPosts('en')).length); }
export default function Page() { return <BlogHub lang="en" />; }
