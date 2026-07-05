import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "Yieum Yoon",
  DESCRIPTION: "Notes on software, books, and becoming a better builder.",
  AUTHOR: "Yieum Yoon",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Writing",
  DESCRIPTION: "Notes on software, books, study, and the process of learning in public.",
}

// Links
export const LINKS: Links = [
  { 
    TEXT: "Home", 
    HREF: "/", 
  },
  { 
    TEXT: "Writing", 
    HREF: "/blog", 
  }
]

// Socials
export const SOCIALS: Socials = [
  { 
    NAME: "Email",
    ICON: "email", 
    TEXT: "junsueddie@gmail.com",
    HREF: "mailto:junsueddie@gmail.com",
  },
  { 
    NAME: "GitHub",
    ICON: "github",
    TEXT: "Yieum Yoon",
    HREF: "https://github.com/YieumYoon"
  },
  { 
    NAME: "LinkedIn",
    ICON: "linkedin",
    TEXT: "Junsu Lee",
    HREF: "https://www.linkedin.com/in/junsueddie",
  },
  { 
    NAME: "Threads",
    ICON: "threads",
    TEXT: "junsueddie",
    HREF: "https://www.threads.net/@junsueddie",
  },
]
