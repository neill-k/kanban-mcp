# LLM Guide: Task-Oriented Kanban Development Approach

This guide provides instructions for LLMs on how to effectively interact with Kanban boards when assisting with software development tasks. Follow these protocols to maintain an organized and efficient workflow.

## 0. User Interaction and Kanban Integration

### 0.1 User-First Approach
- **Always prioritize direct user requests over Kanban operations**
- Only initiate Kanban operations when:
  - The user explicitly requests Kanban-related actions
  - You have completed the user's primary request and are providing additional context
  - The user has established a workflow pattern where Kanban updates are expected
- Never interrupt a user conversation to perform Kanban operations unless specifically requested

### 0.2 Contextual Awareness
- Maintain awareness of the current conversation context
- If the user is focused on a technical discussion, code review, or brainstorming:
  - Complete that interaction fully before suggesting Kanban updates
  - Only mention Kanban when directly relevant to the current topic
- If the user explicitly asks about task status or next steps:
  - Then retrieve and provide Kanban information

### 0.3 Transparent Transitions
- When transitioning from direct user assistance to Kanban operations:
  - Clearly signal the transition: "Now that we've addressed your question, I'll update the Kanban board..."
  - Give the user an opportunity to defer Kanban operations: "Would you like me to update the task status now or continue our discussion?"
- When using Kanban information to inform responses:
  - Explicitly mention the source: "Based on the current tasks in our Kanban board..."

## 1. Initial Kanban Board Analysis

### 1.1 Board Structure Assessment
- When starting a session, first retrieve all projects using `get_projects`
- For the current project, retrieve all boards using `get_boards`
- For each board, retrieve all lists using `get_lists`
- Identify the standard workflow lists: **Backlog**, **In Progress**, **Testing**, and **Done**
- Map the board structure to understand the project's workflow

### 1.2 Card Inventory and Analysis
- Retrieve all cards from each list using `get_cards`
- Analyze card titles, descriptions, and tasks to understand the work scope
- Identify cards with the highest priority based on:
  - Labels (especially `Urgent` or `High Priority`)
  - Position in list (cards at the top are typically higher priority)
  - Due dates (if available)
  - Dependencies (cards blocking other work)

## 2. Task Selection and Workflow Management

### 2.1 Selecting the Next Card
- First check if any cards in **Testing** have feedback that needs to be addressed
- If not, identify the highest priority card in the **Backlog**
- Move this card to **In Progress** using `move_card`
- Add a comment using `create_comment` stating you are beginning work on this card
- Start the card's stopwatch using `start_card_stopwatch`

### 2.2 Task-by-Task Implementation
- Retrieve all tasks for the card using `get_tasks`
- Work on one task at a time in logical sequence
- After completing each task:
  - Mark it as completed using `update_task` with `isCompleted: true`
  - Add a brief comment describing what was done
- Never move to the next task until the current one is fully complete
- If a task is blocked, clearly document why in a comment

### 2.3 Dynamic Task Management
- If you discover a new task while working:
  - Add it to the current card using `create_task` if it's part of the same feature
  - Create a new card in **Backlog** using `create_card` if it's a separate concern
- Always document the rationale for new tasks or cards
- If a new task blocks progress on the current card:
  - Add a `Blocked` label to the card using `add_label_to_card`
  - Document the dependency in a comment

### 2.4 Incidental Discovery Management
- When encountering issues unrelated to the current task:
  - Create a new card in **Backlog** using `create_card`
  - Apply the `Needs Grooming` label using `add_label_to_card`
  - Include detailed context about:
    - Where the issue was discovered
    - Relevant code files and components
    - Potential impact and importance
    - Any initial insights on resolution
  - Link to the current card in the description for context
  - Do not switch focus to the new issue unless it:
    - Blocks the current task
    - Represents a critical bug or security vulnerability
  - Add a comment to the original card noting the discovery and new card creation
  - Continue with the original task without further distraction

## 3. Backlog Grooming

### 3.1 Creating Cards from Sparse Ideas
- When receiving a sparse idea through chat:
  - Create a new card in **Backlog** using `create_card`
  - Apply a `Needs Grooming` label using `add_label_to_card`
  - Add an initial comment acknowledging the grooming process has begun

### 3.2 Codebase Discovery
- Perform targeted codebase analysis:
  - Search for related functionality and components
  - Identify implementation patterns and existing solutions
  - Determine integration points and dependencies
  - Document findings in card comments

### 3.3 Card Refinement
- Enhance the card based on discovery:
  - Update the card description with comprehensive context
  - Create specific, actionable tasks using `create_task`
  - Define clear acceptance criteria as tasks
  - Document technical approach and considerations
  - Identify risks and dependencies

### 3.4 Grooming Completion
- When grooming is complete:
  - Remove the `Needs Grooming` label
  - Add a `Ready for Development` label
  - Add a comment summarizing the grooming results
  - Request developer review if needed

## 4. Card Status Management

### 4.1 Moving Cards Through Workflow
- When all tasks on a card are complete:
  - Move the card to **Testing** using `move_to_testing`
  - Stop the stopwatch using `stop_card_stopwatch`
  - Add a comprehensive comment summarizing the implementation
- After human review and approval:
  - Move the card to **Done** using `move_to_done`
  - Add a completion comment

### 4.2 Handling Human Feedback
- Regularly check cards in **Testing** using `get_board_summary`
- For each card in testing, retrieve comments using `get_comments`
- Analyze comments for:
  - Approval to move to **Done**
  - Requests for changes or fixes
  - Questions that need answers
- If changes are requested:
  - Move the card back to **In Progress**
  - Create tasks for each requested change
  - Restart the implementation process for these tasks

## 5. Communication Protocols

### 5.1 Label Management
- Apply labels consistently to indicate:
  - Type: `Bug`, `Feature`, `Enhancement`, `Documentation`
  - Status: `Blocked`, `In Review`, `Ready for Testing`
  - Priority: `Urgent`, `High`, `Medium`, `Low`
- Use `add_label_to_card` to apply labels
- Use `remove_label_from_card` when a label no longer applies
- Update labels immediately when a card's status changes

### 5.2 Comment Formatting Standards
When adding comments with `create_comment`, follow these formats:

1. **Starting Work**:
   ```
   ▶️ Starting work on this card.
   Initial assessment: [brief analysis of the work required]
   Planned approach: [how you plan to implement the solution]
   ```

2. **Task Completion**:
   ```
   ✅ Completed task: [task name]
   Implementation details: [brief description of what was done]
   [Any relevant notes about the implementation]
   ```

3. **Requesting Clarification**:
   ```
   ❓ Need clarification on [specific aspect]
   Current understanding: [what you currently understand]
   Specific questions:
   1. [question 1]
   2. [question 2]
   ```

4. **Implementation Summary (when moving to Testing)**:
   ```
   🔍 Ready for review
   
   Summary of changes:
   - [major change 1]
   - [major change 2]
   
   Testing considerations:
   - [area to test 1]
   - [area to test 2]
   
   [Any known limitations or future improvements]
   ```

5. **Completion Comment (when moving to Done)**:
   ```
   🏁 Implementation complete
   
   Final summary:
   - [summary of all changes]
   - Time spent: [time from stopwatch]
   
   Lessons learned:
   - [any insights gained]
   ```

### 5.3 Feedback Processing
- When processing human feedback, acknowledge each point explicitly
- Create a task for each actionable feedback item
- If clarification is needed, ask specific questions
- Always respond to feedback within the same card to maintain context

## 6. Time and Progress Tracking

### 6.1 Stopwatch Management
- Start the stopwatch when beginning work with `start_card_stopwatch`
- Stop the stopwatch when:
  - Moving a card to Testing
  - Encountering a blocker that prevents further progress
- Resume the stopwatch when returning to a card
- Reset the stopwatch only if explicitly instructed to do so
- Include time spent in completion summaries

### 6.2 Progress Monitoring
- Use `get_board_summary` regularly to assess overall project status
- Identify and report on:
  - Cards that have been in the same list for an extended period
  - Lists with an unusually high number of cards (bottlenecks)
  - Cards with many incomplete tasks
  - Cards with the `Blocked` label

## 7. Workflow Optimization

### 7.1 Proactive Board Management
- Suggest improvements to board organization when patterns emerge
- Identify commonly occurring tasks and suggest templates
- Detect and report workflow bottlenecks

### 7.2 Continuous Improvement
- Track common issues and suggest process improvements
- Learn from past cards to improve estimation and task breakdown
- Adapt communication style based on team preferences
- Maintain consistent labeling and task formatting

---

## Implementation Checklist

When working with a Kanban board, always follow this sequence:

1. **Initial Analysis**
   - [ ] Retrieve and analyze board structure
   - [ ] Identify highest priority cards

2. **Backlog Grooming**
   - [ ] Identify cards with `Needs Grooming` label
   - [ ] Perform codebase discovery for context
   - [ ] Break down into specific tasks
   - [ ] Define acceptance criteria
   - [ ] Document technical approach
   - [ ] Mark as `Ready for Development`

3. **Card Selection**
   - [ ] Check Testing list for feedback
   - [ ] Select highest priority Backlog card
   - [ ] Move to In Progress
   - [ ] Start stopwatch
   - [ ] Add starting comment

4. **Task Implementation**
   - [ ] Retrieve all tasks
   - [ ] Work through tasks sequentially
   - [ ] Mark tasks complete as you go
   - [ ] Document progress in comments

5. **Completion Process**
   - [ ] Verify all tasks are complete
   - [ ] Move card to Testing
   - [ ] Stop stopwatch
   - [ ] Add implementation summary
   - [ ] Monitor for feedback

6. **Feedback Handling**
   - [ ] Process all feedback
   - [ ] Create tasks for requested changes
   - [ ] Move card as appropriate
   - [ ] Update labels to reflect status

By following this structured approach, you will maintain an organized Kanban workflow and provide consistent, high-quality assistance with software development tasks. 