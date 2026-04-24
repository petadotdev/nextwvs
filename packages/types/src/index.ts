export type ActorType = "customer_user" | "admin_employee";

export type FileVisibility = "private" | "public";

export type FileOwnerActorType = ActorType | "system";

export interface StorageObjectRef {
  bucket: string;
  path: string;
}

export interface FileMetadataRecord extends StorageObjectRef {
  id: string;
  tenantId: string | null;
  ownerActorType: FileOwnerActorType | null;
  ownerActorId: string | null;
  category: string;
  originalFilename: string;
  contentType: string | null;
  byteSize: number | null;
  checksumSha256: string | null;
  visibility: FileVisibility;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
