import { OrganizationDetails } from '@/components/dashboard/organization-details';

export default async function OrganizationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <OrganizationDetails id={id} />;
}
