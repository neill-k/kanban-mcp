/**
 * @fileoverview User manager tool for MCP Kanban
 *
 * This tool provides actions to list users, find specific users, and create users.
 */

import { z } from "zod";
import {
    getUsers,
    getUserById,
    GetUsersSchema,
    createUser as createUserOperation, // Alias to avoid name clash with the tool function
    CreateUserSchema, // Import the schema for creating users from operations
} from "../operations/users.js";
import { PlankaUserSchema } from "../common/types.js"; // Ensure this path is correct and schema exists

// Schema for ListAllUsers action (might take pagination from GetUsersOptions)
export const listAllUsersParamsSchema = GetUsersSchema.pick({
    page: true,
    perPage: true,
}).optional();
export type ListAllUsersParams = z.infer<typeof listAllUsersParamsSchema>;

// Schema for FindUser action
export const findUserParamsSchema = GetUsersSchema.pick({
    username: true,
    email: true,
}).refine((data: { username?: string | null; email?: string | null }) => data.username || data.email, {
    message: "Either username or email must be provided to find a user",
});
export type FindUserParams = z.infer<typeof findUserParamsSchema>;

// Schema for GetUserById action
export const getUserByIdParamsSchema = z.object({
    id: z.string().describe("The ID of the user to retrieve"),
});
export type GetUserByIdParams = z.infer<typeof getUserByIdParamsSchema>;

// Schema for CreateUser tool action
// Re-exporting or directly using CreateUserSchema from operations
export const createUserParamsSchema = CreateUserSchema;
export type CreateUserParams = z.infer<typeof createUserParamsSchema>;

/**
 * Lists all users with optional pagination.
 * Wrapper around the getUsers operation.
 */
export async function listAllUsers(params?: ListAllUsersParams) {
    return getUsers(params);
}

/**
 * Finds users based on username or email.
 * Wrapper around the getUsers operation with specific filters.
 */
export async function findUser(params: FindUserParams) {
    // Assuming getUsers operation can filter by username/email if provided in options
    // Parse with GetUsersSchema to include default pagination values
    const validatedParams = GetUsersSchema.parse({
        username: params.username,
        email: params.email,
        // page and perPage will be defaulted by the schema if not provided here
    });
    const result = await getUsers(validatedParams);
    // If Planka API returns multiple matches for a non-exact search, this will return all of them.
    // If only one is expected, further client-side filtering might be needed or more specific API query.
    return result.items; 
}

/**
 * Retrieves a specific user by their ID.
 * Wrapper around the getUserById operation.
 */
export async function getUser(params: GetUserByIdParams) {
    return getUserById(params.id);
}

/**
 * Creates a new user.
 * Wrapper around the createUser operation from ../operations/users.js.
 */
export async function createUser(params: CreateUserParams) {
    return createUserOperation(params);
}

// It might be beneficial to expose a combined user tool or individual functions
// depending on how the MCP server registers tools.
// For now, these functions can be imported and used by a main tool manager if needed. 