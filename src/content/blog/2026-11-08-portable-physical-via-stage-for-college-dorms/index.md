---
title: Built A portable stage for Nvidia VLA tutorial online with Astra
slug: portable-physical-via-stage-for-college-dorms
lang: en
translationReviewed: false
summary: "Created controlled stage envoronment for sim to real transfer using
  so-101 arm using Astra. "
date: 2026-11-08
tags:
  - so101
  - vla
draft: true
time: 20:37
timezone: America/New_York
---
Last year, I did bimanual task data collection and training for my senior project. And that involved 200 valid teleoperation episode collection. I also wanted to do sim to real transfer. However, only for a semester and a side project, I ran out of time so I disassembled the stage and that sim-to-real learning was in the backlog ever since. I did learn that what would be a better condition to collect data and deploy in the real world. 

The problem I faced was 1. the stage was too large so transportation was not easy also it too much space. 2. The camera location and angle was hard to make it consistent beacsue the top view was a webcam with the neck adjustment feature which was almost impossible to have a fixed camera angle if I disassembled the stage and assembled again. 3. The simulation environment will be hard to build as nothing is concisely measured and built. The camera height even depends on the camera extension pole that the height of the camera is not properly selected. It was rather just trial and error that can fit the entire stage. 4. The camera pov and settings were not able to get or find online as it is a webcam.

This year, when the semester started, and I got an email that Thinkbox is having an AI micro grant program which provides embedded board for the project. I am interested in Jetson nano so I wanted to come up with some idea that uses Jetson Orin Nano board for my project which is a vla sim to real transfer using Isaac sim. "[https://docs.nvidia.com/learning/physical-ai/sim-to-real-so-101/latest/index.html#](https://docs.nvidia.com/learning/physical-ai/sim-to-real-so-101/latest/index.html#)" This is the tutorial I saw and I wanted to do it. 

However, there are some challenges for me to follow that stage setup and instruction. 

First, the instruction assumes that I have a stable and spacious space that I can set up the stage and let it sit there for a while. However, how can a college student who live in a dorm can have that space unless they are in a research lab or something. Therefore, the stage needs to be smaller.

Second, the stage is so flimsy and it is hard to reassemble back to the data collected envornemtn because robot location and different variations and conditions can change. Which means if I need to move somewhere I cannot disassemble the stage because if I reassemble later, the condition will never be same. Therefore, even though the stage and robot go through disassemble and assemble I still need to have same condition and envorioment setting. 

Third, the camera location should be fixed. Web camera seems like a poorly chosen camera because it is hard to let it consistently point at the fixed location due to adjustment feature. Also, I wanted to add more camera so the camsra needs to be fixed on the stage with some brackets or something.

Fourth, the price to build cannot be high. I though about using acriyc panel like old 3d printer such as Anet a3(? I forgot the exact name) or aluminum extrusion profiles, but the cost for those materials are too high which seems unnecessary for me. Also as a college student, I wanted to use some cost effective material. Therefore I decided to use 1/4 in thickness wood panel because I have access to laser cutter from Thinkbox and 2x2 size panels aren't that expensive.

Fifth, I wanted to also minimize the amount of plywood sheet to use so I created the design and layout so everything can fit within four sheet of 2x2 panel. There is also 2x4 sheet, but it is larger sheet so it is harder to transprort, and little bit more expensive than two 2x2 plywood, and also it has more bends than 2x2 panel on the laser cutting machine bed so I decided to use smaller plywood.

Sixth, I wanted to add at least one more task on my vla stage because I have seen demos like ChatGPT Astra controlling the robot with zero shot learning, so I wanted to have some more task than just putting tube in a rack. I wanted to add a demo to turn the light on and off. Therefore, light and lightswithch is also added to the stage on the left. 

Seventh, I wanted to open source this stage so anyone across the world can build and experiment the same stage. Therefore, I decided to use 1/4(6mm) plywood, 3d printed parts, metic bits and nuts, and standard camera for so101 wrist camera (innomaker 1080p), ulanzi ua12, Ikea smart switch and lights.



Challenges I had are 1. Ikea switch, lights, and ulanzi ua12 tube lights does not have 3d asset online. Therefore, I used Artec Leo light Scanner (because the laser scanner was down) to capture objects in 3d and convert into assets which was not easy because light scanner was not that accurate and ua12 was a tube shape so the 3d scan would still not that accurate. Especially, the light and light switch were hard to create 3d asset because to do sim to real and also let ChatGPT Astra model create design based on the real world measurement, I had to measure using caliper and also use 2d scanner and multiple pictures to capture accurate measurement and also especially for light switch, 

Somthig I thought whithe stage was not ment for sim to real transfer so it was large. Also used web cam which was hard to have fixed location all the time. 