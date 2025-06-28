# replit.md

## Overview

Inspirit Labs is a premium AI-powered platform that enables users to create interactive digital replicas of loved ones through advanced voice synthesis and personality modeling. The application combines voice cloning technology from ElevenLabs with OpenAI's conversational AI to deliver authentic, emotionally resonant interactions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom design system featuring glassmorphism and cosmic themes
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Animations**: Framer Motion for smooth transitions and wizard flows
- **State Management**: React Query (TanStack Query) for server state, React hooks for local state
- **Build Tool**: Vite with TypeScript support

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON communication
- **Authentication**: Session-based authentication with bcrypt password hashing
- **File Handling**: Direct integration with ElevenLabs API for voice file processing

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema updates
- **Connection**: Connection pooling via @neondatabase/serverless

## Key Components

### Authentication System
- Access code validation system for user registration
- Email/password authentication with bcrypt encryption
- Session management for persistent login state
- Admin role-based access control

### Replica Creation Wizard
- Four-step wizard using Framer Motion animations:
  1. Name and basic information
  2. Voice sample upload and processing
  3. Personality description and biography
  4. Personality trait configuration with sliders
- Real-time form validation with Zod schemas
- File upload handling for voice samples and photos

### Voice Processing Pipeline
- **Voice Cloning**: ElevenLabs API integration for voice model creation
- **Text-to-Speech**: Real-time voice synthesis using cloned voice models
- **Audio Playback**: Browser-based audio streaming and playback

### Chat Interface
- Immersive full-screen chat experience
- Real-time message streaming
- Voice response generation and playback
- Photo gallery integration with floating animations
- Message feedback system (thumbs up/down)

### Subscription Management
- Three-tier pricing model (Starter $24, Pro $99, Elite $279)
- Usage tracking for messages and credits
- Upgrade overlay for plan promotion
- Stripe integration preparation for payments

## Data Flow

1. **User Registration**: Access code validation → Account creation → Session establishment
2. **Replica Creation**: Wizard completion → Voice processing → Database storage → Chat availability
3. **Chat Interaction**: Message input → OpenAI processing → Voice synthesis → Response delivery
4. **Voice Processing**: File upload → ElevenLabs cloning → Voice ID storage → TTS capability

## External Dependencies

### AI Services
- **OpenAI GPT-4**: Conversational AI for replica responses
- **ElevenLabs**: Voice cloning and text-to-speech synthesis

### Infrastructure
- **Neon**: Serverless PostgreSQL database hosting
- **Replit**: Development and deployment platform
- **Stripe**: Payment processing (configured for future implementation)

### Development Tools
- **TypeScript**: Type safety across full stack
- **ESBuild**: Production bundling for server code
- **PostCSS**: CSS processing with Tailwind
- **Drizzle Kit**: Database schema management

## Deployment Strategy

### Development Environment
- Hot module replacement via Vite dev server
- TypeScript compilation with incremental builds
- Database connection via environment variables
- API key configuration for external services

### Production Build
- Client build: Vite production bundle with optimizations
- Server build: ESBuild bundling with external package handling
- Static asset serving from dist/public directory
- Environment-based configuration management

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API authentication
- `ELEVEN_API_KEY`: ElevenLabs API authentication (optional for demo)
- `NODE_ENV`: Environment specification

## Changelog

Changelog:
- June 28, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.