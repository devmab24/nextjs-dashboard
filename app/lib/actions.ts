'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
// console.log("Database Connection:", sql); // Debugging connection
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const IdSchema = z.string().uuid(); // If `id` is a UUID


// export async function createInvoice(formData: FormData) {
//     const { customerId, amount, status } = CreateInvoice.parse({
//         customerId: formData.get('customerId'),
//         amount: formData.get('amount'),
//         status: formData.get('status'),
//     });
//     const amountInCents = amount * 100;
//     const date = new Date().toISOString().split('T')[0];

//     await sql`
//     INSERT INTO invoices (customer_id, amount, status, date)
//     VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
//   `;

//   revalidatePath('/dashboard/invoices');
//   redirect('/dashboard/invoices');

//     // Test it out:
//     //  console.log(rawFormData);
//     //  console.log(typeof rawFormData.amount);
// }
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
 
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// export async function updateInvoice(id: string, formData: FormData) {
//   const { customerId, amount, status } = UpdateInvoice.parse({
//     customerId: formData.get('customerId'),
//     amount: formData.get('amount'),
//     status: formData.get('status'),
//   });
 
//   const amountInCents = amount * 100;
 
//   await sql`
//     UPDATE invoices
//     SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
//     WHERE id = ${id}
//   `;
 
//   revalidatePath('/dashboard/invoices');
//   redirect('/dashboard/invoices');
// }
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;
 
  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    // We'll log the error to the console for now
    console.error(error);
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// export async function deleteInvoice(id: string) {
//   await sql`DELETE FROM invoices WHERE id = ${id}`;
//   revalidatePath('/dashboard/invoices');
// }
export async function deleteInvoice(id: string) {
  // throw new Error('Failed to Delete Invoice'); testing
  console.log("Deleting invoice with ID:", id); // Debugging
  try {
    const result = await sql`SELECT * FROM invoices WHERE id = ${id}`;

    if (result.length === 0) {
      console.error("Invoice not found:", id);
      throw new Error("Invoice does not exist.");
    }

    IdSchema.parse(id);
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw new Error("Invalid invoice ID");
  }
}
