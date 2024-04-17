import { prisma } from "@/lib/prisma"
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
    },
    where: {
      user_id: user.id,
    }
  })

  const blockedWeekDays = Array.from({ length: 7 }).map((_, i) => i).filter(weekDay => {
    return !availableWeekDays.some(availableWeekDay => availableWeekDay.week_day === weekDay)
  })

  const blockedDatesRaw = await prisma.$queryRaw`
    SELECT * 
    FROM schedulings S

    WHERE S.user_id = ${user.id}
      AND DATE_FORMAT(S.date, "%Y-%m") = ${`${year}-${month}`}
  `

  return res.json({ blockedWeekDays, blockedDatesRaw })
}