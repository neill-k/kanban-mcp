import { z } from "zod";
import { createCard, assignMemberToCard } from "../operations/cards.js";
import { createTask } from "../operations/tasks.js";
import { createComment } from "../operations/comments.js";

/**
 * Zod schema for the createCardWithTasks function parameters
 * @property {string} listId - The ID of the list to create the card in
 * @property {string} name - The name of the card
 * @property {string} [description] - The description of the card
 * @property {Array<{name: string, comment?: string}>} [tasks] - Array of task objects, each with a name and an optional comment
 * @property {string} [comment] - Optional global comment to add to the card itself
 * @property {number} [position] - Optional position for the card in the list
 * @property {string} [dueDate] - Optional due date for the card (ISO 8601 format)
 * @property {string[]} [memberIds] - Optional array of user IDs to assign to the card
 */
export const createCardWithTasksSchema = z.object({
    listId: z.string().describe("The ID of the list to create the card in"),
    name: z.string().describe("The name of the card"),
    description: z.string().optional().describe("The description of the card"),
    tasks: z.array(z.object({
        name: z.string(),
        comment: z.string().optional(),
    })).optional().describe(
        "Array of task objects, each with a name and an optional comment",
    ),
    comment: z.string().optional().describe(
        "Optional global comment to add to the card itself",
    ),
    position: z.number().optional().describe(
        "Optional position for the card in the list",
    ),
    dueDate: z
        .string()
        .datetime({ offset: true })
        .optional()
        .describe("Optional due date for the card (ISO 8601 format)"),
    memberIds: z.array(z.string()).optional().describe(
        "Optional array of user IDs to assign to the card"
    ),
});

/**
 * Type definition for createCardWithTasks parameters
 */
export type CreateCardWithTasksParams = z.infer<
    typeof createCardWithTasksSchema
>;

/**
 * Creates a new card with tasks, description, members, and optional comment in a single operation
 *
 * This function streamlines the process of creating a card with associated tasks, members, and comments
 * by handling all the necessary API calls in a single function.
 *
 * @param {CreateCardWithTasksParams} params - Parameters for creating a card with tasks
 * @param {string} params.listId - The ID of the list to create the card in
 * @param {string} params.name - The name of the card
 * @param {string} [params.description] - The description of the card
 * @param {Array<{name: string, comment?: string}>} [params.tasks] - Array of task objects
 * @param {string[]} [params.memberIds] - Optional array of user IDs to assign
 * @param {string} [params.comment] - Optional global comment for the card
 * @param {number} [params.position] - Optional position for the card in the list
 * @param {string} [params.dueDate] - Optional due date for the card
 * @returns {Promise<object>} The created card, tasks, assigned members (implicitly), and comment
 * @throws {Error} If there's an error creating the card, tasks, assigning members, or comment
 */
export async function createCardWithTasks(params: CreateCardWithTasksParams) {
    const { listId, name, description, tasks, comment, position = 65535, dueDate, memberIds } =
        params;

    try {
        // Create the card
        const card = await createCard({
            listId,
            name,
            description: description || "",
            position,
            dueDate,
        });

        // Assign members if provided
        if (memberIds && memberIds.length > 0 && card.id) {
            for (const userId of memberIds) {
                try {
                    await assignMemberToCard({ cardId: card.id, userId });
                } catch (assignError) {
                    console.warn(`Failed to assign member ${userId} to card ${card.id}:`, assignError);
                    // Optionally, collect these errors and report them, 
                    // or decide if a single failed assignment should throw an error for the whole operation.
                    // For now, we log a warning and continue.
                }
            }
        }

        // Create tasks if provided
        const createdTasks = [];
        if (tasks && tasks.length > 0 && card.id) {
            for (let i = 0; i < tasks.length; i++) {
                const taskObject = tasks[i]; // Now an object { name: string, comment?: string }
                const taskPosition = 65535 * (i + 1);
                const task = await createTask({
                    cardId: card.id,
                    name: taskObject.name, // Use taskObject.name
                    position: taskPosition,
                });
                createdTasks.push(task);

                // If the task object has a comment, create a card comment for it
                if (taskObject.comment && card.id && task.id) { // Ensure task was created
                    try {
                        await createComment({
                            cardId: card.id,
                            text: `Comment for task "${taskObject.name}": ${taskObject.comment}`,
                        });
                    } catch (taskCommentError) {
                        console.warn(`Failed to add comment for task "${taskObject.name}" on card ${card.id}:`, taskCommentError);
                        // Log and continue
                    }
                }
            }
        }

        // Add a global card comment if provided (this is the original comment field)
        let createdGlobalCardComment = null;
        if (comment && card.id) { 
            createdGlobalCardComment = await createComment({
                cardId: card.id,
                text: comment, 
            });
        }

        return {
            card,
            tasks: createdTasks,
            comment: createdGlobalCardComment, // This now refers to the global card comment
            // Member assignment status is not explicitly returned but performed.
            // Could add a field like assignedMemberIds: memberIds if successful, or errors if any occurred.
        };
    } catch (error) {
        console.error("Error in createCardWithTasks:", error);
        throw error; // Re-throw the error to be handled by the caller or MCP framework
    }
}
