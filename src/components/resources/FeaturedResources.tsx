import { HRErrorState, HRListSkeleton } from '@/components/hr/HRStates'
import { ResourceCard, resourceGridClass } from '@/components/resources/ResourceCard'
import { usePortalPreferences } from '@/context/PortalPreferencesContext'
import { useAsync } from '@/hooks/useAsync'
import { getFeaturedResources } from '@/services/resourceService'

/** Featured resources (about 8), from the central index. Sample entries are tagged as such. */
export function FeaturedResources() {
  const { data, error, retry } = useAsync(getFeaturedResources, [])
  const { preferences } = usePortalPreferences()
  if (error) return <HRErrorState onRetry={retry} />
  if (!data) return <HRListSkeleton rows={4} label="Loading featured resources" />

  return (
    <ul aria-label="Featured resources" className={resourceGridClass(preferences.resourceView)}>
      {data.map((r) => (
        <li key={r.id} className="bg-white">
          <ResourceCard resource={r} showFeatured={false} />
        </li>
      ))}
    </ul>
  )
}
