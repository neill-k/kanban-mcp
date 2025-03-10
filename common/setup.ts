// Global variables to store user IDs
let adminUserId: string | null = null;

/**
 * Gets the admin user ID from environment variable
 */
export async function getAdminUserId(): Promise<string | null> {
    if (adminUserId) {
        return adminUserId;
    }

    try {
        const envAdminId = process.env.PLANKA_ADMIN_ID;
        if (!envAdminId) {
            console.error(
                "PLANKA_ADMIN_ID environment variable is required",
            );
            return null;
        }

        // Store and return the admin ID from environment variable
        adminUserId = envAdminId;
        return adminUserId;
    } catch (error) {
        console.error("Failed to get admin user ID:", error);
        return null;
    }
}

// For backward compatibility
export async function getHumanUserId(): Promise<string | null> {
    return getAdminUserId();
}
