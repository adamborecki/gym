// Auto-generated seed data for Gym App v1
// Generated from gym_project_detailed_export.txt (Feb 28, 2026)

export const DEFAULT_DATA = {
  "profile": {
    "name": "Adam",
    "createdAt": "2026-03-01T08:25:08.678605Z",
    "preferences": {
      "ttsEnabled": true,
      "restModeDefault": "normal",
      "absReminder": true,
      "finishedSetOffsetOptionsSec": [
        0,
        5,
        10,
        20,
        30,
        60
      ]
    }
  },
  "machines": {
    "chest_press": {
      "id": "chest_press",
      "name": "Chest Press",
      "category": "push",
      "type": "compound",
      "variants": [
        "MTS",
        "Selectorized"
      ],
      "repRange": {
        "min": 8,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Seat height: handles roughly mid-chest to nipple line at start.\n- Back stays against pad; feet flat, slight leg drive for stability (not to move weight).",
        "form": "(1) CHEST PRESS (machine / MTS-style)\nSetup\n- Seat height: handles roughly mid-chest to nipple line at start.\n- Back stays against pad; feet flat, slight leg drive for stability (not to move weight).\nExecution cues\n- Think “drive elbows slightly down and in,” not flared straight out.\n- Shoulders: keep them “down and back” (avoid shrugging up).\n- Stop short of locking elbows; keep tension on pecs/triceps.\nCommon fixes\n- If you feel front/outer shoulders:\n  - lower seat a touch OR bring elbows a bit more tucked,\n  - reduce ROM at the deepest stretch if it pinches,\n  - prioritize scapula stability (don’t protract/round).\nRep range\n- 8–12 for main working sets; 10–12 if shoulders are sensitive.",
        "mantra": [
          "🧱 chest up",
          "💪 elbows 30–45°",
          "🚫 no lockout"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "incline_press": {
      "id": "incline_press",
      "name": "Incline Chest Press",
      "category": "push",
      "type": "compound",
      "variants": [
        "MTS",
        "Selectorized"
      ],
      "repRange": {
        "min": 8,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Seat typically slightly lower than you think so handles start upper-chest level.",
        "form": "(2) INCLINE CHEST PRESS / MTS INCLINE\nSetup\n- Seat typically slightly lower than you think so handles start upper-chest level.\nExecution\n- Press “up and slightly back,” but don’t over-arch.\n- Keep wrists stacked (don’t let them bend back).\nIf clavicle area feels irritated\n- Decrease depth; keep elbows a little more tucked; consider neutral handles if available.\nRep range\n- 8–12, stop 1–3 RIR.",
        "mantra": [
          "📐 upper-chest path",
          "🧱 ribs quiet",
          "✋ wrists stacked"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "shoulder_press": {
      "id": "shoulder_press",
      "name": "Shoulder Press",
      "category": "push",
      "type": "compound",
      "variants": [
        "MTS",
        "Selectorized"
      ],
      "repRange": {
        "min": 8,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Seat height so handles start around chin/ear level, elbows under wrists.",
        "form": "(3) SHOULDER PRESS (MTS shoulder press)\nSetup\n- Seat height so handles start around chin/ear level, elbows under wrists.\nExecution\n- Press up without shrugging.\n- Keep ribs down (don’t turn it into a standing incline press).\nCommon mistakes\n- Flaring elbows too wide and shrugging → neck/upper trap takeover.\n- Letting elbows drift behind the body too much at the bottom → shoulder stress.\nRep range\n- 8–12 (or 10–12 if shoulder history).",
        "mantra": [
          "🧱 ribs down",
          "🧘 no shrug",
          "🎯 elbows under wrists"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "pec_fly": {
      "id": "pec_fly",
      "name": "Pec Fly",
      "category": "push",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 10,
        "max": 15
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Seat height: handles align with mid-chest; arms roughly horizontal.\n- Adjust start position so you feel a stretch but not a shoulder pinch.",
        "form": "(4) PEC FLY (machine)\nGoal sensation\n- Pecs stretch across chest, not front delts.\nSetup\n- Seat height: handles align with mid-chest; arms roughly horizontal.\n- Adjust start position so you feel a stretch but not a shoulder pinch.\nExecution\n- Slight bend in elbows stays fixed.\n- “Hug a big barrel” — hands move inward; shoulders stay down.\n- Stop before hands slam together; control the last inch.\nCommon fixes\n- If shoulders dominate: reduce stretch depth, lower weight, slow eccentric.\nRep range\n- 10–15 (often 12–15 is sweet).",
        "mantra": [
          "🤗 hug barrel",
          "🧘 shoulders down",
          "🐢 slow stretch"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "rear_delt": {
      "id": "rear_delt",
      "name": "Rear Delt (Reverse Fly)",
      "category": "push",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 12,
        "max": 20
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Chest firmly against pad.\n- Handle height about shoulder height.",
        "form": "(5) REAR DELT (reverse fly machine)\nGoal sensation\n- Rear delts/upper back, not neck/upper traps.\nSetup\n- Chest firmly against pad.\n- Handle height about shoulder height.\nExecution\n- Think “pull elbows out and slightly back,” not hands.\n- Avoid shrugging; keep neck long.\nRep range\n- 12–20 (rear delts respond well to higher reps).",
        "mantra": [
          "🧍 chest to pad",
          "🧘 neck long",
          "🎯 elbows lead"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "triceps_pushdown": {
      "id": "triceps_pushdown",
      "name": "Triceps Pushdown",
      "category": "push",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 10,
        "max": 15
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "attachment",
          "label": "Attachment",
          "type": "text"
        },
        {
          "key": "height",
          "label": "Pulley Height",
          "type": "text"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Elbows pinned to sides; shoulders relaxed.",
        "form": "(6) TRICEPS PUSHDOWN (cable)\nSetup\n- Elbows pinned to sides; shoulders relaxed.\nExecution\n- Extend down; stop short of locking hard.\n- Control the return; don’t let elbows drift forward.\nCommon fixes\n- If forearms take over: focus on elbow staying still, wrists neutral.\nRep range\n- 10–15.",
        "mantra": [
          "📌 elbows pinned",
          "✋ wrists neutral",
          "🐢 control up"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "triceps_extension_machine": {
      "id": "triceps_extension_machine",
      "name": "Triceps Extension (Machine)",
      "category": "push",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 10,
        "max": 15
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Align elbow joint with machine pivot if possible.",
        "form": "(7) TRICEPS EXTENSION MACHINE\nSetup\n- Align elbow joint with machine pivot if possible.\nExecution\n- Smooth extension; don’t slam lockout.\n- Keep upper arms still.\nRep range\n- 10–15.\n\n-----------------------------------------------------------------------\n5.2 PULL DAY MACHINES\n-----------------------------------------------------------------------",
        "mantra": [
          "📌 upper arm still",
          "🐢 control",
          "🚫 no slam"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "lat_pulldown": {
      "id": "lat_pulldown",
      "name": "Lat Pulldown",
      "category": "pull",
      "type": "compound",
      "variants": [],
      "repRange": {
        "min": 8,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Seat height so thighs are firmly under pads.\n- Chest up slightly; neutral spine; slight lean back (~10–20°), not a row.",
        "form": "(1) LAT PULLDOWN (including “curved bar / flared ends” PF bars)\nThis was a recurring issue: “I feel arms, not lats.”\nSetup\n- Seat height so thighs are firmly under pads.\n- Chest up slightly; neutral spine; slight lean back (~10–20°), not a row.\nExecution cues to hit lats\n- Think: “Drive elbows DOWN toward your back pockets.”\n- Hands are hooks; don’t death-grip.\n- Pull bar to upper chest/clavicle area if comfortable.\nElbow path with flared bar\n- A slightly wider grip often increases arm involvement.\n- Try a grip where elbows track 30–45° in front of your torso (not straight out to sides).\n- If elbows flare too wide, biceps dominate.\nCommon fixes\n- Use straps if grip is limiting.\n- Start the pull by “depressing shoulder blades” (down), then elbows down.\nRep range\n- 8–12; sometimes 10–12 works well for mind-muscle.",
        "mantra": [
          "🪝 hands hooks",
          "⬇️ elbows to pockets",
          "🧘 shoulders down"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "seated_row": {
      "id": "seated_row",
      "name": "Seated Row",
      "category": "pull",
      "type": "compound",
      "variants": [],
      "repRange": {
        "min": 8,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Chest tall; don’t round into the pull.\n- Feet stable; avoid rocking.",
        "form": "(2) SEATED ROW (machine)\nSetup\n- Chest tall; don’t round into the pull.\n- Feet stable; avoid rocking.\nExecution\n- Pull toward lower ribs/upper abdomen depending on handle.\n- Think “elbows back, squeeze mid-back,” then control forward stretch.\nCommon fixes\n- If biceps dominate: use thumbless/looser grip and focus elbow drive.\nRep range\n- 8–12 for main row; 10–12 if you want more control.",
        "mantra": [
          "🧱 tall chest",
          "↩️ elbows back",
          "🧊 pause squeeze"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "biceps_curl_machine": {
      "id": "biceps_curl_machine",
      "name": "Biceps Curl (Machine)",
      "category": "pull",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 10,
        "max": 15
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Seat so elbows align with pivot; upper arms stay planted.",
        "form": "(3) BICEPS CURL MACHINE\nSetup\n- Seat so elbows align with pivot; upper arms stay planted.\nExecution\n- Curl without lifting shoulders.\n- Control down; don’t bounce off bottom.\nRep range\n- 10–15.",
        "mantra": [
          "📌 upper arm fixed",
          "✋ wrists neutral",
          "🐢 slow down"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "assisted_chin": {
      "id": "assisted_chin",
      "name": "Assisted Chin/Pull-up",
      "category": "pull",
      "type": "compound",
      "variants": [],
      "repRange": {
        "min": 6,
        "max": 12
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Choose assistance so you can get 6–12 clean reps.",
        "form": "(4) ASSISTED CHIN / PULL-UP MACHINE\nGeneral guidance you asked: “Only assisted chin is available—do I do that?”\nYes—great substitute for lat pulldown / vertical pull.\nSetup\n- Choose assistance so you can get 6–12 clean reps.\nExecution\n- Full hang only if shoulders tolerate it; otherwise partial hang is okay.\n- Pull chest toward bar; avoid craning neck.\nRep range\n- 6–12 (harder movement).\n\n-----------------------------------------------------------------------\n5.3 LEG DAY MACHINES\n-----------------------------------------------------------------------",
        "mantra": [
          "🧘 shoulders down",
          "⬆️ chest to bar",
          "🪝 hands hooks"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "seated_leg_press": {
      "id": "seated_leg_press",
      "name": "Seated Leg Press",
      "category": "legs",
      "type": "compound",
      "variants": [],
      "repRange": {
        "min": 8,
        "max": 15
      },
      "rirPattern": [
        3,
        2,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "Your theme: “I feel more in knees than thighs” and “avoid shifting tension to joints at top.”\nSetup priorities\n- Seat back: a notch more reclined can reduce knee shear and help glutes.\n- Foot placement:\n  - Higher on platform = more glute/ham, less knee",
        "form": "(1) SEATED LEG PRESS (your most-discussed: knees vs thighs)\nYour theme: “I feel more in knees than thighs” and “avoid shifting tension to joints at top.”\nSetup priorities\n- Seat back: a notch more reclined can reduce knee shear and help glutes.\n- Foot placement:\n  - Higher on platform = more glute/ham, less knee\n  - Lower on platform = more quad, more knee stress\n- Stance width: shoulder-width-ish; toes slightly out.\nExecution cues\n- Descend under control; don’t bottom out.\n- Keep knees tracking over toes (no cave-in).\n- Don’t lock out hard at top; stop just before the “joint hang.”\nDepth management (knee-friendly)\n- If knees complain: reduce depth slightly and/or move feet higher.\nRep range\n- 8–15 (you often target 3x12 style, which is solid).\nProgression notes\n- If 175 feels low but form is improving, it’s still a productive step.\n- Only increase load when you can keep the same knee-friendly ROM and avoid “joint shift.”",
        "mantra": [
          "🦶 feet higher = knee friendly",
          "🧭 knees over toes",
          "🚫 no lockout"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "seated_leg_curl": {
      "id": "seated_leg_curl",
      "name": "Seated Leg Curl",
      "category": "legs",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 10,
        "max": 15
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Knee joint aligned with pivot.\n- Pad rests just above ankles.",
        "form": "(2) SEATED LEG CURL\nGoal sensation\n- Hamstrings, not low back.\nSetup\n- Knee joint aligned with pivot.\n- Pad rests just above ankles.\nExecution\n- Curl smoothly; pause at contracted position briefly.\n- Control back up.\nRep range\n- 10–15.",
        "mantra": [
          "🦵 squeeze ham",
          "🧊 pause",
          "🐢 control up"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "leg_extension": {
      "id": "leg_extension",
      "name": "Leg Extension",
      "category": "legs",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 12,
        "max": 20
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Knee aligns with pivot; pad above ankle.",
        "form": "(3) LEG EXTENSION (knee-sensitive for many)\nUse with care; stop if knee pain.\nSetup\n- Knee aligns with pivot; pad above ankle.\nExecution\n- Smooth extension; do not slam lockout.\n- Control eccentric; avoid heavy loads if knees feel cranky.\nRep range\n- 10–15 (or 12–20 lighter, very controlled).",
        "mantra": [
          "🐢 slow down",
          "🚫 no slam",
          "🧭 knee comfy"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "hip_abduction": {
      "id": "hip_abduction",
      "name": "Hip Abduction",
      "category": "legs",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 12,
        "max": 20
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "- Sit tall; pelvis neutral.",
        "form": "(4) HIP ABDUCTION (outer thighs)\nSetup\n- Sit tall; pelvis neutral.\nExecution\n- Drive knees outward; don’t rock torso.\n- Pause briefly at end range; slow return.\nRep range\n- 12–20.",
        "mantra": [
          "🧍 tall torso",
          "🚫 no rocking",
          "🧊 pause end range"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "hip_adduction": {
      "id": "hip_adduction",
      "name": "Hip Adduction",
      "category": "legs",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 12,
        "max": 20
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "start",
          "label": "Start/Range",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "Same principles as abduction.\nRep range\n- 12–20.",
        "form": "(5) HIP ADDUCTION (inner thighs)\nSame principles as abduction.\nRep range\n- 12–20.",
        "mantra": [
          "🧍 tall torso",
          "🚫 no rocking",
          "🧊 pause end range"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "bike": {
      "id": "bike",
      "name": "Bike",
      "category": "cardio",
      "type": "conditioning",
      "variants": [
        "LifeFitness"
      ],
      "repRange": {
        "min": 0,
        "max": 0
      },
      "rirPattern": [
        0
      ],
      "setupFields": [
        {
          "key": "seat",
          "label": "Seat",
          "type": "number"
        },
        {
          "key": "handlebar",
          "label": "Handlebar",
          "type": "number"
        },
        {
          "key": "notes",
          "label": "Setup Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "Seat height\n- Slight bend in knee at bottom of pedal stroke (not locked out, not cramped).\n- Too low = knee pain; too high = hip rocking.\n\nHandlebar\n- Upright position = more comfortable, less back stress.\n- Lower position = more aerodynamic, more core engagement.\n\nFoot position\n- Ball of foot over pedal axle.\n- Keep heel slightly dropped or level — don't point toes down.\n\nResistance\n- Start easy to warm up legs before adding load.",
        "form": "Cycling RPE Scale\n\nRPE 1–2 · Super easy\n  Warm-up / recovery spin. No effort.\n\nRPE 3–4 · Easy (Zone 2)\n  Full sentences, sustainable for a long time.\n  Good for pre-lift warm-up or post-lift cool-down.\n\nRPE 5–6 · Comfortably hard\n  Short phrases only. Steady effort.\n  Good cardio work without wrecking your lifts.\n\nRPE 7 · Hard\n  Talking is broken. Legs burning. You're working.\n  Near-threshold — use after lifting, not before.\n\nRPE 8 · Very hard\n  A few words only. Near-max sustainable for a short time.\n\nRPE 9–10 · All-out\n  Sprint / interval territory. Full effort.\n\n─────────────────────────────\nCardio + Lifting Guidelines\n─────────────────────────────\nBefore heavy compound lifts\n  Keep cycling ≤ RPE 4 and short (5–10 min).\n  Heavy leg day? → RPE 2–4 only.\n\nAfter lifting\n  10–25 min at RPE 3–5 (easy to moderate).\n  Want real cardio? → RPE 4–6, not a death march.\n\nIntervals (RPE 7–9)\n  Best on separate days or after lifting.\n  Avoid right before squats / deadlifts / leg press.",
        "mantra": [
          "🚴 steady or ⚡ intervals",
          "📈 RPE / max HR",
          "💬 can you talk? → RPE 3–4",
          "🔥 legs burning → RPE 7+"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    },
    "abs_quick": {
      "id": "abs_quick",
      "name": "Abs (Quick Add)",
      "category": "core",
      "type": "isolation",
      "variants": [],
      "repRange": {
        "min": 10,
        "max": 20
      },
      "rirPattern": [
        2,
        1,
        1
      ],
      "setupFields": [
        {
          "key": "notes",
          "label": "Notes",
          "type": "text"
        }
      ],
      "tips": {
        "setup": "Quick add: Crunch / Rotation / Other.",
        "form": "Controlled reps. Exhale on crunch. No neck yank.",
        "mantra": [
          "💨 exhale",
          "🧊 pause",
          "🚫 no neck yank"
        ],
        "phasedCues": {}
      },
      "familiarity": "learning",
      "lastUsedAt": null
    }
  },
  "templates": {
    "push_default": {
      "id": "push_default",
      "name": "Push (Default)",
      "dayType": "push",
      "blocks": [
        {
          "id": "warmup",
          "name": "Warmup",
          "suggestions": [
            "bike"
          ]
        },
        {
          "id": "primary",
          "name": "Primary Compound",
          "suggestions": [
            "chest_press"
          ]
        },
        {
          "id": "secondary",
          "name": "Secondary",
          "suggestions": [
            "incline_press",
            "shoulder_press"
          ]
        },
        {
          "id": "accessories",
          "name": "Accessories",
          "suggestions": [
            "pec_fly",
            "rear_delt",
            "triceps_pushdown",
            "triceps_extension_machine"
          ]
        },
        {
          "id": "abs",
          "name": "Abs",
          "suggestions": [
            "abs_quick"
          ]
        }
      ]
    },
    "pull_default": {
      "id": "pull_default",
      "name": "Pull (Default)",
      "dayType": "pull",
      "blocks": [
        {
          "id": "warmup",
          "name": "Warmup",
          "suggestions": [
            "bike"
          ]
        },
        {
          "id": "primary",
          "name": "Primary Compound",
          "suggestions": [
            "lat_pulldown",
            "assisted_chin"
          ]
        },
        {
          "id": "secondary",
          "name": "Secondary",
          "suggestions": [
            "seated_row"
          ]
        },
        {
          "id": "accessories",
          "name": "Accessories",
          "suggestions": [
            "rear_delt",
            "biceps_curl_machine"
          ]
        },
        {
          "id": "abs",
          "name": "Abs",
          "suggestions": [
            "abs_quick"
          ]
        }
      ]
    },
    "legs_default": {
      "id": "legs_default",
      "name": "Legs (Default)",
      "dayType": "legs",
      "blocks": [
        {
          "id": "warmup",
          "name": "Warmup",
          "suggestions": [
            "bike"
          ]
        },
        {
          "id": "primary",
          "name": "Primary Compound",
          "suggestions": [
            "seated_leg_press"
          ]
        },
        {
          "id": "secondary",
          "name": "Secondary",
          "suggestions": [
            "seated_leg_curl"
          ]
        },
        {
          "id": "accessories",
          "name": "Accessories",
          "suggestions": [
            "hip_abduction",
            "hip_adduction",
            "leg_extension"
          ]
        },
        {
          "id": "abs",
          "name": "Abs",
          "suggestions": [
            "abs_quick"
          ]
        }
      ]
    },
    "bonus_default": {
      "id": "bonus_default",
      "name": "Bonus (Full Body Lite)",
      "dayType": "bonus",
      "blocks": [
        {
          "id": "warmup",
          "name": "Warmup",
          "suggestions": [
            "bike"
          ]
        },
        {
          "id": "fullbody",
          "name": "Full Body",
          "suggestions": [
            "seated_leg_press",
            "chest_press",
            "lat_pulldown",
            "seated_row"
          ]
        },
        {
          "id": "abs",
          "name": "Abs",
          "suggestions": [
            "abs_quick"
          ]
        }
      ]
    }
  },
  "sessions": []
};
