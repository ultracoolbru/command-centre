"use server";

import clientPromise from "@/lib/mongodb";
import { getValidatedUserId } from "@/lib/server-auth";
import { sendTaskCreatedNotification } from "@/lib/telegram";
import { Goal, GoalSchema } from "@/types/schemas";
import { ObjectId } from "mongodb";

/**
 * Create a new goal
 */
export async function createGoal(
    userId: string,
    values: {
        title: string;
        description?: string;
        category?: string;
    }
): Promise<{ success: boolean; message: string; goal?: Goal }> {
    try {
        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        // Validate input values against the schema
        const validationResult = GoalSchema.pick({
            title: true,
            description: true,
            category: true,
        }).safeParse(values);

        if (!validationResult.success) {
            const errorMessages = Object.values(validationResult.error.flatten().fieldErrors).flat().join('; ');
            return { success: false, message: `Validation failed: ${errorMessages}` };
        }

        const validatedValues = validationResult.data;

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<Omit<Goal, 'id'>>("Goal");

        const goalDocument = {
            userId: validatedUserId,
            title: validatedValues.title,
            description: validatedValues.description || "",
            category: validatedValues.category || "",
            progress: 0,
            status: 'planning' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(goalDocument);

        if (result.acknowledged) {
            const createdGoal: Goal = {
                id: result.insertedId.toString(),
                userId: goalDocument.userId,
                title: goalDocument.title,
                description: goalDocument.description,
                category: goalDocument.category,
                progress: goalDocument.progress,
                status: goalDocument.status,
                createdAt: goalDocument.createdAt,
                updatedAt: goalDocument.updatedAt,
            };

            return {
                success: true,
                message: "Goal created successfully.",
                goal: createdGoal
            };
        } else {
            return { success: false, message: "Failed to create goal." };
        }
    } catch (error) {
        console.error("Error creating goal:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error creating goal: ${errorMessage}` };
    }
}

/**
 * Get all goals for a user
 */
export async function getUserGoals(userId: string): Promise<{ success: boolean; message?: string; goals?: Goal[] }> {
    try {
        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<Goal>("Goal");

        const goals = await collection.find({ userId: validatedUserId })
            .sort({ createdAt: -1 })
            .toArray();

        const formattedGoals: Goal[] = goals.map(goal => ({
            id: goal._id?.toString() || goal.id,
            userId: goal.userId,
            title: goal.title,
            description: goal.description,
            category: goal.category,
            progress: goal.progress,
            status: goal.status,
            createdAt: goal.createdAt,
            updatedAt: goal.updatedAt,
        }));

        return {
            success: true,
            goals: formattedGoals
        };
    } catch (error) {
        console.error("Error fetching goals:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error fetching goals: ${errorMessage}` };
    }
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(
    userId: string,
    goalId: string,
    progress: number
): Promise<{ success: boolean; message: string }> {
    try {
        console.log('updateGoalProgress called with:', { userId, goalId, progress });

        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        // Validate progress value
        if (progress < 0 || progress > 100) {
            return { success: false, message: "Progress must be between 0 and 100." };
        }

        // Validate that goalId is a valid ObjectId
        if (!ObjectId.isValid(goalId)) {
            return { success: false, message: "Invalid goal ID format." };
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<Goal>("Goal");

        console.log('Attempting to update goal with filter:', {
            _id: new ObjectId(goalId),
            userId: validatedUserId
        });

        // Update the goal progress
        const result = await collection.updateOne(
            {
                _id: new ObjectId(goalId),
                userId: validatedUserId
            },
            {
                $set: {
                    progress: progress,
                    status: progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'planning',
                    updatedAt: new Date()
                }
            }
        );

        console.log('Update result:', result);

        if (result.matchedCount === 0) {
            return { success: false, message: "Goal not found or you don't have permission to update it." };
        }

        if (result.modifiedCount === 0) {
            return { success: false, message: "No changes were made to the goal." };
        }

        return { success: true, message: "Goal progress updated successfully." };
    } catch (error) {
        console.error("Error updating goal progress:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error updating goal progress: ${errorMessage}` };
    }
}

/**
 * Delete a goal
 */
export async function deleteGoal(
    userId: string,
    goalId: string
): Promise<{ success: boolean; message: string }> {
    try {
        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        // Validate that goalId is a valid ObjectId
        if (!ObjectId.isValid(goalId)) {
            return { success: false, message: "Invalid goal ID format." };
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<Goal>("Goal");

        const result = await collection.deleteOne({
            _id: new ObjectId(goalId),
            userId: validatedUserId
        });

        if (result.deletedCount === 0) {
            return { success: false, message: "Goal not found or you don't have permission to delete it." };
        }

        return { success: true, message: "Goal deleted successfully." };
    } catch (error) {
        console.error("Error deleting goal:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error deleting goal: ${errorMessage}` };
    }
}

/**
 * Edit/Update a goal
 */
export async function editGoal(
    userId: string,
    goalId: string,
    values: {
        title: string;
        description?: string;
        category?: string;
    }
): Promise<{ success: boolean; message: string; goal?: Goal }> {
    try {
        console.log('editGoal called with:', { userId, goalId, values });

        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        // Validate that goalId is a valid ObjectId
        if (!ObjectId.isValid(goalId)) {
            return { success: false, message: "Invalid goal ID format." };
        }

        // Validate input values against the schema
        const validationResult = GoalSchema.pick({
            title: true,
            description: true,
            category: true,
        }).safeParse(values);

        if (!validationResult.success) {
            const errorMessages = Object.values(validationResult.error.flatten().fieldErrors).flat().join('; ');
            return { success: false, message: `Validation failed: ${errorMessages}` };
        }

        const validatedValues = validationResult.data;

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<Goal>("Goal");

        // Update the goal
        const result = await collection.updateOne(
            {
                _id: new ObjectId(goalId),
                userId: validatedUserId
            },
            {
                $set: {
                    title: validatedValues.title,
                    description: validatedValues.description || "",
                    category: validatedValues.category || "",
                    updatedAt: new Date()
                }
            }
        );

        console.log('Edit result:', result);

        if (result.matchedCount === 0) {
            return { success: false, message: "Goal not found or you don't have permission to edit it." };
        }

        if (result.modifiedCount === 0) {
            return { success: false, message: "No changes were made to the goal." };
        }

        // Fetch the updated goal to return it
        const updatedGoal = await collection.findOne({
            _id: new ObjectId(goalId),
            userId: validatedUserId
        });

        if (!updatedGoal) {
            return { success: false, message: "Failed to retrieve updated goal." };
        }

        const formattedGoal: Goal = {
            id: updatedGoal._id?.toString() || goalId,
            userId: updatedGoal.userId,
            title: updatedGoal.title,
            description: updatedGoal.description,
            category: updatedGoal.category,
            progress: updatedGoal.progress,
            status: updatedGoal.status,
            createdAt: updatedGoal.createdAt,
            updatedAt: updatedGoal.updatedAt,
        };

        return { success: true, message: "Goal updated successfully.", goal: formattedGoal };
    } catch (error) {
        console.error("Error editing goal:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error editing goal: ${errorMessage}` };
    }
}

/**
 * Create a new task
 */
export async function createTask(
    userId: string,
    values: {
        title: string;
        description?: string;
        priority: 'low' | 'medium' | 'high';
        tags: string[];
        goalId?: string;
        dueDate?: string;
    }
): Promise<{ success: boolean; message: string; task?: any }> {
    try {
        console.log('createTask called with:', { userId, values });

        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        // Validate input values
        if (!values.title || values.title.trim() === '') {
            return { success: false, message: "Task title is required." };
        }

        // Validate goalId if provided
        if (values.goalId && !ObjectId.isValid(values.goalId)) {
            return { success: false, message: "Invalid goal ID format." };
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection("Task");

        const taskDocument = {
            userId: validatedUserId,
            title: values.title.trim(),
            description: values.description?.trim() || "",
            completed: false,
            priority: values.priority,
            tags: values.tags || [],
            goalId: values.goalId || null,
            dueDate: values.dueDate ? new Date(values.dueDate) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(taskDocument);

        if (result.acknowledged) {
            const createdTask = {
                id: result.insertedId.toString(),
                userId: taskDocument.userId,
                title: taskDocument.title,
                description: taskDocument.description,
                completed: taskDocument.completed,
                priority: taskDocument.priority,
                tags: taskDocument.tags,
                goalId: taskDocument.goalId,
                dueDate: taskDocument.dueDate,
                createdAt: taskDocument.createdAt,
                updatedAt: taskDocument.updatedAt,
            };

            // Send Telegram notification (non-blocking)
            sendTaskCreatedNotification({
                title: taskDocument.title,
                description: taskDocument.description,
                priority: taskDocument.priority,
                tags: taskDocument.tags,
                goalId: taskDocument.goalId || undefined,
            }).catch(error => {
                // Log error but don't fail the task creation
                console.error('Failed to send Telegram notification:', error);
            });

            return {
                success: true,
                message: "Task created successfully.",
                task: createdTask
            };
        } else {
            return { success: false, message: "Failed to create task." };
        }
    } catch (error) {
        console.error("Error creating task:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error creating task: ${errorMessage}` };
    }
}

/**
 * Get all tasks for a user
 */
export async function getUserTasks(userId: string): Promise<{ success: boolean; message?: string; tasks?: any[] }> {
    try {
        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection("Task");

        const tasks = await collection.find({ userId: validatedUserId })
            .sort({ createdAt: -1 })
            .toArray();

        const formattedTasks = tasks.map(task => ({
            id: task._id?.toString() || task.id,
            userId: task.userId,
            title: task.title,
            description: task.description,
            completed: task.completed,
            priority: task.priority,
            tags: task.tags || [],
            goal: task.goalId || undefined, // Map goalId to goal for compatibility
            goalId: task.goalId,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
        }));

        return {
            success: true,
            tasks: formattedTasks
        };
    } catch (error) {
        console.error("Error fetching tasks:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error fetching tasks: ${errorMessage}` };
    }
}

/**
 * Update task completion status
 */
export async function updateTaskCompletion(
    userId: string,
    taskId: string,
    completed: boolean
): Promise<{ success: boolean; message: string }> {
    try {
        console.log('updateTaskCompletion called with:', { userId, taskId, completed });

        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        // Validate that taskId is a valid ObjectId
        if (!ObjectId.isValid(taskId)) {
            return { success: false, message: "Invalid task ID format." };
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection("Task");

        const result = await collection.updateOne(
            {
                _id: new ObjectId(taskId),
                userId: validatedUserId
            },
            {
                $set: {
                    completed: completed,
                    updatedAt: new Date()
                }
            }
        );

        console.log('Task completion update result:', result);

        if (result.matchedCount === 0) {
            return { success: false, message: "Task not found or you don't have permission to update it." };
        }

        return { success: true, message: `Task marked as ${completed ? 'completed' : 'incomplete'}.` };
    } catch (error) {
        console.error("Error updating task completion:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error updating task: ${errorMessage}` };
    }
}

/**
 * Delete a task
 */
export async function deleteTask(
    userId: string,
    taskId: string
): Promise<{ success: boolean; message: string }> {
    try {
        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        // Validate that taskId is a valid ObjectId
        if (!ObjectId.isValid(taskId)) {
            return { success: false, message: "Invalid task ID format." };
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection("Task");

        const result = await collection.deleteOne({
            _id: new ObjectId(taskId),
            userId: validatedUserId
        });

        if (result.deletedCount === 0) {
            return { success: false, message: "Task not found or you don't have permission to delete it." };
        }

        return { success: true, message: "Task deleted successfully." };
    } catch (error) {
        console.error("Error deleting task:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error deleting task: ${errorMessage}` };
    }
}

/**
 * Edit/Update a task
 */
export async function editTask(
    userId: string,
    taskId: string,
    values: {
        title: string;
        description?: string;
        priority: 'low' | 'medium' | 'high';
        tags: string[];
        goalId?: string;
        dueDate?: string;
    }
): Promise<{ success: boolean; message: string; task?: any }> {
    try {
        console.log('editTask called with:', { userId, taskId, values });

        // Validate user authentication
        const userValidation = getValidatedUserId(userId);
        if (!userValidation.isValid) {
            return { success: false, message: userValidation.error || "Authentication required." };
        }
        const validatedUserId = userValidation.userId!;

        // Validate that taskId is a valid ObjectId
        if (!ObjectId.isValid(taskId)) {
            return { success: false, message: "Invalid task ID format." };
        }

        // Validate input values
        if (!values.title || values.title.trim() === '') {
            return { success: false, message: "Task title is required." };
        }

        // Validate goalId if provided
        if (values.goalId && !ObjectId.isValid(values.goalId)) {
            return { success: false, message: "Invalid goal ID format." };
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection("Task");

        // Update the task
        const result = await collection.updateOne(
            {
                _id: new ObjectId(taskId),
                userId: validatedUserId
            },
            {
                $set: {
                    title: values.title.trim(),
                    description: values.description?.trim() || "",
                    priority: values.priority,
                    tags: values.tags || [],
                    goalId: values.goalId || null,
                    dueDate: values.dueDate ? new Date(values.dueDate) : null,
                    updatedAt: new Date()
                }
            }
        );

        console.log('Task edit result:', result);

        if (result.matchedCount === 0) {
            return { success: false, message: "Task not found or you don't have permission to edit it." };
        }

        if (result.modifiedCount === 0) {
            return { success: false, message: "No changes were made to the task." };
        }

        // Fetch the updated task to return it
        const updatedTask = await collection.findOne({
            _id: new ObjectId(taskId),
            userId: validatedUserId
        });

        if (!updatedTask) {
            return { success: false, message: "Failed to retrieve updated task." };
        }

        const formattedTask = {
            id: updatedTask._id?.toString() || taskId,
            userId: updatedTask.userId,
            title: updatedTask.title,
            description: updatedTask.description,
            completed: updatedTask.completed,
            priority: updatedTask.priority,
            tags: updatedTask.tags || [],
            goal: updatedTask.goalId || undefined,
            goalId: updatedTask.goalId,
            dueDate: updatedTask.dueDate,
            createdAt: updatedTask.createdAt,
            updatedAt: updatedTask.updatedAt,
        };

        return { success: true, message: "Task updated successfully.", task: formattedTask };
    } catch (error) {
        console.error("Error editing task:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Error editing task: ${errorMessage}` };
    }
}
