"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";
import {
  candidateProfileSchema,
  readList,
  zodToFieldErrors,
  type ActionState,
} from "@/lib/validations";
import { z } from "zod";

function parseProfileForm(formData: FormData) {
  return candidateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    college: formData.get("college"),
    gradYear: formData.get("gradYear"),
    github: formData.get("github"),
    linkedin: formData.get("linkedin") ?? "",
    skills: readList(formData, "skills"),
    resumeUrl: formData.get("resumeUrl") ?? "",
    videoUrl: formData.get("videoUrl") ?? "",
    availability: formData.get("availability") ?? "LOOKING",
  });
}

/** Creates or updates the Candidate row attached to the signed-in user. */
export async function saveCandidateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") {
    return { status: "error", message: "Sign in as a candidate to do that." };
  }
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const parsed = parseProfileForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need another look.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  const isOnboarding = formData.get("mode") === "onboarding";

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { name: input.name, phone: input.phone },
      }),
      prisma.candidate.upsert({
        where: { userId: session.user.id },
        update: {
          college: input.college,
          gradYear: input.gradYear,
          github: input.github,
          linkedin: input.linkedin || null,
          skills: input.skills,
          resumeUrl: input.resumeUrl || null,
          videoUrl: input.videoUrl || null,
          availability: input.availability,
        },
        create: {
          userId: session.user.id,
          college: input.college,
          gradYear: input.gradYear,
          github: input.github,
          linkedin: input.linkedin || null,
          skills: input.skills,
          resumeUrl: input.resumeUrl || null,
          videoUrl: input.videoUrl || null,
          availability: input.availability,
        },
      }),
    ]);
  } catch (error) {
    console.error("[profile] candidate save failed", error);
    return { status: "error", message: "We couldn't save that. Try again." };
  }

  revalidatePath("/me");
  revalidatePath("/me/profile");

  if (isOnboarding) {
    const next = String(formData.get("next") ?? "");
    redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/me");
  }

  return { status: "success", message: "Profile saved." };
}

const companyProfileSchema = z.object({
  companyName: z.string().trim().min(2, "Enter your company name").max(120),
  website: z.string().trim().url("Enter a full URL").optional().or(z.literal("")),
  contactPerson: z.string().trim().min(2, "Enter your name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[-\s]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});

export async function saveCompanyProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "COMPANY") {
    return { status: "error", message: "Sign in as a company to do that." };
  }
  if (!isDbConfigured) {
    return { status: "error", message: "This needs a database connection." };
  }

  const parsed = companyProfileSchema.safeParse({
    companyName: formData.get("companyName"),
    website: formData.get("website") ?? "",
    contactPerson: formData.get("contactPerson"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Some fields need another look.",
      fieldErrors: zodToFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  const isOnboarding = formData.get("mode") === "onboarding";

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { name: input.contactPerson, phone: input.phone },
      }),
      prisma.company.upsert({
        where: { userId: session.user.id },
        update: {
          name: input.companyName,
          website: input.website || null,
          contactPerson: input.contactPerson,
          contactEmail: session.user.email ?? null,
          contactPhone: input.phone,
        },
        create: {
          userId: session.user.id,
          name: input.companyName,
          website: input.website || null,
          contactPerson: input.contactPerson,
          contactEmail: session.user.email ?? null,
          contactPhone: input.phone,
        },
      }),
    ]);
  } catch (error) {
    console.error("[profile] company save failed", error);
    return { status: "error", message: "We couldn't save that. Try again." };
  }

  revalidatePath("/co");

  if (isOnboarding) redirect("/co");
  return { status: "success", message: "Company details saved." };
}
