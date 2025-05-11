/**
 * @fileoverview User operations for the MCP Kanban server
 *
 * This module provides functions for interacting with users in the Planka Kanban system,
 * including retrieving users.
 */

import { z } from "zod";
import { plankaRequest } from "../common/utils.js";
import { PlankaUserSchema } from "../common/types.js"; // Assuming PlankaUserSchema will be added to common/types.ts

// Schema definitions
/**
 * Schema for retrieving users with optional query parameters
 * @property {string} [username] - Filter by username (exact match, Planka might support partial)
 * @property {string} [email] - Filter by email (exact match)
 * @property {number} [page] - Page number for pagination (default: 1)
 * @property {number} [perPage] - Number of results per page (default: 30, max: 100)
 */
export const GetUsersSchema = z.object({
    username: z.string().optional().describe("Filter by username"),
    email: z.string().optional().describe("Filter by email"),
    page: z.number().int().positive().optional().default(1).describe("Page number for pagination (default: 1)"),
    perPage: z.number().int().positive().max(100).optional().default(30).describe("Number of results per page (default: 30, max: 100)"),
});

/**
 * Schema for retrieving a specific user by ID
 * @property {string} id - The ID of the user to retrieve
 */
export const GetUserByIdSchema = z.object({
    id: z.string().describe("User ID"),
});

/**
 * Schema for creating a new user
 * @property {string} email - User's email address (required, unique)
 * @property {string} username - User's username (required, unique)
 * @property {string} password - User's password (required)
 * @property {string} [name] - User's full name (optional)
 * @property {boolean} [isAdmin] - Whether the user should be an admin (optional, default: false)
 */
export const CreateUserSchema = z.object({
    email: z.string().email().describe("User email address"),
    username: z.string().min(1).describe("Username"),
    password: z.string().min(6).describe("User password (min 6 characters)"),
    name: z.string().optional().describe("User full name"),
    isAdmin: z.boolean().optional().default(false).describe("Whether the user is an admin"),
});

// Type exports
export type GetUsersOptions = z.infer<typeof GetUsersSchema>;
export type CreateUserOptions = z.infer<typeof CreateUserSchema>;

// Response schemas
const UsersResponseSchema = z.object({
    items: z.array(PlankaUserSchema),
    // Planka might not use 'included' for a direct /api/users call, 
    // but good to keep pattern if it does for consistency or future expansion.
    included: z.record(z.any()).optional(), 
});

const UserResponseSchema = z.object({
    item: PlankaUserSchema,
    included: z.record(z.any()).optional(),
});

/**
 * Retrieves users with optional filtering and pagination support
 *
 * @param {GetUsersOptions} [options] - Options for filtering and pagination
 * @returns {Promise<{items: Array<object>, included?: object}>} Paginated and/or filtered users
 * @throws {Error} If retrieving users fails
 */
export async function getUsers(options?: GetUsersOptions) {
    try {
        const queryParams = new URLSearchParams();
        if (options?.page) queryParams.append("page", options.page.toString());
        if (options?.perPage) queryParams.append("per_page", options.perPage.toString());
        if (options?.username) queryParams.append("username", options.username);
        if (options?.email) queryParams.append("email", options.email);
        // Planka might use different query params like 'search' or specific filters.
        // This is a generic assumption based on common API patterns.

        const response = await plankaRequest(
            `/api/users?${queryParams.toString()}`,
            {
                method: "GET",
            },
        );

        const parsedResponse = UsersResponseSchema.parse(response);
        return parsedResponse;
    } catch (error) {
        throw new Error(
            `Failed to get users: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Retrieves a specific user by ID
 *
 * @param {string} id - The ID of the user to retrieve
 * @returns {Promise<object>} The requested user object
 * @throws {Error} If retrieving the user fails
 */
export async function getUserById(id: string) {
    try {
        const response = await plankaRequest(`/api/users/${id}`);
        const parsedResponse = UserResponseSchema.parse(response);
        return parsedResponse.item;
    } catch (error) {
        throw new Error(
            `Failed to get user by ID: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
}

/**
 * Creates a new user in the Planka system
 *
 * @param {CreateUserOptions} options - Options for creating the user
 * @returns {Promise<object>} The created user object
 * @throws {Error} If creating the user fails (e.g., email/username taken, validation error)
 */
export async function createUser(options: CreateUserOptions) {
    try {
        const response = await plankaRequest(
            `/api/users`,
            {
                method: "POST",
                body: options, // Send all validated options
            },
        );

        // Assuming Planka returns the created user object, 
        // potentially wrapped in an 'item' similar to other responses.
        // If Planka returns the user directly, UserResponseSchema.parse(response).item might need adjustment.
        // For now, let's assume it returns the user directly and it matches PlankaUserSchema.
        const parsedResponse = PlankaUserSchema.parse(response); 
        return parsedResponse;
    } catch (error) {
        // More specific error handling might be needed here based on Planka's error responses
        // For example, parsing Planka's error structure if it's not a generic network error.
        throw new Error(
            `Failed to create user: ${
                error instanceof Error ? error.message : String(error)
            }`,
        );
    }
} 