import type { Database } from '@/types/database'

type Service = Database['public']['Tables']['services']['Row']

export default function StepService({
  services,
  selected,
  onSelect,
}: {
  services: Service[]
  selected: Service | null
  onSelect: (s: Service) => void
}) {
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Qual serviço você quer?</h2>
      <ul className="flex flex-col gap-2">
        {services.map((service) => (
          <li key={service.id}>
            <button
              onClick={() => onSelect(service)}
              className="w-full rounded-xl px-4 py-4 text-left transition-all"
              style={{
                backgroundColor: 'var(--agendou-surface)',
                border: selected?.id === service.id
                  ? '2px solid var(--color-brand)'
                  : '2px solid var(--agendou-border)',
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{service.name}</p>
                  {service.description && (
                    <p className="mt-0.5 text-sm opacity-60">{service.description}</p>
                  )}
                  <p className="mt-1 text-xs opacity-50">{service.duration_min} min</p>
                </div>
                <span className="shrink-0 text-lg font-bold" style={{ color: 'var(--color-brand)' }}>
                  {fmt.format(service.price)}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
