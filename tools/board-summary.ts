import { z } from "zod";
// Import functions from operations directory
import { getBoard } from "../operations/boards.js";
import { getLists } from "../operations/lists.js";
import { getCards } from "../operations/cards.js";
import { getTasks } from "../operations/tasks.js";
import { getLabels } from "../operations/labels.js";
import { getComments } from "../operations/comments.js";

export const getBoardSummarySchema = z.object({
    boardId: z.string().describe("The ID of the board to get a summary for"),
    includeTaskDetails: z.boolean().optional().default(false).describe(
        "Whether to include detailed task information for each card",
    ),
    includeComments: z.boolean().optional().default(false).describe(
        "Whether to include comments for each card",
    ),
});

export type GetBoardSummaryParams = z.infer<typeof getBoardSummarySchema>;

export async function getBoardSummary(params: GetBoardSummaryParams) {
    const { boardId, includeTaskDetails, includeComments } = params;

    try {
        // Get the board details
        const board = await getBoard(boardId);

        if (!board) {
            throw new Error(`Board with ID ${boardId} not found`);
        }

        // Get all lists on the board
        const allLists = await getLists(boardId);

        // Get all cards for each list
        const listsWithCards = await Promise.all(
            allLists.map(async (list: any) => {
                const listCards = await getCards(list.id);

                // Get tasks for each card if requested
                const cardsWithDetails = await Promise.all(
                    listCards.map(async (card: any) => {
                        let taskDetails: any[] = [];
                        if (includeTaskDetails) {
                            taskDetails = await getTasks(card.id);
                        }

                        // Get comments if requested
                        let cardComments: any[] = [];
                        if (includeComments) {
                            cardComments = await getComments(card.id);
                        }

                        // Calculate task completion percentage
                        const completedTasks = taskDetails.filter((task: any) =>
                            task.isCompleted
                        ).length;
                        const totalTasks = taskDetails.length;
                        const completionPercentage = totalTasks > 0
                            ? Math.round((completedTasks / totalTasks) * 100)
                            : 0;

                        return {
                            ...card,
                            tasks: includeTaskDetails
                                ? {
                                    items: taskDetails,
                                    total: totalTasks,
                                    completed: completedTasks,
                                    completionPercentage,
                                }
                                : undefined,
                            comments: includeComments
                                ? cardComments
                                : undefined,
                        };
                    }),
                );

                return {
                    ...list,
                    cards: cardsWithDetails,
                    cardCount: cardsWithDetails.length,
                };
            }),
        );

        // Get all labels for the board
        const boardLabels = await getLabels(boardId);

        // Calculate overall statistics
        const totalCards = listsWithCards.reduce(
            (sum: number, list: any) => sum + list.cardCount,
            0,
        );

        // Find specific lists by name
        const backlogList = listsWithCards.find((list: any) =>
            list.name.toLowerCase() === "backlog"
        );
        const inProgressList = listsWithCards.find((list: any) =>
            list.name.toLowerCase() === "in progress"
        );
        const testingList = listsWithCards.find((list: any) =>
            list.name.toLowerCase() === "testing"
        );
        const doneList = listsWithCards.find((list: any) =>
            list.name.toLowerCase() === "done"
        );

        // Count cards with specific labels
        const urgentCards = listsWithCards.flatMap((list: any) => list.cards)
            .filter((card: any) =>
                card.labelIds?.some((labelId: string) =>
                    boardLabels.find((label: any) =>
                        label.id === labelId &&
                        label.name.toLowerCase() === "urgent"
                    )
                )
            ).length;

        const bugCards = listsWithCards.flatMap((list: any) => list.cards)
            .filter((card: any) =>
                card.labelIds?.some((labelId: string) =>
                    boardLabels.find((label: any) =>
                        label.id === labelId &&
                        label.name.toLowerCase() === "bug"
                    )
                )
            ).length;

        return {
            board,
            lists: listsWithCards,
            labels: boardLabels,
            stats: {
                totalCards,
                backlogCount: backlogList?.cardCount || 0,
                inProgressCount: inProgressList?.cardCount || 0,
                testingCount: testingList?.cardCount || 0,
                doneCount: doneList?.cardCount || 0,
                urgentCount: urgentCards,
                bugCount: bugCards,
                completionPercentage: totalCards > 0
                    ? Math.round((doneList?.cardCount || 0) / totalCards * 100)
                    : 0,
            },
            workflowState: {
                hasCardsInBacklog: (backlogList?.cardCount || 0) > 0,
                hasCardsInProgress: (inProgressList?.cardCount || 0) > 0,
                hasCardsInTesting: (testingList?.cardCount || 0) > 0,
                nextActionSuggestion: getNextActionSuggestion(
                    backlogList?.cardCount || 0,
                    inProgressList?.cardCount || 0,
                    testingList?.cardCount || 0,
                ),
            },
        };
    } catch (error) {
        console.error("Error in getBoardSummary:", error);
        throw error;
    }
}

// Helper function to suggest the next action based on board state
function getNextActionSuggestion(
    backlogCount: number,
    inProgressCount: number,
    testingCount: number,
): string {
    if (testingCount > 0) {
        return "Review cards in Testing that need feedback";
    } else if (inProgressCount > 0) {
        return "Continue working on cards in In Progress";
    } else if (backlogCount > 0) {
        return "Start working on a card from Backlog";
    } else {
        return "All tasks complete! Create new cards or projects";
    }
}
