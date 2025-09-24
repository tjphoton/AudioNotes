# VoiceNote Application

## Overview

VoiceNote is a full-stack web application that enables users to record voice notes, automatically transcribe them using AI, and organize them into structured notes. The application features a React frontend with a modern UI, an Express.js backend with PostgreSQL database integration, and OpenAI API integration for transcription and note processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management and caching
- **Audio Recording**: Custom hook using MediaRecorder API for browser-based audio recording
- **Build Tool**: Vite with custom configuration for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Upload**: Multer middleware for handling audio file uploads
- **Storage Strategy**: In-memory storage implementation with interface for future database integration
- **Error Handling**: Centralized error handling middleware with structured error responses

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Design**: Three main tables - users, notes, and settings with proper foreign key relationships
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **File Storage**: Local filesystem storage for uploaded audio files

### Authentication and Authorization
- **User Management**: Basic user system with email/username authentication
- **Session Handling**: Express sessions with PostgreSQL storage
- **Demo Mode**: Hardcoded demo user for testing and development
- **Request Headers**: Temporary user ID header system for API authentication

### External Service Integrations
- **OpenAI API**: 
  - Whisper-1 model for audio transcription
  - GPT-5 model for note processing and organization
  - Configurable output language and organization styles
- **Audio Processing**: Browser-native MediaRecorder API with multiple codec support
- **UI Components**: Extensive Radix UI component library integration

## External Dependencies

### Core Backend Dependencies
- **Express.js**: Web application framework
- **Drizzle ORM**: Type-safe PostgreSQL ORM with schema generation
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon Database
- **OpenAI**: Official OpenAI API client for transcription and AI processing
- **Multer**: Multipart form data handling for file uploads
- **tsx**: TypeScript execution engine for development

### Frontend Dependencies
- **React & React DOM**: Core React framework
- **@tanstack/react-query**: Server state management and caching
- **Wouter**: Lightweight client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Comprehensive accessible component library
- **Lucide React**: Icon library for UI components

### Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS & Autoprefixer**: CSS processing and vendor prefixing

### Database and Storage
- **PostgreSQL**: Primary database system
- **Drizzle Kit**: Database migration and schema management tools
- **connect-pg-simple**: PostgreSQL session store for Express

### External APIs
- **OpenAI API**: Audio transcription (Whisper-1) and text processing (GPT-5)
- **Neon Database**: Serverless PostgreSQL hosting and management