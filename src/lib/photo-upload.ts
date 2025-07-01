import { storage } from '@/lib/firebase';
import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';

export async function uploadProfilePhoto(
    file: File,
    uid: string,
    currentAvatarUrl?: string
): Promise<{ success: boolean; avatarUrl?: string; message?: string }> {
    try {
        // Step 1: Delete existing photos for this user
        const userPhotosRef = ref(storage, `profile-photos/${uid}`);

        try {
            const listResult = await listAll(userPhotosRef);
            const deletePromises = listResult.items.map(itemRef => deleteObject(itemRef));
            await Promise.all(deletePromises);
            console.log(`Deleted ${listResult.items.length} existing photos for user ${uid}`);
        } catch (deleteError) {
            console.log('No existing photos to delete or error deleting:', deleteError);
            // Continue with upload even if deletion fails
        }

        // Step 2: Upload the new photo with a consistent name
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const photoRef = ref(storage, `profile-photos/${uid}/profile.${fileExtension}`);

        // Upload the file
        const snapshot = await uploadBytes(photoRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        return { success: true, avatarUrl: downloadURL };
    } catch (error) {
        console.error('Error uploading photo:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {
            success: false,
            message: `Failed to upload photo: ${errorMessage}`
        };
    }
}

// Function to delete a user's profile photo
export async function deleteProfilePhoto(uid: string): Promise<{ success: boolean; message?: string }> {
    try {
        console.log(`Attempting to delete photos for user: ${uid}`);
        const userPhotosRef = ref(storage, `profile-photos/${uid}`);
        const listResult = await listAll(userPhotosRef);

        console.log(`Found ${listResult.items.length} photos to delete`);
        if (listResult.items.length === 0) {
            return { success: true, message: 'No photos to delete' };
        }

        // Log the files we're trying to delete
        listResult.items.forEach(item => {
            console.log(`Deleting: ${item.fullPath}`);
        });

        const deletePromises = listResult.items.map(async (itemRef) => {
            try {
                await deleteObject(itemRef);
                console.log(`Successfully deleted: ${itemRef.fullPath}`);
                return { success: true, path: itemRef.fullPath };
            } catch (error) {
                console.error(`Failed to delete ${itemRef.fullPath}:`, error);
                return { success: false, path: itemRef.fullPath, error };
            }
        });

        const results = await Promise.all(deletePromises);
        const failed = results.filter(r => !r.success);

        if (failed.length > 0) {
            console.error('Some deletes failed:', failed);
            return {
                success: false,
                message: `Failed to delete ${failed.length} out of ${results.length} photos`
            };
        }

        return { success: true, message: `Deleted ${listResult.items.length} photos` };
    } catch (error) {
        console.error('Error deleting photos:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {
            success: false,
            message: `Failed to delete photos: ${errorMessage}`
        };
    }
}

// Function to delete a specific photo by URL
export async function deletePhotoByUrl(avatarUrl: string): Promise<{ success: boolean; message?: string }> {
    try {
        console.log(`Attempting to delete photo by URL: ${avatarUrl}`);

        // Extract the path from the Firebase Storage URL
        const url = new URL(avatarUrl);
        const pathMatch = url.pathname.match(/\/o\/(.+)\?/);

        if (!pathMatch) {
            return { success: false, message: 'Invalid Firebase Storage URL' };
        }

        const decodedPath = decodeURIComponent(pathMatch[1]);
        console.log(`Extracted path: ${decodedPath}`);

        const photoRef = ref(storage, decodedPath);
        await deleteObject(photoRef);

        console.log(`Successfully deleted photo: ${decodedPath}`);
        return { success: true, message: 'Photo deleted successfully' };
    } catch (error) {
        console.error('Error deleting photo by URL:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return {
            success: false,
            message: `Failed to delete photo: ${errorMessage}`
        };
    }
}
