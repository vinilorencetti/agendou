import type { Database } from '@/types/database'

type Professional = Database['public']['Tables']['professionals']['Row'] & {
  professional_services: { service_id: string }[]
  professional_schedules: Database['public']['Tables']['professional_schedules']['Row'][]
}
type Service = Database['public']['Tables']['services']['Row']

export default function StepProfessional({
  professionals,
  selected,
  service,
  onSelect,
  onBack,
}: {
  professionals: Professional[]
  selected: Professional | null
  service: Service
  onSelect: (p: Professional) => void
  onBack: () => void
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-sm opacity-50 hover:opacity-100">←</button>
        <div>
          <h2 className="text-lg font-semibold">Com quem você quer ser atendido?</h2>
          <p className="text-xs opacity-50">{service.name}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {professionals.map((pro) => (
          <li key={pro.id}>
            <button
              onClick={() => onSelect(pro)}
              className={`w-full rounded-xl border-2 px-4 py-4 text-left transition-all hover:shadow-sm ${
                selected?.id === pro.id ? 'border-[var(--color-brand)]' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {pro.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pro.avatar_url}
                    alt={pro.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                  >
                    {pro.name[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{pro.name}</p>
                  {pro.bio && <p className="text-sm opacity-60">{pro.bio}</p>}
                </div>
                {selected?.id === pro.id && (
                  <span className="ml-auto text-lg" style={{ color: 'var(--color-brand)' }}>✓</span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
