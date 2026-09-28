---
title: Imagining the role of digital twins as AI moves into the physical world
slug: importance-of-digital-twin-in-ai-era
lang: en
translationReviewed: false
summary: "Thoughts after a fireside chat with Dr. Michael Grieves at CWRU:
  digital twins as a place for AI to experiment, and how that connects to my
  robotics projects and experience deploying Spot."
date: 2026-09-25
tags:
  - digital twin
  - AI
  - robotics
  - simulation
draft: true
time: 12:48
timezone: America/New_York
---
I attended a fireside chat, “The Evolution and Future of Digital Twins,” with Dr. Michael Grieves at Sears think[box] at CWRU on September 23. I was already interested in this area, and one thought stayed with me after the session: digital twins could become increasingly useful as AI moves beyond computers and starts acting in the physical world. AI models make mistakes, and those mistakes can be dangerous when real machines and equipment are involved. They need somewhere to interact, experiment, and fail without damaging real equipment or hurting anyone. I imagine digital twins could be a kind of gym for that.

![Event poster for The Evolution and Future of Digital Twins, a fireside chat with Dr. Michael Grieves at CWRU on September 23, 2026.](/images/blog/michael-grieves-fireside-chat-2026-09-23.webp)

After the session, I asked about the most advanced digital twin he had seen in industry. The example mentioned was Abu Dhabi National Oil Company in the UAE, described as probably the biggest one he had seen. I guessed that the cost of failure might help justify such a large investment, though that was my own interpretation. I thought it would be a useful reference if I wanted to bring digital twin technology into another industry.

He also talked about how much definitions of digital twins vary. He described physical objects, virtual objects, and a persistent connection between them, but he pushed back on the need for one standardized definition. In our conversation afterward, he kept coming back to the problem: what are you trying to do, and what is preventing it?

The digital twin does not have to be a fancy view of an entire factory. He gave an example of little boxes representing equipment, with data telling you whether a machine works, does not work, or is going to fail. If that helps you predict a failure and reduce its impact, even a simple representation can be useful. My takeaway was that I should not be afraid to start small or make it complicated just to look impressive.

I wanted to hear more about digital twins he had worked on, but there was not enough time. Still, the conversation gave me a better idea of where to start if I wanted to build one for an industrial use case.

Another thought I had was that NVIDIA is working in a related direction with robotics training and deployment. Isaac Sim provides the simulation environment, Isaac Lab supports robot learning, and Cosmos can help with things like synthetic data generation. I had also been thinking of Isaac Gym, although that is now deprecated in favor of Isaac Lab. These tools have different roles, but the idea of training and testing a robot in a computer before deploying it is what interests me. I am working on a project using Isaac Sim to train a pick-and-place task, with the goal of deploying it on a real SO-101 arm and its setup. So let’s see.

I also wanted a digital twin of the plant environment when I was deploying Boston Dynamics’ Spot robot. I wanted to test scenarios like a forklift driver not noticing Spot and driving toward it, a blocked corridor, a floor with less friction, or different lighting conditions.

I spent nearly a month implementing Spot inspections at the plant, doing most of the work on my own. I added about 500 inspection points and tested GraphNav paths and robot behavior, spending 8–10 hours a day walking around the plant.

I did not have a virtual environment where I could work through those tests first. I wanted to get more of that work done on the computer, potentially run some tests faster than real time, and not worry about draining the battery. In my use, the battery lasted a little over an hour. Going back to the dock or swapping batteries was really annoying when I was trying to keep testing.

Even for the custom Spot software I was developing, I wished I had a simulation that included more than the robot’s shape. I wanted to test the parts of my software that interacted with Core I/O, Spot CAM, and the acoustic sensor. That would need models or interfaces that reproduced the behavior I was testing, not just their appearance. Then I could do some of the testing on the computer and the final testing on the actual robot. I would not have to stay near Spot for a stable wireless connection and walk so far with my laptop (it is heavy) just to test software and collect logs.

With AR glasses and possibly more humanoid robots being deployed, I can also imagine digital twins becoming a bigger part of how we interact with and test things in the physical world.