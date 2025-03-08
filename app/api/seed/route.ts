import { NextResponse } from "next/server";
import { db } from "@vercel/postgres";
import { seedUsers, seedCustomers, seedInvoices, seedRevenue } from "@/app/lib/seed"

export async function GET() {
  try {
    const client = await db.connect(); // Connect to the database

    await seedUsers(client);
    await seedCustomers(client);
    await seedInvoices(client);
    await seedRevenue(client);

    return NextResponse.json({ message: "Database seeded successfully!" });
  } catch (error) {
    console.error("Seeding error:", error);

    // Ensure error is an instance of Error before accessing `message`
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}
