import { z } from "zod";
import { plankaRequest } from "../common/utils.js";
import { PlankaCardSchema, PlankaStopwatchSchema } from "../common/types.js";

// Schema definitions
export const CreateCardSchema = z.object({
    listId: z.string().describe("List ID"),
    name: z.string().describe("Card name"),
    description: z.string().optional().describe("Card description"),
    position: z.number().optional().describe("Card position (default: 65535)"),
});

export const GetCardsSchema = z.object({
    listId: z.string().describe("List ID"),
});

export const GetCardSchema = z.object({
    id: z.string().describe("Card ID"),
});

export const UpdateCardSchema = z.object({
    id: z.string().describe("Card ID"),
    name: z.string().optional().describe("Card name"),
    description: z.string().optional().describe("Card description"),
    position: z.number().optional().describe("Card position"),
    dueDate: z.string().optional().describe("Card due date (ISO format)"),
    isCompleted: z.boolean().optional().describe(
        "Whether the card is completed",
    ),
});

export const MoveCardSchema = z.object({
    id: z.string().describe("Card ID"),
    listId: z.string().describe("Target list ID"),
    position: z.number().optional().describe(
        "Card position in the target list (default: 65535)",
    ),
});

export const DuplicateCardSchema = z.object({
    id: z.string().describe("Card ID to duplicate"),
    position: z.number().optional().describe(
        "Position for the duplicated card (default: 65535)",
    ),
});

export const DeleteCardSchema = z.object({
    id: z.string().describe("Card ID"),
});

// Stopwatch schemas
export const StartCardStopwatchSchema = z.object({
    id: z.string().describe("Card ID"),
});

export const StopCardStopwatchSchema = z.object({
    id: z.string().describe("Card ID"),
});

export const GetCardStopwatchSchema = z.object({
    id: z.string().describe("Card ID"),
});

export const ResetCardStopwatchSchema = z.object({
    id: z.string().describe("Card ID"),
});

// Type exports
export type CreateCardOptions = z.infer<typeof CreateCardSchema>;
export type UpdateCardOptions = z.infer<typeof UpdateCardSchema>;
export type MoveCardOptions = z.infer<typeof MoveCardSchema>;
export type DuplicateCardOptions = z.infer<typeof DuplicateCardSchema>;
export type StartCardStopwatchOptions = z.infer<
    typeof StartCardStopwatchSchema
>;
export type StopCardStopwatchOptions = z.infer<typeof StopCardStopwatchSchema>;
export type GetCardStopwatchOptions = z.infer<typeof GetCardStopwatchSchema>;
export type ResetCardStopwatchOptions = z.infer<
    typeof ResetCardStopwatchSchema
>;

// Response schemas
const CardsResponseSchema = z.object({
    items: z.array(PlankaCardSchema),
    included: z.record(z.any()).optional(),
});

const CardResponseSchema = z.object({
    item: PlankaCardSchema,
    included: z.record(z.any()).optional(),
});

// Function implementations
export async function createCard(options: CreateCardOptions) {
    try {
        const response = await plankaRequest(
            `/api/lists/${options.listId}/cards`,
            {
                method: "POST",
                body: {
                    name: options.name,
                    description: options.description,
                    position: options.position,
                },
            },
        );
        const parsedResponse = CardResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to create card: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function getCards(listId: string) {
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
            return [];
        }

        const included = projectsResponse.included as Record<string, unknown>;

        // Get all boards
        if (!("boards" in included) || !Array.isArray(included.boards)) {
            return [];
        }

        const boards = included.boards;

        // Check each board for cards with the matching list ID
        for (const board of boards) {
            if (
                typeof board !== "object" || board === null || !("id" in board)
            ) {
                continue;
            }

            const boardId = board.id as string;

            // Get the board details which includes cards
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
                !("cards" in boardIncluded) ||
                !Array.isArray(boardIncluded.cards)
            ) {
                continue;
            }

            const cards = boardIncluded.cards;

            // Filter cards by list ID
            const matchingCards = cards.filter((card) =>
                typeof card === "object" &&
                card !== null &&
                "listId" in card &&
                card.listId === listId
            );

            if (matchingCards.length > 0) {
                return matchingCards;
            }
        }

        // If we couldn't find any cards for this list ID
        return [];
    } catch (error) {
        // If all else fails, return an empty array
        return [];
    }
}

export async function getCard(id: string) {
    const response = await plankaRequest(`/api/cards/${id}`);
    const parsedResponse = CardResponseSchema.parse(response);
    return parsedResponse.item;
}

export async function updateCard(
    id: string,
    options: Partial<Omit<CreateCardOptions, "listId">>,
) {
    const response = await plankaRequest(`/api/cards/${id}`, {
        method: "PATCH",
        body: options,
    });
    const parsedResponse = CardResponseSchema.parse(response);
    return parsedResponse.item;
}

/**
 * Moves a card to a different list
 * @param cardId The ID of the card to move
 * @param listId The ID of the list to move the card to
 * @param boardId The ID of the board to move the card to (optional)
 * @param projectId The ID of the project to move the card to (optional)
 * @param position The position in the target list (optional, defaults to 65535 to place at the end)
 * @returns The updated card object
 */
export async function moveCard(
    cardId: string,
    listId: string,
    position: number = 65535,
    boardId?: string,
    projectId?: string,
) {
    try {
        // Use the PATCH endpoint to update the card with the new list ID and position
        const response = await plankaRequest(`/api/cards/${cardId}`, {
            method: "PATCH",
            body: {
                listId,
                position,
                boardId,
                projectId,
            },
        });

        // Parse and return the updated card
        const parsedResponse = CardResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to move card: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function duplicateCard(id: string, position?: number) {
    try {
        const response = await plankaRequest(`/api/cards/${id}/duplicate`, {
            method: "POST",
            body: position ? { position } : undefined,
        });
        const parsedResponse = CardResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to duplicate card: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function deleteCard(id: string) {
    await plankaRequest(`/api/cards/${id}`, {
        method: "DELETE",
    });
    return { success: true };
}

// Stopwatch functions

/**
 * Starts a stopwatch for a card
 * @param id The ID of the card
 * @returns The updated card object
 */
export async function startCardStopwatch(id: string) {
    try {
        // Get the current card to check if a stopwatch is already running
        const card = await getCard(id);

        // Calculate the stopwatch object
        let stopwatch = {
            startedAt: new Date().toISOString(),
            total: 0,
        };

        // If there's an existing stopwatch, preserve the total time
        if (card.stopwatch && card.stopwatch.total) {
            stopwatch.total = card.stopwatch.total;
        }

        // Update the card with the new stopwatch
        const response = await plankaRequest(`/api/cards/${id}`, {
            method: "PATCH",
            body: { stopwatch },
        });

        const parsedResponse = CardResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to start card stopwatch: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Stops a stopwatch for a card
 * @param id The ID of the card
 * @returns The updated card object
 */
export async function stopCardStopwatch(id: string) {
    try {
        // Get the current card to calculate elapsed time
        const card = await getCard(id);

        // If there's no stopwatch or it's not running, return the card as is
        if (!card.stopwatch || !card.stopwatch.startedAt) {
            return card;
        }

        // Calculate elapsed time
        const startedAt = new Date(card.stopwatch.startedAt);
        const now = new Date();
        const elapsedSeconds = Math.floor(
            (now.getTime() - startedAt.getTime()) / 1000,
        );

        // Calculate the new total time
        const totalSeconds = (card.stopwatch.total || 0) + elapsedSeconds;

        // Update the card with the stopped stopwatch (null startedAt but preserved total)
        const stopwatch = {
            startedAt: null,
            total: totalSeconds,
        };

        const response = await plankaRequest(`/api/cards/${id}`, {
            method: "PATCH",
            body: { stopwatch },
        });

        const parsedResponse = CardResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to stop card stopwatch: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Gets the stopwatch information for a card
 * @param id The ID of the card
 * @returns The stopwatch information
 */
export async function getCardStopwatch(id: string) {
    try {
        const card = await getCard(id);

        // If there's no stopwatch, return default values
        if (!card.stopwatch) {
            return {
                isRunning: false,
                total: 0,
                current: 0,
                formattedTotal: formatDuration(0),
                formattedCurrent: formatDuration(0),
            };
        }

        // Calculate current elapsed time if stopwatch is running
        let currentElapsed = 0;
        const isRunning = !!card.stopwatch.startedAt;

        if (isRunning && card.stopwatch.startedAt) {
            const startedAt = new Date(card.stopwatch.startedAt);
            const now = new Date();
            currentElapsed = Math.floor(
                (now.getTime() - startedAt.getTime()) / 1000,
            );
        }

        return {
            isRunning,
            total: card.stopwatch.total || 0,
            current: currentElapsed,
            startedAt: card.stopwatch.startedAt,
            formattedTotal: formatDuration(card.stopwatch.total || 0),
            formattedCurrent: formatDuration(currentElapsed),
        };
    } catch (error) {
        throw new Error(
            `Failed to get card stopwatch: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Resets a stopwatch for a card
 * @param id The ID of the card
 * @returns The updated card object
 */
export async function resetCardStopwatch(id: string) {
    try {
        // Set stopwatch to null to clear it
        const response = await plankaRequest(`/api/cards/${id}`, {
            method: "PATCH",
            body: { stopwatch: null },
        });

        const parsedResponse = CardResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to reset card stopwatch: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Helper function to format duration in seconds to a human-readable string
 * @param seconds Total seconds
 * @returns Formatted duration string (e.g., "2h 30m 15s")
 */
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let result = "";
    if (hours > 0) {
        result += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) {
        result += `${minutes}m `;
    }
    result += `${remainingSeconds}s`;

    return result.trim();
}
