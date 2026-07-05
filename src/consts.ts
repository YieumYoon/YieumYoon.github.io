import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "이음의 개발블로그",
  DESCRIPTION: "이음의 개발블로그에 어서오세요.",
  AUTHOR: "Yieum Yoon",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Blog",
  DESCRIPTION: "Writing on topics I am passionate about. 개발하며 배우고 느낀것을 적어나가는 블로그입니다.",
}

// Links
export const LINKS: Links = [
  { 
    TEXT: "Home", 
    HREF: "/", 
  },
  { 
    TEXT: "Blog", 
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
    NAME: "Github",
    ICON: "github",
    TEXT: "Yieum Yoon",
    HREF: "https://github.com/YieumYoon"
  },
  { 
    NAME: "LinkedIn",
    ICON: "linkedin",
    TEXT: "Junsu Lee",
    HREF: "www.linkedin.com/in/junsueddie",
  },
  { 
    NAME: "Threads",
    ICON: "threads",
    TEXT: "junsueddie",
    HREF: "https://www.threads.net/@junsueddie",
  },
]
