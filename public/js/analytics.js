(() => {
  if (window.__blogAnalyticsInstalled) return
  window.__blogAnalyticsInstalled = true

  const SCHEMA_VERSION = "2"
  const ARTICLE_PROGRESS_MILESTONES = [25, 50, 75, 90, 100]
  const ARTICLE_TIME_MILESTONES = [15, 30, 60, 120, 300]
  const MAX_REPORTED_ERRORS = 5
  const sentMilestones = new window.Set()
  const sentImpressions = new window.Set()
  const sentSections = new window.Set()
  const viewedPages = new window.Set()
  const reportedErrors = new window.Set()

  let articleCleanup = () => {}
  let impressionCleanup = () => {}

  function safeDimension(value, maxLength = 100) {
    return String(value || "").slice(0, maxLength)
  }

  function pageContext() {
    const { dataset } = document.body

    return {
      schema_version: SCHEMA_VERSION,
      page_type: dataset.pageType || "page",
      content_id: dataset.contentId || "",
      content_tags: dataset.contentTags || "",
    }
  }

  function track(eventName, parameters = {}) {
    const eventParameters = Object.fromEntries(
      Object.entries({
        ...pageContext(),
        ...parameters,
      }).filter(([, value]) => value !== "" && value !== undefined && value !== null),
    )

    if (Array.isArray(window.__analyticsDebugEvents)) {
      window.__analyticsDebugEvents.push({
        event_name: eventName,
        event_parameters: eventParameters,
      })
      return
    }

    if (window.location.hostname !== "yieumyoon.github.io") return
    if (typeof window.gtag !== "function") return

    window.gtag("event", eventName, eventParameters)
  }

  window.blogAnalytics = { track }
  window.dispatchEvent(new window.CustomEvent("blog:analytics-ready"))

  function analyticsRegion(element) {
    return element.closest("[data-analytics-region]")?.dataset.analyticsRegion || "unknown"
  }

  function safeLinkDetails(anchor) {
    const rawHref = anchor.getAttribute("href") || ""

    if (rawHref.startsWith("mailto:")) {
      return { link_type: "email", link_target: "email" }
    }

    if (rawHref.startsWith("tel:")) {
      return { link_type: "phone", link_target: "phone" }
    }

    let url
    try {
      url = new window.URL(rawHref, window.location.href)
    } catch {
      return { link_type: "other", link_target: "invalid" }
    }

    if (anchor.hasAttribute("download") || /\.(pdf|zip|docx?|xlsx?|pptx?)$/i.test(url.pathname)) {
      return {
        link_type: "download",
        link_target: url.origin === window.location.origin ? url.pathname : url.hostname,
      }
    }

    if (url.pathname === "/rss.xml") {
      return { link_type: "rss", link_target: url.pathname }
    }

    if (url.origin === window.location.origin) {
      return { link_type: "internal", link_target: url.pathname }
    }

    return { link_type: "external", link_target: url.hostname }
  }

  function resourceType(anchor, linkType) {
    if (linkType === "download") return "file"

    let url
    try {
      url = new window.URL(anchor.getAttribute("href") || "", window.location.href)
    } catch {
      return "reference"
    }

    if (url.hostname === "github.com") return "repository"
    if (["youtu.be", "youtube.com", "www.youtube.com", "vimeo.com"].includes(url.hostname)) {
      return "video"
    }
    if (["docs.google.com", "drive.google.com", "notion.site", "www.notion.so"].includes(url.hostname)) {
      return "document"
    }

    return "reference"
  }

  function inferredLinkEvent(anchor, region, linkType) {
    if (region === "article_body" && linkType === "download") return "resource_download"
    if (region === "article_body" && linkType === "external") return "resource_open"
    if (region === "article_body") return "article_link_click"
    if (linkType === "download") return "file_link_click"
    if (linkType === "email") return "contact_click"
    if (linkType === "rss") return "rss_open"
    return "site_link_click"
  }

  async function copyCode(button) {
    const pre = button.closest("pre")
    const code = pre?.querySelector("code")
    if (!code) return

    const originalLabel = button.textContent || "Copy"
    button.disabled = true

    let copyStatus = "success"
    try {
      await window.navigator.clipboard.writeText(code.textContent || "")
      button.textContent = "Copied"
    } catch {
      copyStatus = "failure"
      button.textContent = "Copy failed"
    }

    track("code_copy", {
      code_index: button.dataset.analyticsCodeIndex || "",
      code_language: button.dataset.analyticsCodeLanguage || "unknown",
      copy_status: copyStatus,
    })

    window.setTimeout(() => {
      button.textContent = originalLabel
      button.disabled = false
    }, 1600)
  }

  function handleClick(event) {
    const target = event.target
    if (!(target instanceof window.Element)) return

    const codeCopyButton = target.closest("button[data-analytics-code-copy]")
    if (codeCopyButton instanceof window.HTMLButtonElement) {
      void copyCode(codeCopyButton)
      return
    }

    const trackedElement = target.closest("a, button[data-analytics-event]")
    if (!trackedElement) return

    const region = analyticsRegion(trackedElement)
    const explicitEvent = trackedElement.dataset.analyticsEvent
    const explicitId = trackedElement.dataset.analyticsId || ""
    const explicitValue = trackedElement.dataset.analyticsValue || ""
    const itemPosition = trackedElement.dataset.analyticsPosition || ""

    if (trackedElement instanceof window.HTMLAnchorElement) {
      const linkDetails = safeLinkDetails(trackedElement)
      const eventName = explicitEvent || inferredLinkEvent(trackedElement, region, linkDetails.link_type)

      track(eventName, {
        link_area: region,
        link_id: explicitId,
        link_value: explicitValue,
        content_position: itemPosition,
        resource_type: eventName.startsWith("resource_")
          ? resourceType(trackedElement, linkDetails.link_type)
          : "",
        ...linkDetails,
      })
      return
    }

    let uiValue = explicitValue
    if (!uiValue && explicitEvent === "theme_toggle") {
      uiValue = document.documentElement.classList.contains("dark") ? "dark" : "light"
    }
    if (!uiValue && explicitEvent === "menu_toggle") {
      uiValue = trackedElement.classList.contains("open") ? "open" : "closed"
    }

    track(explicitEvent, {
      action_area: region,
      action_id: explicitId,
      action_value: uiValue,
    })
  }

  function initializeCodeCopyButtons(article) {
    const codeBlocks = article.querySelectorAll("pre")

    codeBlocks.forEach((pre, index) => {
      if (pre.dataset.analyticsCodeReady === "true") return

      const code = pre.querySelector("code")
      if (!code) return

      const languageClass = [...pre.classList, ...code.classList]
        .find((className) => className.startsWith("language-"))
      const language = languageClass?.replace("language-", "") || "unknown"
      const button = document.createElement("button")

      pre.dataset.analyticsCodeReady = "true"
      pre.classList.add("analytics-code-block")
      button.type = "button"
      button.className = "code-copy-button"
      button.textContent = "Copy"
      button.setAttribute("aria-label", `Copy code block ${index + 1}`)
      button.dataset.analyticsCodeCopy = "true"
      button.dataset.analyticsCodeIndex = String(index + 1)
      button.dataset.analyticsCodeLanguage = safeDimension(language, 40)
      pre.prepend(button)
    })
  }

  function initializeArticleTracking() {
    articleCleanup()
    articleCleanup = () => {}

    if (document.body.dataset.pageType !== "article") return

    const article = document.querySelector("[data-analytics-article]")
    if (!article) return

    const controller = new window.AbortController()
    const { signal } = controller
    const headings = article.querySelectorAll("h2, h3")
    let animationFrame = 0
    let engagedSeconds = 0

    initializeCodeCopyButtons(article)

    function checkSections() {
      const readingLine = window.innerHeight * 0.3

      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top > readingLine) return

        const sectionIndex = index + 1
        const sectionId = safeDimension(heading.id || `section-${sectionIndex}`)
        const key = `${document.body.dataset.contentId}:${sectionIndex}:${sectionId}`
        if (sentSections.has(key)) return

        sentSections.add(key)
        track("article_section_view", {
          section_id: sectionId,
          section_index: String(sectionIndex),
          section_level: heading.tagName.toLowerCase(),
        })
      })
    }

    function checkProgress() {
      animationFrame = 0
      const rect = article.getBoundingClientRect()
      const articleHeight = Math.max(article.scrollHeight, 1)
      const visibleDepth = Math.min(Math.max(window.innerHeight - rect.top, 0), articleHeight)
      const progress = Math.min(100, Math.floor((visibleDepth / articleHeight) * 100))

      for (const milestone of ARTICLE_PROGRESS_MILESTONES) {
        const key = `progress:${document.body.dataset.contentId}:${milestone}`
        if (progress < milestone || sentMilestones.has(key)) continue

        sentMilestones.add(key)
        track("article_progress", {
          progress_percent: String(milestone),
        })
      }

      checkSections()
    }

    function scheduleProgressCheck() {
      if (animationFrame) return
      animationFrame = window.requestAnimationFrame(checkProgress)
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) return

      engagedSeconds += 1
      for (const milestone of ARTICLE_TIME_MILESTONES) {
        const key = `time:${document.body.dataset.contentId}:${milestone}`
        if (engagedSeconds < milestone || sentMilestones.has(key)) continue

        sentMilestones.add(key)
        track("article_read_time", {
          engaged_seconds: String(milestone),
        })
      }
    }, 1000)

    window.addEventListener("scroll", scheduleProgressCheck, { passive: true, signal })
    window.addEventListener("resize", scheduleProgressCheck, { passive: true, signal })
    scheduleProgressCheck()

    articleCleanup = () => {
      controller.abort()
      window.clearInterval(timer)
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
    }
  }

  function initializeImpressionTracking() {
    impressionCleanup()
    impressionCleanup = () => {}

    if (!("IntersectionObserver" in window)) return

    const elements = document.querySelectorAll("[data-analytics-impression]")
    if (!elements.length) return

    const controller = new window.AbortController()
    const { signal } = controller
    const timers = new window.Map()
    const ratios = new window.Map()

    function cancelTimer(element) {
      const timer = timers.get(element)
      if (timer) window.clearTimeout(timer)
      timers.delete(element)
    }

    const observer = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target
        ratios.set(element, entry.intersectionRatio)

        if (
          !entry.isIntersecting ||
          entry.intersectionRatio < 0.5 ||
          document.visibilityState !== "visible" ||
          !document.hasFocus()
        ) {
          cancelTimer(element)
          return
        }

        if (timers.has(element)) return
        const timer = window.setTimeout(() => {
          timers.delete(element)
          if (
            (ratios.get(element) || 0) < 0.5 ||
            document.visibilityState !== "visible" ||
            !document.hasFocus()
          ) return

          const eventName = element.dataset.analyticsImpression
          const itemId = element.dataset.analyticsId || ""
          const itemPosition = element.dataset.analyticsPosition || ""
          const itemArea = analyticsRegion(element)
          const key = `${window.location.pathname}:${eventName}:${itemArea}:${itemId}:${itemPosition}`
          if (!eventName || sentImpressions.has(key)) return

          sentImpressions.add(key)
          track(eventName, {
            content_area: itemArea,
            content_item_id: itemId,
            content_position: itemPosition,
          })
          observer.unobserve(element)
        }, 1000)

        timers.set(element, timer)
      })
    }, { threshold: [0, 0.5, 1] })

    elements.forEach((element) => observer.observe(element))
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") return
      elements.forEach(cancelTimer)
    }, { signal })

    impressionCleanup = () => {
      controller.abort()
      observer.disconnect()
      elements.forEach(cancelTimer)
    }
  }

  function safeErrorSource(rawSource) {
    if (!rawSource) return "inline"

    try {
      const url = new window.URL(rawSource, window.location.href)
      if (!["http:", "https:"].includes(url.protocol)) return "other"
      return url.origin === window.location.origin ? url.pathname : url.hostname
    } catch {
      return "unknown"
    }
  }

  function reportClientError(parameters) {
    if (reportedErrors.size >= MAX_REPORTED_ERRORS) return

    const key = JSON.stringify(parameters)
    if (reportedErrors.has(key)) return

    reportedErrors.add(key)
    track("client_error", parameters)
  }

  function handleWindowError(event) {
    const target = event.target
    if (target instanceof window.Element && target !== document.documentElement) {
      const rawSource = target.getAttribute("src") || target.getAttribute("href") || ""
      reportClientError({
        error_type: "resource_error",
        error_name: target.tagName.toLowerCase(),
        error_source: safeErrorSource(rawSource),
      })
      return
    }

    reportClientError({
      error_type: "javascript_error",
      error_name: safeDimension(event.error?.name || "Error", 60),
      error_source: safeErrorSource(event.filename),
      error_line: event.lineno ? String(event.lineno) : "",
    })
  }

  function handleUnhandledRejection(event) {
    const reason = event.reason
    const errorName = reason && typeof reason === "object" && "name" in reason
      ? reason.name
      : "UnhandledRejection"

    reportClientError({
      error_type: "unhandled_rejection",
      error_name: safeDimension(errorName, 60),
      error_source: "promise",
    })
  }

  function initializeTracking() {
    const context = pageContext()
    const pageKey = `${window.location.pathname}:${context.page_type}:${context.content_id}`

    if (!viewedPages.has(pageKey)) {
      viewedPages.add(pageKey)
      track("content_view")

      if (context.page_type === "not_found") {
        track("page_not_found", {
          page_path: window.location.pathname,
        })
      }
    }

    initializeArticleTracking()
    initializeImpressionTracking()
  }

  document.addEventListener("click", handleClick)
  document.addEventListener("astro:page-load", initializeTracking)
  window.addEventListener("error", handleWindowError, true)
  window.addEventListener("unhandledrejection", handleUnhandledRejection)
  initializeTracking()
})()
