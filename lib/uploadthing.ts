import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { prisma, isDbConfigured } from "@/lib/db";

/**
 * File uploads for candidate resumes and demo videos.
 *
 * Optional, like Razorpay and Resend: without UPLOADTHING_TOKEN the uploader
 * is not rendered and the profile form falls back to a plain URL field, which
 * is how the site worked before uploads existed.
 */
export const uploadthingConfigured = Boolean(process.env.UPLOADTHING_TOKEN);

const f = createUploadthing();

/** Every upload is tied to a signed-in candidate — no anonymous writes. */
async function requireCandidate() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") {
    throw new UploadThingError("Sign in as a candidate to upload.");
  }
  if (!isDbConfigured) {
    throw new UploadThingError("Uploads need a database connection.");
  }

  const candidate = await prisma.candidate.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!candidate) {
    throw new UploadThingError("Complete your profile before uploading.");
  }

  return { candidateId: candidate.id, userId: session.user.id };
}

export const fileRouter = {
  /** PDF resume, 4MB cap — a fresher CV that exceeds this is a formatting bug. */
  resume: f({ pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => requireCandidate())
    .onUploadComplete(async ({ metadata, file }) => {
      // Persist here, not client-side: the client callback is a hint, and a
      // dropped connection must not lose the file we already stored.
      await prisma.candidate.update({
        where: { id: metadata.candidateId },
        data: { resumeUrl: file.ufsUrl },
      });
      return { url: file.ufsUrl };
    }),

  /**
   * Demo video, 64MB. Most candidates link YouTube/Loom instead — this exists
   * for the ones who cannot, e.g. patchy campus internet during upload week.
   */
  demoVideo: f({ video: { maxFileSize: "64MB", maxFileCount: 1 } })
    .middleware(async () => requireCandidate())
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.candidate.update({
        where: { id: metadata.candidateId },
        data: { videoUrl: file.ufsUrl },
      });
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
