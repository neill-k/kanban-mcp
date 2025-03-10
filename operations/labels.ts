import { z } from "zod";
import { plankaRequest } from "../common/utils.js";
import { PlankaLabelSchema } from "../common/types.js";

// Schema definitions
export const VALID_LABEL_COLORS = [
    "berry-red",
    "pumpkin-orange",
    "lagoon-blue",
    "pink-tulip",
    "light-mud",
    "orange-peel",
    "bright-moss",
    "antique-blue",
    "dark-granite",
    "lagune-blue",
    "sunny-grass",
    "morning-sky",
    "light-orange",
    "midnight-blue",
    "tank-green",
    "gun-metal",
    "wet-moss",
    "red-burgundy",
    "light-concrete",
    "apricot-red",
    "desert-sand",
    "navy-blue",
    "egg-yellow",
    "coral-green",
    "light-cocoa",
] as const;

export const CreateLabelSchema = z.object({
    boardId: z.string().describe("Board ID"),
    name: z.string().describe("Label name"),
    color: z.enum(VALID_LABEL_COLORS).describe(
        "Label color (one of the valid Planka colors)",
    ),
    position: z.number().default(65535).describe(
        "Label position (default: 65535)",
    ),
});

export const GetLabelsSchema = z.object({
    boardId: z.string().describe("Board ID"),
});

export const GetLabelSchema = z.object({
    id: z.string().describe("Label ID"),
});

export const UpdateLabelSchema = z.object({
    id: z.string().describe("Label ID"),
    name: z.string().optional().describe("Label name"),
    color: z.enum(VALID_LABEL_COLORS).optional().describe(
        "Label color (one of the valid Planka colors)",
    ),
    position: z.number().optional().describe("Label position"),
});

export const DeleteLabelSchema = z.object({
    id: z.string().describe("Label ID"),
});

export const AddLabelToCardSchema = z.object({
    cardId: z.string().describe("Card ID"),
    labelId: z.string().describe("Label ID"),
});

export const RemoveLabelFromCardSchema = z.object({
    cardId: z.string().describe("Card ID"),
    labelId: z.string().describe("Label ID"),
});

// Type exports
export type CreateLabelOptions = z.infer<typeof CreateLabelSchema>;
export type UpdateLabelOptions = z.infer<typeof UpdateLabelSchema>;
export type AddLabelToCardOptions = z.infer<typeof AddLabelToCardSchema>;
export type RemoveLabelFromCardOptions = z.infer<
    typeof RemoveLabelFromCardSchema
>;

// Response schemas
const LabelsResponseSchema = z.object({
    items: z.array(PlankaLabelSchema),
    included: z.record(z.any()).optional(),
});

const LabelResponseSchema = z.object({
    item: PlankaLabelSchema,
    included: z.record(z.any()).optional(),
});

const CardLabelResponseSchema = z.object({
    item: z.object({
        id: z.string(),
        cardId: z.string(),
        labelId: z.string(),
        createdAt: z.string(),
        updatedAt: z.string().nullable(),
    }),
    included: z.record(z.any()).optional(),
});

// Function implementations
export async function createLabel(options: CreateLabelOptions) {
    try {
        const response = await plankaRequest(
            `/api/boards/${options.boardId}/labels`,
            {
                method: "POST",
                body: {
                    name: options.name,
                    color: options.color,
                    position: options.position,
                },
            },
        );
        const parsedResponse = LabelResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to create label: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function getLabels(boardId: string) {
    try {
        // Get the board which includes labels in the response
        const response = await plankaRequest(`/api/boards/${boardId}`);

        // Check if the response has the expected structure
        if (
            response &&
            typeof response === "object" &&
            "included" in response &&
            response.included &&
            typeof response.included === "object" &&
            "labels" in (response.included as Record<string, unknown>)
        ) {
            // Get the labels from the included property
            const labels =
                (response.included as Record<string, unknown>).labels;
            if (Array.isArray(labels)) {
                return labels;
            }
        }

        // If we can't find labels in the expected format, return an empty array
        return [];
    } catch (error) {
        // If all else fails, return an empty array
        return [];
    }
}

export async function updateLabel(
    id: string,
    options: Partial<Omit<CreateLabelOptions, "boardId">>,
) {
    try {
        const response = await plankaRequest(`/api/labels/${id}`, {
            method: "PATCH",
            body: options,
        });
        const parsedResponse = LabelResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to update label: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function deleteLabel(id: string) {
    try {
        await plankaRequest(`/api/labels/${id}`, {
            method: "DELETE",
        });
        return { success: true };
    } catch (error) {
        throw new Error(
            `Failed to delete label: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function addLabelToCard(cardId: string, labelId: string) {
    try {
        const response = await plankaRequest(
            `/api/cards/${cardId}/labels`,
            {
                method: "POST",
                body: {
                    labelId: labelId,
                },
            },
        );
        return { success: true };
    } catch (error) {
        throw new Error(
            `Failed to add label to card: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function removeLabelFromCard(cardId: string, labelId: string) {
    try {
        await plankaRequest(`/api/cards/${cardId}/labels/${labelId}`, {
            method: "DELETE",
        });
        return { success: true };
    } catch (error) {
        throw new Error(
            `Failed to remove label from card: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}
