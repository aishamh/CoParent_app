import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPhotoAlbums,
  getAlbumPhotos,
  createPhotoAlbum,
  deletePhotoAlbum,
  uploadPhoto,
  deletePhoto,
} from "../api/photos";

export function usePhotoAlbums() {
  return useQuery({
    queryKey: ["photoAlbums"],
    queryFn: getPhotoAlbums,
  });
}

export function useAlbumPhotos(albumId: string) {
  return useQuery({
    queryKey: ["albumPhotos", albumId],
    queryFn: () => getAlbumPhotos(albumId),
    enabled: !!albumId,
  });
}

interface CreateAlbumParams {
  title: string;
  childId?: number;
}

export function useCreatePhotoAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, childId }: CreateAlbumParams) =>
      createPhotoAlbum(title, childId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["photoAlbums"] }),
  });
}

export function useDeletePhotoAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePhotoAlbum,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["photoAlbums"] }),
  });
}

interface UploadPhotoParams {
  albumId: string;
  fileUri: string;
  fileName: string;
  fileType: string;
  caption?: string;
}

export function useUploadPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, fileUri, fileName, fileType, caption }: UploadPhotoParams) =>
      uploadPhoto(albumId, fileUri, fileName, fileType, caption),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["albumPhotos", variables.albumId] });
      queryClient.invalidateQueries({ queryKey: ["photoAlbums"] });
    },
  });
}

export function useDeletePhoto(albumId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albumPhotos", albumId] });
      queryClient.invalidateQueries({ queryKey: ["photoAlbums"] });
    },
  });
}
