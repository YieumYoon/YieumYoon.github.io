import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "이음의 개발블로그",
  DESCRIPTION: "이음의 개발블로그에 어서오세요.",
  AUTHOR: "Yieum Yoon",
}

// Work Page
export const WORK: Page = {
  TITLE: "Work",
  DESCRIPTION: "Places I have worked.",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Blog",
  DESCRIPTION: "Writing on topics I am passionate about. 개발하며 배우고 느낀것을 적어나가는 블로그입니다.",
}

// Projects Page 
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "Recent projects I have worked on. 개인적으로 진행해본 프로젝트들을 소개합니다.",
}
// Daily Log Page
export const DAILY_LOGS: Page ={
  TITLE: "Daily Logs",
  DESCRIPTION: "Daily logs of programming, study, or project progress. 매일 공부 및 프로젝트 업무일지를 공유합니다."
}
// Search Page
export const SEARCH: Page = {
  TITLE: "Search",
  DESCRIPTION: "Search all posts and projects by keyword. 제 포스트들과 프로젝트들을 키워드로 검색할 수 있습니다.",
}

// Links
export const LINKS: Links = [
  { 
    TEXT: "Home", 
    HREF: "/", 
  },
  // { 
  //   TEXT: "Work", 
  //   HREF: "/work", 
  // },
  { 
    TEXT: "Blog", 
    HREF: "/blog", 
  },
  { 
    TEXT: "Projects", 
    HREF: "/projects", 
  },
  {
    TEXT: "Daily Records",
    HREF: "/records"
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

