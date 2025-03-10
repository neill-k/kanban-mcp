# MCP Kanban

A Model Context Protocol (MCP) server for interacting with Planka Kanban boards.

## What is MCP Kanban?

MCP Kanban is a specialized middleware designed to facilitate interaction between Large Language Models (LLMs) and Planka, a Kanban board application. It serves as an intermediary layer that provides LLMs with a simplified and enhanced API to interact with Planka's task management system.

### Purpose

The primary purpose of the MCP Server is to enable LLMs to:

1. **Access Kanban Data**: Retrieve projects, boards, lists, cards, tasks, comments, and labels from Planka
2. **Manage Workflow**: Move cards between lists (Backlog → In Progress → Testing → Done)
3. **Track Tasks**: Create, update, and complete tasks within cards
4. **Communicate Progress**: Add comments and labels to cards to document progress and status
5. **Follow Task-Oriented Development**: Support a structured approach to software development using Kanban methodology

### How It Works

The MCP Server wraps the Planka API with specialized functions that are optimized for LLM interaction. Rather than requiring the LLM to make multiple low-level API calls, the MCP Server provides higher-level functions that combine related operations and add context awareness.

This enables LLMs to:
- Identify the next card to work on from the Backlog
- Move it to In Progress
- Implement the required tasks one by one
- Add comments to document progress
- Move the card to Testing when complete
- Process human feedback from Testing
- Either address feedback or move the card to Done

This structured approach ensures that the LLM can effectively manage software development tasks while maintaining clear communication with human team members through the Kanban board.

## Installation

### Prerequisites

- Docker installed on your system
- A running Planka instance (local or remote)

### Building the Docker Image

To build the Docker image:

```bash
npm run docker:build
```

This will build the Docker image with the current version from package.json.

### Running the Docker Container

To run the Docker container:

```bash
npm run docker:run
```

This will start the MCP server on port 3008.

To view the logs:

```bash
npm run docker:logs
```

To stop the container:

```bash
npm run docker:stop
```

## Configuration

### Environment Variables

The MCP server requires the following environment variables:

- `PLANKA_BASE_URL`: The base URL of your Planka instance (e.g., `http://host.docker.internal:3000` for local development)
- `PLANKA_ADMIN_ID`: The ID of the admin user in Planka (optional)
- `PLANKA_AGENT_EMAIL`: The email address of the agent user in Planka
- `PLANKA_AGENT_PASSWORD`: The password of the agent user in Planka

### Using with Cursor

To use this MCP server with Cursor, add the following to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "kanban": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "PLANKA_BASE_URL=http://host.docker.internal:3000",
        "-e",
        "PLANKA_ADMIN_ID=1460688047300412417",
        "-e",
        "PLANKA_AGENT_EMAIL=your-email@example.com",
        "-e",
        "PLANKA_AGENT_PASSWORD=your-password",
        "mcp-kanban:0.0.3"
      ]
    }
  }
}
```

Replace `your-email@example.com` and `your-password` with your Planka credentials.

> **Note**: When using Docker with a local Planka instance, use `host.docker.internal` instead of `localhost` to access the host machine from within the container.

## Available Tools

The MCP server provides the following tools for interacting with Planka:

### Project Management

- `get_projects`: Get all projects with pagination
- `get_project`: Get a specific project by ID
- `create_project`: Create a new project
- `update_project`: Update an existing project
- `delete_project`: Delete a project

### Board Management

- `get_boards`: Get all boards for a project
- `get_board`: Get a specific board by ID
- `create_board`: Create a new board in a project
- `update_board`: Update an existing board
- `delete_board`: Delete a board
- `get_board_summary`: Get a comprehensive summary of a board including lists, cards, tasks, and statistics

### List Management

- `get_lists`: Get all lists for a board
- `create_list`: Create a new list in a board
- `update_list`: Update an existing list
- `delete_list`: Delete a list

### Card Management

- `get_cards`: Get all cards for a list
- `get_card`: Get a specific card by ID
- `create_card`: Create a new card in a list
- `update_card`: Update an existing card
- `move_card`: Move a card to a different list
- `duplicate_card`: Duplicate a card
- `delete_card`: Delete a card
- `get_card_details`: Get detailed information about a card including tasks, comments, and labels
- `create_card_with_tasks`: Create a new card with tasks, description, and optional comment in a single call

### Task Management

- `get_tasks`: Get all tasks for a card
- `get_task`: Get a specific task by ID
- `create_task`: Create a new task for a card
- `batch_create_tasks`: Create multiple tasks for cards in a single operation
- `update_task`: Update an existing task
- `delete_task`: Delete a task

### Label Management

- `get_labels`: Get all labels for a board
- `create_label`: Create a new label for a board
- `update_label`: Update an existing label
- `delete_label`: Delete a label
- `add_label_to_card`: Add a label to a card
- `remove_label_from_card`: Remove a label from a card

### Comment Management

- `get_comments`: Get all comments for a card
- `get_comment`: Get a specific comment by ID
- `create_comment`: Create a new comment on a card
- `update_comment`: Update an existing comment
- `delete_comment`: Delete a comment

### Board Membership Management

- `get_board_memberships`: Get all memberships for a board
- `get_board_membership`: Get a specific board membership by ID
- `create_board_membership`: Add a user to a board with specified permissions
- `update_board_membership`: Update a user's permissions on a board
- `delete_board_membership`: Remove a user from a board

### Card Stopwatch

- `start_card_stopwatch`: Start the stopwatch for a card
- `stop_card_stopwatch`: Stop the stopwatch for a card
- `get_card_stopwatch`: Get the current stopwatch time for a card
- `reset_card_stopwatch`: Reset the stopwatch for a card

### Workflow Actions

The MCP server also provides high-level workflow actions to simplify common operations:

- `start_working`: Move a card to "In Progress" and add a starting comment
- `mark_completed`: Mark tasks as completed and add a comment
- `move_to_testing`: Move a card to "Testing" with an implementation summary
- `move_to_done`: Move a card to "Done" with a completion comment

## Development

### Local Development

To set up the project for local development:

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Run the MCP Inspector for testing:
   ```bash
   npm run inspector
   ```

### Testing with MCP Inspector

The MCP Inspector is an interactive developer tool for testing and debugging MCP servers:

```bash
# Run with environment variables set separately
npm run inspector

# Run with demo credentials
npm run inspector:demo
```

## Docker Notes

When using Docker, keep these points in mind:

1. Use `host.docker.internal` instead of `localhost` to access host services
2. Environment variables must be explicitly set in the Docker command args with values
3. The MCP server needs to be rebuilt after TypeScript changes
4. For attachments, mount a volume to `/app/attachments` in your Docker container

## Running Planka

This project includes a Dockerfile for running Planka, the Kanban board application that MCP Kanban interacts with.

### Using the Planka Dockerfile

To build and run Planka using the provided Dockerfile:

```bash
# Build the Planka Docker image
npm run planka:build

# Run the Planka container
npm run planka:run
```

This will start Planka on port 3000. You can then access it at http://localhost:3000.

Default credentials:
- Email: demo@demo.demo
- Password: demo

To stop the Planka container:

```bash
npm run planka:stop
```

## Development Methodology

This project includes a guide for implementing a task-oriented Kanban development approach. This methodology is designed to help teams effectively use Kanban boards for structured software development, with or without LLM assistance.

See [KANBAN_DEVELOPMENT_GUIDE.md](./KANBAN_DEVELOPMENT_GUIDE.md) for detailed instructions on implementing this approach in your development workflow.

## License

MIT
