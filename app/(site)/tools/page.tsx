import { ToolsHub, toolsHubMetadata } from '@/components/site/views';
export const revalidate = 86400;
export const metadata = toolsHubMetadata('en');
export default function Page() { return <ToolsHub lang="en" />; }
