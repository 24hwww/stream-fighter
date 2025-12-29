# StreamFighter Architecture Guide

This project follows a modular and service-oriented architecture designed to be easily parsed by AI agents and humans alike.

## Directory Structure
- `/app`: Next.js App Router (pages and routes).
- `/components`: UI library.
  - `/stream`: High-fidelity overlay components for the broadcast.
  - `/mobile`: Touch-optimized components for participant voting.
- `/lib`: Singleton instances and external API configurations (Prisma, OpenRouter).
- `/services`: Business logic (Poll rotation, Vote processing).
- `/prisma`: Database schema (Supabase/PostgreSQL).

## Core Technologies
- **Next.js 15+**: React Framework.
- **Prisma**: ORM for Supabase interaction.
- **OpenRouter**: Unified AI API for dynamic content generation.
- **Lucide-React**: Iconography.
- **Tailwind CSS**: Visual design system.

## Key Logic
1. **Poll Rotation**: Handled by `PollService.rotatePoll()`. Uses OpenRouter to generate new contestants based on a category.
2. **Voting**: Secured via unique sessions/IDs (to be fully implemented).
3. **Overlay**: Specifically designed for 1280x720 capture.

## AI Instructions
When modifying:
- Logic goes into `/services`.
- UI changes go into `/components`.
- Database changes require `npx prisma db push`.
