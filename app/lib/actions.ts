'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

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
// export async function createInvoice(prevState: State, formData: FormData) {
//   const { customerId, amount, status } = CreateInvoice.parse({
//     customerId: formData.get('customerId'),
//     amount: formData.get('amount'),
//     status: formData.get('status'),
//   });
 
//   const amountInCents = amount * 100;
//   const date = new Date().toISOString().split('T')[0];
 
//   try {
//     await sql`
//       INSERT INTO invoices (customer_id, amount, status, date)
//       VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
//     `;
//   } catch (error) {
//     // We'll log the error to the console for now
//     console.error(error);
//   }
 
//   revalidatePath('/dashboard/invoices');
//   redirect('/dashboard/invoices');
// }

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

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
 
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
 
  // Insert data into the database
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // If a database error occurs, return a more specific error.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
 
  // Revalidate the cache for the invoices page and redirect the user.
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
 
//   try {
//     await sql`
//         UPDATE invoices
//         SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
//         WHERE id = ${id}
//       `;
//   } catch (error) {
//     // We'll log the error to the console for now
//     console.error(error);
//   }
 
//   revalidatePath('/dashboard/invoices');
//   redirect('/dashboard/invoices');
// }

// export async function deleteInvoice(id: string) {
//   await sql`DELETE FROM invoices WHERE id = ${id}`;
//   revalidatePath('/dashboard/invoices');
// }

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
 
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
 
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}



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
