// server/utils/file.js
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import supabase from '../supabaseClient.js';

// Upload file buffer to Supabase bucket
export async function uploadToBucket(file) {
  const ext = path.extname(file.originalname);
  const uniqueFileName = `${uuidv4()}${ext}`;

  const { error } = await supabase.storage
    .from('resources')
    .upload(uniqueFileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) throw error;

  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/resources/${uniqueFileName}`;

  return { publicUrl, uniqueFileName };
}

// Delete file from Supabase bucket using public URL
export async function deleteFromBucket(publicUrl) {
  const parts = publicUrl.split('/resources/');
  const pathInBucket = parts[1];
  if (!pathInBucket) throw new Error('Invalid Supabase file path');

  const { error } = await supabase.storage
    .from('resources')
    .remove([pathInBucket]);

  if (error) throw error;
}
