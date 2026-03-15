import { type Express } from "express";
import multer from "multer";
import { put, del } from "@vercel/blob";
import { db } from "../db";
import { photoAlbums, photos } from "../tables";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../auth";
import { insertPhotoAlbumSchema, insertPhotoSchema } from "../../shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/heic", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

async function uploadToBlob(
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Graceful fallback for local dev without Vercel Blob
    return `data:${contentType};base64,${buffer.toString("base64").slice(0, 100)}...`;
  }

  const { url } = await put(`photos/${Date.now()}-${filename}`, buffer, {
    access: "public", // Vercel Blob only supports public access - URLs are unguessable with random tokens
    contentType,
  });
  return url;
}

export function registerPhotoRoutes(app: Express): void {
  // ----------------------------------------------------------
  // POST /api/photo-albums — Create a new photo album
  // ----------------------------------------------------------
  app.post("/api/photo-albums", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const userId: string = (req as any).userId;
      const validated = insertPhotoAlbumSchema.parse(req.body);

      const [album] = await db
        .insert(photoAlbums)
        .values({
          family_id: familyId,
          child_id: validated.child_id ?? null,
          title: validated.title,
          created_by: userId,
        })
        .returning();

      res.status(201).json(album);
    } catch (error) {
      console.error("[Photos] Create album error:", error);
      res.status(400).json({ error: "Failed to create album" });
    }
  });

  // ----------------------------------------------------------
  // GET /api/photo-albums — List all albums for the family
  // ----------------------------------------------------------
  app.get("/api/photo-albums", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;

      const albums = await db
        .select()
        .from(photoAlbums)
        .where(eq(photoAlbums.family_id, familyId))
        .orderBy(desc(photoAlbums.created_at));

      res.json(albums);
    } catch (error) {
      console.error("[Photos] List albums error:", error);
      res.status(500).json({ error: "Failed to list albums" });
    }
  });

  // ----------------------------------------------------------
  // GET /api/photo-albums/:id — Get a single album
  // ----------------------------------------------------------
  app.get("/api/photo-albums/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const albumId = req.params.id;

      const [album] = await db
        .select()
        .from(photoAlbums)
        .where(and(eq(photoAlbums.id, albumId), eq(photoAlbums.family_id, familyId)));

      if (!album) {
        return res.status(404).json({ error: "Album not found" });
      }

      res.json(album);
    } catch (error) {
      console.error("[Photos] Get album error:", error);
      res.status(500).json({ error: "Failed to get album" });
    }
  });

  // ----------------------------------------------------------
  // DELETE /api/photo-albums/:id — Delete an album and its photos
  // ----------------------------------------------------------
  app.delete("/api/photo-albums/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const albumId = req.params.id;

      const [album] = await db
        .select()
        .from(photoAlbums)
        .where(and(eq(photoAlbums.id, albumId), eq(photoAlbums.family_id, familyId)));

      if (!album) {
        return res.status(404).json({ error: "Album not found" });
      }

      // Delete all photos in the album first
      await db.delete(photos).where(eq(photos.album_id, albumId));
      await db.delete(photoAlbums).where(eq(photoAlbums.id, albumId));

      res.status(204).send();
    } catch (error) {
      console.error("[Photos] Delete album error:", error);
      res.status(500).json({ error: "Failed to delete album" });
    }
  });

  // ----------------------------------------------------------
  // POST /api/photo-albums/:id/photos — Upload a photo to an album
  // ----------------------------------------------------------
  app.post(
    "/api/photo-albums/:id/photos",
    requireAuth,
    upload.single("photo"),
    async (req, res) => {
      try {
        const familyId: string = (req as any).familyId;
        const userId: string = (req as any).userId;
        const albumId = req.params.id;

        if (!req.file) {
          return res.status(400).json({ error: "No photo uploaded" });
        }

        // Verify album belongs to the family
        const [album] = await db
          .select()
          .from(photoAlbums)
          .where(and(eq(photoAlbums.id, albumId), eq(photoAlbums.family_id, familyId)));

        if (!album) {
          return res.status(404).json({ error: "Album not found" });
        }

        const caption = req.body.caption || null;
        const fileUrl = await uploadToBlob(
          req.file.originalname,
          req.file.buffer,
          req.file.mimetype,
        );

        const [photo] = await db
          .insert(photos)
          .values({
            album_id: albumId,
            family_id: familyId,
            uploaded_by: userId,
            file_url: fileUrl,
            thumbnail_url: fileUrl, // MVP: reuse full-size URL
            caption,
          })
          .returning();

        // Set as cover photo if album has no cover yet
        if (!album.cover_photo_url) {
          await db
            .update(photoAlbums)
            .set({ cover_photo_url: fileUrl })
            .where(eq(photoAlbums.id, albumId));
        }

        res.status(201).json(photo);
      } catch (error) {
        console.error("[Photos] Upload photo error:", error);
        res.status(400).json({ error: "Failed to upload photo" });
      }
    },
  );

  // ----------------------------------------------------------
  // GET /api/photo-albums/:id/photos — List photos in an album
  // ----------------------------------------------------------
  app.get("/api/photo-albums/:id/photos", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const albumId = req.params.id;

      // Verify album belongs to the family
      const [album] = await db
        .select()
        .from(photoAlbums)
        .where(and(eq(photoAlbums.id, albumId), eq(photoAlbums.family_id, familyId)));

      if (!album) {
        return res.status(404).json({ error: "Album not found" });
      }

      const albumPhotos = await db
        .select()
        .from(photos)
        .where(eq(photos.album_id, albumId))
        .orderBy(desc(photos.created_at));

      res.json(albumPhotos);
    } catch (error) {
      console.error("[Photos] List photos error:", error);
      res.status(500).json({ error: "Failed to list photos" });
    }
  });

  // ----------------------------------------------------------
  // DELETE /api/photos/:id — Delete a single photo
  // ----------------------------------------------------------
  app.delete("/api/photos/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const photoId = req.params.id;

      const [photo] = await db
        .select()
        .from(photos)
        .where(and(eq(photos.id, photoId), eq(photos.family_id, familyId)));

      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }

      await db.delete(photos).where(eq(photos.id, photoId));
      res.status(204).send();
    } catch (error) {
      console.error("[Photos] Delete photo error:", error);
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });
}
