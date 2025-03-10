import { z } from "zod";
import { plankaRequest } from "../common/utils.js";
import { PlankaListSchema } from "../common/types.js";

// Schema definitions
export const CreateListSchema = z.object({
    boardId: z.string().describe("Board ID"),
    name: z.string().describe("List name"),
    position: z.number().optional().describe("List position (default: 65535)"),
});

export const GetListsSchema = z.object({
    boardId: z.string().describe("Board ID"),
});

export const UpdateListSchema = z.object({
    id: z.string().describe("List ID"),
    name: z.string().optional().describe("List name"),
    position: z.number().optional().describe("List position"),
});

export const DeleteListSchema = z.object({
    id: z.string().describe("List ID"),
});

// Type exports
export type CreateListOptions = z.infer<typeof CreateListSchema>;
export type UpdateListOptions = z.infer<typeof UpdateListSchema>;

// Response schemas
const ListsResponseSchema = z.object({
    items: z.array(PlankaListSchema),
    included: z.record(z.any()).optional(),
});

const ListResponseSchema = z.object({
    item: PlankaListSchema,
    included: z.record(z.any()).optional(),
});

// Function implementations
export async function createList(options: CreateListOptions) {
    try {
        const response = await plankaRequest(
            `/api/boards/${options.boardId}/lists`,
            {
                method: "POST",
                body: {
                    name: options.name,
                    position: options.position,
                },
            },
        );
        const parsedResponse = ListResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to create list: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function getLists(boardId: string) {
    try {
        // Get the board which includes lists in the response
        const response = await plankaRequest(`/api/boards/${boardId}`);

        // Check if the response has the expected structure
        if (
            response &&
            typeof response === "object" &&
            "included" in response &&
            response.included &&
            typeof response.included === "object" &&
            "lists" in (response.included as Record<string, unknown>)
        ) {
            // Get the lists from the included property
            const lists = (response.included as Record<string, unknown>).lists;
            if (Array.isArray(lists)) {
                return lists;
            }
        }

        // If we can't find lists in the expected format, return an empty array
        return [];
    } catch (error) {
        // If all else fails, return an empty array
        return [];
    }
}

export async function updateList(
    id: string,
    options: Partial<Omit<CreateListOptions, "boardId">>,
) {
    const response = await plankaRequest(`/api/lists/${id}`, {
        method: "PATCH",
        body: options,
    });
    const parsedResponse = ListResponseSchema.parse(response);
    return parsedResponse.item;
}

export async function deleteList(id: string) {
    await plankaRequest(`/api/lists/${id}`, {
        method: "DELETE",
    });
    return { success: true };
}
