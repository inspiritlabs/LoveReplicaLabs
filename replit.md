# Inspirt Labs - AI Voice Replica Platform

## Overview

Inspirt Labs is a full-stack web application that enables users to create interactive digital replicas of loved ones using advanced AI voice technology. Users can upload voice samples, define personality traits, and engage in realistic conversations with AI-powered digital personas. The platform features a premium subscription model with tiered access to different levels of functionality.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system featuring glassmorphism effects and cosmic themes
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON communication
- **Authentication**: Access code-based registration system with bcrypt password hashing
- **Session Management**: Express sessions with PostgreSQL store

### Database Architecture
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Connection**: Connection pooling with @neondatabase/serverless
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- Access code validation for user registration
- Email/password authentication with bcrypt hashing
- Session-based authentication with persistent storage
- Admin role-based access control

### AI Voice Processing
- Integration with OpenAI API for chat completion
- ElevenLabs API integration for voice synthesis (optional)
- Personality trait modeling with customizable parameters
- Voice cloning and character consistency

### User Management
- Credit-based usage system with message limits
- Tiered subscription plans (Starter, Pro, Elite)
- User profile management with replica creation
- Admin dashboard for system monitoring

### Chat Interface
- Real-time conversation interface with voice playback
- Message history persistence
- Feedback system for AI responses
- Photo memory integration with floating animations

### Replica Creation
- Voice sample upload and processing
- Personality trait configuration (warmth, humor, thoughtfulness, etc.)
- Photo gallery integration
- Character name and description setup

## Data Flow

1. **User Registration**: Access code validation → Account creation → Dashboard access
2. **Replica Creation**: Voice upload → Personality configuration → AI model training
3. **Chat Interaction**: Message sending → AI processing → Voice synthesis → Response delivery
4. **Subscription Management**: Usage tracking → Upgrade prompts → Payment processing

## External Dependencies

### Required Services
- **OpenAI API**: Core AI chat completion functionality
- **PostgreSQL Database**: Primary data storage via Neon
- **Stripe**: Payment processing for subscriptions

### Optional Services
- **ElevenLabs API**: Advanced voice synthesis capabilities
- **Replit Development Tools**: Development environment integration

### Key Libraries
- **Drizzle ORM**: Type-safe database operations
- **React Query**: Server state management and caching
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **bcrypt**: Password hashing and security

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- Automatic error overlay for runtime issues
- TypeScript compilation with strict mode
- Replit integration for cloud development

### Production Build
- Vite production build with optimizations
- ESBuild for server bundling
- Static asset optimization and compression
- Environment variable configuration

### Database Management
- Drizzle migrations for schema updates
- Connection pooling for scalability
- Backup and recovery procedures
- Performance monitoring

## Changelog

- June 28, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.