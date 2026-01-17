# Gabriel's Blog

A modern, full-featured blog platform built with Astro, React, and Supabase.

## Features

- **Rich Content Editor**: Markdown editor with live preview and image upload
- **Freeform Canvas**: Drawing and note-taking with Excalidraw integration
- **Authentication**: OAuth login via GitHub and LinkedIn
- **Comments System**: Authenticated users can comment on posts
- **Topics & Organization**: Categorize posts with draggable topic ordering
- **Responsive Design**: Built with Tailwind CSS and shadcn/ui
- **Post-it Board Integration**: Embedded external canvas for quick notes

## Tech Stack

- **Framework**: Astro.js with React
- **UI**: Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Supabase (Auth, Database, Storage)
- **Deployment**: Vercel
- **Editor**: @uiw/react-md-editor
- **Canvas**: Excalidraw

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- GitHub/LinkedIn OAuth apps (for authentication)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd noteblog
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Supabase Setup

1. **Create tables**:
   - `notes`: `id`, `title`, `content`, `topic`, `user_id`, `is_public`, `featured_image`, `read_time_minutes`, `created_at`
   - `comments`: `id`, `post_id`, `user_id`, `content`, `created_at`

2. **Enable Storage**:
   - Create a `post-assets` bucket for image uploads
   - Set appropriate RLS policies

3. **Configure Authentication**:
   - Enable GitHub and LinkedIn OAuth providers
   - Set redirect URLs to match your domain

4. **Set Row Level Security (RLS)**:
   - `notes`: Allow public read for `is_public=true`, restrict write to authenticated users
   - `comments`: Allow read for all, restrict write to authenticated users
   - `post-assets`: Restrict upload to authenticated users, allow public read

## Security Considerations

### Environment Variables
- Never commit `.env` to version control
- Use Vercel environment variables for production
- Rotate Supabase keys if exposed

### Admin Access
- Admin operations are restricted to a specific user ID (hardcoded in `BlogShell.tsx`)
- Consider implementing role-based access control for production

### RLS Policies
- Ensure Supabase RLS policies are properly configured
- Test policies in development before deploying

### Content Security
- User-generated content (comments, posts) should be sanitized
- Markdown rendering is handled by `marked` - ensure it's up to date

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── Auth.tsx         # OAuth authentication
│   ├── BlogShell.tsx    # Main app container
│   ├── Comments.tsx     # Comments section
│   ├── FreeformCanvas.tsx # Excalidraw integration
│   ├── MagazineGrid.tsx # Post grid layout
│   ├── NoteEditor.tsx   # Markdown editor
│   ├── ReaderPanel.tsx  # Post reader view
│   └── Sidebar.tsx      # Navigation sidebar
├── hooks/               # Custom React hooks
├── layouts/             # Astro layouts
├── lib/                 # Utilities and Supabase client
├── pages/               # Astro pages
└── styles/              # Global CSS
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Deployment

The project is configured for deployment on Vercel:

1. Push your code to a Git repository
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## License

MIT
