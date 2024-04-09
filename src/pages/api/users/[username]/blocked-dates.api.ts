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

  return res.json({ blockedWeekDays })
}