import { db } from '@vercel/postgres';
import { invoices, customers, revenue, users } from '@/app/lib/placeholder-data';
import bcrypt from 'bcryptjs';

type PostgresClient = {
  sql: (query: TemplateStringsArray, ...values: any[]) => Promise<any>;
};

async function ensureUuidExtension(client: PostgresClient) {
  await client.sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION "uuid-ossp";
      END IF;
    END $$;
  `;
}

export async function seedUsers(client: PostgresClient) {
  try {
    await ensureUuidExtension(client);
    
    await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `;
    console.log(`Created "users" table`);

    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return client.sql`
          INSERT INTO users (id, name, email, password)
          VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
          ON CONFLICT (id) DO NOTHING;
        `;
      })
    );

    console.log(`Seeded ${insertedUsers.length} users`);
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

export async function seedInvoices(client: PostgresClient) {
  try {
    await ensureUuidExtension(client);

    await client.sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        customer_id UUID NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );
    `;
    console.log(`Created "invoices" table`);

    const insertedInvoices = await Promise.all(
      invoices.map((invoice) =>
        client.sql`
          INSERT INTO invoices (customer_id, amount, status, date)
          VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
          ON CONFLICT (id) DO NOTHING;
        `
      )
    );

    console.log(`Seeded ${insertedInvoices.length} invoices`);
  } catch (error) {
    console.error('Error seeding invoices:', error);
    throw error;
  }
}

export async function seedCustomers(client: PostgresClient) {
  try {
    await ensureUuidExtension(client);

    await client.sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        image_url VARCHAR(255) NOT NULL
      );
    `;
    console.log(`Created "customers" table`);

    const insertedCustomers = await Promise.all(
      customers.map((customer) =>
        client.sql`
          INSERT INTO customers (id, name, email, image_url)
          VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
          ON CONFLICT (id) DO NOTHING;
        `
      )
    );

    console.log(`Seeded ${insertedCustomers.length} customers`);
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}

export async function seedRevenue(client: PostgresClient) {
  try {
    await client.sql`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `;
    console.log(`Created "revenue" table`);

    const insertedRevenue = await Promise.all(
      revenue.map((rev) =>
        client.sql`
          INSERT INTO revenue (month, revenue)
          VALUES (${rev.month}, ${rev.revenue})
          ON CONFLICT (month) DO NOTHING;
        `
      )
    );

    console.log(`Seeded ${insertedRevenue.length} revenue`);
  } catch (error) {
    console.error('Error seeding revenue:', error);
    throw error;
  }
}

async function main() {
  const client = await db.connect();
  await seedUsers(client);
  await seedCustomers(client);
  await seedInvoices(client);
  await seedRevenue(client);
}

main().catch((err) => {
  console.error('An error occurred while attempting to seed the database:', err);
});
