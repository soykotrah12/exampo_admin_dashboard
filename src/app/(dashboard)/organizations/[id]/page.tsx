import { OrganizationDetails } from '@/components/dashboard/organization-details';

export default function OrganizationDetailsPage({ params }: { params: { id: string } }) {
  return <OrganizationDetails id={params.id} />;
}
