import { z } from "zod";
import { plankaRequest } from "../common/utils.js";
import { PlankaTaskSchema } from "../common/types.js";

// Schema definitions
export const CreateTaskSchema = z.object({
    cardId: z.string().describe("Card ID"),
    name: z.string().describe("Task name"),
    position: z.number().optional().describe("Task position (default: 65535)"),
});

// New schema for batch task creation
export const BatchCreateTasksSchema = z.object({
    tasks: z.array(CreateTaskSchema).describe("Array of tasks to create"),
});

export const GetTasksSchema = z.object({
    cardId: z.string().describe("Card ID"),
});

export const GetTaskSchema = z.object({
    id: z.string().describe("Task ID"),
});

export const UpdateTaskSchema = z.object({
    id: z.string().describe("Task ID"),
    name: z.string().optional().describe("Task name"),
    isCompleted: z.boolean().optional().describe(
        "Whether the task is completed",
    ),
    position: z.number().optional().describe("Task position"),
});

export const DeleteTaskSchema = z.object({
    id: z.string().describe("Task ID"),
});

// Type exports
export type CreateTaskOptions = z.infer<typeof CreateTaskSchema>;
export type BatchCreateTasksOptions = z.infer<typeof BatchCreateTasksSchema>;
export type UpdateTaskOptions = z.infer<typeof UpdateTaskSchema>;

// Response schemas
const TasksResponseSchema = z.object({
    items: z.array(PlankaTaskSchema),
    included: z.record(z.any()).optional(),
});

const TaskResponseSchema = z.object({
    item: PlankaTaskSchema,
    included: z.record(z.any()).optional(),
});

// Function implementations
export async function createTask(options: CreateTaskOptions) {
    try {
        const response = await plankaRequest(
            `/api/cards/${options.cardId}/tasks`,
            {
                method: "POST",
                body: {
                    name: options.name,
                    position: options.position,
                },
            },
        );
        const parsedResponse = TaskResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to create task: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

// New function for batch task creation
export async function batchCreateTasks(options: BatchCreateTasksOptions) {
    try {
        // Define proper types for results and errors
        interface TaskResult {
            success: boolean;
            result?: any;
            error?: { message: string };
        }

        interface TaskError {
            index: number;
            task: CreateTaskOptions;
            error: string;
        }

        const results: TaskResult[] = [];
        const errors: TaskError[] = [];

        // Process tasks in parallel for better performance
        const taskPromises = options.tasks.map(async (task, index) => {
            try {
                const result = await createTask(task);
                results[index] = { success: true, result };
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : String(error);
                results[index] = {
                    success: false,
                    error: { message: errorMessage },
                };
                errors.push({ index, task, error: errorMessage });
            }
        });

        await Promise.all(taskPromises);

        return {
            results,
            summary: {
                total: options.tasks.length,
                succeeded: results.filter((r) => r.success).length,
                failed: errors.length,
                errors: errors.length > 0 ? errors : undefined,
            },
        };
    } catch (error) {
        throw new Error(
            `Failed to batch create tasks: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function getTasks(cardId: string) {
    try {
        // First, we need to get the card to find its boardId
        const cardResponse = await plankaRequest(`/api/cards/${cardId}`);

        if (
            !cardResponse || typeof cardResponse !== "object" ||
            !("item" in cardResponse)
        ) {
            return [];
        }

        const card = cardResponse.item;
        if (!card || typeof card !== "object" || !("boardId" in card)) {
            return [];
        }

        const boardId = card.boardId;

        // Now get the board which includes tasks in the response
        const boardResponse = await plankaRequest(`/api/boards/${boardId}`);

        // Check if the response has the expected structure
        if (
            boardResponse &&
            typeof boardResponse === "object" &&
            "included" in boardResponse &&
            boardResponse.included &&
            typeof boardResponse.included === "object" &&
            "tasks" in (boardResponse.included as Record<string, unknown>)
        ) {
            // Get the tasks from the included property
            const allTasks =
                (boardResponse.included as Record<string, unknown>).tasks;
            if (Array.isArray(allTasks)) {
                // Filter tasks by cardId
                const filteredTasks = allTasks.filter((task) =>
                    typeof task === "object" &&
                    task !== null &&
                    "cardId" in task &&
                    task.cardId === cardId
                );
                return filteredTasks;
            }
        }

        // If we can't find tasks in the expected format, return an empty array
        return [];
    } catch (error) {
        // If all else fails, return an empty array
        return [];
    }
}

export async function getTask(id: string) {
    try {
        // Get all projects which includes boards
        const projectsResponse = await plankaRequest(`/api/projects`);

        if (
            !projectsResponse ||
            typeof projectsResponse !== "object" ||
            !("included" in projectsResponse) ||
            !projectsResponse.included ||
            typeof projectsResponse.included !== "object"
        ) {
            throw new Error("Failed to get projects");
        }

        const included = projectsResponse.included as Record<string, unknown>;

        // Get all boards
        if (!("boards" in included) || !Array.isArray(included.boards)) {
            throw new Error("No boards found");
        }

        const boards = included.boards;

        // Check each board for the task
        for (const board of boards) {
            if (
                typeof board !== "object" || board === null || !("id" in board)
            ) {
                continue;
            }

            const boardId = board.id as string;

            // Get the board details which includes tasks
            const boardResponse = await plankaRequest(`/api/boards/${boardId}`);

            if (
                !boardResponse ||
                typeof boardResponse !== "object" ||
                !("included" in boardResponse) ||
                !boardResponse.included ||
                typeof boardResponse.included !== "object"
            ) {
                continue;
            }

            const boardIncluded = boardResponse.included as Record<
                string,
                unknown
            >;

            if (
                !("tasks" in boardIncluded) ||
                !Array.isArray(boardIncluded.tasks)
            ) {
                continue;
            }

            const tasks = boardIncluded.tasks;

            // Find the task with the matching ID
            const task = tasks.find((task) =>
                typeof task === "object" &&
                task !== null &&
                "id" in task &&
                task.id === id
            );

            if (task) {
                return task;
            }
        }

        throw new Error(`Task not found: ${id}`);
    } catch (error) {
        throw new Error(
            `Failed to get task: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function updateTask(
    id: string,
    options: Partial<Omit<CreateTaskOptions, "cardId">>,
) {
    try {
        const response = await plankaRequest(`/api/tasks/${id}`, {
            method: "PATCH",
            body: options,
        });
        const parsedResponse = TaskResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to update task: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function deleteTask(id: string) {
    try {
        await plankaRequest(`/api/tasks/${id}`, {
            method: "DELETE",
        });
        return { success: true };
    } catch (error) {
        throw new Error(
            `Failed to delete task: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}
