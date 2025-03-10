import { z } from "zod";
import { plankaRequest } from "../common/utils.js";
import { PlankaProjectSchema } from "../common/types.js";

// Schema definitions
export const CreateProjectSchema = z.object({
    name: z.string().describe("Project name"),
});

export const GetProjectsSchema = z.object({
    page: z.number().optional().describe(
        "Page number for pagination (default: 1)",
    ),
    perPage: z.number().optional().describe(
        "Number of results per page (default: 30, max: 100)",
    ),
});

export const GetProjectSchema = z.object({
    id: z.string().describe("Project ID"),
});

export const UpdateProjectSchema = z.object({
    id: z.string().describe("Project ID"),
    name: z.string().optional().describe("Project name"),
});

export const DeleteProjectSchema = z.object({
    id: z.string().describe("Project ID"),
});

// Type exports
export type CreateProjectOptions = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectOptions = z.infer<typeof UpdateProjectSchema>;

// Response schemas
const ProjectsResponseSchema = z.object({
    items: z.array(PlankaProjectSchema),
    included: z.record(z.any()).optional(),
});

const ProjectResponseSchema = z.object({
    item: PlankaProjectSchema,
    included: z.record(z.any()).optional(),
});

// Function implementations
export async function getProjects(
    page: number = 1,
    perPage: number = 30,
) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", page.toString());
        queryParams.append("per_page", perPage.toString());

        const response = await plankaRequest(
            `/api/projects?${queryParams.toString()}`,
            {
                method: "GET",
            },
        );
        const parsedResponse = ProjectsResponseSchema.parse(response);
        return parsedResponse.items;
    } catch (error) {
        throw new Error(
            `Failed to get projects: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

export async function getProject(id: string) {
    const response = await plankaRequest(`/api/projects/${id}`);
    const parsedResponse = ProjectResponseSchema.parse(response);
    return parsedResponse.item;
}
