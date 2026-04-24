import {
  parsePublicSupabaseEnv,
  parseServerSupabaseEnv
} from "@petadot/config";

export function getPublicSupabaseEnv() {
  return parsePublicSupabaseEnv(process.env);
}

export function getServerSupabaseEnv() {
  return parseServerSupabaseEnv(process.env);
}
