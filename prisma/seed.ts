import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { EventType, PrismaClient, Role } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { seatLabel } from "../src/lib/seats-label";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const db = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("password123", 10);

  await db.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: { email: "admin@demo.com", name: "Admin", password, role: Role.ADMIN },
  });

  await db.user.upsert({
    where: { email: "organiser@demo.com" },
    update: {},
    create: { email: "organiser@demo.com", name: "Organiser", password, role: Role.ORGANISER },
  });

  await db.user.upsert({
    where: { email: "customer@demo.com" },
    update: {},
    create: { email: "customer@demo.com", name: "Customer", password, role: Role.CUSTOMER },
  });

  const venue = await db.venue.upsert({
    where: { id: "seed-venue" },
    update: {},
    create: { id: "seed-venue", name: "City Arena", rows: 5, cols: 8 },
  });

  const premium = await db.seatCategory.upsert({
    where: { id: "seed-premium" },
    update: {},
    create: { id: "seed-premium", venueId: venue.id, name: "Premium", color: "#f59e0b" },
  });

  const standard = await db.seatCategory.upsert({
    where: { id: "seed-standard" },
    update: {},
    create: { id: "seed-standard", venueId: venue.id, name: "Standard", color: "#6366f1" },
  });

  const seatCount = await db.seat.count({ where: { venueId: venue.id } });
  if (!seatCount) {
    for (let row = 1; row <= 5; row++) {
      const categoryId = row <= 2 ? premium.id : standard.id;
      for (let col = 1; col <= 8; col++) {
        await db.seat.create({
          data: {
            venueId: venue.id,
            categoryId,
            row,
            col,
            label: seatLabel(row, col),
          },
        });
      }
    }
  }

  const organiser = await db.user.findUnique({ where: { email: "organiser@demo.com" } });
  if (!organiser) return;

  const seats = await db.seat.findMany({ where: { venueId: venue.id } });
  const demoEvents = [
    {
      title: "Summer Pulse",
      type: EventType.CONCERT,
      description: "A euphoric night of live electronic music, immersive light and arena-sized energy.",
      date: "2026-09-15",
      time: "19:30",
      premiumPrice: 1800,
      standardPrice: 850,
    },
    {
      title: "Beyond the Blue",
      type: EventType.MOVIE,
      description: "A visually breathtaking big-screen journey through memory, distance and the deep unknown.",
      date: "2026-09-19",
      time: "20:15",
      premiumPrice: 650,
      standardPrice: 320,
    },
    {
      title: "The Golden Hour",
      type: EventType.CONCERT,
      description: "A warm, intimate showcase of indie favourites and new voices under a sea of amber light.",
      date: "2026-09-26",
      time: "18:00",
      premiumPrice: 1400,
      standardPrice: 700,
    },
    {
      title: "Neon After Dark",
      type: EventType.MOVIE,
      description: "A stylish late-night thriller where every secret glows brighter after midnight.",
      date: "2026-10-03",
      time: "21:45",
      premiumPrice: 720,
      standardPrice: 380,
    },
    {
      title: "Monsoon Sessions",
      type: EventType.CONCERT,
      description: "Soulful live performances inspired by rain, rhythm and the sound of the city.",
      date: "2026-10-10",
      time: "19:00",
      premiumPrice: 1600,
      standardPrice: 750,
    },
    {
      title: "Parallel Hearts",
      type: EventType.MOVIE,
      description: "Two lives collide across alternate realities in this bold romantic science-fiction premiere.",
      date: "2026-10-17",
      time: "20:30",
      premiumPrice: 680,
      standardPrice: 340,
    },
  ];

  for (const item of demoEvents) {
    const existingEvent = await db.event.findFirst({ where: { title: item.title } });
    if (existingEvent) continue;

    const event = await db.event.create({
      data: {
        title: item.title,
        type: item.type,
        description: item.description,
        venueId: venue.id,
        date: item.date,
        time: item.time,
        organiserId: organiser.id,
        prices: {
          create: [
            { categoryId: premium.id, price: item.premiumPrice },
            { categoryId: standard.id, price: item.standardPrice },
          ],
        },
      },
    });

    await db.showSeat.createMany({
      data: seats.map((seat) => ({ eventId: event.id, seatId: seat.id })),
    });
  }

  console.log("Seed complete");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
