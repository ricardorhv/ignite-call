import { prisma } from "@/lib/prisma"
import dayjs from "dayjs"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  const username = String(req.query.username)
  const { date, year, month } = req.query

  if (!year || !month) {
    return res.status(404).json({ message: 'Year or month not specified' })
  }

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  })

  if (!user) {
    return res.status(404).json({ message: 'User does not exist.' })
  }

  const availableWeekDays = await prisma.userTimeIntervals.findMany({
    select: {
      week_day: true,
      time_end_in_minutes: true,
    },
    where: {
      user_id: user.id,
    }
  })

  const blockedWeekDays = Array.from({ length: 7 }).map((_, i) => i).filter(weekDay => {
    return !availableWeekDays.some(availableWeekDay => availableWeekDay.week_day === weekDay)
  })

  const blockedDatesRaw: Array<{ date: number }> = await prisma.$queryRaw`
    SELECT 
      EXTRACT(DAY FROM S.date) AS date,
      COUNT(S.date) AS amount,
      ((UTI.time_end_in_minutes - UTI.time_start_in_minutes) / 60) AS size
    FROM schedulings S

    LEFT JOIN user_time_intervals UTI
      ON UTI.week_day = WEEKDAY(DATE_ADD(S.date, INTERVAL 1 DAY))

    WHERE S.user_id = ${user.id}
      AND DATE_FORMAT(S.date, "%Y-%m") = ${`${year}-${month}`}

    GROUP BY EXTRACT(DAY FROM S.date),
      ((UTI.time_end_in_minutes - UTI.time_start_in_minutes) / 60)

    HAVING amount >= size
  `
  const blockedDates = blockedDatesRaw.map(item => item.date)

  const currentDay = dayjs().get("day") - 1

  const lastHourOfAppointmentOfToday = (availableWeekDays[currentDay]?.time_end_in_minutes / 60) - 1

  return res.json({ blockedWeekDays, blockedDates, lastHourOfAppointmentOfToday })
}