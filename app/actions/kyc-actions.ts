"use server";

import { db } from "@/lib/db";
import { users, kycApplications } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { put } from "@vercel/blob";

export async function submitKycApplication(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // 1. Extract the text data
  const legalName = formData.get("legalName") as string;
  const dob = new Date(formData.get("dob") as string);
  const phoneNumber = formData.get("phoneNumber") as string;
  const country = formData.get("country") as string;
  const fullAddress = formData.get("fullAddress") as string;
  const documentType = formData.get("documentType") as string;
  const documentNumber = formData.get("documentNumber") as string;
  const bankName = (formData.get("bankName") as string) || null;
  const bankAccountHolder = (formData.get("bankAccountHolder") as string) || null;
  const bankAccountNumber = (formData.get("bankAccountNumber") as string) || null;
  const bankBranch = (formData.get("bankBranch") as string) || null;

  // 2. Extract the files
  const frontIdFile = formData.get("frontId") as File;
  const backIdFile = formData.get("backId") as File | null;
  const selfieFile = formData.get("selfie") as File;

  if (!frontIdFile || !selfieFile) {
    throw new Error("Required documents are missing.");
  }

  // 3. Upload to Vercel Blob
  // We use `addRandomSuffix: true` so filenames never collide and throw overwrite errors
  const frontIdBlob = await put(`kyc/${userId}/front-id-${frontIdFile.name}`, frontIdFile, { 
    access: 'public',
    addRandomSuffix: true
  });
  
  const selfieBlob = await put(`kyc/${userId}/selfie-${selfieFile.name}`, selfieFile, { 
    access: 'public',
    addRandomSuffix: true
  });
  
  let backIdBlob = null;
  if (backIdFile && backIdFile.size > 0) {
    backIdBlob = await put(`kyc/${userId}/back-id-${backIdFile.name}`, backIdFile, { 
      access: 'public',
      addRandomSuffix: true
    });
  }

  // 4. Save to Database
  await db.insert(kycApplications).values({
    userId,
    legalName,
    dob,
    phoneNumber,
    country,
    fullAddress,
    documentType,
    documentNumber,
    frontIdUrl: frontIdBlob.url,
    backIdUrl: backIdBlob?.url || null,
    selfieUrl: selfieBlob.url,
  });

  // 5. Update User Status + save bank details if provided
  await db.update(users)
    .set({
      kycStatus: "pending",
      ...(bankName && { bankName }),
      ...(bankAccountHolder && { bankAccountHolder }),
      ...(bankAccountNumber && { bankAccountNumber }),
      ...(bankBranch && { bankBranch }),
    })
    .where(eq(users.id, userId));

  return { success: true };
}