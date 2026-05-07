'use client'

import { useState } from 'react'
import ImageUpload from '@/components/ui/image-upload'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import { updateProfessional, saveProfessionalSchedule, type ScheduleInput } from '@/app/actions/professionals'
import type { Database, DayOfWeek } from '@/types/database'

type Professional = Database['public']['Tables']['professionals']['Row'] & {
  professional_services: { service_id: string }[]
  professional_schedules: Database['public']['Tables']['professional_schedules']['Row'][]
}
type Service = Database['public']['Tables']['services']['Row']

const DAY_ORDER: DayOfWeek[] = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
}

type DayState = {
  isWorking: boolean
  startTime: string
  endTime: string
  hasBreak: boolean
  breakStart: string
  breakEnd: string
}

export default function MyProfileEditor({
  professional,
  services,
  tenantId,
  tenantSlug,
}: {
  professional: Professional
  services: Service[]
  tenantId: string
  tenantSlug: string
}) {
  const [profile, setProfile] = useState({
    name: professional.name,
    bio: professional.bio ?? '',
    avatarUrl: professional.avatar_url ?? '',
    serviceIds: professional.professional_services.map((ps) => ps.service_id),
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [days, setDays] = useState<Record<DayOfWeek, DayState>>(() => {
    const result = {} as Record<DayOfWeek, DayState>
    for (const day of DAY_ORDER) {
      const s = professional.professional_schedules.find((x) => x.day === day)
      result[day] = {
        isWorking: s?.is_working ?? false,
        startTime: s?.start_time ?? '09:00',
        endTime: s?.end_time ?? '18:00',
        hasBreak: !!(s?.break_start_time),
        breakStart: s?.break_start_time ?? '12:00',
        breakEnd: s?.break_end_time ?? '13:00',
      }
    }
    return result
  })
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleSaved, setScheduleSaved] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  function setDay(day: DayOfWeek, patch: Partial<DayState>) {
    setDays((d) => ({ ...d, [day]: { ...d[day], ...patch } }))
    setScheduleSaved(false)
  }

  function toggleService(id: string) {
    setProfile((p) => ({
      ...p,
      serviceIds: p.serviceIds.includes(id)
        ? p.serviceIds.filter((s) => s !== id)
        : [...p.serviceIds, id],
    }))
    setProfileSaved(false)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError(null)
    const result = await updateProfessional(professional.id, {
      tenantId,
      name: profile.name,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      serviceIds: profile.serviceIds,
    })
    if (!result.success) setProfileError(result.error ?? 'Erro.')
    else setProfileSaved(true)
    setProfileLoading(false)
  }

  async function saveSchedule() {
    setScheduleLoading(true)
    setScheduleError(null)
    const schedules: ScheduleInput[] = DAY_ORDER.map((day) => ({
      day,
      isWorking: days[day].isWorking,
      startTime: days[day].startTime,
      endTime: days[day].endTime,
      breakStartTime: days[day].hasBreak ? days[day].breakStart : null,
      breakEndTime: days[day].hasBreak ? days[day].breakEnd : null,
    }))
    const result = await saveProfessionalSchedule(professional.id, tenantId, schedules)
    if (!result.success) setScheduleError(result.error ?? 'Erro.')
    else setScheduleSaved(true)
    setScheduleLoading(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Perfil */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold">Informações pessoais</h2>
        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-gray-700">Foto de perfil</p>
            <ImageUpload
              bucket="avatars"
              path={`${tenantId}/${professional.id}`}
              currentUrl={profile.avatarUrl || null}
              shape="circle"
              size={80}
              onUpload={(url) => { setProfile((p) => ({ ...p, avatarUrl: url })); setProfileSaved(false) }}
            />
          </div>

          <Input id="mp-name" label="Nome" required value={profile.name}
            onChange={(e) => { setProfile((p) => ({ ...p, name: e.target.value })); setProfileSaved(false) }}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="mp-bio" className="text-sm font-medium text-gray-700">
              Bio <span className="font-normal text-gray-400">(opcional — aparece para os clientes)</span>
            </label>
            <textarea id="mp-bio" rows={2} value={profile.bio}
              onChange={(e) => { setProfile((p) => ({ ...p, bio: e.target.value })); setProfileSaved(false) }}
              placeholder="Ex: Especialista em degradê e barba clássica"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {services.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700">Serviços que executo</p>
              <div className="flex flex-wrap gap-2">
                {services.map((svc) => {
                  const checked = profile.serviceIds.includes(svc.id)
                  return (
                    <button key={svc.id} type="button" onClick={() => toggleService(svc.id)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        checked ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}>
                      {svc.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {profileError && <p className="text-sm text-red-500">{profileError}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={profileLoading}>Salvar perfil</Button>
            {profileSaved && <span className="text-sm text-green-600">✓ Salvo</span>}
          </div>
        </form>
      </div>

      {/* Horários */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-1 font-semibold">Meus horários de trabalho</h2>
        <p className="mb-4 text-xs text-gray-500">
          Configure quando você está disponível para atendimento e seus intervalos.
        </p>

        <div className="flex flex-col gap-3">
          {DAY_ORDER.map((day) => {
            const d = days[day]
            return (
              <div key={day} className="rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  {/* Toggle ativo/folga */}
                  <button type="button" onClick={() => setDay(day, { isWorking: !d.isWorking })}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${d.isWorking ? 'bg-black' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${d.isWorking ? 'left-[18px]' : 'left-0.5'}`} />
                  </button>

                  <span className={`w-20 text-sm font-medium ${d.isWorking ? '' : 'text-gray-400'}`}>
                    {DAY_LABELS[day]}
                  </span>

                  {d.isWorking ? (
                    <div className="flex items-center gap-2 text-sm">
                      <input type="time" value={d.startTime}
                        onChange={(e) => setDay(day, { startTime: e.target.value })}
                        className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-black" />
                      <span className="text-gray-400">às</span>
                      <input type="time" value={d.endTime}
                        onChange={(e) => setDay(day, { endTime: e.target.value })}
                        className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-black" />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Folga</span>
                  )}
                </div>

                {/* Intervalo */}
                {d.isWorking && (
                  <div className="ml-12 mt-2">
                    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={d.hasBreak}
                        onChange={(e) => setDay(day, { hasBreak: e.target.checked })}
                        className="rounded" />
                      Tem intervalo (almoço, pausa)
                    </label>
                    {d.hasBreak && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-xs text-gray-500">Das</span>
                        <input type="time" value={d.breakStart}
                          onChange={(e) => setDay(day, { breakStart: e.target.value })}
                          className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-black" />
                        <span className="text-xs text-gray-500">às</span>
                        <input type="time" value={d.breakEnd}
                          onChange={(e) => setDay(day, { breakEnd: e.target.value })}
                          className="rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-black" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {scheduleError && <p className="mt-3 text-sm text-red-500">{scheduleError}</p>}

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={saveSchedule} loading={scheduleLoading}>Salvar horários</Button>
          {scheduleSaved && <span className="text-sm text-green-600">✓ Salvo</span>}
        </div>
      </div>
    </div>
  )
}
