import { Request, Response } from "express";
import { prisma } from "../db/clientPrisma";
import { deleteImage, uploadImage } from "../utils/cloudinary";
import fs from "fs-extra";

export const createTrack = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;
  const { trackName, trackUrl, trackImage, trackCreatedAt, genreId, artistId, albumId, post, counter } = req.body;

  console.log(req.body);
  try {
    if (!trackName || !trackUrl) return res.status(400).send({ error: "Missing Required Fields" });
    if (!req.files?.trackImage) {
      return res.status(400).json({ error: "Image is missing" });
    }
    const imageVerefication = req.files?.trackImage;
    if ("tempFilePath" in imageVerefication) {
      const upload = await uploadImage(imageVerefication.tempFilePath);
      await fs.unlink(imageVerefication.tempFilePath);
      const newTrack = await prisma.track.create({
        data: {
          trackName,
          trackUrl,
          trackImage: upload.secure_url,
          trackCreatedAt,
          genre: genreId ? { connect: { id: genreId } } : undefined,
          artist: artistId ? { connect: { id: artistId } } : undefined,
          album: albumId ? { connect: { id: albumId } } : undefined,
          // post: post ?? null,
          // counter: counter ?? null
        },
      });

      const newTrackId = newTrack.id;

      const newTrackLiked = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          tracksId: {
            push: newTrackId,
          },
        },
      });

      return res.status(201).send({ message: "Track created successfully", newTrack });
    }
    return res.status(404).send({ message: "File not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
};

export const getTrackById = async (req: Request, res: Response): Promise<Response> => {
  const { trackId } = req.params;

  try {
    const getTrack = await prisma.track.findUnique({
      where: {
        id: trackId,
      },
    });

    return res.status(200).send({ message: "Track gotten successfully", getTrack });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
};

//TOFIX getTrackByAlbumId

export const getAllTracks = async (req: Request, res: Response): Promise<Response> => {
  try {
    const allTrack = await prisma.track.findMany({});

    return res.status(200).send({ message: "Track gotten successfully", allTrack });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
};

export const updateTrackById = async (req: Request, res: Response): Promise<Response> => {
  const { trackId } = req.params;
  const { trackName, trackUrl, genreId, artistId, albumId } = req.body;

  try {
    if (!req.files?.trackImage) {
      return res.status(400).json({ error: "Image is missing" });
    }
    const imageVerefication = req.files?.trackImage;
    if ("tempFilePath" in imageVerefication) {
      const upload = await uploadImage(imageVerefication.tempFilePath);
      await fs.unlink(imageVerefication.tempFilePath);
      const updateTrack = await prisma.track.update({
        where: {
          id: trackId,
        },
        data: {
          trackName,
          trackUrl,
          trackImage: upload.secure_url,
          genre: {
            connect: { id: genreId },
          },
          artist: {
            connect: { id: artistId },
          },
          album: {
            connect: { id: albumId },
          },
        },
      });

      return res.status(200).send({ message: "Track updated successfully", updateTrack });
    }
    return res.status(404).send({ message: "File not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
};

export const toggleTrackById = async (req: Request, res: Response): Promise<Response> => {
  const { trackId, userId } = req.params;

  try {
    const userToUpdate = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    let arrayTracksUser = userToUpdate?.tracksId || [];
    const index = arrayTracksUser.indexOf(trackId);

    if (index === -1) {
      arrayTracksUser.push(trackId);
    } else {
      arrayTracksUser.splice(index, 1);
    }

    const newTrackLiked = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        tracksId: arrayTracksUser,
      },
    });

    return res.status(200).send({ message: "Tracks liked modified successfully", newTrackLiked });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
};

export const deleteTrackById = async (req: Request, res: Response): Promise<Response> => {
  const { trackId } = req.params;

  try {
     //Find Track by id
     const track = await prisma.track.findUnique({
      where: { id:  trackId  }
    });

    if (!track) {
      return res.status(404).send({ status: "Error", msg: "track not found" });
    }else {      
        await deleteImage(track.trackImage)
      
    }

    const deleteTrack = await prisma.track.delete({
      where: {
        id: trackId,
      },
    });

    return res.status(200).send({ message: "Track deleted successfully", deleteTrack });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal server error" });
  }
};

// Crear 4 canciones para probar
// crear playlist vacia
// añadir canciones a playlist pasandole 3 canciones
// crear una segunda playlist pasandole otras 3 canciones
// Tener una cancion en dos playlist diferentes
// Y tener una playlist con canciones en comun con otra playlist.
