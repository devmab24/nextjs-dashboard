import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await db.connect();

    const result = await client.sql`
      SELECT customers.name, COUNT(*)
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      GROUP BY customers.name;
`;
    // const result = await client.sql`
    //     SELECT DISTINCT ON (customers.id) invoices.amount, customers.name
    //     FROM invoices
    //     JOIN customers ON invoices.customer_id = customers.id
    //     WHERE invoices.amount = 666;
    //     `;

    // const result = await client.sql`
    // SELECT * FROM customers;
    //  `
    

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Database query error:", error);

    // Ensure error is an instance of Error before accessing `message`
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Database query error" }, { status: 500 });
  }
}
