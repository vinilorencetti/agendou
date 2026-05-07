import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSlots, getDayOfWeek } from '@/lib/availability'

// GET /api/availability?professional_id=&service_id=&date=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const professionalId = searchParams.get('professional_id')
  const serviceId = searchParams.get('service_id')
  const date = searchParams.get('date') // "2026-05-10"

  if (!professionalId || !serviceId || !date) {
    return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes.' }, { status: 400 })
  }

  const supabase = await createClient()

  // Busca dados em paralelo
  const [serviceRes, scheduleRes, appointmentsRes, blockedRes] = await Promise.all([
    supabase.from('services').select('duration_min').eq('id', serviceId).single(),

    supabase
      .from('professional_schedules')
      .select('is_working, start_time, end_time')
      .eq('professional_id', professionalId)
      .eq('day', getDayOfWeek(date))
      .maybeSingle(),

    supabase
      .from('appointments')
      .select('starts_at, ends_at, status')
      .eq('professional_id', professionalId)
      .gte('starts_at', `${date}T00:00:00Z`)
      .lte('starts_at', `${date}T23:59:59Z`),

    supabase
      .from('professional_blocked_times')
      .select('start_at, end_at')
      .eq('professional_id', professionalId)
      .lte('start_at', `${date}T23:59:59Z`)
      .gte('end_at', `${date}T00:00:00Z`),
  ])

  if (!serviceRes.data) {
    return NextResponse.json({ error: 'Serviço não encontrado.' }, { status: 404 })
  }

  const slots = generateSlots({
    date,
    schedule: scheduleRes.data ?? null,
    appointments: appointmentsRes.data ?? [],
    blockedTimes: blockedRes.data ?? [],
    durationMin: serviceRes.data.duration_min,
  })

  return NextResponse.json({ slots })
}
