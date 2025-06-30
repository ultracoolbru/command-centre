"use server";

import clientPromise from "@/lib/mongodb";
import { UserSchema, User } from "@/types/schemas"; // Assuming User is the inferred type
import { ZodError } from "zod";

interface CreateMongoUserProfileParams {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

export async function createMongoUserProfile(
  params: CreateMongoUserProfileParams
): Promise<{ success: boolean; message: string; userId?: string; errorFields?: any }> {
  try {
    const { uid, email, displayName, firstName, lastName } = params;

    if (!uid || !email) {
      return { success: false, message: "User ID (uid) and email are required." };
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<Omit<User, 'id'>>("users"); // Store as Omit<User, 'id'> if DB uses _id

    // Check if user already exists in MongoDB (e.g., if action is somehow called twice)
    const existingUser = await usersCollection.findOne({ _id: uid as any }); // Use `_id` for MongoDB
    if (existingUser) {
      // This case should ideally be rare if UI flow is correct.
      // Could update existing user or just return success if data matches.
      // For now, let's treat it as a success to avoid blocking the flow if Firebase user exists.
      console.warn(`User with UID ${uid} already exists in MongoDB.`);
      return { success: true, message: "User profile already exists.", userId: uid };
    }

    const now = new Date();

    // Prepare the user document according to UserSchema, applying defaults
    const newUserDocumentData = {
      _id: uid as any, // Use uid as MongoDB's _id
      email: email.toLowerCase(),
      isEmailVerified: false, // Email verification is pending
      isActive: true,
      role: 'user', // Default role
      lastLogin: undefined, // Will be set on actual login
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      recoveryCodes: [],
      telegramId: undefined,
      telegramUsername: undefined,
      telegramFirstName: undefined,
      telegramLastName: undefined,
      emailNotificationsEnabled: true,
      displayName: displayName || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      avatarUrl: undefined,
      bio: undefined,
      timezone: undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Validate with a partial schema or be careful if UserSchema has non-optional fields not set here
    // For UserSchema, id is not optional, but we are using _id.
    // Let's ensure the structure matches what UserSchema expects for creation (excluding the Zod 'id' field if _id is used)

    const dataToInsert = { ...newUserDocumentData };
    // Manually map _id to id for validation if UserSchema expects 'id'
    const validationSchema = UserSchema.omit({ id: true }); // Assuming UserSchema has 'id', not '_id'

    // For the purpose of this action, we are constructing the document.
    // The UserSchema has `id: z.string()`. We are using `_id` for Mongo.
    // When fetching, we would map `_id` to `id`.
    // For insertion, we provide `_id`.

    // Let's refine the document based on UserSchema to ensure all defaults are applied by Zod if possible,
    // or ensure all required fields are present.
    // The current UserSchema has many defaults.

    const userToCreate: Omit<User, "id"> & { _id: string } = {
        _id: uid,
        email: email.toLowerCase(),
        isEmailVerified: UserSchema.shape.isEmailVerified.parse(undefined), // Get default
        isActive: UserSchema.shape.isActive.parse(undefined),
        role: UserSchema.shape.role.parse(undefined),
        lastLogin: undefined,
        twoFactorEnabled: UserSchema.shape.twoFactorEnabled.parse(undefined),
        twoFactorSecret: undefined,
        recoveryCodes: UserSchema.shape.recoveryCodes.parse(undefined),
        telegramId: undefined,
        telegramUsername: undefined,
        telegramFirstName: undefined,
        telegramLastName: undefined,
        emailNotificationsEnabled: UserSchema.shape.emailNotificationsEnabled.parse(undefined),
        displayName: displayName || `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        avatarUrl: undefined,
        bio: undefined,
        timezone: undefined,
        createdAt: now,
        updatedAt: now,
    };


    // Zod validation is more for incoming data. Here we are constructing it.
    // However, it's good practice to ensure the object matches the schema.
    // We can validate `userToCreate` against `UserSchema` (after mapping _id to id).
    const validationCheckData = { ...userToCreate, id: userToCreate._id };
    delete (validationCheckData as any)._id; // remove _id before validating with UserSchema expecting 'id'

    const parseResult = UserSchema.safeParse(validationCheckData);

    if (!parseResult.success) {
        console.error("MongoDB User Document Validation Error:", parseResult.error.flatten());
        return {
            success: false,
            message: "Failed to create user profile due to validation errors.",
            errorFields: parseResult.error.flatten().fieldErrors
        };
    }

    // Use the data that Zod parsed and defaulted, if necessary, but ensure _id is used for insertion
    const finalDataForDb = { ...parseResult.data, _id: uid };
    delete (finalDataForDb as any).id; // remove 'id' field, use '_id'

    await usersCollection.insertOne(finalDataForDb as any); // Cast to any to handle _id vs id

    return {
      success: true,
      message: "User profile created successfully in MongoDB.",
      userId: uid,
    };

  } catch (error) {
    console.error("Error in createMongoUserProfile:", error);
    if (error instanceof ZodError) {
        return {
            success: false,
            message: "Validation error creating user profile.",
            errorFields: error.flatten().fieldErrors
        };
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to create user profile: ${errorMessage}` };
  }
}
