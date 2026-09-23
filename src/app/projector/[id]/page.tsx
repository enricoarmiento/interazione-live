import { ProjectorView } from '@/components/projector/ProjectorView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectorPage({ params }: PageProps) {
  const { id } = await params;
  return <ProjectorView initialPollId={id} />;
}
